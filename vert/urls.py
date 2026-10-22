"""
URL configuration for vert project.
"""
from django.contrib import admin
from django.urls import include, path
from apps.vert_core import frontend_auth

urlpatterns = [
   path("api/frontend/session/", frontend_auth.session, name="frontend_session"),
   path("api/frontend/login/", frontend_auth.login, name="frontend_login"),
   path("api/frontend/logout/", frontend_auth.logout, name="frontend_logout"),
   path("admin/", admin.site.urls),
   path("accounts/", include("allauth.urls")),
   path("", include("apps.vert_core.urls")),
]
