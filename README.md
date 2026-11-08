

# 📋 Checklist مراجعة المشروع — MCSC

**تاريخ المراجعة:** 2026-10-29  
**الحالة العامة:** ⚠️ غير جاهز للـ Production  
**عدد المشاكل المكتشفة:** 47 مشكلة

---

## 🔴 مخاطر حرجة (لازم تتصلح قبل أي حاجة)

| # | المشكلة | الملف/المكان | الخطورة | الحالة |
|---|---------|--------------|---------|--------|
| 1 | **الصور مخزنة كـ Base64 في الداتابيز** | `cases/models.py` | 🔴 حرج | ⬜ |
| 2 | **الـ Import مش مقفل على الأدمن** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 3 | **مفيش حد لحجم ملف الاستيراد** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 4 | **خطر ZIP Bomb في الاستيراد** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 5 | **الاستيراد مش في Transaction** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 6 | **القضية المستوردة بتبقى Submitted مباشرة** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 7 | **مفيش سجل للاستيراد (Audit Log)** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 8 | **ربط الصور بالاسم في الاستيراد ممكن يغلط** | `cases/views.py` → `import_case` | 🔴 حرج | ⬜ |
| 9 | **مفيش فحص حقيقي لنوع الملف المرفوع** | `cases/views.py` → `guess_media_type` | 🔴 حرج | ⬜ |
| 10 | **مفيش Rate Limiting** | `config/settings.py` | 🔴 حرج | ⬜ |
| 11 | **مفيش JWT Blacklisting** | `users/views.py` | 🔴 حرج | ⬜ |
| 12 | **مفيش فحص `is_active` في الـ Auth** | `users/views.py` | 🔴 حرج | ⬜ |
| 13 | **الـ JWT بيعكس الـ Role القديم** | `users/serializers.py` | 🔴 حرج | ⬜ |
| 14 | **Race Condition في توليد الأكواد** | `cases/models.py` | 🔴 حرج | ⬜ |
| 15 | **الـ Download بيحمل الـ ZIP في الذاكرة** | `cases/views.py` → `download` | 🔴 حرج | ⬜ |
| 16 | **الـ CaseDetail بيرجع كل الصور كـ Base64** | `cases/serializers.py` | 🔴 حرج | ⬜ |

---

## 🟠 مخاطر عالية

| # | المشكلة | الملف/المكان | الخطورة | الحالة |
|---|---------|--------------|---------|--------|
| 17 | **الـ PDF بيستخدم خط من `C:/Windows/`** | `cases/views.py` → `download` | 🟠 عالي | ⬜ |
| 18 | **مفيش Database Indexes** | `cases/models.py` | 🟠 عالي | ⬜ |
| 19 | **مفيش Logging مناسب** | كل المشروع | 🟠 عالي | ⬜ |
| 20 | **مفيش فحص لـ `case_number` مكرر في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 21 | **مفيش فحص لـ `case_year` منطقي** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 22 | **مفيش فحص لـ `case_type` في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 23 | **مفيش فحص لـ `biological_sample` في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 24 | **مفيش فحص لـ `role` في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 25 | **مفيش فحص لـ `media_type` في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 26 | **مفيش فحص لـ `mime_type` في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 27 | **مفيش فحص لـ `file_name` في الاستيراد** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 28 | **مفيش فحص لـ `path` في ملفات الـ ZIP** | `cases/views.py` → `import_case` | 🟠 عالي | ⬜ |
| 29 | **مفيش فحص لـ `updated_at` بشكل صحيح في الـ Sync** | `cases/views.py` → `SyncView` | 🟠 عالي | ⬜ |
| 30 | **مفيش فحص لـ `data` في الـ Sync** | `cases/views.py` → `SyncView` | 🟠 عالي | ⬜ |
| 31 | **مفيش فحص لـ `local_id` مكرر في نفس الـ Request** | `cases/views.py` → `SyncView` | 🟠 عالي | ⬜ |
| 32 | **مفيش فحص لـ `biological_sample` في الـ BodySerializer** | `cases/serializers.py` | 🟠 عالي | ⬜ |
| 33 | **مفيش فحص لـ `role` في الـ PersonSerializer** | `cases/serializers.py` | 🟠 عالي | ⬜ |
| 34 | **مفيش فحص لـ `case_type` في الـ CaseSerializer** | `cases/serializers.py` | 🟠 عالي | ⬜ |
| 35 | **مفيش فحص لـ `media_type` في الـ MediaViewSet** | `cases/views.py` | 🟠 عالي | ⬜ |

---

## 🟡 مخاطر متوسطة

| # | المشكلة | الملف/المكان | الخطورة | الحالة |
|---|---------|--------------|---------|--------|
| 36 | **مفيش Health Check Endpoint** | `config/urls.py` | 🟡 متوسط | ⬜ |
| 37 | **مفيش Graceful Shutdown** | `config/settings.py` | 🟡 متوسط | ⬜ |
| 38 | **مفيش فحص للحروف الغريبة في أسماء الملفات** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 39 | **مفيش فحص للحقول الفارغة في الـ PDF** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 40 | **مفيش فحص لـ `None` في التواريخ في الـ PDF** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 41 | **مفيش فحص لـ `case_number` في الـ ZIP** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 42 | **مفيش فحص لـ `case_code` في الـ ZIP** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 43 | **مفيش فحص لـ `evidence_code` في الـ ZIP** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 44 | **مفيش فحص لـ `person.code` في الـ ZIP** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |
| 45 | **مفيش فحص لـ `b.code` في الـ ZIP** | `cases/views.py` → `download` | 🟡 متوسط | ⬜ |

---

## 🐛 باغات في الكود

| # | المشكلة | الملف/المكان | الحالة |
|---|---------|--------------|--------|
| 46 | **`safe_name.replace("", "_")` باغ** | `cases/views.py` → `download` | ⬜ |
| 47 | **كود ميت بعد `return` في `get_queryset`** | `cases/views.py` → `CaseViewSet` | ⬜ |

---

## 📊 ملخص الأولويات

| الأولوية | عدد المشاكل | الإجراء |
|----------|-------------|---------|
| 🔴 حرج | 16 | لازم تتصلح قبل أي نشر |
| 🟠 عالي | 19 | لازم تتصلح قبل الـ Production |
| 🟡 متوسط | 10 | يفضل تتصلح |
| 🐛 باغات | 2 | لازم تتصلح فورًا |

---

## ✅ خطة العمل المقترحة

### المرحلة 1: الأمان والصلاحيات (أولوية قصوى)
- [ ] قفل الـ Import على الأدمن فقط
- [ ] إضافة Rate Limiting
- [ ] إضافة JWT Blacklisting
- [ ] فحص `is_active` في الـ Auth
- [ ] فحص نوع الملفات المرفوعة فعليًا

### المرحلة 2: الاستيراد والتصدير (ثاني أولوية)
- [ ] حد لحجم ملف الاستيراد
- [ ] حماية من ZIP Bomb
- [ ] Transaction للاستيراد
- [ ] سجل للاستيراد
- [ ] مراجعة قبل الإرسال

### المرحلة 3: التخزين والأداء (ثالث أولوية)
- [ ] نقل الصور من الـ DB لملفات
- [ ] تعديل الـ CaseDetail ليرجع URLs
- [ ] Streaming للـ ZIP
- [ ] Database Indexes

### المرحلة 4: التشغيل والـ Production
- [ ] إصلاح الـ PDF Font
- [ ] Logging
- [ ] Health Check
- [ ] Graceful Shutdown

---
