import json
import os
import zipfile
from io import BytesIO

from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User
from users.permissions import IsAdmin

from .models import (
    Case, Evidence, EvidenceMedia, Person, PersonImage, SyncRecord,
    b64_encode, b64_decode, make_image_versions,
    Body, BodyImage, CaseImage, MediaType,
)
from .serializers import (
    CaseDetailSerializer, CaseSerializer, EvidenceMediaSerializer,
    EvidenceSerializer, PersonImageSerializer, PersonSerializer,
    SyncCaseSerializer, SyncRecordSerializer,
    BodySerializer, BodyImageSerializer, CaseImageSerializer,
)


# ===================== قفلين للصلاحيات =====================
from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.db import transaction

def ensure_case_view(case, user):
    """مشاهدة/تحميل: الأدمن أي حاجة — الضابط قضاياه هو بس (أي حالة)."""
    if user.role == User.Role.ADMIN:
        return
    if case.created_by_id == user.id:
        return
    raise Http404


def ensure_case_edit(case, user):
    """تعديل: الأدمن أي حاجة — الضابط قضاياه وطالما لسه مسودة."""
    if user.role == User.Role.ADMIN:
        return
    if case.created_by_id != user.id:
        raise Http404
    if case.status != Case.Status.DRAFT:
        raise PermissionDenied("القضية مرسلة للمركز — التعديل مقفول.")


# ===================== مساعدات نوع الوسيط =====================

VIDEO_EXTS = (".mp4", ".mov", ".avi", ".mkv", ".webm")
AUDIO_EXTS = (".mp3", ".wav", ".m4a")
DOC_EXTS = (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt")


def guess_media_type(name: str) -> str:
    low = (name or "").lower()
    if low.endswith(VIDEO_EXTS):
        return MediaType.VIDEO
    if low.endswith(AUDIO_EXTS):
        return MediaType.AUDIO
    if low.endswith(DOC_EXTS):
        return MediaType.DOCUMENT
    return MediaType.IMAGE


# ===================== Mixin موحد للوسائط =====================

class MediaViewSetMixin:
    """حد حجم + نوع وسيط + أكشن تحميل — لكل موديلات الصور/الفيديو."""
    MAX_IMAGE = 25 * 1024 * 1024      # 25MB
    MAX_OTHER = 150 * 1024 * 1024     # 150MB
    form_field = "image"              # اسم حقل الـ FormData
    data_column = "image_data"        # عمود الـ base64 في الموديل

    def read_media_upload(self, request):
        """بيرجع (file, media_type, error_response)."""
        f = request.FILES.get(self.form_field)
        if not f:
            return None, None, Response({"detail": f"{self.form_field} مطلوب."}, status=400)
        mt = request.data.get("media_type") or guess_media_type(f.name)
        if mt not in ("image", "video", "audio", "document"):
            mt = "document"
        limit = self.MAX_IMAGE if mt == MediaType.IMAGE else self.MAX_OTHER
        if f.size > limit:
            return None, None, Response(
                {"detail": f"حجم الملف كبير جدًا — الحد الأقصى {limit // (1024 * 1024)}MB."},
                status=400,
            )
        return f, mt, None

    @action(detail=True, methods=["get"], url_path="download")
    def download_file(self, request, pk=None):
        obj = self.get_object()
        raw = b64_decode(getattr(obj, self.data_column))
        res = HttpResponse(raw, content_type=obj.mime_type or "application/octet-stream")
        res["Content-Disposition"] = f'inline; filename="{obj.file_name or str(obj.id)}"'
        res["Cache-Control"] = "private, max-age=86400"
        return res


# ===================== CaseViewSet =====================

class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["incident_type", "governorate", "status"]
    search_fields = ["case_code", "case_number", "description", "location_name", "investigator"]
    ordering_fields = ["created_at", "incident_date"]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.SUPPORT:
            return Case.objects.none()
        qs = Case.objects.select_related("created_by").annotate(
            persons_count=Count("persons", distinct=True),
            evidences_count=Count("evidences", distinct=True),
        )
        if user.role != User.Role.ADMIN:
            qs = qs.filter(created_by=user)

        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        date_after = self.request.query_params.get("date_after")
        if date_after:
            qs = qs.filter(created_at__date__gte=date_after)
        date_before = self.request.query_params.get("date_before")
        if date_before:
            qs = qs.filter(created_at__date__lte=date_before)
        station = self.request.query_params.get("station")
        if station and station != "All Stations":
            qs = qs.filter(created_by__username=station)
        return qs.order_by("-created_at")
        updated_after = self.request.query_params.get("updated_after")
        if updated_after:
            qs = qs.filter(updated_at__gte=updated_after)

    def get_serializer_class(self):
        return CaseDetailSerializer if self.action == "retrieve" else CaseSerializer

    def get_object(self):
        obj = super().get_object()
        if self.request.method not in permissions.SAFE_METHODS:
            ensure_case_edit(obj, self.request.user)
        else:
            ensure_case_view(obj, self.request.user)
        return obj

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        if self.request.user.role == User.Role.SUPPORT:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        case = self.get_object()
        case.status = Case.Status.SUBMITTED
        case.submitted_at = timezone.now()
        case.save(update_fields=["status", "submitted_at"])
        return Response({"detail": "تم إرسال القضية للمركز.", "case_code": case.case_code})

    # ===== تحميل القضية كـ ZIP (PDF تقرير نصي + JSON + كل الوسائط) =====
    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        import re
        import arabic_reshaper
        from bidi.algorithm import get_display
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        # ===== تسجيل خط بيدعم العربي (مرة واحدة) =====
        try:
            pdfmetrics.getFont("ArabicFont")
        except KeyError:
            pdfmetrics.registerFont(TTFont("ArabicFont", "C:/Windows/Fonts/tahoma.ttf"))

        def ar(text):
            """بيصلح العربي (تشكيل + اتجاه) وسيب الإنجليزي زي ما هو."""
            s = str(text) if text not in (None, "") else ""
            if not s:
                return "—"
            if re.search(r"[؀-ۿ]", s):
                return get_display(arabic_reshaper.reshape(s))
            return s

        def ar_block(text, width=80):
            """يلف النص العربي لأسطر بإيدينا BEFORE الـ bidi —
            عشان ترتيب الأسطر ميتقلبش في الـ PDF."""
            if not text:
                return "—"
            out_paras = []
            for para in str(text).split("\n"):
                para = para.strip()
                if not para:
                    continue
                # نص إنجليزي/أرقام بس → زي ما هو
                if not re.search(r"[؀-ۿ]", para):
                    out_paras.append(para)
                    continue
                # ===== لف يدوي بالكلمات =====
                words = para.split()
                lines = []
                cur = ""
                for w in words:
                    if len(cur) + len(w) + 1 <= width:
                        cur = (cur + " " + w).strip()
                    else:
                        if cur:
                            lines.append(cur)
                        cur = w
                if cur:
                    lines.append(cur)
                # ===== reshape لكل سطر لوحده =====
                shaped = [get_display(arabic_reshaper.reshape(ln)) for ln in lines]
                out_paras.append("<br/>".join(shaped))
            return "<br/>".join(out_paras) if out_paras else "—"
        def info_table(rows):
            t = Table(rows, colWidths=[120, 350])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
                ('FONTNAME', (0, 0), (-1, -1), 'ArabicFont'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            return t

        case = self.get_object()
        buffer = BytesIO()

        persons = case.persons.prefetch_related("images").all()
        evidences = case.evidences.prefetch_related("media").all()
        bodies = case.bodies.prefetch_related("images").all()
        case_images = case.images.all()

        # ===== 1) توليد الـ PDF (نص وجداول بس — من غير صور) =====
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CustomTitle', parent=styles['Heading1'],
            fontName="ArabicFont", fontSize=16,
            textColor=colors.HexColor('#005588'), spaceAfter=12,
        )
        heading_style = ParagraphStyle(
            'CustomHeading', parent=styles['Heading2'],
            fontName="ArabicFont", fontSize=12,
            textColor=colors.HexColor('#0875a8'), spaceAfter=8,
        )
        normal_style = ParagraphStyle(
            'CustomNormal', parent=styles['Normal'],
            fontName="ArabicFont", fontSize=9,
            textColor=colors.HexColor('#475569'),
        )
        normal_style1 = ParagraphStyle(
            'CustomNormal', parent=styles['Normal'],
            fontName="ArabicFont", fontSize=9, spaceAfter=12,
            textColor=colors.HexColor('#0875a8'),
        )

        story = []
        story.append(Paragraph("MAI Crime Scene Collector", normal_style1))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Case Report: {case.case_code}", title_style))
        story.append(Spacer(1, 12))

                # ===== Case Information (أساسي + حقول النوع بس) =====
        story.append(Paragraph("Case Information", heading_style))
        case_data = [
            ["Case ID:", ar(case.case_number or case.report_number)],  # ✅ الجثث: رقم المحضر
        ]
        if case.case_year:
            case_data.append(["Case Year:", str(case.case_year)])     # ✅ السنة تظهر لو موجودة بس
        case_data += [
            ["Case Type:", case.get_case_type_display()],
            ["Status:", case.get_status_display()],
            ["Submitted At:", str(case.submitted_at)[:16] if case.submitted_at else "—"],
            ["Station (By):", case.created_by.username],
        ]
        if case.case_type == Case.CaseType.CRIMINAL:
            case_data += [
                ["Incident Type:", ar(case.incident_type.capitalize() if case.incident_type else "")],
                ["Inspection Date:", str(case.inspection_date) if case.inspection_date else "—"],
                ["Governorate:", ar(case.governorate)],
                ["Police Department:", ar(case.police_department)],
                ["Investigator:", ar(case.investigator)],
            ]
        story.append(info_table(case_data))
        story.append(Spacer(1, 12))

        # ===== ✅ جنائي: الموقع + الوصف في جدول لوحده =====
        if case.case_type == Case.CaseType.CRIMINAL:
            if case.location_name or case.address:
                story.append(Paragraph("Crime Scene Location", heading_style))
                story.append(info_table([
                    ["Location Name:", ar(case.location_name)],
                    ["Address:", ar(case.address)],
                    ["Governorate:", ar(case.location_governorate)],
                    ["City:", ar(case.city)],
                    ["District:", ar(case.district)],
                ]))
                story.append(Spacer(1, 12))

            if case.description:
                story.append(Paragraph("Description", heading_style))
                story.append(info_table([[
                    "Description:",
                    Paragraph(ar_block(case.description), normal_style),
                ]]))
                story.append(Spacer(1, 12))

        # ===== ✅ مدني: حقول المدني بس + الملاحظات في جدول لوحده =====
        if case.case_type == Case.CaseType.CIVIL:
            story.append(Paragraph("Civil Case Details", heading_style))
            story.append(info_table([
                ["Date of Receipt:", str(case.date_of_receipt) if case.date_of_receipt else "—"],
                ["Receipt Authority:", ar(case.receipt_authority)],
                ["Date of Transfer:", str(case.date_of_transfer) if case.date_of_transfer else "—"],
                ["Transferred Authority:", ar(case.transferred_authority)],
                ["Fingerprint Type:", ar(case.fingerprint_type)],
                ["Fingerprint Holder:", ar(case.fingerprint_holder)],
                ["Comparison Document:", ar(case.comparison_document)],
                ["Doc Type:", ar(case.type_of_comparison_document)],
                ["Expert:", ar(case.expert)],
                ["Photographer:", ar(case.photographer)],
            ]))
            story.append(Spacer(1, 12))

            if case.notes:
                story.append(Paragraph("Notes", heading_style))
                story.append(info_table([["Notes:", ar(case.notes)]]))
                story.append(Spacer(1, 12))

        # ===== ✅ جثث: حقول الجثث بس + الملاحظات في جدول لوحده =====
        if case.case_type == Case.CaseType.BODY:
            story.append(Paragraph("Body Case Details", heading_style))
            story.append(info_table([
                ["Report Number:", ar(case.report_number)],
                ["Date of Discovery:", str(case.date_of_discovery) if case.date_of_discovery else "—"],
                ["Location of Body:", ar(case.location_of_body_presence)],
                ["Finding Location:", ar(case.finding_location)],
                ["Photography Expert:", ar(case.photography_expert)],
                ["Fingerprint Expert:", ar(case.fingerprint_expert)],
            ]))
            story.append(Spacer(1, 12))

            if case.description:
                story.append(Paragraph("Case Notes", heading_style))
                story.append(info_table([["Notes:", ar(case.description)]]))
                story.append(Spacer(1, 12))

            if bodies:
                story.append(Paragraph(f"Corpses ({len(bodies)})", heading_style))
                for b in bodies:
                    story.append(Paragraph(f"Corpse [{b.code}]", normal_style))
                    phys = (
                        f"Gender: {ar(b.get_gender_display() if b.gender else '')} | "
                        f"Age: {ar(b.approximate_age)} | "
                        f"Height: {ar(b.approximate_height)} cm | "
                        f"Weight: {ar(b.weight)}"
                    )
                    story.append(Paragraph(phys, normal_style))
                    if b.discovery_circumstances:
                        story.append(Paragraph(f"Discovery Circumstances: {ar(b.discovery_circumstances)}", normal_style))
                    if b.distinguishing_marks:
                        story.append(Paragraph(f"Distinguishing Marks: {ar(b.distinguishing_marks)}", normal_style))
                    if b.underwear or b.outerwear:
                        story.append(Paragraph(f"Clothing (inner/outer): {ar(b.underwear)} / {ar(b.outerwear)}", normal_style))
                    if b.facial_features:
                        line = f"Facial Features: {b.get_facial_features_display()}"
                        if b.facial_features == "unclear" and b.facial_features_reason:
                            line += f" — Reason: {ar(b.facial_features_reason)}"
                        story.append(Paragraph(line, normal_style))
                    if b.hand_fingerprints:
                        line = f"Fingerprints: {b.get_hand_fingerprints_display()}"
                        if b.hand_fingerprints == "no" and b.hand_fingerprints_reason:
                            line += f" — Reason: {ar(b.hand_fingerprints_reason)}"
                        story.append(Paragraph(line, normal_style))
                    if b.biological_sample:
                        raw_bio = b.biological_sample
                        if isinstance(raw_bio, str):
                            raw_bio = [x.strip() for x in raw_bio.split(",") if x.strip()]
                        bio_labels = {
                            "blood": "Blood (دم)",
                            "tissue": "Tissue (نسيج)",
                            "bones": "Bones (عظام)",
                            "none": "None (لا يوجد)",
                        }
                        bio_text = ", ".join(bio_labels.get(x, x) for x in raw_bio)
                        story.append(Paragraph(f"Biological Sample: {ar(bio_text)}", normal_style))
                    if b.specifications_notes:
                        story.append(Paragraph(f"Notes: {ar(b.specifications_notes)}", normal_style))
                    story.append(Spacer(1, 6))
                story.append(Spacer(1, 12))

        # ===== Persons (نص بس — من غير صور) =====
        if persons:
            story.append(Paragraph(f"Persons ({len(persons)})", heading_style))
            for p in persons:
                story.append(Paragraph(
                    f"{p.get_role_display()} : {ar(p.full_name)}   [{p.code}]",
                    normal_style,
                ))
                person_info = f"ID: {ar(p.national_id)} | Gender: {ar(p.gender.capitalize() if p.gender else '')} | Nationality: {ar(p.nationality)}"
                story.append(Paragraph(person_info, normal_style))
                if p.person_notes:
                    story.append(Paragraph(f"Note: {ar(p.person_notes)}", normal_style))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 12))

        # ===== ✅ الأدلة: جدول لوحده لكل دليل (من غير صور) =====
        if evidences:
            story.append(Paragraph(f"Evidence ({len(evidences)})", heading_style))
            for e in evidences:
                ev_rows = [
                    ["Evidence Code:", e.evidence_code],
                    ["Evidence Type:", ar(e.evidence_type.capitalize() if e.evidence_type else "")],
                ]
                if e.evidence_number:
                    ev_rows.append(["Evidence ID:", ar(e.evidence_number)])
                ev_rows.append(["Collected By:", ar(e.collected_by_name or e.collector.username)])
                if e.description:
                    ev_rows.append(["Description:", ar(e.description)])
                story.append(info_table(ev_rows))
                story.append(Spacer(1, 8))
            story.append(Spacer(1, 12))

        doc.build(story)
        pdf_buffer.seek(0)

        # ===== 2) بناء الـ ZIP (التقرير + JSON + كل الوسائط الأصلية) =====
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr("Report/Case_Report.pdf", pdf_buffer.read())

            data = CaseDetailSerializer(case, context={"request": request}).data
            zipf.writestr(
                "Data/case.json",
                json.dumps(data, ensure_ascii=False, indent=2, default=str),
            )

            for person in persons:
                safe_name = (person.full_name or "unknown").replace("/", "_").replace("\\", "_")
                for img in person.images.all():
                    name = img.file_name or f"{person.code}.jpg"
                    zipf.writestr(
                        f"Images/{person.role.capitalize()}s/{safe_name}/{img.id}_{name}",
                        b64_decode(img.image_data),
                    )

            for idx, ev in enumerate(evidences, start=1):
                # ✅ رقم + كود = اسم فولدر فريد 100%
                folder_name = f"{idx:02d}_{ev.evidence_code}"
                for m in ev.media.all():
                    name = m.file_name or f"{ev.evidence_code}.bin"
                    zipf.writestr(
                        f"Images/Evidence/{folder_name}/{m.id}_{name}",
                        b64_decode(m.file_data),
                    )

            for cim in case_images:
                name = cim.file_name or f"case_{case.case_code}.jpg"
                zipf.writestr(
                    f"Images/CaseImages/{case.case_code}/{cim.id}_{name}",
                    b64_decode(cim.image_data),
                )

            for b in bodies:
                for bim in b.images.all():
                    name = bim.file_name or f"{b.code}.jpg"
                    zipf.writestr(
                        f"Images/Bodies/{b.code}/{bim.id}_{name}",
                        b64_decode(bim.image_data),
                    )

        buffer.seek(0)
        res = HttpResponse(buffer.read(), content_type="application/zip")
        res["Content-Disposition"] = f'attachment; filename="{case.case_number or case.case_code}.zip"'
        return res
    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser, FormParser])
    def import_case(self, request):
        """POST /api/cases/import/ — استيراد قضية من JSON أو ZIP كامل (بالصور والفيديو)."""
        import zipfile as zf_module

        f = request.FILES.get("file")
        if not f:
            return Response({"detail": "ملف مطلوب."}, status=400)

        fname = f.name.lower()
        zip_images = {}

        # ===== 1) قراءة البيانات =====
        if fname.endswith(".json"):
            try:
                data = json.loads(f.read().decode("utf-8"))
            except Exception as e:
                return Response({"detail": f"ملف JSON غير صالح: {e}"}, status=400)

        elif fname.endswith(".zip"):
            try:
                z = zf_module.ZipFile(f)
            except Exception as e:
                return Response({"detail": f"ملف ZIP غير صالح: {e}"}, status=400)

            json_path = None
            for name in z.namelist():
                if name.lower().endswith("case.json"):
                    json_path = name
                    break
            if not json_path:
                return Response({"detail": "ملف case.json مش موجود جوه الـ ZIP."}, status=400)

            try:
                data = json.loads(z.read(json_path).decode("utf-8"))
            except Exception as e:
                return Response({"detail": f"الـ JSON جوه الـ ZIP غير صالح: {e}"}, status=400)

            for name in z.namelist():
                if name.startswith("Images/") and not name.endswith("/"):
                    try:
                        zip_images[name] = z.read(name)
                    except Exception:
                        continue
        else:
            return Response({"detail": "من فضلك اختار ملف JSON أو ZIP."}, status=400)

        # ===== 2) إنشاء القضية (كل الأنواع) =====
        case_number = data.get("case_number") or data.get("caseId")
        if not case_number:
            return Response({"detail": "حقل case_number مطلوب في الملف."}, status=400)

        try:
            case = Case.objects.create(
                case_number=case_number,
                case_year=data.get("case_year") or None,
                case_type=data.get("case_type", "criminal"),
                incident_type=data.get("incident_type", ""),
                description=data.get("description", ""),
                inspection_date=data.get("inspection_date") or None,
                governorate=data.get("governorate", ""),
                police_department=data.get("police_department", ""),
                investigator=data.get("investigator", ""),
                location_name=data.get("location_name", ""),
                address=data.get("address", ""),
                location_governorate=data.get("location_governorate", ""),
                city=data.get("city", ""),
                district=data.get("district", ""),
                street=data.get("street", ""),
                date_of_receipt=data.get("date_of_receipt") or None,
                receipt_authority=data.get("receipt_authority", ""),
                date_of_transfer=data.get("date_of_transfer") or None,
                transferred_authority=data.get("transferred_authority", ""),
                fingerprint_type=data.get("fingerprint_type", ""),
                fingerprint_holder=data.get("fingerprint_holder", ""),
                comparison_document=data.get("comparison_document", ""),
                type_of_comparison_document=data.get("type_of_comparison_document", ""),
                expert=data.get("expert", ""),
                photographer=data.get("photographer", ""),
                notes=data.get("notes", ""),
                report_number=data.get("report_number", ""),
                date_of_discovery=data.get("date_of_discovery") or None,
                location_of_body_presence=data.get("location_of_body_presence", ""),
                finding_location=data.get("finding_location", ""),
                photography_expert=data.get("photography_expert", ""),
                fingerprint_expert=data.get("fingerprint_expert", ""),
                created_by=request.user,
                status=Case.Status.SUBMITTED,
                submitted_at=timezone.now(),
            )
        except Exception as e:
            return Response({"detail": f"فشل إنشاء القضية: {e}"}, status=400)

        # ===== 3) Mapping للأشخاص =====
        person_mapping = {}
        role_map = {"victims": "victim", "suspects": "suspect", "reporters": "reporter"}

        for p in (data.get("persons") or []):
            try:
                old_code = p.get("code")
                full_name = p.get("full_name", "") or p.get("fullName", "") or "Unknown"
                person = Person.objects.create(
                    case=case,
                    role=p.get("role", "victim"),
                    full_name=full_name,
                    national_id=p.get("national_id", "") or p.get("nationalId", ""),
                    gender=p.get("gender", ""),
                    nationality=p.get("nationality", ""),
                    person_notes=p.get("person_notes", "") or p.get("note", ""),
                )
                if old_code:
                    person_mapping[old_code] = person
                if full_name:
                    person_mapping[full_name] = person
            except Exception as e:
                print(f"⚠️ فشل إضافة شخص: {e}")

        # ===== 4) Mapping للأدلة =====
        evidence_mapping = {}
        for e in (data.get("evidences") or data.get("evidence") or []):
            try:
                old_code = e.get("evidence_code")
                evidence_number = e.get("evidence_number", "") or e.get("evidenceId", "")
                evidence = Evidence.objects.create(
                    case=case,
                    evidence_number=evidence_number,
                    evidence_type=e.get("evidence_type", "") or e.get("evidenceType", ""),
                    description=e.get("description", ""),
                    collector=request.user,
                )
                if old_code:
                    evidence_mapping[old_code] = evidence
                if evidence_number:
                    evidence_mapping[evidence_number] = evidence
            except Exception as e:
                print(f"⚠️ فشل إضافة دليل: {e}")

        # ===== 5) ✅ Mapping للجثث =====
        body_mapping = {}
        for b in (data.get("bodies") or []):
            try:
                old_code = b.get("code")
                body = Body.objects.create(
                    case=case,
                    gender=b.get("gender", ""),
                    approximate_age=b.get("approximate_age", ""),
                    approximate_height=b.get("approximate_height", ""),
                    weight=b.get("weight", ""),
                    discovery_circumstances=b.get("discovery_circumstances", ""),
                    distinguishing_marks=b.get("distinguishing_marks", ""),
                    underwear=b.get("underwear", ""),
                    outerwear=b.get("outerwear", ""),
                    facial_features=b.get("facial_features", ""),
                    facial_features_reason=b.get("facial_features_reason", ""),
                    hand_fingerprints=b.get("hand_fingerprints", ""),
                    hand_fingerprints_reason=b.get("hand_fingerprints_reason", ""),
                    biological_sample=b.get("biological_sample") or [],
                    specifications_notes=b.get("specifications_notes", "") or b.get("notes", ""),
                )
                if old_code:
                    body_mapping[old_code] = body
            except Exception as e:
                print(f"⚠️ فشل إضافة جثة: {e}")

        # ===== 6) ربط الوسائط (صور + فيديو + مستندات) =====
        imported_images = 0
        for path, raw in zip_images.items():
            parts = path.split("/")
            if len(parts) < 4:
                continue
            category = parts[1].lower()
            folder = parts[2]
            file_name = parts[-1]

            if not raw:
                continue

            mtype = guess_media_type(file_name)
            mime = "image/jpeg" if mtype == MediaType.IMAGE else "application/octet-stream"
            compressed_b64, thumb_b64 = make_image_versions(raw) if mtype == MediaType.IMAGE else ("", "")

            if category == "evidence":
                ev = evidence_mapping.get(folder)
                if ev:
                    EvidenceMedia.objects.create(
                        evidence=ev,
                        file_name=file_name,
                        mime_type=mime,
                        file_data=b64_encode(raw),
                        compressed=compressed_b64,
                        thumbnail=thumb_b64,
                        media_type=mtype,
                    )
                    imported_images += 1
                else:
                    print(f"⚠️ وسيط دليل مش مربوط: {path}")

            elif category == "caseimages":
                CaseImage.objects.create(
                    case=case,
                    file_name=file_name,
                    mime_type=mime,
                    image_data=b64_encode(raw),
                    compressed=compressed_b64,
                    thumbnail=thumb_b64,
                    media_type=mtype,
                )
                imported_images += 1

            elif category == "bodies":
                body = body_mapping.get(folder)
                if body:
                    BodyImage.objects.create(
                        body=body,
                        file_name=file_name,
                        mime_type=mime,
                        image_data=b64_encode(raw),
                        compressed=compressed_b64,
                        thumbnail=thumb_b64,
                        media_type=mtype,
                    )
                    imported_images += 1
                else:
                    print(f"⚠️ وسيط جثة مش مربوط: {path}")

            elif category in role_map:
                person = person_mapping.get(folder)
                if person:
                    PersonImage.objects.create(
                        person=person,
                        file_name=file_name,
                        mime_type=mime,
                        image_data=b64_encode(raw),
                        compressed=compressed_b64,
                        thumbnail=thumb_b64,
                        media_type=mtype,
                    )
                    imported_images += 1
                else:
                    print(f"⚠️ وسيط شخص مش مربوط: {path}")

        return Response({
            "id": case.id,
            "case_code": case.case_code,
            "case_number": case.case_number,
            "persons_count": case.persons.count(),
            "evidences_count": case.evidences.count(),
            "bodies_count": case.bodies.count(),
            "images_count": imported_images,
        }, status=201)


# ===================== PersonViewSet =====================

class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["role"]
    search_fields = ["code", "full_name", "national_id"]

    def get_case(self):
        case_id = self.kwargs.get("case_id")
        if not case_id:
            return None
        case = get_object_or_404(Case, pk=case_id)
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(case, self.request.user)
        else:
            ensure_case_edit(case, self.request.user)
        return case

    def get_queryset(self):
        qs = Person.objects.prefetch_related("images")
        case = self.get_case()
        return qs.filter(case=case) if case else qs

    def get_object(self):
        obj = super().get_object()
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(obj.case, self.request.user)
        else:
            ensure_case_edit(obj.case, self.request.user)
        return obj

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["case_id"] = self.kwargs.get("case_id")
        return context

    def perform_create(self, serializer):
        serializer.save(case=self.get_case())


# ===================== PersonImageViewSet =====================

class PersonImageViewSet(MediaViewSetMixin, viewsets.ModelViewSet):
    serializer_class = PersonImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        person = self.get_person()
        f, mt, err = self.read_media_upload(request)
        if err:
            return err
        raw = f.read()
        compressed_b64, thumb_b64 = make_image_versions(raw) if mt == MediaType.IMAGE else ("", "")
        obj = PersonImage.objects.create(
            person=person,
            file_name=f.name,
            mime_type=f.content_type or "application/octet-stream",
            image_data=b64_encode(raw),
            compressed=compressed_b64,
            thumbnail=thumb_b64,
            media_type=mt,
        )
        return Response(PersonImageSerializer(obj).data, status=201)

    def get_person(self):
        person = get_object_or_404(Person, pk=self.kwargs["person_id"])
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(person.case, self.request.user)
        else:
            ensure_case_edit(person.case, self.request.user)
        return person

    def get_queryset(self):
        return PersonImage.objects.filter(person=self.get_person())

    def perform_create(self, serializer):
        serializer.save(person=self.get_person())


# ===================== EvidenceViewSet =====================

class EvidenceViewSet(viewsets.ModelViewSet):
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["evidence_code", "description"]

    def get_case(self):
        case_id = self.kwargs.get("case_id")
        if not case_id:
            return None
        case = get_object_or_404(Case, pk=case_id)
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(case, self.request.user)
        else:
            ensure_case_edit(case, self.request.user)
        return case

    def get_queryset(self):
        qs = Evidence.objects.select_related("case", "collector").prefetch_related("media")
        case = self.get_case()
        return qs.filter(case=case) if case else qs

    def get_object(self):
        obj = super().get_object()
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(obj.case, self.request.user)
        else:
            ensure_case_edit(obj.case, self.request.user)
        return obj

    def perform_create(self, serializer):
        serializer.save(case=self.get_case(), collector=self.request.user)


# ===================== EvidenceMediaViewSet =====================

class EvidenceMediaViewSet(MediaViewSetMixin, viewsets.ModelViewSet):
    serializer_class = EvidenceMediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    form_field = "file"        # ✅ الأدلة بترفع بحقل اسم file
    data_column = "file_data"

    def create(self, request, *args, **kwargs):
        evidence = self.get_evidence()
        f, mt, err = self.read_media_upload(request)
        if err:
            return err
        raw = f.read()
        compressed_b64, thumb_b64 = make_image_versions(raw) if mt == MediaType.IMAGE else ("", "")
        obj = EvidenceMedia.objects.create(
            evidence=evidence,
            file_name=f.name,
            mime_type=f.content_type or "application/octet-stream",
            file_data=b64_encode(raw),
            compressed=compressed_b64,
            thumbnail=thumb_b64,
            media_type=mt,
        )
        return Response(EvidenceMediaSerializer(obj).data, status=201)

    def get_evidence(self):
        evidence = get_object_or_404(Evidence, pk=self.kwargs["evidence_id"])
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(evidence.case, self.request.user)
        else:
            ensure_case_edit(evidence.case, self.request.user)
        return evidence

    def get_queryset(self):
        evidence_id = self.kwargs.get("evidence_id")
        if evidence_id:
            return EvidenceMedia.objects.filter(evidence=self.get_evidence())
        return EvidenceMedia.objects.all()

    def get_object(self):
        obj = super().get_object()
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(obj.evidence.case, self.request.user)
        else:
            ensure_case_edit(obj.evidence.case, self.request.user)
        return obj

    def get_permissions(self):
        if self.action == "destroy" and "evidence_id" not in self.kwargs:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(evidence=self.get_evidence())


# ===================== BodyViewSet (الجثث) =====================

class BodyViewSet(viewsets.ModelViewSet):
    serializer_class = BodySerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["code", "case__case_code"]

    def get_case(self):
        case_id = self.kwargs.get("case_id")
        if not case_id:
            return None
        case = get_object_or_404(Case, pk=case_id)
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(case, self.request.user)
        else:
            ensure_case_edit(case, self.request.user)
        return case

    def get_queryset(self):
        qs = Body.objects.prefetch_related("images")
        case = self.get_case()
        return qs.filter(case=case) if case else qs

    def get_object(self):
        obj = super().get_object()
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(obj.case, self.request.user)
        else:
            ensure_case_edit(obj.case, self.request.user)
        return obj

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["case_id"] = self.kwargs.get("case_id")
        return context

    def perform_create(self, serializer):
        serializer.save(case=self.get_case())


# ===================== BodyImageViewSet (صور الجثة) =====================

class BodyImageViewSet(MediaViewSetMixin, viewsets.ModelViewSet):
    serializer_class = BodyImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        body = self.get_body()
        f, mt, err = self.read_media_upload(request)
        if err:
            return err
        raw = f.read()
        compressed_b64, thumb_b64 = make_image_versions(raw) if mt == MediaType.IMAGE else ("", "")
        obj = BodyImage.objects.create(
            body=body,
            file_name=f.name,
            mime_type=f.content_type or "application/octet-stream",
            image_data=b64_encode(raw),
            compressed=compressed_b64,
            thumbnail=thumb_b64,
            media_type=mt,
        )
        return Response(BodyImageSerializer(obj).data, status=201)

    def get_body(self):
        body = get_object_or_404(Body, pk=self.kwargs["body_id"])
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(body.case, self.request.user)
        else:
            ensure_case_edit(body.case, self.request.user)
        return body

    def get_queryset(self):
        return BodyImage.objects.filter(body=self.get_body())

    def perform_create(self, serializer):
        serializer.save(body=self.get_body())


# ===================== CaseImageViewSet (صور القضية — للمدني) =====================

class CaseImageViewSet(MediaViewSetMixin, viewsets.ModelViewSet):
    serializer_class = CaseImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        case = self.get_case()
        f, mt, err = self.read_media_upload(request)
        if err:
            return err
        raw = f.read()
        compressed_b64, thumb_b64 = make_image_versions(raw) if mt == MediaType.IMAGE else ("", "")
        obj = CaseImage.objects.create(
            case=case,
            file_name=f.name,
            mime_type=f.content_type or "application/octet-stream",
            image_data=b64_encode(raw),
            compressed=compressed_b64,
            thumbnail=thumb_b64,
            media_type=mt,
        )
        return Response(CaseImageSerializer(obj).data, status=201)

    def get_case(self):
        case = get_object_or_404(Case, pk=self.kwargs["case_id"])
        if self.request.method in permissions.SAFE_METHODS:
            ensure_case_view(case, self.request.user)
        else:
            ensure_case_edit(case, self.request.user)
        return case

    def get_queryset(self):
        return CaseImage.objects.filter(case=self.get_case())

    def perform_create(self, serializer):
        serializer.save(case=self.get_case())


# ===================== Sync Views =====================

class SyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role == User.Role.SUPPORT:
            return Response(
                {"detail": "غير مصرح لك."},
                status=403,
            )

        cases_data = request.data.get("cases", [])

        if not isinstance(cases_data, list):
            return Response(
                {"detail": "الحقل cases لازم يكون قائمة."},
                status=400,
            )

        results = []

        for item in cases_data:
            local_id = item.get("local_id")

            if not local_id:
                results.append({
                    "local_id": None,
                    "status": "error",
                    "detail": "local_id مطلوب",
                })
                continue

            if not isinstance(local_id, str) or len(local_id) > 64:
                results.append({
                    "local_id": local_id,
                    "status": "error",
                    "detail": "local_id غير صالح أو أطول من المسموح.",
                })
                continue

            try:
                with transaction.atomic():
                    # منع إعادة إنشاء قضية سبق ربطها بهذا local_id.
                    record = (
                        SyncRecord.objects
                        .select_for_update()
                        .filter(user=request.user, local_id=local_id)
                        .first()
                    )

                    if record and record.status == SyncRecord.Status.SYNCED:
                        results.append({
                            "local_id": local_id,
                            "status": "already_synced",
                            "case_id": record.case_id,
                        })
                        continue

                    # لا نعيد إنشاء قضية مرتبطة بسجل مزامنة سابق.
                    if record and record.case_id:
                        results.append({
                            "local_id": local_id,
                            "status": (
                                "conflict"
                                if record.status == SyncRecord.Status.CONFLICT
                                else "error"
                            ),
                            "case_id": record.case_id,
                            "detail": (
                                record.detail
                                or "سجل المزامنة مرتبط بقضية موجودة؛ راجع الحالة قبل إعادة المحاولة."
                            ),
                        })
                        continue

                    server_case_id = item.get("server_case_id")

                    if server_case_id:
                        try:
                            case = Case.objects.get(
                                pk=server_case_id,
                                created_by=request.user,
                            )
                        except (Case.DoesNotExist, ValueError, TypeError):
                            results.append({
                                "local_id": local_id,
                                "status": "error",
                                "detail": "القضية غير موجودة أو لا تملك صلاحية الوصول إليها.",
                            })
                            continue

                        if case.status != Case.Status.DRAFT:
                            self._record(
                                local_id,
                                SyncRecord.Status.CONFLICT,
                                "القضية مرسلة بالفعل.",
                                case=case,
                            )
                            results.append({
                                "local_id": local_id,
                                "status": "conflict",
                                "detail": "القضية مرسلة بالفعل ولا يمكن تعديلها.",
                                "case_id": case.id,
                            })
                            continue

                        base_updated_at = item.get("base_updated_at")

                        if (
                            base_updated_at
                            and case.updated_at.isoformat() != base_updated_at
                        ):
                            self._record(
                                local_id,
                                SyncRecord.Status.CONFLICT,
                                "القضية اتعدلت على السيرفر بعد نسختك المحلية.",
                                case=case,
                            )
                            results.append({
                                "local_id": local_id,
                                "status": "conflict",
                                "detail": "القضية اتعدلت على السيرفر بعد نسختك المحلية.",
                                "case_id": case.id,
                                "server_updated_at": case.updated_at.isoformat(),
                            })
                            continue

                        serializer = SyncCaseSerializer(
                            case,
                            data=item.get("data", {}),
                            partial=True,
                            context={"request": request},
                        )
                    else:
                        serializer = SyncCaseSerializer(
                            data=item.get("data", {}),
                            context={"request": request},
                        )

                    if not serializer.is_valid():
                        detail = serializer.errors

                        self._record(
                            local_id,
                            SyncRecord.Status.ERROR,
                            str(detail),
                        )

                        results.append({
                            "local_id": local_id,
                            "status": "error",
                            "detail": detail,
                        })
                        continue

                    # إنشاء/تحديث القضية وسجل المزامنة في معاملة واحدة.
                    case = serializer.save(created_by=request.user)

                    # Check if any media failed to process
                    media_failures = getattr(case, '_sync_media_failures', None)
                    if media_failures:
                        # Case created but some media failed
                        warning_detail = f"Case created but {len(media_failures)} media file(s) failed: {'; '.join(media_failures[:3])}"
                        if len(media_failures) > 3:
                            warning_detail += f" ... and {len(media_failures) - 3} more"
                        
                        self._record(
                            local_id,
                            SyncRecord.Status.SYNCED,  # Still synced, but with warnings
                            warning_detail,
                            case=case,
                        )

                        results.append({
                            "local_id": local_id,
                            "status": "synced",
                            "case_id": case.id,
                            "case_code": case.case_code,
                            "updated_at": case.updated_at.isoformat(),
                            "warnings": media_failures,  # Include all failures in response
                        })
                    else:
                        # Full success
                        self._record(
                            local_id,
                            SyncRecord.Status.SYNCED,
                            "",
                            case=case,
                        )

                        results.append({
                            "local_id": local_id,
                            "status": "synced",
                            "case_id": case.id,
                            "case_code": case.case_code,
                            "updated_at": case.updated_at.isoformat(),
                        })

            except Exception:
                # الخطأ لا يُعرض بتفاصيل داخلية للسيرفر للعميل.
                results.append({
                    "local_id": local_id,
                    "status": "error",
                    "detail": "فشلت المزامنة. راجع سجل أخطاء السيرفر قبل إعادة المحاولة.",
                })

        return Response({"results": results})

    def _record(self, local_id, status, detail, case=None):
        SyncRecord.objects.update_or_create(
            user=self.request.user,
            local_id=local_id,
            defaults={
                "status": status,
                "detail": detail,
                "case": case,
            },
        )

class SyncStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role == User.Role.SUPPORT:
            return Response({"detail": "غير مصرح لك."}, status=403)
        records = SyncRecord.objects.filter(user=request.user).order_by("-synced_at")[:50]
        return Response(SyncRecordSerializer(records, many=True).data)