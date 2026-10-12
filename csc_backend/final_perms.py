import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import Permission
from users.models import User

# 1) حذف root لو اتعمل
deleted, _ = User.objects.filter(username="root").delete()
print("🗑️ اتحذف root" if deleted else "🗑️ root مش موجود أصلًا")

# 2) الأدمن: صلاحيات القضايا بس
cases_perms = Permission.objects.filter(content_type__app_label="cases")
for a in User.objects.filter(role="admin"):
    a.is_superuser = False
    a.is_staff = True
    a.save()
    a.user_permissions.set(cases_perms)
    print("✅", a.username, "-> القضايا بس")

# 3) الدعم: صلاحيات المستخدمين بس
users_perms = Permission.objects.filter(codename__in=["view_user", "add_user", "change_user"])
for s in User.objects.filter(role="support"):
    s.is_superuser = False
    s.is_staff = True
    s.save()
    s.user_permissions.set(users_perms)
    print("✅", s.username, "-> المستخدمين بس")

# 4) الضباط برا الأدمن خالص
n = User.objects.filter(role="officer").update(is_staff=False, is_superuser=False)
print("✅ الضباط مقفول عنهم الأدمن:", n)

# 5) الحالة النهائية
print("\n===== الحالة النهائية =====")
for u in User.objects.all().order_by("id"):
    print(f"- {u.username} | role={u.role} | super={u.is_superuser} | staff={u.is_staff}")
print("عدد الـ superusers:", User.objects.filter(is_superuser=True).count())
