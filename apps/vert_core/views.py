from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.http import FileResponse, Http404
from pathlib import Path
from .models import User


FRONTEND_INDEX = Path(__file__).resolve().parent / "dist" / "index.html"

def serve_frontend_app(request):
    if not FRONTEND_INDEX.is_file():
        raise Http404("Frontend build not found. Build the React app first.")
    return FileResponse(FRONTEND_INDEX.open("rb"), content_type="text/html")

#   views not needed for the moment, will build these out later after the React frontend is implemented. Keeping them here for reference in case they are needed in the future.
# FRONTEND_INDEX = (
#     Path(__file__).resolve().parent
#     / "static"
#     / "vert_core"
#     / "frontend"
#     / "index.html"
# )

# def serve_frontend_app(request):
#     if not FRONTEND_INDEX.is_file():
#         raise Http404("Frontend build not found. Build the React app first.")
#     return FileResponse(FRONTEND_INDEX.open("rb"), content_type="text/html")


#   these view functions were used in the backend placeholder before the React frontend was implemented. They are now commented out, but kept here for reference in case they are needed in the future.
# @login_required
# def users(request):
#     if request.method == 'POST':
#         data = request.POST
#         pet_image = request.FILES.get('pet_image')
#         user_name = data.get('user_name')
#         additional_notes = data.get('additional_notes')

#         User.objects.create(
#             pet_image=pet_image,
#             user_name=user_name,
#             additional_notes=additional_notes,
#         )
#         return redirect('/')

#     queryset = User.objects.all()
#     if request.GET.get('search'):
#         queryset = queryset.filter(user_name__icontains=request.GET.get('search'))

#     context = {'users': queryset}
#     return render(request, 'dashboard.html', context)


# @login_required
# def delete_user(request, id):
#     user = get_object_or_404(User, id=id)
#     user.delete()
#     return redirect('/')


# @login_required
# def update_user(request, id):
#     user = get_object_or_404(User, id=id)
#     if request.method == 'POST':
#         data = request.POST
#         user_name = data.get('user_name')
#         additional_notes = data.get('additional_notes')
#         pet_image = request.FILES.get('pet_image')

#         user.user_name = user_name
#         user.additional_notes = additional_notes
#         if pet_image:
#             user.pet_image = pet_image
#         user.save()
#         return redirect('/')

#     context = {'user': user}
#     return render(request, 'form_page.html', context)


