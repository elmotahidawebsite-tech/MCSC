from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("cases", views.CaseViewSet, basename="case")

urlpatterns = [
    path("", include(router.urls)),

    # الأشخاص + صورهم
    path("cases/<int:case_id>/persons/",
         views.PersonViewSet.as_view({"get": "list", "post": "create"}), name="case-person-list"),
    path("cases/<int:case_id>/persons/<int:pk>/",
         views.PersonViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
         name="case-person-detail"),
    path("persons/<int:pk>/",
         views.PersonViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
         name="person-detail"),
    path("persons/<int:person_id>/images/",
         views.PersonImageViewSet.as_view({"get": "list", "post": "create"}), name="person-image-list"),
    path("persons/<int:person_id>/images/<int:pk>/",
         views.PersonImageViewSet.as_view({"get": "retrieve", "delete": "destroy"}), name="person-image-detail"),
    path("persons/<int:person_id>/images/<int:pk>/download/",
         views.PersonImageViewSet.as_view({"get": "download_file"}), name="person-image-download"),

    # الأدلة + ملفاتها
    path("cases/<int:case_id>/evidence/",
         views.EvidenceViewSet.as_view({"get": "list", "post": "create"}), name="case-evidence-list"),
    path("cases/<int:case_id>/evidence/<int:pk>/",
         views.EvidenceViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
         name="case-evidence-detail"),
    path("evidence/<int:pk>/",
         views.EvidenceViewSet.as_view({"get": "retrieve", "patch": "partial_update"}), name="evidence-detail"),
    path("evidence/<int:evidence_id>/media/",
         views.EvidenceMediaViewSet.as_view({"get": "list", "post": "create"}), name="evidence-media-list"),
    path("evidence/<int:evidence_id>/media/<int:pk>/",
         views.EvidenceMediaViewSet.as_view({"get": "retrieve", "delete": "destroy"}), name="evidence-media-detail"),
    path("evidence/<int:evidence_id>/media/<int:pk>/download/",
         views.EvidenceMediaViewSet.as_view({"get": "download_file"}), name="evidence-media-download"),
    path("media/<int:pk>/",
         views.EvidenceMediaViewSet.as_view({"delete": "destroy"}), name="media-delete"),
    path("media/<int:pk>/download/",
         views.EvidenceMediaViewSet.as_view({"get": "download_file"}), name="media-download"),

    # الجثث + صورها
    path("cases/<int:case_id>/bodies/",
         views.BodyViewSet.as_view({"get": "list", "post": "create"}), name="case-body-list"),
    path("cases/<int:case_id>/bodies/<int:pk>/",
         views.BodyViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
         name="case-body-detail"),
    path("bodies/<int:pk>/",
         views.BodyViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
         name="body-detail"),
    path("bodies/<int:body_id>/images/",
         views.BodyImageViewSet.as_view({"get": "list", "post": "create"}), name="body-image-list"),
    path("bodies/<int:body_id>/images/<int:pk>/",
         views.BodyImageViewSet.as_view({"get": "retrieve", "delete": "destroy"}), name="body-image-detail"),
    path("bodies/<int:body_id>/images/<int:pk>/download/",
         views.BodyImageViewSet.as_view({"get": "download_file"}), name="body-image-download"),

    # صور القضية (مدني)
    path("cases/<int:case_id>/images/",
         views.CaseImageViewSet.as_view({"get": "list", "post": "create"}), name="case-image-list"),
    path("cases/<int:case_id>/images/<int:pk>/",
         views.CaseImageViewSet.as_view({"get": "retrieve", "delete": "destroy"}), name="case-image-detail"),
    path("cases/<int:case_id>/images/<int:pk>/download/",
         views.CaseImageViewSet.as_view({"get": "download_file"}), name="case-image-download"),

    path("sync/", views.SyncView.as_view(), name="sync"),
    path("sync/status/", views.SyncStatusView.as_view(), name="sync-status"),
]