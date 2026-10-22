import os
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image
from rest_framework import serializers

ALLOWED = {
    "image": {".jpg", ".jpeg", ".png", ".webp"},
    "video": {".mp4", ".mov", ".avi", ".mkv"},
    "document": {".pdf", ".doc", ".docx", ".txt"},
}

MAX_SIZE = {
    "image": 10 * 1024 * 1024,      # 10MB
    "video": 200 * 1024 * 1024,     # 200MB
    "document": 20 * 1024 * 1024,   # 20MB
}


def validate_upload(file, media_type):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED.get(media_type, set()):
        raise serializers.ValidationError(f"نوع الملف غير مسموح لـ {media_type}: {ext}")
    if file.size > MAX_SIZE.get(media_type, 0):
        limit = MAX_SIZE[media_type] // (1024 * 1024)
        raise serializers.ValidationError(f"حجم الملف أكبر من الحد المسموح ({limit}MB)")
    if media_type == "image":
        try:
            Image.open(file).verify()
            file.seek(0)
        except Exception:
            raise serializers.ValidationError("الملف ليس صورة صالحة")


def optimize_image(instance, file_field="file", thumb_field="thumbnail",
                   max_dim=1920, quality=80):
    field = getattr(instance, file_field)
    if not field:
        return
    try:
        img = Image.open(field)
    except Exception:
        return
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.thumbnail((max_dim, max_dim))

    base = os.path.splitext(os.path.basename(field.name))[0]

    # ضغط الصورة الأصلية
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    field.save(f"{base}.jpg", ContentFile(buf.getvalue()), save=False)

    # Thumbnail
    thumb = img.copy()
    thumb.thumbnail((320, 320))
    tbuf = BytesIO()
    thumb.save(tbuf, format="JPEG", quality=quality, optimize=True)
    getattr(instance, thumb_field).save(f"thumb_{base}.jpg", ContentFile(tbuf.getvalue()), save=False)