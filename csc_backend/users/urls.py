from django.urls import path
from .views import LoginView, MeView, RefreshView, UserListView, LogoutView
from rest_framework_simplejwt.views import TokenBlacklistView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="token_refresh"),
     path('auth/logout/', LogoutView.as_view(), name='token_blacklist'),  # ✅ SEC-003: JWT Blacklisting
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/", UserListView.as_view(), name="users-list"),
]
