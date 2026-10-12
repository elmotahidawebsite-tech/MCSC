from rest_framework import permissions
from rest_framework.permissions import BasePermission
from .models import User


class IsAdmin(permissions.BasePermission):
    """عمليات متاحة للأدمن فقط (حذف، إدارة، مراجعة نهائية...)."""
    message = "العملية دي متاحة للأدمن فقط."

    def has_permission(self, request, view):
        return bool(request.user and request.user.role == User.Role.ADMIN)

class IsSupport(BasePermission):
    """مسؤل الدعم الفني بس."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == User.Role.SUPPORT)


class IsAdminOrSupport(BasePermission):
    """أدمن أو دعم فني — لإدارة المستخدمين."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in (User.Role.ADMIN, User.Role.SUPPORT))  