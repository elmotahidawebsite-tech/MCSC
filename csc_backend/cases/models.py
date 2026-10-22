"""
cases/models.py
القضية بكل محتوياتها — الـ API بيرجعها كـ JSON واحد متداخل.
"""
import random
import string
from datetime import date, datetime

from django.conf import settings
from django.db import models

import base64
from io import BytesIO


# ================= نوع الوسيط (مشترك بين كل موديلات الوسائط) =================

class MediaType(models.TextChoices):
    IMAGE = "image", "Image"
    VIDEO = "video", "Video"
    AUDIO = "audio", "Audio"
    DOCUMENT = "document", "Document"


# ================= توليد الأكواد =================

def generate_case_code():
    """C-2026-0001"""
    year = datetime.now().year
    seq = Case.objects.filter(case_code__startswith=f"C-{year}-").count() + 1
    while True:
        code = f"C-{year}-{seq:04d}"
        if not Case.objects.filter(case_code=code).exists():
            return code
        seq += 1


def generate_person_code():
    """REC-00001"""
    seq = Person.objects.count() + 1
    while True:
        code = f"REC-{seq:05d}"
        if not Person.objects.filter(code=code).exists():   # ✅ Person مش Case
            return code
        seq += 1

def generate_evidence_code():
    """EV-98234-A"""
    while True:
        code = f"EV-{random.randint(10000, 99999)}-{random.choice(string.ascii_uppercase)}"
        if not Evidence.objects.filter(evidence_code=code).exists():
            return code


def generate_body_code():
    """BD-00001"""
    seq = Body.objects.count() + 1
    while True:
        code = f"BD-{seq:05d}"
        if not Body.objects.filter(code=code).exists():
            return code
        seq += 1


# ================= القضية =================

class Case(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"

    class CaseType(models.TextChoices):
        CRIMINAL = "criminal", "Criminal"
        CIVIL = "civil", "Civil"
        BODY = "body", "Body"

    # ========== التعريف ==========
    case_number = models.CharField(max_length=255, blank=True)
    case_code = models.CharField(max_length=30, unique=True, editable=False)
    case_year = models.IntegerField(null=True, blank=True)
    case_type = models.CharField(
        max_length=10, choices=CaseType.choices, default=CaseType.CRIMINAL
    )

    # ========== حالة القضية ==========
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)

    # ========== تفاصيل الجريمة (Criminal) ==========
    incident_type = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    incident_date = models.DateTimeField(null=True, blank=True)
    inspection_date = models.DateField(null=True, blank=True)

    # ========== موقع مسرح الجريمة (Criminal) ==========
    location_name = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True)
    location_governorate = models.CharField(max_length=100, blank=True)
    governorate = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    street = models.CharField(max_length=100, blank=True)

    # ========== جهة التحقيق (Criminal) ==========
    investigation_governorate = models.CharField(max_length=100, blank=True)
    police_department = models.CharField(max_length=100, blank=True)
    investigator = models.CharField(max_length=100, blank=True)

    # ========== حقول القضية المدنية (Civil) ==========
    date_of_receipt = models.DateField(null=True, blank=True)
    receipt_authority = models.CharField(max_length=255, blank=True)
    date_of_transfer = models.DateField(null=True, blank=True)
    transferred_authority = models.CharField(max_length=255, blank=True)
    fingerprint_type = models.CharField(max_length=100, blank=True)
    fingerprint_holder = models.CharField(max_length=100, blank=True)
    comparison_document = models.CharField(max_length=255, blank=True)
    type_of_comparison_document = models.CharField(max_length=100, blank=True)
    expert = models.CharField(max_length=255, blank=True)
    photographer = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    # ========== حقول قضية الجثث (Body) ==========
    report_number = models.CharField(max_length=255, blank=True)
    date_of_discovery = models.DateField(null=True, blank=True)
    location_of_body_presence = models.CharField(max_length=255, blank=True)
    finding_location = models.TextField(blank=True)
    photography_expert = models.CharField(max_length=255, blank=True)
    fingerprint_expert = models.CharField(max_length=255, blank=True)

    # ========== المالك ==========
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_cases"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.case_code:
            self.case_code = generate_case_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.case_code


# ================= مساعدات تخزين الصور في الـ DB =================

def b64_encode(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def b64_decode(s: str) -> bytes:
    return base64.b64decode(s)


def make_image_versions(raw: bytes):
    """بيرجع (compressed_b64, thumbnail_b64) من بايتات الصورة."""
    try:
        from PIL import Image as PILImage
        img = PILImage.open(BytesIO(raw)).convert("RGB")
    except Exception:
        return "", ""

    if img.width > 1280:
        ratio = 1280 / img.width
        large = img.resize((1280, int(img.height * ratio)), PILImage.LANCZOS)
    else:
        large = img
    buf = BytesIO()
    large.save(buf, format="JPEG", quality=80)
    compressed_b64 = b64_encode(buf.getvalue())

    ratio = 256 / img.width
    thumb = img.resize((256, int(img.height * ratio)), PILImage.LANCZOS)
    buf2 = BytesIO()
    thumb.save(buf2, format="JPEG", quality=70)
    return compressed_b64, b64_encode(buf2.getvalue())


# ================= الأشخاص =================

class Person(models.Model):
    class Role(models.TextChoices):
        VICTIM = "victim", "Victim"
        SUSPECT = "suspect", "Suspect"
        REPORTER = "reporter", "Reporter"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="persons")
    code = models.CharField(max_length=15, unique=True, editable=False)
    role = models.CharField(max_length=10, choices=Role.choices)
    full_name = models.CharField(max_length=255)
    national_id = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=100, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    person_notes = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = generate_person_code()
        super().save(*args, **kwargs)

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        return (
            today.year - self.date_of_birth.year
            - ((today.month, self.date_of_birth.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )

    def __str__(self):
        return f"{self.code} - {self.full_name}"


class PersonImage(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="images")
    file_name = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=100, default="image/jpeg")
    image_data = models.TextField()
    compressed = models.TextField(blank=True)
    thumbnail = models.TextField(blank=True)
    media_type = models.CharField(
        max_length=10, choices=MediaType.choices, default=MediaType.IMAGE, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)


# ================= الأدلة =================

class Evidence(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="evidences")
    evidence_code = models.CharField(max_length=20, unique=True, editable=False)
    evidence_number = models.CharField(max_length=50, blank=True)
    evidence_type = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    collected_by_name = models.CharField(max_length=255, blank=True)

    collector = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="collected_evidences"
    )

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        if not self.evidence_code:
            self.evidence_code = generate_evidence_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.evidence_code


class EvidenceMedia(models.Model):
    evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, related_name="media")
    file_name = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=100, default="image/jpeg")
    file_data = models.TextField()
    compressed = models.TextField(blank=True)
    thumbnail = models.TextField(blank=True)
    media_type = models.CharField(
        max_length=10, choices=MediaType.choices, default=MediaType.IMAGE, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)


# ================= ✅ موديل الجثة (Body) =================

class Body(models.Model):
    """جثة واحدة داخل قضية من نوع body. القضية ممكن تحتوي أكتر من جثة."""

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        NONE = "none", "None"

    class FacialFeatures(models.TextChoices):
        CLEAR = "clear", "Clear"
        UNCLEAR = "unclear", "Unclear"

    class HandFingerprints(models.TextChoices):
        YES = "yes", "Yes"
        NO = "no", "No"

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="bodies")
    code = models.CharField(max_length=15, unique=True, editable=False)

    # ========== الصفات الجسدية ==========
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    approximate_age = models.CharField(max_length=20, blank=True)
    approximate_height = models.CharField(max_length=20, blank=True)
    weight = models.CharField(max_length=100, blank=True)

    # ========== ظروف وملابسات ==========
    discovery_circumstances = models.TextField(blank=True)
    distinguishing_marks = models.TextField(blank=True)
    underwear = models.TextField(blank=True)
    outerwear = models.TextField(blank=True)

    # ========== الفحوصات ==========
    facial_features = models.CharField(max_length=20, choices=FacialFeatures.choices, blank=True)
    facial_features_reason = models.TextField(blank=True)
    hand_fingerprints = models.CharField(max_length=10, choices=HandFingerprints.choices, blank=True)
    hand_fingerprints_reason = models.TextField(blank=True)
    biological_sample = models.JSONField(default=list, blank=True)

    # ========== ملاحظات ==========
    specifications_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        verbose_name_plural = "bodies"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = generate_body_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - Case {self.case.case_code}"


class BodyImage(models.Model):
    """صور الجثة — بنية مطابقة لـ PersonImage."""
    body = models.ForeignKey(Body, on_delete=models.CASCADE, related_name="images")
    file_name = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=100, default="image/jpeg")
    image_data = models.TextField()
    compressed = models.TextField(blank=True)
    thumbnail = models.TextField(blank=True)
    media_type = models.CharField(
        max_length=10, choices=MediaType.choices, default=MediaType.IMAGE, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)


# ================= ✅ صور القضية نفسها (للـ Civil والـ Body) =================

class CaseImage(models.Model):
    """صور القضية نفسها — مش أشخاص ولا أدلة."""
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="images")
    file_name = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=100, default="image/jpeg")
    image_data = models.TextField()
    compressed = models.TextField(blank=True)
    thumbnail = models.TextField(blank=True)
    media_type = models.CharField(
        max_length=10, choices=MediaType.choices, default=MediaType.IMAGE, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)


# ================= سجلات المزامنة =================

class SyncRecord(models.Model):
    class Status(models.TextChoices):
        SYNCED = "synced", "Synced"
        CONFLICT = "conflict", "Conflict"
        ERROR = "error", "Error"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sync_records"
    )
    local_id = models.CharField(max_length=64)
    case = models.ForeignKey(
        Case, on_delete=models.SET_NULL, null=True, blank=True, related_name="sync_records"
    )
    status = models.CharField(max_length=10, choices=Status.choices)
    detail = models.TextField(blank=True)
    synced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "local_id"], name="uniq_user_local_id")
        ]