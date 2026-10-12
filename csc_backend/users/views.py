from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminOrSupport
from .serializers import (
    CSCTokenObtainPairSerializer,
    MeSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = CSCTokenObtainPairSerializer


class MeView(RetrieveAPIView):
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(APIView):
    """قائمة المحطات (قراءة فقط) — للداشبورد وفلتر المحطات.
    الإدارة (إضافة/إيقاف/تفعيل/حذف) بتتم من Django Admin بس."""
    permission_classes = [IsAdminOrSupport]

    def get(self, request):
        qs = User.objects.filter(role=User.Role.OFFICER).order_by("username")
        return Response(UserSerializer(qs, many=True).data)