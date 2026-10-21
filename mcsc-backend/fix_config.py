"""
بيكتب config/urls.py بالمحتوى الصحيح إجباريًا + يتأكد من users/urls.py
التشغيل: python fix_config.py   وبعدها:   python fix_support.py
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
TARGET = os.path.join(BASE, "config", "urls.py")

CONTENT = '''from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("cases.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
'''

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(CONTENT)
print("✅ اتكتب:", TARGET)

# فحص سريع إن users/urls.py فيه المسارات المتوقعة
users_urls = open(os.path.join(BASE, "users", "urls.py"), encoding="utf-8").read()
for needle in ["auth/login/", "auth/refresh/", "auth/me/", "users/"]:
    print(("✅" if needle in users_urls else "❌"), "users/urls.py فيه:", needle)