import json

from allauth.account import app_settings
from allauth.account.adapter import get_adapter
from allauth.account.forms import LoginForm
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST


def session_data(request):
    user = None
    if request.user.is_authenticated:
        user = {
            "id": request.user.pk,
            "username": request.user.get_username(),
            "name": request.user.get_full_name() or request.user.get_username(),
            "email": request.user.email,
        }
    # BACKEND TODO: Return approved clinic membership and record permissions for
    # AppLayout and record forms. Account authentication alone is not provider approval.
    return {
        "user": user,
        "permissions": {},
        "csrf_token": get_token(request),
        "login_label": str(LoginForm(request=request).fields["login"].label),
    }


@never_cache
@require_GET
def session(request):
    return JsonResponse(session_data(request))


@never_cache
@require_POST
@csrf_protect
def login(request):
    if len(request.body) > 10000:
        return JsonResponse({"message": "Request is too large."}, status=400)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"message": "Send a valid JSON object."}, status=400)
    if not isinstance(data, dict) or not all(
        isinstance(data.get(key), str) for key in ("login", "password")
    ):
        return JsonResponse({"message": "Account identifier and password are required."}, status=400)
    form_class = app_settings.FORMS.get("login")
    # Respect an existing customized allauth form as well as its authentication flow.
    if form_class:
        from django.utils.module_loading import import_string
        form = import_string(form_class)(data=data, request=request)
    else:
        form = LoginForm(data=data, request=request)
    if not form.is_valid():
        return JsonResponse({"message": "Sign-in failed. Check your account details.",
                             "errors": form.errors.get_json_data()}, status=400)
    response = form.login(request, redirect_url="/")
    if not request.user.is_authenticated:
        location = response.get("Location", "/accounts/login/")
        if not location.startswith("/accounts/"):
            location = "/accounts/login/"
        return JsonResponse({"message": "Complete sign-in through the account page.",
                             "continue_url": location}, status=409)
    return JsonResponse(session_data(request))


@never_cache
@require_POST
@csrf_protect
def logout(request):
    get_adapter(request).logout(request)
    return JsonResponse(session_data(request))
