import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Fingerprint,
  CalendarDays,
  Hash,
  Stethoscope,
  MapPin,
  Camera,
  User,
  Ruler,
  Scale,
  Eye,
  Hand,
  Droplets,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import type { CaseData, CorpsesSpecifications } from "@/context/CaseContext";
import { api } from "@/api/client";
import { sanitizeFilename } from "@/utils/download";
import { usePermissions } from "@/hooks/usePermissions";

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { t } = useTranslation(["cases", "common"]);
  return (
    <div>
      <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-[#475569]">{value || t("common:notProvided")}</p>
    </div>
  );
}

function IconField({
  Icon,
  label,
  value,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
}) {
  const { t } = useTranslation(["cases", "common"]);
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#0875a8]">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-[#475569]">{value || t("common:notProvided")}</p>
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="my-7 border-t border-[#e5edf2]" />;
}

function SectionHeader({
  Icon,
  title,
}: {
  Icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[#e5edf2] px-5 py-4 bg-[#fafcfe]">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
        <Icon size={14} />
      </div>
      <h2 className="text-sm font-semibold text-[#12385a]">{title}</h2>
    </div>
  );
}

function Badge({
  label,
  color = "blue",
}: {
  label: string;
  color?: "blue" | "green" | "amber";
}) {
  const colorMap = {
    blue: "bg-[#e0f2fe] text-[#0369a1]",
    green: "bg-[#d1fae5] text-[#047857]",
    amber: "bg-[#fef3c7] text-[#b45309]",
  };
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  );
}

function facialFeaturesDisplay(v: string) {
  if (!v) return "";
  const parts = v.split(",").map((s) => s.trim());
  return parts.join(" • ");
}

function handFingerprintsDisplay(v: string) {
  if (!v) return "";
  const parts = v.split(",").map((s) => s.trim());
  return parts.join(" • ");
}

function biologicalSampleBadge(v: string) {
  const lc = v.toLowerCase();
  if (lc === "blood") return <Badge label={v} color="blue" />;
  if (lc === "saliva") return <Badge label={v} color="green" />;
  if (lc === "hair") return <Badge label={v} color="amber" />;
  return <Badge label={v} color="blue" />;
}

function biologicalSampleDisplay(arr: string[]) {
  if (!arr || arr.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {arr.map((val, i) => (
        <span key={i}>{biologicalSampleBadge(val)}</span>
      ))}
    </div>
  );
}

interface CorpseCardProps {
  corpse: CorpsesSpecifications;
  cardIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  translateWeight: (w: string) => string;
}

function CorpseCard({ corpse, cardIndex, isExpanded, onToggleExpand, translateWeight }: CorpseCardProps) {
  const { t } = useTranslation(["cases", "common"]);

  // Load images from URLs instead of File objects
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    // In admin review, corpse.imageUrls should contain URLs from the API
    setImageUrls(corpse.imageUrls || []);
  }, [corpse.imageUrls]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#dbe5ec] bg-white">
      <div
        className="flex cursor-pointer items-center justify-between bg-[#fafcfe] px-4 py-3 transition hover:bg-[#f1f5f9]"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e5f5fc] text-sm font-semibold text-[#0875a8]">
            {cardIndex + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f2942]">
              {corpse.gender || `${t("cases:labels.corpseLabel")} ${cardIndex + 1}`}
            </p>
            <p className="text-xs text-[#64748b]">
              {corpse.gender ? `${corpse.gender} • ` : ""}
              {corpse.approximateAge ? `${corpse.approximateAge} ${t("cases:labels.years")}` : ""}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#64748b] transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </div>

      {isExpanded && (
        <div className="px-5 py-5 space-y-5">
          {/* Basic Details */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                <User size={12} />
              </div>
              <p className="text-xs font-semibold text-[#12385a]">
                {t("cases:labels.basicDetails")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("cases:labels.gender")} value={corpse.gender} />
              <Field label={t("cases:labels.approximateAge")} value={corpse.approximateAge} />
              <Field label={t("cases:labels.approximateHeight")} value={corpse.approximateHeight} />
              <Field label={t("cases:labels.weight")} value={translateWeight(corpse.weight)} />
            </div>
          </div>

          <SectionDivider />

          {/* Physical Attributes */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                <Ruler size={12} />
              </div>
              <p className="text-xs font-semibold text-[#12385a]">
                {t("cases:labels.physicalAttributes")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("cases:labels.underwear")} value={corpse.underwear} />
              <Field label={t("cases:labels.outerwear")} value={corpse.outerwear} />
              <Field label={t("cases:labels.discoveryCircumstances")} value={corpse.discoveryCircumstances} />
              <Field label={t("cases:labels.distinguishingMarks")} value={corpse.distinguishingMarks} />
            </div>
          </div>

          <SectionDivider />

          {/* Identifying Marks */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                <Eye size={12} />
              </div>
              <p className="text-xs font-semibold text-[#12385a]">
                {t("cases:labels.identifyingMarks")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("cases:labels.facialFeatures")}
                value={corpse.facialFeatures}
              />
              <Field
                label={t("cases:labels.facialFeaturesReason")}
                value={corpse.facialFeaturesReason}
              />
            </div>
          </div>

          <SectionDivider />

          {/* Forensic Details */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                <Hand size={12} />
              </div>
              <p className="text-xs font-semibold text-[#12385a]">
                {t("cases:labels.forensicDetails")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("cases:labels.handFingerprints")}
                value={corpse.handFingerprints}
              />
              <Field
                label={t("cases:labels.handFingerprintsReason")}
                value={corpse.handFingerprintsReason}
              />
            </div>
          </div>

          {(corpse.biologicalSample && corpse.biologicalSample.length > 0) && (
            <>
              <SectionDivider />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                    <Droplets size={12} />
                  </div>
                  <p className="text-xs font-semibold text-[#12385a]">
                    {t("cases:labels.biologicalSample")}
                  </p>
                </div>
                {biologicalSampleDisplay(corpse.biologicalSample)}
              </div>
            </>
          )}

          {corpse.notes && (
            <>
              <SectionDivider />
              <div>
                <IconField
                  Icon={StickyNote}
                  label={t("cases:labels.additionalNotes")}
                  value={corpse.notes}
                />
              </div>
            </>
          )}

          {imageUrls.length > 0 && (
            <>
              <SectionDivider />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                    <Camera size={12} />
                  </div>
                  <p className="text-xs font-semibold text-[#12385a]">
                    {t("cases:labels.images")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Corpse ${idx + 1}`}
                      className="h-20 w-20 rounded-md border border-[#dbe5ec] object-cover"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCorpsesReview() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["cases", "common"]);
  const { canExportCase } = usePermissions();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => ({ 0: true }));

  // Helper function to translate weight values
  const translateWeight = (weight: string): string => {
    if (!weight) return "";
    
    const normalizedWeight = weight.trim().toLowerCase();
    
    if (normalizedWeight === "slim") return t("cases:weightRanges.slim");
    if (normalizedWeight === "average") return t("cases:weightRanges.average");
    if (normalizedWeight === "overweight") return t("cases:weightRanges.overweight");
    
    return weight;
  };

  useEffect(() => {
    async function fetchCase() {
      try {
        const response = await api.get(`/cases/${caseId}`);
        setCaseData(response.data);
      } catch (error) {
        toast.error(t("cases:review.failedToLoadCase"));
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      fetchCase();
    }
  }, [caseId, t]);

  async function handleDownload() {
    if (!caseId) return;

    try {
      setDownloading(true);
      const res = await api.get(`/cases/${caseId}/download/`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = sanitizeFilename(`CorpsesCase_${caseData?.corpsesCaseInfo?.caseNumber || caseId}.zip`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success(t("cases:review.downloadSuccess"), { duration: 3000 });
    } catch (error) {
      toast.error(t("cases:review.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005588] mx-auto"></div>
          <p className="mt-4 text-sm text-[#64748b]">{t("cases:review.loadingCaseData")}</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#0f2942]">{t("cases:review.caseNotFound")}</p>
          <p className="mt-2 text-sm text-[#64748b]">{t("cases:review.caseNotFoundDesc")}</p>
          <button
            onClick={() => navigate("/admin/cases")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#005588] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00466f]"
          >
            <ArrowLeft size={16} />
            {t("cases:review.backToCases")}
          </button>
        </div>
      </div>
    );
  }

  const info = caseData.corpsesCaseInfo;
  const corpses = caseData.corpsesSpecifications || [];

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />

      <div className="mx-auto w-full max-w-6xl pb-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f2942]">
              {t("cases:review.corpsesTitle")} - {info.caseNumber}
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {t("cases:review.corpsesSubtitle")}
            </p>
          </div>

          <div className="flex gap-3">
            {canExportCase && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? t("cases:review.downloading") : t("cases:review.downloadCase")}
              </button>
            )}
          </div>
        </div>

        {/* ===== SECTION 1: Case Information ===== */}
        <section className="mb-5 overflow-hidden rounded-xl border border-[#dbe5ec] bg-white">
          <SectionHeader title={t("cases:review.caseInfo")} Icon={FileText} />

          <div className="px-5 py-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <IconField Icon={Hash} label={t("cases:labels.caseNumber")} value={info.caseNumber} />
              <IconField
                Icon={CalendarDays}
                label={t("cases:labels.dateOfDiscovery")}
                value={info.dateOfDiscovery}
              />
              <IconField
                Icon={CalendarDays}
                label={t("cases:labels.inspectionDate")}
                value={info.inspectionDate}
              />
              <IconField
                Icon={MapPin}
                label={t("cases:labels.locationOfBodyPresence")}
                value={info.locationOfBodyPresence}
              />
              <IconField
                Icon={MapPin}
                label={t("cases:labels.findingLocation")}
                value={info.findingLocation}
              />
              <IconField
                Icon={Camera}
                label={t("cases:labels.photographyExpert")}
                value={info.photographyExpert}
              />
              <IconField
                Icon={Fingerprint}
                label={t("cases:labels.fingerprintExpert")}
                value={info.fingerprintExpert}
              />
            </div>

            {info.note && (
              <>
                <SectionDivider />
                <IconField
                  Icon={StickyNote}
                  label={t("cases:labels.additionalNotes")}
                  value={info.note}
                />
              </>
            )}
          </div>
        </section>

        {/* ===== SECTION 2: Corpses Specifications ===== */}
        <section className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
              <User size={14} />
            </div>
            <h2 className="text-sm font-semibold text-[#12385a]">
              {t("cases:labels.corpses")}
            </h2>
            <span className="ml-1 rounded-full bg-[#e5f5fc] px-2.5 py-0.5 text-xs font-semibold text-[#0875a8]">
              {corpses.length}
            </span>
          </div>

          <div className="space-y-3">
            {corpses.map((corpse, idx) => (
              <CorpseCard
                key={idx}
                corpse={corpse}
                cardIndex={idx}
                isExpanded={expanded[idx] || false}
                onToggleExpand={() =>
                  setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))
                }
                translateWeight={translateWeight}
              />
            ))}
          </div>
        </section>

        <div className="mt-6 flex justify-start">
          <button
            onClick={() => navigate("/admin/cases")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9]"
          >
            <ArrowLeft size={16} />
            {t("cases:review.backToCases")}
          </button>
        </div>
      </div>
    </div>
  );
}
