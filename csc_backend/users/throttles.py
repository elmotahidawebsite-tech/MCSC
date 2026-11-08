"""
users/throttles.py
Rate Limiting لحماية تسجيل الدخول من هجمات Brute Force.
(SEC-002)
"""
from rest_framework.throttling import AnonRateThrottle


class LoginThrottle(AnonRateThrottle):
    """
    يحد من محاولات تسجيل الدخول.
    
    الميزة: يحدد بالـ IP + username معًا، فلو مهاجم بيحاول يخترق
    حساب معين من أكتر من IP، كل حساب لسه محمي.
    
    الحد: 5 محاولات في الدقيقة.
    """
    rate = '5/minute'
    scope = 'login'

    def get_cache_key(self, request, view):
        # لو فيه username في الطلب، حدد بيه + الـ IP
        username = request.data.get('username')
        if username:
            ident = f"{self.get_ident(request)}:{username.lower()}"
            return self.cache_format % {
                'scope': self.scope,
                'ident': ident,
            }
        # لو مفيش username، حدد بالـ IP فقط
        return super().get_cache_key(request, view)