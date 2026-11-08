"""
test_logout.py
اختبار SEC-003: JWT Blacklisting + Logout
شغله من داخل الـ venv:
    python test_logout.py
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def print_step(num, title):
    print(f"\n{'='*60}")
    print(f"  الخطوة {num}: {title}")
    print(f"{'='*60}")

def main():
    # ========================================
    # 1. تسجيل الدخول
    # ========================================
    print_step(1, "تسجيل الدخول")
    
    login_resp = requests.post(
        f"{BASE_URL}/auth/login/",
        json={"username": "admin", "password": "admin1234"}
    )
    
    if login_resp.status_code != 200:
        print(f"❌ فشل تسجيل الدخول: {login_resp.status_code}")
        print(f"   Response: {login_resp.text}")
        sys.exit(1)
    
    data = login_resp.json()
    access_token = data["access"]
    refresh_token = data["refresh"]
    
    print(f"✅ تسجيل دخول ناجح")
    print(f"   Access Token:  {access_token[:30]}...")
    print(f"   Refresh Token: {refresh_token[:30]}...")
    print(f"   Length:        {len(refresh_token)} chars")
    
    # ========================================
    # 2. استخدام الـ access token (مفروض يشتغل)
    # ========================================
    print_step(2, "استخدام الـ access token (مفروض يشتغل)")
    
    me_resp = requests.get(
        f"{BASE_URL}/auth/me/",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    if me_resp.status_code == 200:
        print(f"✅ /auth/me/ ناجح: {me_resp.json()}")
    else:
        print(f"❌ /auth/me/ فشل: {me_resp.status_code}")
        print(f"   Response: {me_resp.text}")
    
    # ========================================
    # 3. تسجيل الخروج (سحب الـ refresh token)
    # ========================================
    print_step(3, "تسجيل الخروج (سحب الـ refresh token)")
    
    logout_resp = requests.post(
        f"{BASE_URL}/auth/logout/",
        json={"refresh": refresh_token}
    )
    
    if logout_resp.status_code == 200:
        print(f"✅ Logout ناجح: {logout_resp.json()}")
    else:
        print(f"❌ Logout فشل: {logout_resp.status_code}")
        print(f"   Response: {logout_resp.text}")
        sys.exit(1)
    
    # ========================================
    # 4. محاولة استخدام الـ refresh token المسحوب (مفروض يفشل)
    # ========================================
    print_step(4, "محاولة استخدام الـ refresh token المسحوب (مفروض 401)")
    
    refresh_resp = requests.post(
        f"{BASE_URL}/auth/refresh/",
        json={"refresh": refresh_token}
    )
    
    if refresh_resp.status_code == 401:
        print(f"✅ التوكن المسحوب مرفوض (401) - ده المتوقع!")
        print(f"   Response: {refresh_resp.json()}")
    else:
        print(f"❌ التوكن لسه شغال! Status: {refresh_resp.status_code}")
        print(f"   Response: {refresh_resp.text}")
    
    # ========================================
    # 5. محاولة logout بنفس التوكن تاني (مفروض 400)
    # ========================================
    print_step(5, "محاولة logout بنفس التوكن تاني (مفروض 400)")
    
    logout2_resp = requests.post(
        f"{BASE_URL}/auth/logout/",
        json={"refresh": refresh_token}
    )
    
    if logout2_resp.status_code == 400:
        print(f"✅ التوكن المسحوب مرفوض في logout تاني (400) - ده المتوقع!")
        print(f"   Response: {logout2_resp.json()}")
    else:
        print(f"⚠️  Status غير متوقع: {logout2_resp.status_code}")
        print(f"   Response: {logout2_resp.text}")
    
    # ========================================
    # 6. الـ access token لسه شغال (مفروض يشتغل لحد ما ينتهي)
    # ========================================
    print_step(6, "الـ access token لسه شغال (مفروض 200)")
    
    me2_resp = requests.get(
        f"{BASE_URL}/auth/me/",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    if me2_resp.status_code == 200:
        print(f"✅ Access token لسه شغال (طبيعي - هينتهي بعد 15 دقيقة)")
        print(f"   User: {me2_resp.json()}")
    else:
        print(f"❌ Access token فشل: {me2_resp.status_code}")
    
    # ========================================
    # 7. محاولة logout بدون refresh token (مفروض 400)
    # ========================================
    print_step(7, "محاولة logout بدون refresh token (مفروض 400)")
    
    bad_logout = requests.post(
        f"{BASE_URL}/auth/logout/",
        json={}
    )
    
    if bad_logout.status_code == 400:
        print(f"✅ رفض الطلب بدون token (400) - ده المتوقع!")
        print(f"   Response: {bad_logout.json()}")
    else:
        print(f"⚠️  Status غير متوقع: {bad_logout.status_code}")
    
    # ========================================
    # 8. محاولة logout بـ token مزيف (مفروض 400)
    # ========================================
    print_step(8, "محاولة logout بـ token مزيف (مفروض 400)")
    
    fake_logout = requests.post(
        f"{BASE_URL}/auth/logout/",
        json={"refresh": "fake.token.here"}
    )
    
    if fake_logout.status_code == 400:
        print(f"✅ رفض التوكن المزيف (400) - ده المتوقع!")
        print(f"   Response: {fake_logout.json()}")
    else:
        print(f"⚠️  Status غير متوقع: {fake_logout.status_code}")
    
    # ========================================
    # الخلاصة
    # ========================================
    print(f"\n{'='*60}")
    print(f"  ✅ اختبار SEC-003 اكتمل")
    print(f"{'='*60}")
    print(f"""
النتائج المتوقعة:
  ✅ تسجيل دخول ناجح
  ✅ /auth/me/ شغال
  ✅ Logout ناجح (200)
  ✅ التوكن المسحوب مرفوض (401)
  ✅ Logout تاني بنفس التوكن مرفوض (400)
  ✅ Access token لسه شغال (طبيعي)
  ✅ Logout بدون token مرفوض (400)
  ✅ Logout بـ token مزيف مرفوض (400)
""")

if __name__ == "__main__":
    main()