from django.db import transaction
from rest_framework import serializers

from .models import (
    Case, Evidence, EvidenceMedia, Person, PersonImage, SyncRecord,
    Body, BodyImage, CaseImage, MediaType,
    b64_encode, b64_decode, make_image_versions,
)


# ================= Sync-specific serializers with media support =================

class SyncPersonImageSerializer(serializers.Serializer):
    """Accepts base64-encoded images during sync."""
    file_name = serializers.CharField()
    mime_type = serializers.CharField()
    data = serializers.CharField()  # Base64 data URL


class SyncEvidenceMediaSerializer(serializers.Serializer):
    """Accepts base64-encoded media during sync."""
    file_name = serializers.CharField()
    mime_type = serializers.CharField()
    data = serializers.CharField()  # Base64 data URL


class SyncBodyImageSerializer(serializers.Serializer):
    """Accepts base64-encoded images during sync."""
    file_name = serializers.CharField()
    mime_type = serializers.CharField()
    data = serializers.CharField()  # Base64 data URL


class SyncCaseImageSerializer(serializers.Serializer):
    """Accepts base64-encoded case images during sync."""
    file_name = serializers.CharField()
    mime_type = serializers.CharField()
    data = serializers.CharField()  # Base64 data URL


# ================= Evidence =================


class EvidenceMediaSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    compressed = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = EvidenceMedia
        fields = ["id", "file", "compressed", "thumbnail", "media_type", "file_name", "uploaded_at"]

    def get_file(self, obj):
        # ✅ الصور بس base64 — الفيديو والمستندات عبر /media/{id}/download/
        if obj.media_type == MediaType.IMAGE:
            return f"data:{obj.mime_type};base64,{obj.file_data}"
        return f"/api/media/{obj.id}/download/"

    def get_compressed(self, obj):
        return f"data:image/jpeg;base64,{obj.compressed}" if obj.compressed else None

    def get_thumbnail(self, obj):
        return f"data:image/jpeg;base64,{obj.thumbnail}" if obj.thumbnail else None


class EvidenceSerializer(serializers.ModelSerializer):
    media = EvidenceMediaSerializer(many=True, read_only=True)
    collector_username = serializers.CharField(source="collector.username", read_only=True)

    class Meta:
        model = Evidence
        fields = [
            "id", "evidence_code", "evidence_number", "evidence_type",
            "description", "collected_by_name",
            "collector", "collector_username", "media",
        ]
        read_only_fields = ["evidence_code", "collector"]


# ================= Persons =================

class PersonImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    compressed = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = PersonImage
        fields = ["id", "image", "compressed", "thumbnail", "media_type", "file_name", "uploaded_at"]

    def get_image(self, obj):
        if obj.media_type == MediaType.IMAGE:
            return f"data:{obj.mime_type};base64,{obj.image_data}"
        return f"/api/media/{obj.id}/download/"

    def get_compressed(self, obj):
        return f"data:image/jpeg;base64,{obj.compressed}" if obj.compressed else None

    def get_thumbnail(self, obj):
        return f"data:image/jpeg;base64,{obj.thumbnail}" if obj.thumbnail else None


class PersonSerializer(serializers.ModelSerializer):
    note = serializers.CharField(source="person_notes", required=False, allow_blank=True)

    images = PersonImageSerializer(many=True, read_only=True)
    age = serializers.ReadOnlyField()

    class Meta:
        model = Person
        fields = [
            "id", "code", "role", "full_name", "national_id",
            "gender", "nationality", "date_of_birth", "age", "note", "images",
        ]
        read_only_fields = ["code"]

    def validate(self, attrs):
        """Reporter واحد بس لكل قضية."""
        if attrs.get("role") == Person.Role.REPORTER:
            case_id = self.context.get("case_id")
            if not case_id and self.instance:
                case_id = self.instance.case_id
            qs = Person.objects.filter(case_id=case_id, role=Person.Role.REPORTER)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if case_id and qs.exists():
                raise serializers.ValidationError({"role": "القضية دي فيها Reporter بالفعل."})
        return attrs


# ================= ✅ Bodies (الجثث) =================

class BodyImageSerializer(serializers.ModelSerializer):
    """صور الجثة — نفس نمط PersonImageSerializer بالظبط."""
    image = serializers.SerializerMethodField()
    compressed = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = BodyImage
        fields = ["id", "image", "compressed", "thumbnail", "media_type", "file_name", "uploaded_at"]

    def get_image(self, obj):
        if obj.media_type == MediaType.IMAGE:
            return f"data:{obj.mime_type};base64,{obj.image_data}"
        return f"/api/media/{obj.id}/download/"

    def get_compressed(self, obj):
        return f"data:image/jpeg;base64,{obj.compressed}" if obj.compressed else None

    def get_thumbnail(self, obj):
        return f"data:image/jpeg;base64,{obj.thumbnail}" if obj.thumbnail else None


class BodySerializer(serializers.ModelSerializer):
    """جثة واحدة — قراءة/كتابة بنفس مفاتيح الـ snake_case اللي الفرونت بيستخدمها."""
    images = BodyImageSerializer(many=True, read_only=True)
    notes = serializers.SerializerMethodField()

    class Meta:
        model = Body
        fields = [
            "id", "code",
            "gender", "approximate_age", "approximate_height", "weight",
            "discovery_circumstances", "distinguishing_marks",
            "underwear", "outerwear",
            "facial_features", "facial_features_reason",
            "hand_fingerprints", "hand_fingerprints_reason",
            "biological_sample", "specifications_notes", "notes",
            "images",
            "created_at", "updated_at",
        ]
        read_only_fields = ["code", "created_at", "updated_at"]

    def validate_biological_sample(self, value):
        """لو وصلنا string قديم، حوله list — التخزين دايمًا list."""
        if isinstance(value, str):
            return [x.strip() for x in value.split(",") if x.strip()]
        return value or []

    def to_internal_value(self, data):
        """حوّل أي null لـ نص فاضي قبل التحقق."""
        if hasattr(data, "copy"):
            data = data.copy()
        text_fields = {
            "gender", "approximate_age", "approximate_height", "weight",
            "discovery_circumstances", "distinguishing_marks",
            "underwear", "outerwear",
            "facial_features", "facial_features_reason",
            "hand_fingerprints", "hand_fingerprints_reason",
            "specifications_notes",
        }
        for key in list(data.keys()):
            if key in text_fields and data[key] is None:
                data[key] = ""
        return super().to_internal_value(data)

    def get_notes(self, obj):
        return obj.specifications_notes


# ================= ✅ صور القضية نفسها (للمدني) =================

class CaseImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    compressed = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = CaseImage
        fields = ["id", "image", "compressed", "thumbnail", "media_type", "file_name", "uploaded_at"]

    def get_image(self, obj):
        if obj.media_type == MediaType.IMAGE:
            return f"data:{obj.mime_type};base64,{obj.image_data}"
        return f"/api/media/{obj.id}/download/"

    def get_compressed(self, obj):
        return f"data:image/jpeg;base64,{obj.compressed}" if obj.compressed else None

    def get_thumbnail(self, obj):
        return f"data:image/jpeg;base64,{obj.thumbnail}" if obj.thumbnail else None


# ================= Cases =================

class CaseSerializer(serializers.ModelSerializer):
    persons_count = serializers.IntegerField(read_only=True)
    evidences_count = serializers.IntegerField(read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Case
        fields = [
            "id", "case_number", "case_code", "case_year", "case_type",
            "incident_type", "description", "incident_date", "inspection_date",
            "status", "submitted_at",
            "location_name", "address", "location_governorate",
            "governorate", "city", "district", "street",
            "investigation_governorate", "police_department", "investigator",
            "date_of_receipt", "receipt_authority",
            "date_of_transfer", "transferred_authority",
            "fingerprint_type", "fingerprint_holder",
            "comparison_document", "type_of_comparison_document",
            "expert", "photographer", "notes",
            "report_number", "date_of_discovery",
            "location_of_body_presence", "finding_location",
            "photography_expert", "fingerprint_expert",
            "created_by", "created_by_username",
            "created_at", "updated_at",
            "persons_count", "evidences_count",
        ]
        read_only_fields = [
            "case_code", "status", "submitted_at",
            "created_by", "created_at", "updated_at",
        ]


class CaseDetailSerializer(CaseSerializer):
    """القضية كاملة كـ JSON واحد متداخل (للـ Retrieve)."""
    persons = PersonSerializer(many=True, read_only=True)
    evidences = EvidenceSerializer(many=True, read_only=True)
    bodies = BodySerializer(many=True, read_only=True)
    images = CaseImageSerializer(many=True, read_only=True)

    class Meta(CaseSerializer.Meta):
        fields = CaseSerializer.Meta.fields + ["persons", "evidences", "bodies", "images"]


# ================= Sync =================

class SyncPersonSerializer(serializers.Serializer):
    """Person with embedded images for sync."""
    role = serializers.ChoiceField(choices=["victim", "suspect", "reporter"])
    full_name = serializers.CharField()
    national_id = serializers.CharField(allow_blank=True, required=False)
    gender = serializers.CharField(allow_blank=True, required=False)
    nationality = serializers.CharField(allow_blank=True, required=False)
    person_notes = serializers.CharField(allow_blank=True, required=False)
    images = SyncPersonImageSerializer(many=True, required=False)


class SyncEvidenceSerializer(serializers.Serializer):
    """Evidence with embedded media for sync."""
    evidence_number = serializers.CharField(allow_blank=True, required=False)
    evidence_type = serializers.CharField(allow_blank=True, required=False)
    description = serializers.CharField(allow_blank=True, required=False)
    media = SyncEvidenceMediaSerializer(many=True, required=False)


class SyncBodySerializer(serializers.Serializer):
    """Body with embedded images for sync."""
    gender = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    approximate_age = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    approximate_height = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    weight = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    discovery_circumstances = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    distinguishing_marks = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    underwear = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    outerwear = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    facial_features = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    facial_features_reason = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    hand_fingerprints = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    hand_fingerprints_reason = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    biological_sample = serializers.ListField(child=serializers.CharField(), required=False)
    specifications_notes = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    images = SyncBodyImageSerializer(many=True, required=False)


class SyncCaseSerializer(CaseSerializer):
    """Accepts full case with nested persons, evidence, bodies, and images."""
    persons = SyncPersonSerializer(many=True, required=False)
    evidences = SyncEvidenceSerializer(many=True, required=False)
    bodies = SyncBodySerializer(many=True, required=False)
    case_images = SyncCaseImageSerializer(many=True, required=False)

    class Meta(CaseSerializer.Meta):
        fields = CaseSerializer.Meta.fields + ["persons", "evidences", "bodies", "case_images"]

    @transaction.atomic
    def create(self, validated_data):
        persons_data = validated_data.pop("persons", [])
        evidences_data = validated_data.pop("evidences", [])
        bodies_data = validated_data.pop("bodies", [])
        case_images_data = validated_data.pop("case_images", [])
        
        case = Case.objects.create(**validated_data)
        
        # Track media failures
        failed_media = []
        
        # Create persons with images
        for p_data in persons_data:
            images_data = p_data.pop('images', [])
            person = Person.objects.create(case=case, **p_data)
            
            for img_data in images_data:
                try:
                    # Extract base64 data (remove data:image/...;base64, prefix if present)
                    data_url = img_data['data']
                    if ',' in data_url:
                        data_url = data_url.split(',', 1)[1]
                    
                    raw = b64_decode(data_url)
                    compressed_b64, thumb_b64 = make_image_versions(raw)
                    
                    PersonImage.objects.create(
                        person=person,
                        file_name=img_data['file_name'],
                        mime_type=img_data['mime_type'],
                        image_data=b64_encode(raw),
                        compressed=compressed_b64,
                        thumbnail=thumb_b64,
                        media_type=MediaType.IMAGE,
                    )
                except Exception as e:
                    error_msg = f"Person image '{img_data.get('file_name', 'unknown')}': {str(e)}"
                    print(f"⚠️ {error_msg}")
                    failed_media.append(error_msg)
        
        # Create evidence with media
        for e_data in evidences_data:
            media_data = e_data.pop('media', [])
            evidence = Evidence.objects.create(
                case=case,
                collector=case.created_by,
                **e_data
            )
            
            for media_item in media_data:
                try:
                    data_url = media_item['data']
                    if ',' in data_url:
                        data_url = data_url.split(',', 1)[1]
                    
                    raw = b64_decode(data_url)
                    
                    # Only create versions for images
                    mime = media_item['mime_type']
                    if mime.startswith('image/'):
                        compressed_b64, thumb_b64 = make_image_versions(raw)
                        media_type = MediaType.IMAGE
                    else:
                        compressed_b64, thumb_b64 = "", ""
                        if mime.startswith('video/'):
                            media_type = MediaType.VIDEO
                        elif mime.startswith('audio/'):
                            media_type = MediaType.AUDIO
                        else:
                            media_type = MediaType.DOCUMENT
                    
                    EvidenceMedia.objects.create(
                        evidence=evidence,
                        file_name=media_item['file_name'],
                        mime_type=mime,
                        file_data=b64_encode(raw),
                        compressed=compressed_b64,
                        thumbnail=thumb_b64,
                        media_type=media_type,
                    )
                except Exception as e:
                    error_msg = f"Evidence media '{media_item.get('file_name', 'unknown')}': {str(e)}"
                    print(f"⚠️ {error_msg}")
                    failed_media.append(error_msg)
        
        # Create bodies with images
        for b_data in bodies_data:
            images_data = b_data.pop('images', [])
            body = Body.objects.create(case=case, **b_data)
            
            for img_data in images_data:
                try:
                    data_url = img_data['data']
                    if ',' in data_url:
                        data_url = data_url.split(',', 1)[1]
                    
                    raw = b64_decode(data_url)
                    compressed_b64, thumb_b64 = make_image_versions(raw)
                    
                    BodyImage.objects.create(
                        body=body,
                        file_name=img_data['file_name'],
                        mime_type=img_data['mime_type'],
                        image_data=b64_encode(raw),
                        compressed=compressed_b64,
                        thumbnail=thumb_b64,
                        media_type=MediaType.IMAGE,
                    )
                except Exception as e:
                    error_msg = f"Body image '{img_data.get('file_name', 'unknown')}': {str(e)}"
                    print(f"⚠️ {error_msg}")
                    failed_media.append(error_msg)
        
        # Create case images (for civil cases)
        for img_data in case_images_data:
            try:
                data_url = img_data['data']
                if ',' in data_url:
                    data_url = data_url.split(',', 1)[1]
                
                raw = b64_decode(data_url)
                compressed_b64, thumb_b64 = make_image_versions(raw)
                
                CaseImage.objects.create(
                    case=case,
                    file_name=img_data['file_name'],
                    mime_type=img_data['mime_type'],
                    image_data=b64_encode(raw),
                    compressed=compressed_b64,
                    thumbnail=thumb_b64,
                    media_type=MediaType.IMAGE,
                )
            except Exception as e:
                error_msg = f"Case image '{img_data.get('file_name', 'unknown')}': {str(e)}"
                print(f"⚠️ {error_msg}")
                failed_media.append(error_msg)
        
        # Store failed media errors in case for later inspection
        if failed_media:
            case._sync_media_failures = failed_media
        
        return case

    def update(self, instance, validated_data):
        # Remove nested data for updates (not supported in sync context)
        validated_data.pop("persons", None)
        validated_data.pop("evidences", None)
        validated_data.pop("bodies", None)
        validated_data.pop("case_images", None)
        return super().update(instance, validated_data)


class SyncRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncRecord
        fields = ["local_id", "status", "case", "detail", "synced_at"]