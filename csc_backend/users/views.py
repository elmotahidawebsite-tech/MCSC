import logging
import os
from pathlib import Path

from django.conf import settings
from django.db import connection
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema

from .throttles import LoginThrottle
from .models import User
from .permissions import IsAdminOrSupport
from .serializers import (
    CSCTokenObtainPairSerializer,
    HealthCheckResponseSerializer,
    LogoutRequestSerializer,
    MessageResponseSerializer,
    MeSerializer,
    UserSerializer,
)

logger = logging.getLogger("csc")


class LoginView(TokenObtainPairView):
    serializer_class = CSCTokenObtainPairSerializer
    throttle_classes = [LoginThrottle]  # ✅ SEC-002: حماية من Brute Force

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code < 400:
            logger.info("auth_login_success username=%r", request.data.get("username"))
        else:
            logger.warning(
                "auth_login_failed username=%r status=%s",
                request.data.get("username"),
                response.status_code,
            )
        return response

    def handle_exception(self, exc):
        logger.warning("auth_login_failed error=%s", type(exc).__name__)
        return super().handle_exception(exc)


class RefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code < 400:
            logger.info("auth_refresh_success")
        else:
            logger.warning("auth_refresh_failed status=%s", response.status_code)
        return response

    def handle_exception(self, exc):
        logger.warning("auth_refresh_failed error=%s", type(exc).__name__)
        return super().handle_exception(exc)


class MeView(RetrieveAPIView):
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(APIView):
    """قائمة المحطات (قراءة فقط) — للداشبورد وفلتر المحطات.
    الإدارة (إضافة/إيقاف/تفعيل/حذف) بتتم من Django Admin بس."""
    permission_classes = [IsAdminOrSupport]
    serializer_class = UserSerializer

    @extend_schema(responses={200: UserSerializer(many=True)})
    def get(self, request):
        qs = User.objects.filter(role=User.Role.OFFICER).order_by("username")
        return Response(UserSerializer(qs, many=True).data)

class LogoutView(APIView):
    """Logout endpoint - SEC-003"""
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=LogoutRequestSerializer,
        responses={200: MessageResponseSerializer, 400: MessageResponseSerializer},
    )
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            logger.warning("auth_logout_failed reason=missing_refresh_token")
            return Response(
                {'detail': 'Refresh token مطلوب.'},
                status=400
            )
        
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("auth_logout_success user_id=%s", token.get("user_id"))
            return Response(
                {'detail': 'تم تسجيل الخروج بنجاح.'},
                status=200
            )
        except TokenError:
            logger.warning("auth_logout_failed reason=invalid_refresh_token")
            return Response(
                {'detail': 'Token غير صالح.'},
                status=400
            )



class HealthCheckView(APIView):
    """
    OPS-005: نقطة فحص لصحة النظام.
    بترجع 200 لو كل حاجة تمام، و503 لو فيه مكون واقع.
    مفيش Authentication — عشان أدوات المراقبة تقدر تنادي عليها.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = HealthCheckResponseSerializer

    @extend_schema(
        responses={200: HealthCheckResponseSerializer, 503: HealthCheckResponseSerializer}
    )
    def get(self, request):
        checks = {}
        healthy = True

        # 1) فحص الداتابيز
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            checks["database"] = "ok"
        except Exception as e:
            logger.error("health_check_database_failed", exc_info=True)
            checks["database"] = f"error: {e}"
            healthy = False

        # 2) فحص مجلد الـ media (موجود + قابل للكتابة)
        try:
            media_root = Path(settings.MEDIA_ROOT)
            if media_root.exists() and os.access(media_root, os.W_OK):
                checks["media"] = "ok"
            else:
                checks["media"] = "error: missing or not writable"
                healthy = False
        except Exception as e:
            logger.error("health_check_media_failed", exc_info=True)
            checks["media"] = f"error: {e}"
            healthy = False

        return Response(
            {
                "status": "healthy" if healthy else "unhealthy",
                "checks": checks,
            },
            status=200 if healthy else 503,
        )