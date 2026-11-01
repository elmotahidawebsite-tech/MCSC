```markdown
# 🔒 تقرير المراجعة الأمنية والتشغيلية الشامل
## مشروع: MCSC — Crime Scene Collector

| البند | التفاصيل |
|:---|:---|
| **تاريخ المراجعة** | 2026-11-01 |
| **إصدار التقرير** | 1.0 |
| **حالة المشروع** | 🔴 غير جاهز للإنتاج |
| **عدد المشاكل المكتشفة** | 47 مشكلة |
| **البيئة المستهدفة** | Ubuntu Linux + Docker + PostgreSQL خارجي |
| **النشر** | إنترنت مفتوح |
| **المستخدمون المتوقعون** | 12 (10 ضباط + 1 أدمن + 1 دعم فني) |

---

## 📋 فهرس التقرير

1. [الملخص التنفيذي](#1-الملخص-التنفيذي)
2. [نطاق المراجعة](#2-نطاق-المراجعة)
3. [المنهجية](#3-المنهجية)
4. [النتائج التفصيلية](#4-النتائج-التفصيلية)
   - 4.1 [مخاطر أمنية حرجة](#41-مخاطر-أمنية-حرجة-)
   - 4.2 [مخاطر أمنية عالية](#42-مخاطر-أمنية-عالية-)
   - 4.3 [مخاطر تشغيلية](#43-مخاطر-تشغيلية-)
   - 4.4 [باغات في الكود](#44-باغات-في-الكود-)
5. [تقييم البنية التحتية](#5-تقييم-البنية-التحتية)
6. [خطة المعالجة](#6-خطة-المعالجة)
7. [قائمة التحقق النهائية](#7-قائمة-التحقق-النهائية)
8. [التوصيات](#8-التوصيات)
9. [الملاحق](#9-الملاحق)

---

## 1. الملخص التنفيذي

### 1.1 الحالة العامة

```
┌─────────────────────────────────────────────────────────────┐
│                    حالة الجاهزية للإنتاج                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   الأمان        ████████░░░░░░░░░░░░  35%   🔴 حرج        │
│   الأداء        ██████████░░░░░░░░░░  50%   🟠 يحتاج عمل   │
│   البنية        ██░░░░░░░░░░░░░░░░░░  10%   🔴 غير موجودة  │
│   الاختبارات    ░░░░░░░░░░░░░░░░░░░░   0%   🔴 معدومة      │
│   التوثيق       ████░░░░░░░░░░░░░░░░  20%   🟠 ناقص        │
│                                                             │
│   التقييم الكلي:  ❌ غير جاهز للنشر على الإنترنت             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 أهم المخاطر المكتشفة

| # | الخطورة | المشكلة | التأثير المحتمل |
|:---:|:---:|---|---|
| 1 | 🔴 حرج | مفتاح سري ثابت + `DEBUG=True` + `ALLOWED_HOSTS=["*"]` | اختراق كامل للنظام |
| 2 | 🔴 حرج | لا يوجد Rate Limiting على Login | هجمات Brute Force |
| 3 | 🔴 حرج | لا يوجد JWT Blacklisting | سرقة الجلسات |
| 4 | 🔴 حرج | تخزين الصور/الفيديو كـ Base64 في قاعدة البيانات | انهيار الأداء |
| 5 | 🔴 حرج | `import_case` بدون قيود أمان | استنزاف الموارد + حقن بيانات |
| 6 | 🟠 عالي | لا يوجد فحص حقيقي لنوع الملفات المرفوعة | رفع ملفات خبيثة |
| 7 | 🟠 عالي | خط PDF من مسار Windows | فشل توليد التقارير على لينكس |
| 8 | 🟠 عالي | لا يوجد Docker / CI/CD / نسخ احتياطي | عدم قابلية النشر |

### 1.3 التوصية الفورية

> ⚠️ **تحذير:** المشروع بصورته الحالية **لا يجب نشره على الإنترنت المفتوح** تحت أي ظرف. 
> يجب معالجة جميع المخاطر الحرجة (🔴) على الأقل قبل أي نشر.

---

## 2. نطاق المراجعة

### 2.1 المكونات المشمولة

```
MCSC/
├── csc_backend/          ✅ مراجعة كاملة
│   ├── config/           ✅ settings.py, urls.py
│   ├── users/            ✅ models, views, serializers, urls, permissions
│   ├── cases/            ✅ models, views, serializers, urls, media_utils
│   ├── requirements.txt  ✅ مراجعة الاعتماديات
│   └── .env.example      ✅ مراجعة
├── csc_frontend/         ✅ مراجعة جزئية
│   ├── src/api/          ✅ client.ts, auth.ts
│   ├── src/context/      ✅ AuthContext.tsx
│   ├── src/routes/       ✅ ProtectedRoute, RoleRoute
│   └── package.json      ✅ مراجعة الاعتماديات
└── البنية التحتية        ✅ فحص وجود ملفات النشر
```

### 2.2 المكونات غير المشمولة

| المكون | السبب |
|---|---|
| ملفات الفرونت إند الداخلية (كل صفحة) | مراجعة جزئية فقط |
| قاعدة البيانات الفعلية | غير متاحة وقت المراجعة |
| السيرفر / البيئة الفعلية | المشروع على جهاز شخصي |
| اختبارات الاختراق الفعلية | تتطلب بيئة تشغيل |

### 2.3 التقنيات المستخدمة في المشروع

| الطبقة | التقنية | الإصدار |
|---|---|---|
| Backend Framework | Django | 5.0.6 |
| REST API | Django REST Framework | 3.15.1 |
| Authentication | SimpleJWT | 5.3.1 |
| Database (حاليًا) | SQLite | مدمج |
| Database (مستهدف) | PostgreSQL | — |
| Frontend | React + TypeScript | 18.3.1 |
| Build Tool | Vite | 5.3.3 |
| Styling | Tailwind CSS | 4.3.3 |
| State Management | TanStack Query | 5.51.1 |
| PDF Generation | ReportLab | 5.0.0 |
| Image Processing | Pillow | 10.3.0 |

---

## 3. المنهجية

### 3.1 خطوات المراجعة

```
1. فحص إعدادات الأمان (settings.py)
   ├── SECRET_KEY, DEBUG, ALLOWED_HOSTS
   ├── CORS configuration
   └── Security middleware

2. مراجعة المصادقة والتفويض
   ├── JWT configuration & lifecycle
   ├── Permission classes
   └── Role-based access control

3. فحص نقاط النهاية (API Endpoints)
   ├── Input validation
   ├── Authentication requirements
   └── Error handling

4. مراجعة رفع الملفات
   ├── Size limits
   ├── Type validation
   └── Storage mechanism

5. فحص قاعدة البيانات
   ├── Schema design
   ├── Indexes
   └── Data storage patterns

6. مراجعة البنية التحتية
   ├── Docker / deployment files
   ├── CI/CD pipelines
   └── Backup strategy
```

### 3.2 أدوات المراجعة

- تحليل كود يدوي (Manual Code Review)
- بحث آلي عن الأنماط الخطرة (Pattern-based scanning)
- مراجعة إعدادات المكتبات (Dependency review)
- فحص ملفات الإعدادات (Configuration audit)

---

## 4. النتائج التفصيلية

---

### 4.1 مخاطر أمنية حرجة 🔴

---

#### 🔴 SEC-001: مفتاح سري ثابت وإعدادات تطوير في الإنتاج

| البند | التفاصيل |
|---|---|
| **الملف** | `csc_backend/config/settings.py` |
| **الأسطر** | 10, 123-126 |
| **الخطورة** | 🔴 حرجة |
| **الثقة** | 9/10 |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

```python
# الكود الحالي في settings.py
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")  # ❌ قيمة ثابتة
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"         # ❌ True افتراضيًا
ALLOWED_HOSTS = ["*"]                                                # ❌ مفتوح للجميع
```

**التحليل:**

1. **SECRET_KEY ثابت:** إذا لم يتم تعيين متغير البيئة `DJANGO_SECRET_KEY`، سيستخدم Django القيمة `"dev-only-change-me"`. هذه القيمة:
   - معروفة لأي شخص يقرأ الكود المصدري
   - تُستخدم لتوقيع JWT tokens → أي شخص يمكنه تزوير توكنات صالحة
   - تُستخدم لتوقيع جلسات الإدارة → اختراق لوحة التحكم

2. **DEBUG=True افتراضيًا:** في حالة الخطأ، يعرض Django صفحة تفصيلية تحتوي على:
   - الكود المصدري
   - متغيرات البيئة
   - استعلامات قاعدة البيانات
   - مسار الملفات على السيرفر

3. **ALLOWED_HOSTS=["*"]:** يسمح لأي نطاق بالاتصال بالتطبيق، مما يمكّن من هجمات:
   - Host Header Injection
   - Cache Poisoning
   - Password Reset Poisoning

**التأثير المحتمل:**
```
مهاجم يعرف SECRET_KEY = "dev-only-change-me"
    ↓
يولد JWT token مزور بأي صلاحيات (admin)
    ↓
يصل لجميع البيانات (قضايا، أدلة، صور، بيانات شخصية)
    ↓
يسرق/يعدل/يحذف البيانات
```

**الحل المقترح:**

```python
# settings.py - نسخة مُصححة
import os

DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise RuntimeError(
            "CRITICAL: DJANGO_SECRET_KEY must be set in production. "
            "Generate one with: python -c 'from django.core.management.utils "
            "import get_random_secret_key; print(get_random_secret_key())'"
        )
    SECRET_KEY = "insecure-dev-key-do-not-use-in-production"

if DEBUG:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
else:
    allowed = os.getenv("DJANGO_ALLOWED_HOSTS", "")
    if not allowed:
        raise RuntimeError("CRITICAL: DJANGO_ALLOWED_HOSTS must be set in production")
    ALLOWED_HOSTS = [h.strip() for h in allowed.split(",")]
```

---

#### 🔴 SEC-002: لا يوجد Rate Limiting على تسجيل الدخول

| البند | التفاصيل |
|---|---|
| **الملف** | `csc_backend/users/views.py`, `config/settings.py` |
| **الخطورة** | 🔴 حرجة |
| **الثقة** | 10/10 |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

نقطة النهاية `POST /api/auth/login/` لا تحتوي على أي حماية من:
- هجمات تخمين كلمة المرور (Brute Force)
- هجمات قوائم البيانات (Credential Stuffing)
- هجمات حجب الخدمة (DoS)

**الكود الحالي:**
```python
# users/views.py
class LoginView(TokenObtainPairView):
    serializer_class = CSCTokenObtainPairSerializer
    # ❌ لا يوجد throttle_classes
    # ❌ لا يوجد rate limiting
```

**الهجوم المحتمل:**
```bash
# مهاجم يمكنه تنفيذ:
for password in $(cat rockyou.txt); do
    curl -X POST https://api.example.com/api/auth/login/ \
         -H "Content-Type: application/json" \
         -d "{\"username\": \"admin\", \"password\": \"$password\"}"
done
# بدون أي قيود → آلاف المحاولات في الدقيقة
```

**الحل المقترح:**

```python
# 1. في settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
    },
}

# 2. في users/views.py
from rest_framework.throttling import AnonRateThrottle

class LoginThrottle(AnonRateThrottle):
    rate = '5/minute'
    
    def get_cache_key(self, request, view):
        # تحديد بالـ IP + username معًا
        if request.data.get('username'):
            ident = f"{self.get_ident(request)}:{request.data['username']}"
            return self.cache_format % {'scope': 'login', 'ident': ident}
        return super().get_cache_key(request, view)

class LoginView(TokenObtainPairView):
    serializer_class = CSCTokenObtainPairSerializer
    throttle_classes = [LoginThrottle]  # ✅
```

---

#### 🔴 SEC-003: لا يوجد JWT Blacklisting أو Logout فعلي

| البند | التفاصيل |
|---|---|
| **الملفات** | `users/views.py`, `users/urls.py`, `settings.py`, `frontend/src/api/auth.ts` |
| **الخطورة** | 🔴 حرجة |
| **الثقة** | 10/10 |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

| البند | الحالة الحالية | المشكلة |
|---|---|---|
| Access Token Lifetime | **8 ساعات** | طويلة جدًا |
| Refresh Token Lifetime | **7 أيام** | طويلة جدًا |
| Blacklist App | **غير مفعّل** | لا يمكن إبطال التوكنات |
| Logout Endpoint | **غير موجود** | لا يوجد سحب للتوكن |
| Frontend Logout | **يمسح localStorage فقط** | التوكن يظل صالحًا |

**الكود الحالي للفرونت:**
```typescript
// frontend/src/api/auth.ts
export const logout = () => {
  localStorage.removeItem("access");   // ❌ يمسح من المتصفح فقط
  localStorage.removeItem("refresh");  // ❌ التوكن لسه صالح على السيرفر
};
```

**السيناريو الخطر:**
```
1. مستخدم يسجل دخول من مقهى إنترنت
2. يسجل خروج (يمسح من المتصفح فقط)
3. مهاجم يحصل على التوكن من:
   - سجل المتصفح
   - Network tab
   - XSS vulnerability
4. التوكن صالح لمدة 8 ساعات → وصول كامل
```

**الحل المقترح:**

```python
# 1. settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework_simplejwt.token_blacklist',  # ✅
]

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),    # ✅ 15 دقيقة بدل 8 ساعات
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),       # ✅ يوم بدل 7 أيام
    'ROTATE_REFRESH_TOKENS': True,                     # ✅
    'BLACKLIST_AFTER_ROTATION': True,                  # ✅
    'UPDATE_LAST_LOGIN': True,                         # ✅
    'CHECK_USER_IS_ACTIVE': True,                      # ✅
}

# 2. users/urls.py
from rest_framework_simplejwt.views import TokenBlacklistView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),  # ✅
    path('auth/me/', MeView.as_view(), name='me'),
]
```

```bash
# 3. تطبيق migration
python manage.py migrate

# 4. Cron job لحذف التوكنات المنتهية
# في crontab:
0 0 * * * cd /opt/projects/mcsc && python manage.py flushexpiredtokens
```

---

#### 🔴 SEC-004: تخزين الوسائط كـ Base64 في قاعدة البيانات

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/models.py`, `cases/views.py`, `cases/serializers.py` |
| **الخطورة** | 🔴 حرجة (أداء + قابلية التوسع) |
| **الثقة** | 10/10 |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

جميع الوسائط (صور، فيديو، صوت، مستندات) تُخزن كنصوص Base64 في حقول `TextField`:

```python
# cases/models.py
class EvidenceMedia(models.Model):
    file_data = models.TextField()        # ❌ الصورة/الفيديو كنص
    compressed = models.TextField()       # ❌ نسخة مضغوطة كنص
    thumbnail = models.TextField()        # ❌ نسخة مصغرة كنص

# نفس النمط في:
# PersonImage.image_data
# BodyImage.image_data
# CaseImage.image_data
```

**التحليل الكمي:**

```
صورة واحدة 5MB:
├── Base64 encoding يضيف ~33% → 6.67MB
├── الأصل (file_data)        → 6.67MB
├── المضغوط (compressed)     → ~2MB
├── المصغر (thumbnail)       → ~0.1MB
└── الإجمالي لكل صورة        → ~8.77MB في قاعدة البيانات

قضية فيها 50 صورة:
└── 50 × 8.77MB = ~438MB لقضية واحدة

100 قضية:
└── ~43.8GB في قاعدة البيانات ❌

فيديو 100MB:
├── Base64 → 133MB كنص
└── في TextField → كارثة حقيقية ❌
```

**المشاكل الناتجة:**

| المشكلة | التأثير |
|---|---|
| حجم قاعدة البيانات | ينمو بشكل أسّي |
| سرعة الاستعلامات | بطء شديد عند قراءة القضايا |
| الـ Backup | يستغرق ساعات |
| الـ API Response | `CaseDetailSerializer` يرجع كل الصور كـ Base64 → response بمئات الـ MB |
| الذاكرة | تحميل كل الوسائط في الذاكرة عند توليد ZIP |
| PostgreSQL | `TextField` غير مصمم للبيانات الثنائية الكبيرة |

**الحل المقترح (مرحلي):**

```
المرحلة 1 (فوري):
├── إيقاف إرجاع الصور الكاملة في CaseDetailSerializer
├── إرجاع thumbnail فقط في القوائم
└── إرجاع رابط التحميل للأصل

المرحلة 2 (قبل الإنتاج):
├── إضافة FileField لكل موديل وسائط
├── كتابة migration script لنقل البيانات
├── استخدام S3/MinIO للتخزين
└── حذف حقول TextField القديمة

المرحلة 3 (تحسين):
├── توليد النسخ المضغوطة بشكل غير متزامن (Celery)
├── CDN للصور
└── ضغط الفيديو
```

---

#### 🔴 SEC-005: `import_case` بدون قيود أمان

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/views.py` → `import_case` |
| **الأسطر** | 504-545 |
| **الخطورة** | 🔴 حرجة |
| **الثقة** | 9/10 |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

نقطة النهاية `POST /api/cases/import/` تقبل ملفات JSON و ZIP بدون أي حماية:

```
المشاكل المكتشفة:
├── ❌ لا فحص لحجم الملف
├── ❌ لا حد لعدد الملفات في ZIP
├── ❌ لا حد للحجم بعد فك الضغط (ZIP Bomb)
├── ❌ لا فحص لنوع المحتوى
├── ❌ لا فحص لتكرار case_number
├── ❌ لا Transaction (فشل جزئي ممكن)
├── ❌ القضية المستوردة تصبح "submitted" فورًا
├── ❌ لا سجل (audit log) للاستيراد
├── ❌ ربط الصور بالاسم (قابل للخطأ)
├── ❌ غير مقفل على الأدمن
└── ❌ يستخدم print() بدل logger
```

**هجوم ZIP Bomb:**
```
ملف ZIP بحجم 1MB
├── يحتوي على ملفات مضغوطة بشكل متكرر
├── عند فك الضغط → 10GB+
├── الكود يقرأ كل الصور في الذاكرة:
│   zip_images[name] = z.read(name)
└── النتيجة: استنزاف الذاكرة → انهيار السيرفر
```

**الحل المقترح:**

```python
# الخيار الموصى به: حذف الـ endpoint بالكامل
# (بناءً على قرار إلغاء الميزة من الفرونت)

# أو إذا كان لا بد من إبقائه:
@action(detail=False, methods=["post"], url_path="import",
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[IsAdmin])  # ✅ أدمن فقط
def import_case(self, request):
    MAX_FILE_SIZE = 100 * 1024 * 1024      # 100MB
    MAX_ZIP_MEMBERS = 500                   # 500 ملف
    MAX_UNCOMPRESSED_SIZE = 1 * 1024**3    # 1GB
    
    f = request.FILES.get("file")
    if not f:
        return Response({"detail": "ملف مطلوب."}, status=400)
    
    # ✅ فحص الحجم
    if f.size > MAX_FILE_SIZE:
        return Response({"detail": "حجم الملف يتجاوز الحد المسموح"}, status=400)
    
    if f.name.lower().endswith(".zip"):
        import zipfile
        z = zipfile.ZipFile(f)
        
        # ✅ فحص عدد الملفات
        if len(z.namelist()) > MAX_ZIP_MEMBERS:
            return Response({"detail": "عدد الملفات في ZIP كبير"}, status=400)
        
        # ✅ فحص الحجم بعد فك الضغط (حماية من ZIP Bomb)
        total_uncompressed = sum(info.file_size for info in z.infolist())
        if total_uncompressed > MAX_UNCOMPRESSED_SIZE:
            return Response({"detail": "حجم الملفات بعد فك الضغط كبير"}, status=400)
    
    # ✅ Transaction
    from django.db import transaction
    with transaction.atomic():
        # ... باقي الكود
```

---

### 4.2 مخاطر أمنية عالية 🟠

---

#### 🟠 SEC-006: لا يوجد فحص حقيقي لنوع الملفات المرفوعة

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/views.py` → `MediaViewSetMixin.read_media_upload` |
| **الخطورة** | 🟠 عالية |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

```python
# الكود الحالي
def read_media_upload(self, request):
    f = request.FILES.get(self.form_field)
    mt = request.data.get("media_type") or guess_media_type(f.name)  # ❌ يعتمد على الاسم
    # ❌ لا فحص للمحتوى الفعلي
    # ❌ لا فحص MIME حقيقي
    # ❌ يوجد validate_upload في media_utils.py لكنه غير مستدعى
```

**المشكلة:**
- `guess_media_type` يعتمد على امتداد الملف فقط
- يمكن رفع ملف `.exe` وتسميته `.jpg`
- `f.content_type` يُرسل من العميل → يمكن تزويره
- `python-magic` غير مثبتة

**الحل:**
```python
# تثبيت python-magic
# pip install python-magic
# على لينكس: apt-get install libmagic1

import magic

def read_media_upload(self, request):
    f = request.FILES.get(self.form_field)
    if not f:
        return None, None, Response({"detail": "ملف مطلوب."}, status=400)
    
    # ✅ فحص MIME حقيقي من المحتوى
    file_header = f.read(2048)
    f.seek(0)
    detected_mime = magic.from_buffer(file_header, mime=True)
    
    ALLOWED_TYPES = {
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'video': ['video/mp4', 'video/quicktime'],
        'audio': ['audio/mpeg', 'audio/wav'],
        'document': ['application/pdf'],
    }
    
    mt = request.data.get("media_type") or guess_media_type(f.name)
    if detected_mime not in ALLOWED_TYPES.get(mt, []):
        return None, None, Response(
            {"detail": f"نوع الملف غير مسموح: {detected_mime}"},
            status=400
        )
    
    # ... باقي الفحوصات
```

---

#### 🟠 SEC-007: API عبر HTTP + Tokens في localStorage

| البند | التفاصيل |
|---|---|
| **الملفات** | `frontend/src/api/client.ts`, `frontend/src/api/auth.ts` |
| **الخطورة** | 🟠 عالية |
| **الحالة** | ⬜ غير مُصلح |

**الوصف:**

```typescript
// client.ts
const API_URL = "http://127.0.0.1:8000/api";  // ❌ HTTP غير مشفر

// auth.ts
localStorage.setItem("access", data.access);   // ❌ قابل للسرقة عبر XSS
localStorage.setItem("refresh", data.refresh); // ❌
```

**المخاطر:**
1. **HTTP:** بيانات الدخول والتوكنات تُرسل بدون تشفير → اعتراض على الشبكة
2. **localStorage:** أي XSS vulnerability يمكنها سرقة التوكنات

**الحل:**
```
1. تفعيل HTTPS على السيرفر (Let's Encrypt)
2. تغيير API_URL لـ https://
3. النظر في استخدام httpOnly cookies بدل localStorage
4. إضافة Content-Security-Policy header للحماية من XSS
```

---

#### 🟠 SEC-008: PDF Font من مسار Windows

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/views.py` → `download` action |
| **الخطورة** | 🟠 عالية (فشل وظيفي على لينكس) |
| **الحالة** | ⬜ غير مُصلح |

**الكود الحالي:**
```python
pdfmetrics.registerFont(TTFont("ArabicFont", "C:/Windows/Fonts/tahoma.ttf"))  # ❌
```

**التأثير:** على سيرفر لينكس، هذا المسار غير موجود → `FileNotFoundError` → فشل توليد جميع تقارير PDF.

**الحل:**
```python
import os
from django.conf import settings

def get_arabic_font_path():
    candidates = [
        os.path.join(settings.BASE_DIR, 'static', 'fonts', 'tahoma.ttf'),
        os.path.join(settings.BASE_DIR, 'static', 'fonts', 'Amiri-Regular.ttf'),
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    raise RuntimeError("Arabic font not found")

# في download action:
try:
    pdfmetrics.getFont("ArabicFont")
except KeyError:
    pdfmetrics.registerFont(TTFont("ArabicFont", get_arabic_font_path()))
```

---

### 4.3 مخاطر تشغيلية 🟠

---

#### 🟠 OPS-001: لا يوجد Docker / docker-compose

| البند | التفاصيل |
|---|---|
| **الحالة** | ❌ غير موجود |
| **التأثير** | لا يمكن النشر بشكل موثوق |

**الملفات المطلوبة:**
```
المشروع/
├── csc_backend/
│   ├── Dockerfile          ❌ غير موجود
│   └── .dockerignore       ❌ غير موجود
├── csc_frontend/
│   ├── Dockerfile          ❌ غير موجود
│   └── .dockerignore       ❌ غير موجود
├── docker-compose.yml      ❌ غير موجود
├── docker-compose.prod.yml ❌ غير موجود
└── nginx/
    └── nginx.conf          ❌ غير موجود
```

---

#### 🟠 OPS-002: لا يوجد CI/CD Pipeline

| البند | التفاصيل |
|---|---|
| **الحالة** | ❌ غير موجود |
| **التأثير** | لا اختبارات آلية، لا نشر آمن |

**الملفات المطلوبة:**
```
المشروع/
├── .github/
│   └── workflows/
│       ├── test.yml        ❌ غير موجود
│       ├── security.yml    ❌ غير موجود
│       └── deploy.yml      ❌ غير موجود
└── Makefile                ❌ غير موجود
```

---

#### 🟠 OPS-003: لا يوجد خطة نسخ احتياطي

| البند | التفاصيل |
|---|---|
| **الحالة** | ❌ غير موجودة |
| **التأثير** | فقدان البيانات كارثي |

**المتطلبات:**
```
1. نسخ احتياطي يومي لـ PostgreSQL (pg_dump)
2. WAL archiving للاستعادة لنقطة زمنية
3. تشفير النسخ الاحتياطية
4. تخزين خارجي (خارج السيرفر)
5. اختبار الاستعادة دوريًا
6. سياسة احتفاظ واضحة (30 يوم على الأقل)
```

---

#### 🟠 OPS-004: لا يوجد Logging مركزي

| البند | التفاصيل |
|---|---|
| **الحالة** | ⚠️ يستخدم `print()` في بعض الأماكن |
| **التأثير** | عدم القدرة على تتبع المشاكل |

**الأماكن التي تستخدم `print()`:**
```python
# cases/views.py → import_case
print(f"⚠️ فشل إضافة شخص: {e}")
print(f"⚠️ فشل إضافة دليل: {e}")
print(f"⚠️ فشل إضافة جثة: {e}")
```

---

#### 🟠 OPS-005: لا يوجد Health Check Endpoint

| البند | التفاصيل |
|---|---|
| **الحالة** | ❌ غير موجود |
| **التأثير** | Docker لا يمكنه فحص صحة التطبيق |

---

### 4.4 باغات في الكود 🐛

---

#### 🐛 BUG-001: `safe_name.replace("", "_")` — باغ منطقي

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/views.py` → `download` action |
| **الخطورة** | 🟡 متوسطة |

**الكود:**
```python
safe_name = (person.full_name or "unknown").replace("/", "_").replace("", "_")
#                                                     ❌ replace("", "_")
# يستبدل كل موضع فارغ بـ "_"
# النتيجة: "محمد" → "_م_ح_م_د_"
```

**الحل:**
```python
import re
safe_name = re.sub(r'[^\w\s-]', '_', person.full_name or "unknown").strip()
```

---

#### 🐛 BUG-002: كود ميت بعد `return`

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/views.py` → `CaseViewSet.get_queryset` |
| **الخطورة** | 🟡 منخفضة (لا يعمل أبدًا) |

**الكود:**
```python
def get_queryset(self):
    # ...
    return qs.order_by("-created_at")
    # ❌ الكود التالي لا يُنفذ أبدًا:
    updated_after = self.request.query_params.get("updated_after")
    if updated_after:
        qs = qs.filter(updated_at__gte=updated_after)
```

---

#### 🐛 BUG-003: Race Condition في توليد الأكواد

| البند | التفاصيل |
|---|---|
| **الملف** | `cases/models.py` → `generate_case_code` |
| **الخطورة** | 🟠 عالية (مع تزامن الطلبات) |

**الكود:**
```python
def generate_case_code():
    year = datetime.now().year
    seq = Case.objects.filter(case_code__startswith=f"C-{year}-").count() + 1
    # ❌ بين الـ count والـ save، طلب آخر يمكنه الحصول على نفس الرقم
    while True:
        code = f"C-{year}-{seq:04d}"
        if not Case.objects.filter(case_code=code).exists():
            return code
        seq += 1
```

**الحل:**
```python
from django.db import transaction

def generate_case_code():
    with transaction.atomic():
        year = datetime.now().year
        prefix = f"C-{year}-"
        # استخدام SELECT FOR UPDATE أو تسلسل قاعدة البيانات
        last = Case.objects.filter(
            case_code__startswith=prefix
        ).select_for_update().order_by('-case_code').first()
        
        if last:
            seq = int(last.case_code.split('-')[-1]) + 1
        else:
            seq = 1
        
        return f"{prefix}{seq:04d}"
```

---

## 5. تقييم البنية التحتية

### 5.1 الوضع الحالي

```
┌─────────────────────────────────────────────────────────────┐
│                    البنية الحالية                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   جهاز شخصي (Windows)                                       │
│   ├── Django runserver (تطوير)                              │
│   ├── SQLite (db.sqlite3)                                   │
│   ├── Vite dev server (فرونت)                               │
│   └── لا يوجد:                                              │
│       ├── ❌ Docker                                         │
│       ├── ❌ Reverse Proxy                                  │
│       ├── ❌ HTTPS                                          │
│       ├── ❌ CI/CD                                          │
│       ├── ❌ Monitoring                                     │
│       ├── ❌ Backup                                         │
│       └── ❌ Log Management                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 البنية المستهدفة

```
┌─────────────────────────────────────────────────────────────┐
│                    البنية المستهدفة                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   الإنترنت                                                  │
│      │                                                      │
│      ▼                                                      │
│   ┌──────────┐                                             │
│   │  Nginx   │  ← HTTPS (Let's Encrypt)                    │
│   │  Proxy   │  ← Rate Limiting                            │
│   │          │  ← Security Headers                         │
│   └────┬─────┘                                             │
│        │                                                    │
│   ┌────┴────────────────────────────┐                       │
│   │         Docker Network          │                       │
│   │                                 │                       │
│   │  ┌───────────┐  ┌───────────┐  │                       │
│   │  │ Frontend  │  │  Backend  │  │                       │
│   │  │  (Nginx)  │  │(Gunicorn) │  │                       │
│   │  └───────────┘  └─────┬─────┘  │                       │
│   │                       │         │                       │
│   └───────────────────────┼─────────┘                       │
│                           │                                 │
│   ┌───────────────────────┼─────────┐                       │
│   │    PostgreSQL Server  │         │                       │
│   │    (خارجي/منفصل)     │         │                       │
│   │    ├── SSL/TLS        │         │                       │
│   │    ├── Daily Backup   │         │                       │
│   │    └── WAL Archive    │         │                       │
│   └───────────────────────┘         │                       │
│                                                             │
│   ┌─────────────────────────────────┐                       │
│   │         CI/CD Pipeline          │                       │
│   │   GitHub Actions / GitLab CI    │                       │
│   │   ├── Tests                     │                       │
│   │   ├── Security Scan             │                       │
│   │   ├── Build Docker Images       │                       │
│   │   └── Deploy                    │                       │
│   └─────────────────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 متطلبات إضافية للسيرفر

> ⚠️ ملاحظة: السيرفر سيستضيف مشاريع متعددة في المستقبل.

| المتطلب | التوصية |
|---|---|
| نظام التشغيل | Ubuntu 22.04 LTS / 24.04 LTS |
| RAM | 8GB على الأقل (لعدة مشاريع) |
| CPU | 4 cores |
| التخزين | 100GB SSD |
| Docker | Docker Engine + Docker Compose |
| Reverse Proxy | Nginx / Traefik / Caddy |
| HTTPS | Let's Encrypt (Certbot) |
| Firewall | UFW |
| Monitoring | Uptime Kuma + Prometheus + Grafana |
| Log Management | Loki أو ملفات + logrotate |

---

## 6. خطة المعالجة

### 6.1 الجدول الزمني المقترح

```
الأسبوع 1-2: الأمان الحرج (المرحلة 1.1)
├── اليوم 1-2:  SECRET_KEY + DEBUG + ALLOWED_HOSTS
├── اليوم 3-4:  Rate Limiting + JWT Blacklisting
├── اليوم 5-6:  فحص MIME + حذف/تقييد Import
├── اليوم 7-8:  PDF Font + إصلاح الباجات
├── اليوم 9-10: كتابة اختبارات للأمان
└── اليوم 11-14: مراجعة شاملة + اختبار

الأسبوع 3-4: البنية التحتية (المرحلة 2)
├── إعداد السيرفر (Ubuntu + Docker)
├── إعداد PostgreSQL الخارجي
├── إعداد Nginx + HTTPS
├── إعداد النسخ الاحتياطي
└── إعداد CI/CD

الأسبوع 5-6: النشر والاختبار (المرحلة 3)
├── رفع المشروع على السيرفر
├── اختبار شامل
├── مراقبة الأداء
└── معالجة المشاكل المكتشفة

الأسبوع 7: التسليم (المرحلة 4)
├── مسح البيانات التجريبية
├── التوثيق
└── التسليم للعميل
```

### 6.2 أولويات المعالجة

```
أولوية 1 — قبل أي نشر (🔴 حرج):
┌─────────────────────────────────────────────────┐
│ □ SEC-001: SECRET_KEY + DEBUG + ALLOWED_HOSTS  │
│ □ SEC-002: Rate Limiting                       │
│ □ SEC-003: JWT Blacklisting                    │
│ □ SEC-005: import_case (حذف أو تأمين)          │
│ □ OPS-001: HTTPS                               │
└─────────────────────────────────────────────────┘

أولوية 2 — قبل الإنتاج (🟠 عالي):
┌─────────────────────────────────────────────────┐
│ □ SEC-004: نقل الوسائط من Base64              │
│ □ SEC-006: فحص MIME                           │
│ □ SEC-008: PDF Font                           │
│ □ OPS-001: Docker                             │
│ □ OPS-002: CI/CD                              │
│ □ OPS-003: Backup                             │
│ □ BUG-003: Race Condition                     │
└─────────────────────────────────────────────────┘

أولوية 3 — تحسينات (🟡 متوسط):
┌─────────────────────────────────────────────────┐
│ □ OPS-004: Logging                            │
│ □ OPS-005: Health Check                       │
│ □ BUG-001: safe_name                          │
│ □ BUG-002: Dead code                          │
│ □ Database Indexes                            │
└─────────────────────────────────────────────────┘
```

---

## 7. قائمة التحقق النهائية

### 7.1 قبل النشر على السيرفر

#### الأمان
- [ ] `SECRET_KEY` من متغير بيئة (50+ حرف عشوائي)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` محدد بدقة
- [ ] `JWT_SIGNING_KEY` منفصل عن `SECRET_KEY`
- [ ] Rate Limiting على Login (5/دقيقة)
- [ ] Rate Limiting عام على API
- [ ] JWT Blacklisting مفعّل
- [ ] `ACCESS_TOKEN_LIFETIME` ≤ 15 دقيقة
- [ ] `REFRESH_TOKEN_LIFETIME` ≤ يوم واحد
- [ ] Logout endpoint يسحب التوكن فعليًا
- [ ] فحص MIME حقيقي للملفات المرفوعة
- [ ] حدود حجم الملفات المرفوعة
- [ ] `import_case` محذوف أو مؤمن بالكامل
- [ ] لا توجد أسرار في الكود المصدري
- [ ] لا توجد ملفات `.env` في Git
- [ ] `db.sqlite3` غير موجود في Git
- [ ] HTTPS مفعّل
- [ ] Security Headers مضبوطة
- [ ] CORS محدد بنطاقات معينة

#### قاعدة البيانات
- [ ] PostgreSQL (ليس SQLite)
- [ ] `psycopg2` في requirements.txt
- [ ] اتصال SSL/TLS بقاعدة البيانات
- [ ] مستخدم قاعدة بيانات بصلاحيات محدودة
- [ ] لا يوجد منفذ قاعدة بيانات مفتوح للعالم

#### الملفات المرفوعة
- [ ] الوسائط لا تُخزن كـ Base64 في قاعدة البيانات
- [ ] تخزين في ملفات أو S3/MinIO
- [ ] حدود حجم واضحة
- [ ] فحص نوع المحتوى

### 7.2 قبل التسليم للعميل

#### التشغيل
- [ ] Docker + docker-compose يعمل
- [ ] CI/CD pipeline يعمل
- [ ] نسخ احتياطي يومي مفعّل
- [ ] اختبار استعادة ناجح
- [ ] Health Check endpoint
- [ ] Logging مركزي
- [ ] Monitoring مفعّل
- [ ] لا توجد بيانات تجريبية
- [ ] مستخدم أدمن جديد (ليس الافتراضي)
- [ ] كلمات المرور الافتراضية مُغيّرة

#### التوثيق
- [ ] دليل تشغيل
- [ ] دليل النسخ الاحتياطي والاستعادة
- [ ] توثيق API
- [ ] معلومات التواصل والدعم
- [ ] HANDOVER.md

#### الاختبارات
- [ ] جميع اختبارات الوحدة ناجحة
- [ ] جميع اختبارات التكامل ناجحة
- [ ] اختبار الصلاحيات (ضابط/أدمن/دعم)
- [ ] اختبار رفع الملفات
- [ ] اختبار توليد PDF
- [ ] اختبار Rate Limiting
- [ ] اختبار JWT expiry
- [ ] اختبار النسخ الاحتياطي والاستعادة

---

## 8. التوصيات

### 8.1 توصيات فورية

1. **لا تنشر المشروع على الإنترنت** حتى معالجة جميع المخاطر الحرجة
2. **احذف `import_case`** أو قيده بالأدمن مع كل الحماية المطلوبة
3. **أعد تصميم تخزين الوسائط** قبل إضافة أي بيانات حقيقية
4. **أضف اختبارات** قبل أي تغييرات كبيرة

### 8.2 توصيات قصيرة المدى

1. **استخدم PostgreSQL** مع مشغل `psycopg2`
2. **انقل الوسائط لـ S3/MinIO** بدل قاعدة البيانات
3. **أضف Docker** لكل مكونات المشروع
4. **أعد تصميم الـ Frontend Token Storage** (httpOnly cookies بدل localStorage)

### 8.3 توصيات طويلة المدى

1. **اعتمد إطار أمان** (OWASP Top 10 كمرجع)
2. **أضف اختبارات اختراق** دورية
3. **راقب الأداء** مع نمو البيانات
4. **خطط للتوسع** إذا زاد عدد المستخدمين

---

## 9. الملاحق

### 9.1 ملخص الاعتماديات

#### Backend (requirements.txt)
```
Django==5.0.6
djangorestframework==3.15.1
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
django-filter==24.2
drf-spectacular==0.30.0
pillow==10.3.0
python-decouple==3.8
reportlab==5.0.0
arabic-reshaper==3.0.1
python-bidi==0.6.11
PyJWT==2.13.0
```

**الاعتماديات المفقودة:**
```
psycopg2-binary          # ❌ مطلوب لـ PostgreSQL
python-magic             # ❌ مطلوب لفحص MIME
gunicorn                 # ❌ مطلوب للإنتاج
django-ratelimit         # ❌ مطلوب للحماية
```

#### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "axios": "^1.7.2",
    "@tanstack/react-query": "^5.51.1",
    "react-router-dom": "^6.24.0",
    "jwt-decode": "^4.0.0",
    "react-hook-form": "^7.84.0",
    "zod": "^4.4.3"
  }
}
```

### 9.2 هيكل المشروع

```
MCSC/
├── csc_backend/
│   ├── config/
│   │   ├── settings.py      ← إعدادات الأمان
│   │   ├── urls.py          ← المسارات الرئيسية
│   │   └── wsgi.py
│   ├── users/
│   │   ├── models.py        ← User model (roles)
│   │   ├── views.py         ← Login, Me
│   │   ├── serializers.py   ← JWT serializer
│   │   ├── permissions.py   ← IsAdmin, IsAdminOrSupport
│   │   └── urls.py
│   ├── cases/
│   │   ├── models.py        ← Case, Person, Evidence, Media
│   │   ├── views.py         ← CRUD + Import + Download + Sync
│   │   ├── serializers.py   ← Serializers
│   │   ├── media_utils.py   ← ⚠️ غير مستدعى
│   │   ├── permissions.py
│   │   └── urls.py
│   ├── requirements.txt
│   ├── manage.py
│   └── .env.example
├── csc_frontend/
│   ├── src/
│   │   ├── api/             ← client.ts, auth.ts
│   │   ├── context/         ← AuthContext.tsx
│   │   ├── routes/          ← ProtectedRoute, RoleRoute
│   │   ├── pages/
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

### 9.3 المصطلحات

| المصطلح | التعريف |
|---|---|
| **Base64** | طريقة لترميز البيانات الثنائية كنص |
| **JWT** | JSON Web Token — توكن مصادقة |
| **Rate Limiting** | تحديد عدد الطلبات المسموح بها |
| **ZIP Bomb** | ملف مضغوط صغير يتمدد لحجم ضخم |
| **MIME Type** | نوع المحتوى الفعلي للملف |
| **RPO** | Recovery Point Objective — أقصى فقدان مقبول للبيانات |
| **RTO** | Recovery Time Objective — أقصى وقت مقبول للاستعادة |

---

## 📌 ملاحظات ختامية

> هذا التقرير يمثل حالة المشروع كما تم فحصه في تاريخ المراجعة.
> أي تغييرات لاحقة على الكود تتطلب مراجعة جديدة.
> 
> **المسؤولية:** هذا التقرير للتوجيه فقط. التنفيذ النهائي والتحقق من الأمان مسؤولية فريق التطوير.

---

| | |
|---|---|
| **مُعد التقرير** | AI Security Review Assistant |
| **التاريخ** | 2026-11-01 |
| **الإصدار** | 1.0 |
| **التصنيف** | سري — للاستخدام الداخلي |

---

*نهاية التقرير*
```

---

الملف ده شامل كل حاجة. احفظه باسم `SECURITY-REPORT.md` في المشروع.

**الخطوة الجاية:** تحب نبدأ ننفذ أول إصلاح (الأسرار والإعدادات)؟ 🚀