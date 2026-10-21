import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "node_modules/react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  Save,
  Trash2,
} from "lucide-react";
import type {
  CaseData,
  CorpsesSpecifications,
  EvidenceData,
  PersonData,
} from "@/context/CaseContext";
import { api } from "../../../api/client";
import CriminalCaseDetail from "./CriminalCaseDetail";
import CorpsesCaseDetail from "../corpses/CorpsesCaseDetail";
import CivilCaseDetail from "../civil/CivilCaseDetail";
import {
  type ImageAction,
  type ImageHandler,
  type IndexedImageHandler,
  type RemoteImages,
  type ServerIds,
  AdminConsoleFooter,
  DeleteConfirmModal,
  emptyEvidence,
  emptyPerson,
  normalizeForCompare,
  RemoteImage,
} from "../CaseDetailShared";

export const emptyCorpseSpecs: CorpsesSpecifications = {
  gender: "",
  approximateAge: "",
  approximateHeight: "",
  weight: "",
  discoveryCircumstances: "",
  distinguishingMarks: "",
  underwear: "",
  outerwear: "",
  facialFeatures: "",
  facialFeaturesReason: "",
  handFingerprints: "",
  handFingerprintsReason: "",
  biologicalSample: [],
  images: [],
  notes: "",
};

export default function AdminCaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(["cases", "common"]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [data, setData] = useState<CaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [savedStamp, setSavedStamp] = useState<string | null>(null);
    const [stationUsername, setStationUsername] = useState<string>("");
    const [remoteImages, setRemoteImages] = useState<RemoteImages>({
      victims: [], suspects: [], reporters: [], evidences: [], corpseImages: [], civilImages: [],
    });
    const [serverIds, setServerIds] = useState<ServerIds>({
      victims: [], suspects: [], reporters: [], evidences: [], corpses: [],
    });

    useEffect(() => {
      if (!id) return;
      let cancelled = false;

      (async () => {
        try {
          setStationUsername("");
          const { data: c } = await api.get(`/cases/${id}/`);
          if (cancelled) return;

          setStationUsername(
            typeof c?.created_by_username === "string"
              ? c.created_by_username
              : typeof c?.created_by === "object" && typeof c?.created_by?.username === "string"
                ? c.created_by.username
                : ""
          );

          const persons: any[] = c.persons || [];
          const evidences: any[] = c.evidences || [];

          const victims = persons.filter((p) => p.role === "victim");
          const suspects = persons.filter((p) => p.role === "suspect");
          const reporters = persons.filter((p) => p.role === "reporter");

          const toPersonData = (p: any): PersonData => ({
            fullName: p.full_name || "",
            nationalId: p.national_id || "",
            gender: p.gender || "",
            nationality: p.nationality || "",
            note: p.person_notes || p.note || "",
            images: [],
          });

          const toEvidenceData = (e: any): EvidenceData => ({
            evidenceId: e.evidence_number || e.evidence_code || "",
            evidenceType: e.evidence_type || "",
            description: e.description || "",
            images: [],
          });

          // ✅ كل الجثث من bodies[] بس — مفيش "أول جثة" على مستوى القضية
          const bodiesArr: any[] = Array.isArray(c.bodies) ? c.bodies : [];

          const parseBio = (v: any): string[] =>
            Array.isArray(v)
              ? (v as string[])
              : typeof v === "string" && v
                ? v.split(",").filter(Boolean)
                : [];

          const toCorpseSpecs = (b: any): CorpsesSpecifications => ({
            gender: b.gender || "",
            approximateAge: b.approximate_age || "",
            approximateHeight: b.approximate_height || "",
            weight: b.weight || "",
            discoveryCircumstances: b.discovery_circumstances || "",
            distinguishingMarks: b.distinguishing_marks || "",
            underwear: b.underwear || "",
            outerwear: b.outerwear || "",
            facialFeatures: (b.facial_features as "clear" | "unclear" | "") || "",
            facialFeaturesReason: b.facial_features_reason || "",
            handFingerprints: (b.hand_fingerprints as "yes" | "no" | "") || "",
            handFingerprintsReason: b.hand_fingerprints_reason || "",
            biologicalSample: parseBio(b.biological_sample),
            images: [],
            notes: b.specifications_notes || b.notes || "",
          });

          const corpsesList: CorpsesSpecifications[] = bodiesArr.map(toCorpseSpecs);

          const converted: CaseData = {
            caseType: ((c.case_type === "body" ? "corpses" : c.case_type) as "criminal" | "corpses" | "civil") || "criminal",
            caseInfo: {
              caseId: c.case_number || "",
              caseYear: c.case_year ? String(c.case_year) : "",
              incidentType: c.incident_type || "",
              inspectionDate: c.inspection_date ? c.inspection_date.slice(0, 10) : "",
              description: c.description || "",
              policeDepartment: c.police_department || "",
              governorate: c.governorate || "",
              investigator: c.investigator || "",
              locationName: c.location_name || "",
              address: c.address || "",
              locationGovernorate: c.location_governorate || "",
              city: c.city || "",
              district: c.district || "",
              stationUsername: c.stationUsername || "",
            },
            corpsesCaseInfo: {
              caseNumber: c.case_number || "",
              caseYear: c.case_year ? String(c.case_year) : "",
              governorate: c.governorate || "",
              policeDepartment: c.police_department || "",
              dateOfDiscovery: c.date_of_discovery ? String(c.date_of_discovery).slice(0, 10) : "",
              inspectionDate: c.inspection_date ? c.inspection_date.slice(0, 10) : "",
              locationOfBodyPresence: c.location_of_body_presence || "",
              findingLocation: c.finding_location || "",
              photographyExpert: c.photography_expert || "",
              fingerprintExpert: c.fingerprint_expert || "",
              note: c.description || "",
            },
            civilCaseInfo: {
              caseNumber: c.case_number || "",
              caseYear: c.case_year ? String(c.case_year) : "",
              dateOfReceipt: c.date_of_receipt ? String(c.date_of_receipt).slice(0, 10) : "",
              receiptAuthority: c.receipt_authority || "",
              dateOfTransfer: c.date_of_transfer ? String(c.date_of_transfer).slice(0, 10) : "",
              transferredAuthority: c.transferred_authority || "",
              governorate: c.governorate || "",
              fingerprintType: c.fingerprint_type || "",
              fingerprintHolder: c.fingerprint_holder || "",
              comparisonDocument: c.comparison_document || "",
              typeOfComparisonDocument: c.type_of_comparison_document || "",
              expert: c.expert || "",
              photographer: c.photographer || "",
              notes: c.notes || c.description || "",
              images: [],
            },
            corpsesSpecifications: corpsesList,
            victims: victims.map(toPersonData),
            suspects: suspects.map(toPersonData),
            reporters: reporters.map(toPersonData),
            evidence: evidences.map(toEvidenceData),
          };

          const corpseImagesList: RemoteImage[][] = bodiesArr.map((b: any) =>
            (b.images || []).map((img: any) => ({
              url: img.thumbnail || img.image || "",
              id: img.id,
            })).filter((x: any) => x.url)
          );

          const caseImages = (c.images || []).map((img: any) => ({
            url: img.thumbnail || img.image || "",
            id: img.id,
          })).filter((x: any) => x.url);

          const newRemoteImages: RemoteImages = {
            victims: victims.map((p) =>
              (p.images || []).map((img: any) => ({
                url: img.thumbnail || img.image || "",
                id: img.id,
              })).filter((x: any) => x.url)
            ),
            suspects: suspects.map((p) =>
              (p.images || []).map((img: any) => ({
                url: img.thumbnail || img.image || "",
                id: img.id,
              })).filter((x: any) => x.url)
            ),
            reporters: reporters.map((p) =>
              (p.images || []).map((img: any) => ({
                url: img.thumbnail || img.image || "",
                id: img.id,
              })).filter((x: any) => x.url)
            ),
            evidences: evidences.map((e) =>
              (e.media || []).map((m: any) => ({
                url: m.thumbnail || m.file || "",
                id: m.id,
              })).filter((x: any) => x.url)
            ),
            corpseImages: corpseImagesList,
            civilImages: caseImages,
          };

          setData(converted);
          setRemoteImages(newRemoteImages);
          setServerIds({
            victims: victims.map((p) => p.id ?? null),
            suspects: suspects.map((p) => p.id ?? null),
            reporters: reporters.map((p) => p.id ?? null),
            evidences: evidences.map((e) => e.id ?? null),
            corpses: bodiesArr.map((b: any) => b.id ?? null),
          });
          setSavedStamp(JSON.stringify(normalizeForCompare(converted, newRemoteImages)));
        } catch (e) {
          console.error(e);
          toast.error(t("cases:review.failedToLoad"));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => { cancelled = true; };
    }, [id]);

    const dirty = useMemo(() => {
      if (!savedStamp || !data) return false;
      return JSON.stringify(normalizeForCompare(data, remoteImages)) !== savedStamp;
    }, [data, savedStamp, remoteImages]);

    function openDeleteModal(): void {
      setShowDeleteModal(true);
    }

    async function confirmDelete(): Promise<void> {
      if (!id || !data) return;
      const isCorpsesCase = data.caseType === "corpses";
      const isCivilCase = data.caseType === "civil";
      const caseName = isCorpsesCase
        ? (data.corpsesCaseInfo.caseNumber || `#${id}`)
        : isCivilCase
        ? (data.civilCaseInfo.caseNumber || `#${id}`)
        : (data.caseInfo.caseId || `#${id}`);

      try {
        setDeleting(true);
        await api.delete(`/cases/${id}/`);
        toast.success(`تم حذف القضية ${caseName} بنجاح.`);
        setShowDeleteModal(false);
        navigate("/admin/cases");
      } catch (e: any) {
        console.error(e);
        const status = e?.response?.status;
        const msg = status === 403
          ? "مفيش صلاحية للحذف — الأدمن بس."
          : status === 404
          ? "القضية غير موجودة."
          : "فشل حذف القضية.";
        toast.error(msg);
      } finally {
        setDeleting(false);
      }
    }

    function patchCaseInfo(p: Partial<CaseData["caseInfo"]>): void {
      setData((prev) => (prev ? { ...prev, caseInfo: { ...prev.caseInfo, ...p } } : prev));
    }

    function patchCorpsesCaseInfo(p: Partial<CaseData["corpsesCaseInfo"]>): void {
      setData((prev) => (prev ? { ...prev, corpsesCaseInfo: { ...prev.corpsesCaseInfo, ...p } } : prev));
    }

    function patchCivilCaseInfo(p: Partial<CaseData["civilCaseInfo"]>): void {
      setData((prev) => (prev ? { ...prev, civilCaseInfo: { ...prev.civilCaseInfo, ...p } } : prev));
    }

    function patchCorpsesSpecifications(i: number, p: Partial<CorpsesSpecifications>): void {
      setData((prev) => {
        if (!prev) return prev;
        const next = [...prev.corpsesSpecifications];
        next[i] = { ...next[i], ...p };
        return { ...prev, corpsesSpecifications: next };
      });
    }

    function addCorpse(): void {
      setData((prev) => prev ? { ...prev, corpsesSpecifications: [...prev.corpsesSpecifications, { ...emptyCorpseSpecs }] } : prev);
      setRemoteImages((prev) => ({ ...prev, corpseImages: [...prev.corpseImages, []] }));
      setServerIds((prev) => ({ ...prev, corpses: [...prev.corpses, null] }));
    }

    function removeCorpse(i: number): void {
      const sid = serverIds.corpses[i];
      if (sid) {
        void api.delete(`/bodies/${sid}/`).catch(() => toast.error("فشل حذف الجثة من السيرفر."));
      }
      setData((prev) => prev ? { ...prev, corpsesSpecifications: prev.corpsesSpecifications.filter((_, idx) => idx !== i) } : prev);
      setRemoteImages((prev) => ({ ...prev, corpseImages: prev.corpseImages.filter((_, idx) => idx !== i) }));
      setServerIds((prev) => ({ ...prev, corpses: prev.corpses.filter((_, idx) => idx !== i) }));
    }

    function handleCorpseImageAction(i: number, action: ImageAction, payload?: unknown) {
      if (action === "add") {
        setData((prev) => {
          if (!prev) return prev;
          const next = [...prev.corpsesSpecifications];
          next[i] = { ...next[i], images: [...next[i].images, payload as File] };
          return { ...prev, corpsesSpecifications: next };
        });
      } else if (action === "remove-new") {
        setData((prev) => {
          if (!prev) return prev;
          const next = [...prev.corpsesSpecifications];
          next[i] = { ...next[i], images: next[i].images.filter((_, idx) => idx !== (payload as number)) };
          return { ...prev, corpsesSpecifications: next };
        });
      } else if (action === "remove") {
        const imageId = payload as number;
        const bodyId = serverIds.corpses[i];
        if (bodyId) {
          api.delete(`/bodies/${bodyId}/images/${imageId}/`).catch(() => {
            toast.error("فشل حذف صورة الجثة من السيرفر.");
          });
        }
        setRemoteImages((prev) => ({
          ...prev,
          corpseImages: prev.corpseImages.map((list, idx) =>
            idx === i ? list.filter((img) => img.id !== imageId) : list
          ),
        }));
      }
    }

    function patchVictim(i: number, p: PersonData): void {
      setData((prev) => {
        if (!prev) return prev;
        const next = [...prev.victims];
        next[i] = p;
        return { ...prev, victims: next };
      });
    }

    function addVictim(): void {
      setData((prev) => prev ? { ...prev, victims: [...prev.victims, { ...emptyPerson }] } : prev);
      setRemoteImages((prev) => ({ ...prev, victims: [...prev.victims, []] }));
      setServerIds((prev) => ({ ...prev, victims: [...prev.victims, null] }));
    }

    function removeVictim(i: number): void {
      const sid = serverIds.victims[i];
      if (sid) void api.delete(`/persons/${sid}/`).catch(() => toast.error("فشل الحذف من السيرفر."));
      setData((prev) => prev ? { ...prev, victims: prev.victims.filter((_, idx) => idx !== i) } : prev);
      setRemoteImages((prev) => ({ ...prev, victims: prev.victims.filter((_, idx) => idx !== i) }));
      setServerIds((prev) => ({ ...prev, victims: prev.victims.filter((_, idx) => idx !== i) }));
    }

    function patchSuspect(i: number, p: PersonData): void {
      setData((prev) => {
        if (!prev) return prev;
        const next = [...prev.suspects];
        next[i] = p;
        return { ...prev, suspects: next };
      });
    }
    function addSuspect(): void {
      setData((prev) => prev ? { ...prev, suspects: [...prev.suspects, { ...emptyPerson }] } : prev);
      setRemoteImages((prev) => ({ ...prev, suspects: [...prev.suspects, []] }));
      setServerIds((prev) => ({ ...prev, suspects: [...prev.suspects, null] }));
    }
    function removeSuspect(i: number): void {
      const sid = serverIds.suspects[i];
      if (sid) void api.delete(`/persons/${sid}/`).catch(() => toast.error("فشل الحذف من السيرفر."));
      setData((prev) => prev ? { ...prev, suspects: prev.suspects.filter((_, idx) => idx !== i) } : prev);
      setRemoteImages((prev) => ({ ...prev, suspects: prev.suspects.filter((_, idx) => idx !== i) }));
      setServerIds((prev) => ({ ...prev, suspects: prev.suspects.filter((_, idx) => idx !== i) }));
    }

    function patchReporter(p: PersonData | null): void {
      if (!p && serverIds.reporters[0]) {
        void api.delete(`/persons/${serverIds.reporters[0]}/`).catch(() => toast.error("فشل الحذف من السيرفر."));
      }
      setData((prev) => (prev ? { ...prev, reporters: p ? [p] : [] } : prev));
      setRemoteImages((prev) => ({ ...prev, reporters: p ? [prev.reporters[0] || []] : [] }));
      setServerIds((prev) => ({ ...prev, reporters: p ? [prev.reporters[0] ?? null] : [] }));
    }

    function patchEvidence(i: number, p: EvidenceData): void {
      setData((prev) => {
        if (!prev) return prev;
        const next = [...prev.evidence];
        next[i] = p;
        return { ...prev, evidence: next };
      });
    }
    function addEvidence(): void {
      setData((prev) => prev ? { ...prev, evidence: [...prev.evidence, { ...emptyEvidence }] } : prev);
      setRemoteImages((prev) => ({ ...prev, evidences: [...prev.evidences, []] }));
      setServerIds((prev) => ({ ...prev, evidences: [...prev.evidences, null] }));
    }
    function removeEvidence(i: number): void {
      const sid = serverIds.evidences[i];
      if (sid) void api.delete(`/evidence/${sid}/`).catch(() => toast.error("فشل الحذف من السيرفر."));
      setData((prev) => prev ? { ...prev, evidence: prev.evidence.filter((_, idx) => idx !== i) } : prev);
      setRemoteImages((prev) => ({ ...prev, evidences: prev.evidences.filter((_, idx) => idx !== i) }));
      setServerIds((prev) => ({ ...prev, evidences: prev.evidences.filter((_, idx) => idx !== i) }));
    }

    function handleVictimImageAction(i: number, action: ImageAction, payload?: unknown) {
      if (action === "add") {
        setData((prev) => {
          if (!prev) return prev;
          const victims = [...prev.victims];
          victims[i] = { ...victims[i], images: [...victims[i].images, payload as File] };
          return { ...prev, victims };
        });
      } else if (action === "remove-new") {
        setData((prev) => {
          if (!prev) return prev;
          const victims = [...prev.victims];
          victims[i] = { ...victims[i], images: victims[i].images.filter((_, idx) => idx !== (payload as number)) };
          return { ...prev, victims };
        });
      } else if (action === "remove") {
        const imageId = payload as number;
        const personId = serverIds.victims[i];
        if (personId) {
          api.delete(`/persons/${personId}/images/${imageId}/`).catch(() => {
            toast.error("فشل حذف الصورة من السيرفر.");
          });
        }
        setRemoteImages((prev) => ({
          ...prev,
          victims: prev.victims.map((list, idx) =>
            idx === i ? list.filter((img) => img.id !== imageId) : list
          ),
        }));
      }
    }

    function handleSuspectImageAction(i: number, action: ImageAction, payload?: unknown) {
      if (action === "add") {
        setData((prev) => {
          if (!prev) return prev;
          const suspects = [...prev.suspects];
          suspects[i] = { ...suspects[i], images: [...suspects[i].images, payload as File] };
          return { ...prev, suspects };
        });
      } else if (action === "remove-new") {
        setData((prev) => {
          if (!prev) return prev;
          const suspects = [...prev.suspects];
          suspects[i] = { ...suspects[i], images: suspects[i].images.filter((_, idx) => idx !== (payload as number)) };
          return { ...prev, suspects };
        });
      } else if (action === "remove") {
        const imageId = payload as number;
        const personId = serverIds.suspects[i];
        if (personId) {
          api.delete(`/persons/${personId}/images/${imageId}/`).catch(() => {
            toast.error("فشل حذف الصورة من السيرفر.");
          });
        }
        setRemoteImages((prev) => ({
          ...prev,
          suspects: prev.suspects.map((list, idx) =>
            idx === i ? list.filter((img) => img.id !== imageId) : list
          ),
        }));
      }
    }

    function handleReporterImageAction(action: ImageAction, payload?: unknown) {
      if (action === "add") {
        setData((prev) => {
          if (!prev || prev.reporters.length === 0) return prev;
          const reporters = [...prev.reporters];
          reporters[0] = { ...reporters[0], images: [...reporters[0].images, payload as File] };
          return { ...prev, reporters };
        });
      } else if (action === "remove-new") {
        setData((prev) => {
          if (!prev || prev.reporters.length === 0) return prev;
          const reporters = [...prev.reporters];
          reporters[0] = { ...reporters[0], images: reporters[0].images.filter((_, idx) => idx !== (payload as number)) };
          return { ...prev, reporters };
        });
      } else if (action === "remove") {
        const imageId = payload as number;
        const personId = serverIds.reporters[0];
        if (personId) {
          api.delete(`/persons/${personId}/images/${imageId}/`).catch(() => {
            toast.error("فشل حذف الصورة من السيرفر.");
          });
        }
        setRemoteImages((prev) => ({
          ...prev,
          reporters: prev.reporters.map((list, idx) =>
            idx === 0 ? list.filter((img) => img.id !== imageId) : list
          ),
        }));
      }
    }

    function handleEvidenceImageAction(i: number, action: ImageAction, payload?: unknown) {
      if (action === "add") {
        setData((prev) => {
          if (!prev) return prev;
          const evidence = [...prev.evidence];
          evidence[i] = { ...evidence[i], images: [...evidence[i].images, payload as File] };
          return { ...prev, evidence };
        });
      } else if (action === "remove-new") {
        setData((prev) => {
          if (!prev) return prev;
          const evidence = [...prev.evidence];
          evidence[i] = { ...evidence[i], images: evidence[i].images.filter((_, idx) => idx !== (payload as number)) };
          return { ...prev, evidence };
        });
      } else if (action === "remove") {
        const imageId = payload as number;
        api.delete(`/media/${imageId}/`).catch(() => {
          toast.error("فشل حذف الصورة من السيرفر.");
        });
        setRemoteImages((prev) => ({
          ...prev,
          evidences: prev.evidences.map((list, idx) =>
            idx === i ? list.filter((img) => img.id !== imageId) : list
          ),
        }));
      }
    }

    function handleCivilImageAction(action: ImageAction, payload?: unknown) {
      if (action === "add") {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            civilCaseInfo: {
              ...prev.civilCaseInfo,
              images: [...prev.civilCaseInfo.images, payload as File],
            },
          };
        });
      } else if (action === "remove-new") {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            civilCaseInfo: {
              ...prev.civilCaseInfo,
              images: prev.civilCaseInfo.images.filter((_, idx) => idx !== (payload as number)),
            },
          };
        });
      } else if (action === "remove") {
        const imageId = payload as number;
        api.delete(`/cases/${id}/images/${imageId}/`).catch(() => {
          toast.error("فشل حذف الصورة من السيرفر.");
        });
        setRemoteImages((prev) => ({
          ...prev,
          civilImages: prev.civilImages.filter((img) => img.id !== imageId),
        }));
      }
    }

    async function saveChanges(): Promise<void> {
      if (!data || !id) return;
      try {
        if (data.caseType === "corpses") {
      const specsList = Array.isArray(data.corpsesSpecifications)
        ? data.corpsesSpecifications
        : [data.corpsesSpecifications];
      
      for (let i = 0; i < specsList.length; i++) {
        const s = specsList[i];
        
        // تحقق من Facial Features
        if (s.facialFeatures === "unclear" && !s.facialFeaturesReason.trim()) {
          toast.error(`لم تقم بملء سبب عدم وضوح ملامح الوجه للجثة #${i + 1}`);
          return;
        }
        
        // تحقق من Hand Fingerprints
        if (s.handFingerprints === "no" && !s.handFingerprintsReason.trim()) {
          toast.error(`لم تقم بملء سبب عدم وجود بصمات الأصابع للجثة #${i + 1}`);
          return;
        }
      }
    }
        const baseline = savedStamp ? (JSON.parse(savedStamp) as ReturnType<typeof normalizeForCompare>) : null;
        const current = normalizeForCompare(data, remoteImages);

        const changedCaseInfo = baseline
          ? (Object.keys(current.caseInfo) as (keyof CaseData["caseInfo"])[]).reduce<Partial<CaseData["caseInfo"]>>(
            (acc, k) => {
              if (current.caseInfo[k] !== baseline.caseInfo[k]) acc[k] = current.caseInfo[k];
              return acc;
            },
            {}
          )
          : current.caseInfo;

        const payload: Record<string, unknown> = {};
        const setIfChanged = (apiKey: string, value: unknown) => {
          payload[apiKey] = value;
        };

        if (changedCaseInfo.caseId !== undefined) setIfChanged("case_number", changedCaseInfo.caseId.trim());
        if (changedCaseInfo.caseYear !== undefined) {
          const trimmed = changedCaseInfo.caseYear.trim();
          setIfChanged("case_year", trimmed ? Number(trimmed) : null);
        }
        if (changedCaseInfo.incidentType !== undefined) {
          const trimmed = changedCaseInfo.incidentType.trim();
          setIfChanged("incident_type", trimmed);
        }
        if (changedCaseInfo.inspectionDate !== undefined) {
          const trimmed = changedCaseInfo.inspectionDate.trim();
          setIfChanged("inspection_date", trimmed ? trimmed : null);
        }
        if (changedCaseInfo.description !== undefined) setIfChanged("description", changedCaseInfo.description.trim());
        if (changedCaseInfo.policeDepartment !== undefined) setIfChanged("police_department", changedCaseInfo.policeDepartment.trim());
        if (changedCaseInfo.governorate !== undefined) setIfChanged("governorate", changedCaseInfo.governorate.trim());
        if (changedCaseInfo.investigator !== undefined) setIfChanged("investigator", changedCaseInfo.investigator.trim());
        if (changedCaseInfo.locationName !== undefined) setIfChanged("location_name", changedCaseInfo.locationName.trim());
        if (changedCaseInfo.address !== undefined) setIfChanged("address", changedCaseInfo.address.trim());
        if (changedCaseInfo.locationGovernorate !== undefined) setIfChanged("location_governorate", changedCaseInfo.locationGovernorate.trim());
        if (changedCaseInfo.city !== undefined) setIfChanged("city", changedCaseInfo.city.trim());
        if (changedCaseInfo.district !== undefined) setIfChanged("district", changedCaseInfo.district.trim());

        const isCorpses = data.caseType === "corpses";
        const isCivil = data.caseType === "civil";
        if (isCorpses) {
          const currentInfo = current.corpsesCaseInfo;
          const baselineInfo = baseline?.corpsesCaseInfo;

          const changedInfo: Partial<CaseData["corpsesCaseInfo"]> = {};
          if (baselineInfo) {
            for (const k of Object.keys(currentInfo) as (keyof CaseData["corpsesCaseInfo"])[]) {
              if (currentInfo[k] !== baselineInfo[k]) changedInfo[k] = currentInfo[k];
            }
          } else {
            Object.assign(changedInfo, currentInfo);
          }

          if (changedInfo.caseNumber !== undefined) setIfChanged("report_number", changedInfo.caseNumber.trim());
          if (changedInfo.dateOfDiscovery !== undefined) {
            const trimmed = changedInfo.dateOfDiscovery.trim();
            setIfChanged("date_of_discovery", trimmed ? trimmed : null);
          }
          if (changedInfo.inspectionDate !== undefined) {
            const trimmed = changedInfo.inspectionDate.trim();
            setIfChanged("inspection_date", trimmed ? trimmed : null);
          }
          if (changedInfo.locationOfBodyPresence !== undefined) setIfChanged("location_of_body_presence", changedInfo.locationOfBodyPresence.trim());
          if (changedInfo.findingLocation !== undefined) setIfChanged("finding_location", changedInfo.findingLocation.trim());
          if (changedInfo.photographyExpert !== undefined) setIfChanged("photography_expert", changedInfo.photographyExpert.trim());
          if (changedInfo.fingerprintExpert !== undefined) setIfChanged("fingerprint_expert", changedInfo.fingerprintExpert.trim());
          if (changedInfo.note !== undefined) setIfChanged("description", changedInfo.note.trim());
        }

        if (isCivil) {
          const currentInfo = current.civilCaseInfo;
          const baselineInfo = baseline?.civilCaseInfo;

          const changedInfo: Partial<CaseData["civilCaseInfo"]> = {};
          if (baselineInfo) {
            for (const k of Object.keys(currentInfo) as (keyof CaseData["civilCaseInfo"])[]) {
              const currentValue = currentInfo[k];
              const baselineValue = baselineInfo[k];

              if (currentValue !== baselineValue) {
                (changedInfo as Record<string, unknown>)[String(k)] = currentValue as never;
              }
            }
          } else {
            Object.assign(changedInfo, currentInfo);
          }

          if (changedInfo.caseNumber !== undefined) setIfChanged("case_number", changedInfo.caseNumber.trim());
          if (changedInfo.caseYear !== undefined) {
            const trimmed = changedInfo.caseYear.trim();
            setIfChanged("case_year", trimmed ? Number(trimmed) : null);
          }
          if (changedInfo.dateOfReceipt !== undefined) {
            const trimmed = changedInfo.dateOfReceipt.trim();
            setIfChanged("date_of_receipt", trimmed ? trimmed : null);
          }
          if (changedInfo.receiptAuthority !== undefined) setIfChanged("receipt_authority", changedInfo.receiptAuthority.trim());
          if (changedInfo.dateOfTransfer !== undefined) {
            const trimmed = changedInfo.dateOfTransfer.trim();
            setIfChanged("date_of_transfer", trimmed ? trimmed : null);
          }
          if (changedInfo.transferredAuthority !== undefined) setIfChanged("transferred_authority", changedInfo.transferredAuthority.trim());
          if (changedInfo.governorate !== undefined) setIfChanged("governorate", changedInfo.governorate.trim());
          if (changedInfo.fingerprintType !== undefined) setIfChanged("fingerprint_type", changedInfo.fingerprintType.trim());
          if (changedInfo.fingerprintHolder !== undefined) setIfChanged("fingerprint_holder", changedInfo.fingerprintHolder.trim());
          if (changedInfo.comparisonDocument !== undefined) setIfChanged("comparison_document", changedInfo.comparisonDocument.trim());
          if (changedInfo.typeOfComparisonDocument !== undefined) setIfChanged("type_of_comparison_document", changedInfo.typeOfComparisonDocument.trim());
          if (changedInfo.expert !== undefined) setIfChanged("expert", changedInfo.expert.trim());
          if (changedInfo.photographer !== undefined) setIfChanged("photographer", changedInfo.photographer.trim());
          if (changedInfo.notes !== undefined) setIfChanged("notes", changedInfo.notes.trim());
        }

        if (Object.keys(payload).length > 0) {
          await api.patch(`/cases/${id}/`, payload);
        }

        const newIds: ServerIds = {
          victims: [...serverIds.victims],
          suspects: [...serverIds.suspects],
          reporters: [...serverIds.reporters],
          evidences: [...serverIds.evidences],
          corpses: [...serverIds.corpses],
        };

        const groups: { role: "victim" | "suspect" | "reporter"; key: "victims" | "suspects" | "reporters" }[] = [
          { role: "victim", key: "victims" },
          { role: "suspect", key: "suspects" },
          { role: "reporter", key: "reporters" },
        ];

        for (const g of groups) {
          const list = data[g.key];
          for (let i = 0; i < list.length; i++) {
            const p = list[i];
            if (!p.fullName && !p.nationalId && !p.nationality) continue;
            const body = {
              full_name: p.fullName,
              national_id: p.nationalId,
              gender: p.gender,
              nationality: p.nationality,
              note: p.note || "",
            };
            let personId: number | null = newIds[g.key][i];
            if (personId) {
              await api.patch(`/persons/${personId}/`, body);
            } else {
              const res = await api.post(`/cases/${id}/persons/`, { ...body, role: g.role });
              personId = res.data.id;
              newIds[g.key][i] = personId;
            }
            if (personId) {
              for (const f of p.images) {
                const fd = new FormData();
                fd.append("image", f);
                await api.post(`/persons/${personId}/images/`, fd);
              }
            }
          }
        }

        for (let i = 0; i < data.evidence.length; i++) {
          const ev = data.evidence[i];
          if (!ev.evidenceId && !ev.evidenceType && !ev.description) continue;
          const body = {
            evidence_number: ev.evidenceId,
            evidence_type: ev.evidenceType,
            description: ev.description,
          };
          let evId: number | null = newIds.evidences[i];
          if (evId) {
            await api.patch(`/evidence/${evId}/`, body);
          } else {
            const res = await api.post(`/cases/${id}/evidence/`, body);
            evId = res.data.id;
            newIds.evidences[i] = evId;
          }
          if (evId) {
            for (const f of ev.images) {
              const fd = new FormData();
              fd.append("file", f);
              fd.append("media_type", "image");
              await api.post(`/evidence/${evId}/media/`, fd);
            }
          }
        }

        if (data.caseType === "civil") {
          for (const f of data.civilCaseInfo.images) {
            const fd = new FormData();
            fd.append("image", f);
            await api.post(`/cases/${id}/images/`, fd);
          }
        }

        // ✅ كل الجثث كـ Body records موحدة (مفيش "أول جثة" مختلفة)
        if (data.caseType === "corpses") {
          const specsList = Array.isArray(data.corpsesSpecifications)
            ? data.corpsesSpecifications
            : [data.corpsesSpecifications];

          for (let i = 0; i < specsList.length; i++) {
            const s = specsList[i];
            const hasAny = [
              s.gender, s.approximateAge, s.approximateHeight, s.weight,
              s.discoveryCircumstances, s.distinguishingMarks, s.underwear, s.outerwear,
              s.facialFeatures, s.facialFeaturesReason, s.handFingerprints,
              s.handFingerprintsReason, s.notes,
            ].some(Boolean) || s.biologicalSample.length > 0;

            if (!hasAny && s.images.length === 0 && !newIds.corpses[i]) continue;

            const body: Record<string, unknown> = {
              gender: s.gender.trim() || null,
              approximate_age: s.approximateAge.trim() || null,
              approximate_height: s.approximateHeight.trim() || null,
              weight: s.weight.trim() || null,
              discovery_circumstances: s.discoveryCircumstances.trim() || null,
              distinguishing_marks: s.distinguishingMarks.trim() || null,
              underwear: s.underwear.trim() || null,
              outerwear: s.outerwear.trim() || null,
              facial_features: s.facialFeatures || null,
              facial_features_reason: s.facialFeaturesReason.trim() || null,
              hand_fingerprints: s.handFingerprints || null,
              hand_fingerprints_reason: s.handFingerprintsReason.trim() || null,
              biological_sample: s.biologicalSample,
              specifications_notes: s.notes.trim() || null,
            };

            let bodyId: number | null = newIds.corpses[i] ?? null;
            if (bodyId) {
              await api.patch(`/bodies/${bodyId}/`, body);
            } else {
              const res = await api.post(`/cases/${id}/bodies/`, body);
              bodyId = res.data?.id ?? null;
              if (bodyId) newIds.corpses[i] = bodyId;
            }

            if (bodyId) {
              for (const f of s.images) {
                const fd = new FormData();
                fd.append("image", f);
                await api.post(`/bodies/${bodyId}/images/`, fd);
              }
            }
          }
        }

        setServerIds(newIds);
        toast.success("Changes saved to server.", { duration: 2500 });

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (e: any) {
        console.error(e);
        const detail = e?.response?.data;
        const msg = detail
          ? `فشل الحفظ: ${JSON.stringify(detail).slice(0, 200)}`
          : "فشل حفظ التغييرات.";
        toast.error(msg);
      }
    }

    async function handleDownload(): Promise<void> {
      if (!id) return;
      try {
        const res = await api.get(`/cases/${id}/download/`, { responseType: "blob" });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        const downloadName = data?.caseType === "corpses"
          ? (data?.corpsesCaseInfo.caseNumber || id)
          : data?.caseType === "civil"
          ? (data?.civilCaseInfo.caseNumber || id)
          : (data?.caseInfo.caseId || id);
        a.href = url;
        a.download = `Case_${downloadName}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Case bundle downloaded successfully.", { duration: 2500 });
      } catch (e) {
        console.error(e);
        toast.error(t("cases:review.failedToDownload"));
      }
    }

    if (loading) {
      return (
        <div className="min-h-full flex items-center justify-center py-20">
          <div className="text-sm text-gray-500">{t("cases:review.loadingCase")}</div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="min-h-full flex items-center justify-center py-20">
          <Toaster position="top-right" />
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center max-w-lg">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2 size={32} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{t("cases:review.caseNotFound")}</h1>
            <p className="text-sm text-gray-500 mb-2">{t("cases:review.caseNotFoundDesc")}</p>
            <p className="text-xs text-gray-400 mb-8 font-mono">{t("cases:review.requestedId")}: {id ?? "—"}</p>
            <button onClick={() => navigate("/admin/cases")} className="h-12 px-6 rounded-2xl bg-[#005588] text-white inline-flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#004670] shadow-lg shadow-[#005588]/20 transition">
              <ArrowLeft size={17} strokeWidth={2.5} />
              {t("cases:review.backToCases")}
            </button>
          </div>
        </div>
      );
    }

    const info = data.caseInfo;
    const isCorpses = data.caseType === "corpses";
    const isCivil = data.caseType === "civil";
    const corpsesInfo = data.corpsesCaseInfo;
    const civilInfo = data.civilCaseInfo;
    const displayCaseTitle = isCorpses
      ? (corpsesInfo.caseNumber || `#${id ?? "—"}`)
      : isCivil
      ? (civilInfo.caseNumber || `#${id ?? "—"}`)
      : (info.caseId || `#${id ?? "—"}`);

    const typeBadge = isCorpses
      ? "bg-rose-50 text-rose-600 border-rose-200"
      : data.caseType === "civil"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-[#0875a8] border-blue-200";
    const typeLabel = isCorpses ? `${t("cases:caseTypeLabels.corpses")}` : data.caseType === "civil" ? `${t("cases:caseTypeLabels.civil")} ` : `${t("cases:caseTypeLabels.criminal")}`;

    const criminalHandlers = {
      patchCaseInfo,
      addVictim, removeVictim, patchVictim, handleVictimImageAction: handleVictimImageAction as IndexedImageHandler,
      addSuspect, removeSuspect, patchSuspect, handleSuspectImageAction: handleSuspectImageAction as IndexedImageHandler,
      patchReporter, handleReporterImageAction: handleReporterImageAction as ImageHandler,
      addEvidence, removeEvidence, patchEvidence, handleEvidenceImageAction: handleEvidenceImageAction as IndexedImageHandler,
      emptyPerson,
    };

    const corpsesHandlers = {
      patchCorpsesCaseInfo,
      patchCorpsesSpecifications: patchCorpsesSpecifications as (
        i: number,
        p: Partial<CorpsesSpecifications>
      ) => void,
      addCorpse,
      removeCorpse,
      handleCorpseImageAction: handleCorpseImageAction as IndexedImageHandler,
      emptyCorpseSpecs,
    };

    const civilHandlers = {
      patchCivilCaseInfo,
      addVictim, removeVictim, patchVictim, handleVictimImageAction: handleVictimImageAction as IndexedImageHandler,
      addSuspect, removeSuspect, patchSuspect, handleSuspectImageAction: handleSuspectImageAction as IndexedImageHandler,
      patchReporter, handleReporterImageAction: handleReporterImageAction as ImageHandler,
      addEvidence, removeEvidence, patchEvidence, handleEvidenceImageAction: handleEvidenceImageAction as IndexedImageHandler,
      handleCivilImageAction: handleCivilImageAction as ImageHandler,
      emptyPerson,
    };

    return (
      <div className="min-h-full pb-10" id="admin-case-report-root">
        <Toaster position="top-right" />

        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4 print:hidden">
          <div className="flex items-start gap-4">
            <button onClick={() => navigate("/admin/cases")} className="flex-shrink-0 h-11 w-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center justify-center text-gray-600 transition shadow-sm" aria-label="Back to cases">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Case {displayCaseTitle}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${typeBadge}`}>
                  {typeLabel}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {t("cases:review.submittedCaseFile")} · {t("cases:review.adminReviewMode")}
                <span className="mx-2 text-gray-300">•</span>
                <span className="font-bold text-gray-600 bg-blue-100 px-2 py-1 rounded">{t("cases:review.station")}: <span className="font-semibold text-gray-700">{stationUsername || "—"}</span></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {dirty && (
              <button onClick={saveChanges} className="h-11 px-5 rounded-2xl bg-emerald-600 text-white inline-flex items-center gap-2 text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition">
                <Save size={17} />
                {t("cases:review.saveChanges")}
              </button>
            )}
            <button onClick={() => { void handleDownload(); }} className="h-11 px-6 rounded-2xl bg-[#005588] text-white inline-flex items-center gap-2 text-sm font-semibold hover:bg-[#004670] shadow-lg shadow-[#005588]/20 transition">
              <Download size={17} />
              {t("cases:review.downloadCase")}
            </button>
            <button
              onClick={openDeleteModal}
              disabled={deleting}
              className="h-11 px-5 rounded-2xl border-2 border-rose-300 bg-white text-rose-600 inline-flex items-center gap-2 text-sm font-semibold hover:bg-rose-50 hover:border-rose-400 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="حذف القضية نهائيًا"
              >
              <Trash2 size={17} />
              {t("cases:review.deleteCase")}
            </button>
          </div>
        </div>

        <div className="w-full max-w-6xl space-y-5">
          {isCivil ? (
            <CivilCaseDetail
              data={data}
              remoteImages={remoteImages}
              handlers={civilHandlers}
            />
          ) : isCorpses ? (
            <CorpsesCaseDetail
              data={data}
              remoteImages={remoteImages}
              handlers={corpsesHandlers}
            />
          ) : (
            <CriminalCaseDetail
              data={data}
              remoteImages={remoteImages}
              handlers={criminalHandlers}
            />
          )}

          <AdminConsoleFooter
            dirty={dirty}
            saveChanges={saveChanges}
            handleDownload={handleDownload}
          />
        </div>
        <DeleteConfirmModal
        open={showDeleteModal}
        caseName={displayCaseTitle || `#${id ?? "—"}`}
        caseCode={displayCaseTitle || `#${id ?? "—"}`}
        deleting={deleting}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
      </div>
    );
}