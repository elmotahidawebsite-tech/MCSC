from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(DjangoUserAdmin):
    list_display = ["username", "email", "role", "is_active", "is_staff", "date_joined"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["username"]
    ordering = ["username"]

    # ===== للسوبر يوزر (الأدمن): كل حاجة ظاهرة =====
    fieldsets = DjangoUserAdmin.fieldsets + (("الدور", {"fields": ("role",)}),)
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (("الدور", {"fields": ("role",)}),)

    # ===== RBAC: الدعم الفني يشوف المحطات بس =====
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(role=User.Role.OFFICER)   # الدعم يشوف المحطات بس
        return qs

    def get_fieldsets(self, request, obj=None):
        if request.user.is_superuser:
            if obj is None:  # شاشة الإضافة
                return (
                    (None, {"classes": ("wide",), "fields": ("username", "password1", "password2")}),
                    ("الدور", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
                )
            return (
                (None, {"fields": ("username", "password")}),
                ("الدور", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
            )
        # ===== الدعم الفني: من غير role ولا فلاجات أدمن (منع تصعيد الصلاحيات) =====
        if obj is None:  # شاشة الإضافة
            return (
                (None, {"classes": ("wide",), "fields": ("username", "password1", "password2")}),
                ("الحساب", {"fields": ("is_active",)}),
            )
        return (
            (None, {"fields": ("username", "password")}),
            ("الحساب", {"fields": ("is_active",)}),
        )

    def save_model(self, request, obj, form, change):
        """أي حد مش سوبر يوزر ينشئ/يعدل محطات بس — حتى لو بعت role تاني."""
        if not request.user.is_superuser:
            obj.role = User.Role.OFFICER
            obj.is_staff = False
            obj.is_superuser = False
        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser   # الحذف للسوبر يوزر بس