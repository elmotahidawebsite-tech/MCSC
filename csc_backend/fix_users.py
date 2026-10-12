"""
بيضمن إن UserListView موجودة في views.py + بيكتب users/urls.py النهائي
التشغيل: python fix_users.py   وبعدها:   python fix_support.py
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
VIEWS = os.path.join(BASE, "users", "views.py")
URLS = os.path.join(BASE, "users", "urls.py")

# ===== 1) اتأكد إن UserListView موجودة في views.py =====
views_src = open(VIEWS, encoding="utf-8").read()
if "class UserListView" not in views_src:
    views_src += '''

class UserListView(APIView):
    """قائمة المحطات (قراءة فقط) — للداشبورد وفلتر المحطات.
    الإدارة بتتم من Django Admin بس."""
    permission_classes = [IsAdminOrSupport]

    def get(self, request):
        qs = User.objects.filter(role=User.Role.OFFICER).order_by("username")
        return Response(UserSerializer(qs, many=True).data)
'''
    open(VIEWS, "w", encoding="utf-8").write(views_src)
    print("✅ ضفنا UserListView في views.py")
else:
    print("✅ UserListView موجودة بالفعل في views.py")

# ===== 2) اكتب users/urls.py النهائي =====
URLS_CONTENT = '''from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, MeView, UserListView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/", UserListView.as_view(), name="users-list"),
]
'''
open(URLS, "w", encoding="utf-8").write(URLS_CONTENT)
print("✅ اتكتب:", URLS)

# ===== 3) فحص أخير =====
urls_src = open(URLS, encoding="utf-8").read()
for needle in ["auth/login/", "auth/refresh/", "auth/me/", "users/"]:
    print(("✅" if needle in urls_src else "❌"), "users/urls.py فيه:", needle)