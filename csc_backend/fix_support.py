"""
سكربت تشخيص + تجهيز حسابات الدعم الفني
التشغيل: python fix_support.py
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.urls import resolve
from django.contrib.auth.models import Permission
from users.models import User

print("\n===== 1) فحص مسارات الـ API =====")
for u in ["/api/auth/login/", "/api/auth/refresh/", "/api/auth/me/", "/api/users/", "/api/cases/"]:
    try:
        resolve(u)
        print("✅", u)
    except Exception as e:
        print("❌", u, "->", type(e).__name__)

print("\n===== 2) حالة حسابات الدعم الحالية =====")
supports = User.objects.filter(role="support")
if not supports.exists():
    print("⚠️ مفيش حساب دعم — هنعمل support1 تلقائيًا...")
    User.objects.create_user(username="support1", password="Support@123", role="support")
for u in User.objects.filter(role="support"):
    print(f"- {u.username} | is_staff={u.is_staff} | is_superuser={u.is_superuser} | "
          f"perms={list(u.user_permissions.values_list('codename', flat=True))}")

print("\n===== 3) تثبيت صلاحيات الدعم =====")
perms = Permission.objects.filter(codename__in=["view_user", "add_user", "change_user"])
for s in User.objects.filter(role="support"):
    s.is_staff = True
    s.is_superuser = False
    s.user_permissions.set(perms)
    s.save()
    print("✅ تم تجهيز:", s.username)

n = User.objects.filter(role="officer", is_staff=True).update(is_staff=False)
print(f"✅ الضباط اتقفل عنهم Django admin: {n} حساب")

print("\n===== خلصنا =====")
print("دلوقتي ادخل /admin/ بحساب الدعم من جديد (LOG OUT الأول لو داخل)")