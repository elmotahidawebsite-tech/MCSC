from django.db import transaction
from rest_framework import serializers

from .models import (
    Case, Evidence, EvidenceMedia, Person, PersonImage, SyncRecord,
    Body, BodyImage, CaseImage, MediaType,
)


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

class SyncCaseSerializer(CaseSerializer):
    """بتقبل القضية كاملة nested عشان الـ Sync."""
    persons = PersonSerializer(many=True, required=False)
    evidences = EvidenceSerializer(many=True, required=False)
    bodies = BodySerializer(many=True, required=False)

    class Meta(CaseSerializer.Meta):
        fields = CaseSerializer.Meta.fields + ["persons", "evidences", "bodies"]

    @transaction.atomic
    def create(self, validated_data):
        persons_data = validated_data.pop("persons", [])
        evidences_data = validated_data.pop("evidences", [])
        bodies_data = validated_data.pop("bodies", [])
        case = Case.objects.create(**validated_data)
        for p in persons_data:
            Person.objects.create(case=case, **p)
        for e in evidences_data:
            Evidence.objects.create(case=case, collector=case.created_by, **e)
        for b in bodies_data:
            Body.objects.create(case=case, **b)
        return case

    def update(self, instance, validated_data):
        validated_data.pop("persons", None)
        validated_data.pop("evidences", None)
        validated_data.pop("bodies", None)
        return super().update(instance, validated_data)


class SyncRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncRecord
        fields = ["local_id", "status", "case", "detail", "synced_at"]