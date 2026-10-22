from django.contrib import admin

from .models import Case, Evidence, EvidenceMedia, Person, PersonImage

from .models import Body, BodyImage, CaseImage



class PersonInline(admin.TabularInline):
    model = Person
    extra = 0
    readonly_fields = ["code"]


class EvidenceInline(admin.TabularInline):
    model = Evidence
    extra = 0
    readonly_fields = ["evidence_code"]


class PersonImageInline(admin.TabularInline):
    model = PersonImage
    extra = 0


class EvidenceMediaInline(admin.TabularInline):
    model = EvidenceMedia
    extra = 0


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ["case_code", "case_number", "incident_type", "governorate", "created_at"]
    list_filter = ["incident_type", "governorate"]
    search_fields = ["case_code", "case_number", "description", "location_name"]
    readonly_fields = ["case_code", "created_at", "updated_at"]
    inlines = [PersonInline, EvidenceInline]


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ["code", "full_name", "role", "case"]
    list_filter = ["role"]
    search_fields = ["code", "full_name", "national_id"]
    readonly_fields = ["code"]
    inlines = [PersonImageInline]


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ["evidence_code", "case", "description"]
    search_fields = ["evidence_code", "description"]
    readonly_fields = ["evidence_code"]
    inlines = [EvidenceMediaInline]

# ملحوظة: PersonImage و EvidenceMedia مش مسجلين منفصلين عشان التنظيف —
# بيتداروا من الـ inlines جوه صفحات Person و Evidence.

@admin.register(Body)
class BodyAdmin(admin.ModelAdmin):
    list_display = ("code", "case", "gender", "approximate_age", "created_at")
    search_fields = ("code", "case__case_code")

@admin.register(BodyImage)
class BodyImageAdmin(admin.ModelAdmin):
    list_display = ("id", "body", "file_name", "uploaded_at")

@admin.register(CaseImage)
class CaseImageAdmin(admin.ModelAdmin):
    list_display = ("id", "case", "file_name", "uploaded_at")