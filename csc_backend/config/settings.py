"""
Django settings for CSC (Crime Scene Collector) project - MVP.
"""
import logging
import os
from datetime import timedelta
from pathlib import Path
from decouple import config, Csv
import secrets


logger = logging.getLogger("csc")

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"
# ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS","http://192.168.1.2:5173","https://csc-frontend-self.vercel.app").split(",")
ALLOWED_HOSTS = ["*"]
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'rest_framework_simplejwt.token_blacklist',  # ✅ SEC-003: JWT Blacklisting
    # third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    #Docs
    "drf_spectacular",
    # local apps
    "users",
    "cases",
]

DATA_UPLOAD_MAX_MEMORY_SIZE = 200 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 200 * 1024 * 1024

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# =============================================================================
# CACHES - Required for Rate Limiting (SEC-002)
# =============================================================================
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'mcsc-rate-limit-cache',
    }
}

# ⚠️ في الإنتاج مع أكتر من Gunicorn worker، استخدم Redis بدلًا من الذاكرة المحلية:
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
#     }
# }

# --- Database ---
# MVP: SQLite by default so it runs with zero setup.
# Switch to PostgreSQL by setting these env vars (see .env.example).
DATABASES = {
    "default": {
        "ENGINE": os.environ.get("DB_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.environ.get("DB_NAME", BASE_DIR / "db.sqlite3"),
        "USER": os.environ.get("DB_USER", ""),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", ""),
        "PORT": os.environ.get("DB_PORT", ""),
    }
}

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Cairo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
multiple_upload = os.environ.get("MULTIPLE_UPLOAD", "True") == "True"
# --- DRF ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": ("drf_spectacular.openapi.AutoSchema"),
    # ✅ SEC-002: Rate Limiting
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',       # الزوار المجهولين: 100 طلب/ساعة
        'user': '1000/hour',      # المستخدمين: 1000 طلب/ساعة
        'login': '5/minute',      # تسجيل الدخول: 5 محاولات/دقيقة
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "CSC API",
    "DESCRIPTION": "Crime Scene Collector (CSC) API for the MVP.",
    "VERSION": "1.0.0",
    "ENUM_NAME_OVERRIDES": {
        "CaseStatusEnum": [("draft", "Draft"), ("submitted", "Submitted")],
        "SyncRecordStatusEnum": [
            ("synced", "Synced"),
            ("conflict", "Conflict"),
            ("error", "Error"),
        ],
        "PersonRoleEnum": [
            ("victim", "Victim"),
            ("suspect", "Suspect"),
            ("reporter", "Reporter"),
        ],
        "UserRoleEnum": [
            ("officer", "Officer"),
            ("admin", "Admin"),
            ("support", "Support"),
        ],
    },
}

# =============================================================================
# JWT SETTINGS - SEC-003: Short-lived tokens + blacklisting
# =============================================================================

# ✅ تأكد إن SIGNING_KEY دايمًا ليه قيمة (مش None)
_jwt_signing_key = config('JWT_SIGNING_KEY', default=None)
if not _jwt_signing_key:
    # لو مفيش مفتاح JWT منفصل، استخدم SECRET_KEY
    _jwt_signing_key = SECRET_KEY

# ✅ لو لسه فاضي (مستحيل بس احتياط)، استخدم قيمة آمنة
if not _jwt_signing_key:
    if DEBUG:
        _jwt_signing_key = "dev-jwt-" + secrets.token_urlsafe(40)
        logger.warning("Generated temporary JWT_SIGNING_KEY for development")
    else:
        raise RuntimeError("❌ CRITICAL: JWT_SIGNING_KEY or SECRET_KEY must be set!")

SIMPLE_JWT = {
    # ✅ مدة التوكنات قصيرة
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),   # بدل 8 ساعات
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),      # بدل 7 أيام
    
    # ✅ تدوير التوكنات
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    
    # ✅ أمان إضافي
    'UPDATE_LAST_LOGIN': True,
    'CHECK_USER_IS_ACTIVE': True,
    
    # ✅ مفتاح التوقيع (مضمون مش فاضي)
    'SIGNING_KEY': _jwt_signing_key,
    
    # باقي الإعدادات الافتراضية
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# --- CORS (MVP: open for local frontend dev, tighten later) ---
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://192.168.1.25:5173"
).split(",")

# =============================================================================
# LOGGING - OPS-004: تسجيل مركزي (ملفين: info + error)
# =============================================================================
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname:<8} {name}:{lineno} - {message}",
            "style": "{",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        # ملف يومي لكل الأحداث
        "info_file": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "filename": str(LOGS_DIR / "info.log"),
            "when": "midnight",          # يلف كل نص ليل
            "interval": 1,               # كل 1 يوم
            "backupCount": 30,           # يحتفظ بـ 30 يوم
            "formatter": "verbose",
            "encoding": "utf-8",
            "level": "INFO",
        },
        # ملف يومي للأخطاء بس
        "error_file": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "filename": str(LOGS_DIR / "error.log"),
            "when": "midnight",
            "interval": 1,
            "backupCount": 90,           # الأخطاء نحتفظ بيها 90 يوم
            "formatter": "verbose",
            "encoding": "utf-8",
            "level": "ERROR",
        },
    },
    "root": {
        "handlers": ["console", "info_file", "error_file"],
        "level": "WARNING",
    },

    "loggers": {
        # اللوجز بتاعتنا (اللي هنكتبها بـ logger.info / logger.error)
        "csc": {
            "handlers": ["console", "info_file", "error_file"],
            "level": "INFO",
            "propagate": False,
        },
        # طلبات Django الفاشلة (4xx = WARNING، 5xx = ERROR)
        "django.request": {
            "handlers": ["info_file", "error_file"],
            "level": "WARNING",
            "propagate": False,
        },
        # أحداث الأمان (محاولات اختراق، CSRF فاشل...)
        "django.security": {
            "handlers": ["info_file", "error_file"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}