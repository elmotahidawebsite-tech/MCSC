from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from .models import User


from .models import User


class LogoutRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class MessageResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()


class HealthCheckResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("healthy", "unhealthy"))
    checks = serializers.DictField(child=serializers.CharField())


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


class CSCTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Adds role/username into the JWT payload for FRONTEND UI convenience only.
    
    ⚠️ #13 (B1): الـ role claim مُجمَّد وقت الإصدار. لو الأدمن غيّر دور المستخدم،
    التوكن الحيّ (١٥ دقيقة) لسه شايل الدور القديم.
    
    الأمان: الـ BACKEND آمن تمامًا — ensure_case_view/edit/get_queryset/get_permissions
    بتقرا user.role من الـ DB (request.user)، مش من الـ claim. فأي عملية صلاحيات
    هتُرفض بـ 403/404 حتى لو الفرونت عرض زرار غلط.
    
    الإصلاح الكامل (token versioning) يتطلب:
      1. users/models.py: إضافة token_version = PositiveIntegerField(default=0)
      2. users/models.py: في save() أو signal: لو role اتغير → token_version += 1
      3. users/authentication.py: custom JWTAuthentication يقارن claim["tv"] == user.token_version
      4. هنا: token["tv"] = user.token_version
    مؤجَّل لـ B4 (قبل التسليم) لأنه يتطلب migration + ملف جديد.
    
    للـ beta: الفرونت يستدعي /api/auth/me/ (MeView) بعد login وعلى كل صفحة حساسة،
    ويستخدم role من الـ response (fresh من DB) مش من فكّ التوكن.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role        # UI-only; backend uses DB
        token["username"] = user.username
        # B4: token["tv"] = user.token_version  (uncomment after model migration)
        return token



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role", "is_active", "date_joined", "last_login"]
        read_only_fields = ["id", "date_joined", "last_login"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "role", "is_active", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
