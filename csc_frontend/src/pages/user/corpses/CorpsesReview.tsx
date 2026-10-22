import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
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
import { useCase } from "@/context/CaseContext";
import type { CorpsesSpecifications } from "@/context/CaseContext";
import { submitCorpsesCase } from "@/api/cases";
import { api } from "@/api/client";

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
      <p className="mt-1 text-sm text-[#475569]">
        {value || <span className="text-[#94a3b8]">{t("cases:review.notProvided")}</span>}
      </p>
    </div>
  );
}

function IconField({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof Hash;
}) {
  const { t } = useTranslation(["cases", "common"]);
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-[#0875a8]" />
        <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
          {label}
        </p>
      </div>
      <p className="mt-1 text-sm text-[#475569]">
        {value || <span className="text-[#94a3b8]">{t("cases:review.notProvided")}</span>}
      </p>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-[#edf2f5]" />;
}

function SectionHeader({
  title,
  Icon,
}: {
  title: string;
  Icon: typeof FileText;
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

const badgeCls =
  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold";

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    default: "bg-[#e5edf2] text-[#475569]",
    green: "bg-[#dcfce7] text-[#166534]",
    amber: "bg-[#fef3c7] text-[#92400e]",
    red: "bg-[#fee2e2] text-[#991b1b]",
    blue: "bg-[#dbeafe] text-[#1e40af]",
  };
  return (
    <span className={`${badgeCls} ${tones[tone]}`}>{children}</span>
  );
}

function facialFeaturesDisplay(v: string) {
  const { t } = useTranslation(["cases"]);
  if (v === "clear") return <Badge tone="green">{t("cases:review.clear")}</Badge>;
  if (v === "unclear") return <Badge tone="amber">{t("cases:review.unclear")}</Badge>;
  return null;
}

function handFingerprintsDisplay(v: string) {
  const { t } = useTranslation(["cases"]);
  if (v === "yes") return <Badge tone="green">{t("cases:review.yes")}</Badge>;
  if (v === "no") return <Badge tone="red">{t("cases:review.no")}</Badge>;
  return null;
}

function biologicalSampleBadge(v: string) {
  const { t } = useTranslation(["cases"]);
  switch (v) {
    case "blood":
      return <Badge tone="red">{t("cases:review.blood")}</Badge>;
    case "tissue":
      return <Badge tone="blue">{t("cases:review.tissue")}</Badge>;
    case "bones":
      return <Badge tone="amber">{t("cases:review.bones")}</Badge>;
    case "none":
      return <Badge tone="default">{t("cases:review.none")}</Badge>;
    default:
      return null;
  }
}

function biologicalSampleDisplay(arr: string[]) {
  if (!arr || arr.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map((v) => (
        <span key={v}>{biologicalSampleBadge(v)}</span>
      ))}
    </div>
  );
}

type CorpseCardProps = {
  corpse: CorpsesSpecifications;
  cardIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  translateWeight: (weight: string) => string;
};

function CorpseCard({ corpse, cardIndex, isExpanded, onToggleExpand, translateWeight }: CorpseCardProps) {
  const { t } = useTranslation(["cases", "common"]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls: string[] = [];
    for (const img of corpse.images) {
      urls.push(URL.createObjectURL(img));
    }
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [corpse.images]);

  const displayGender =
    corpse.gender === "male"
      ? t("cases:display.maleBilingual") 
      : corpse.gender === "female"
      ? t("cases:display.femaleBilingual")
      : corpse.gender === "none"
      ? t("cases:display.noneBilingual")
      : corpse.gender || t("cases:display.notSet");

  const displayAge = corpse.approximateAge ? `${corpse.approximateAge} ${t("cases:display.years")}` : t("cases:display.noAge");

  return (
    <div className="rounded-xl border border-[#dbe5ec] bg-white p-4 sm:p-5">
      <div
        className="mb-4 flex items-center justify-between border-b border-[#edf2f5] pb-3 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe5ec] bg-[#e5f5fc] text-[#005588]">
            <Stethoscope size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#12385a]">
              {t("cases:display.corpseNumber")} #{cardIndex + 1} • {displayGender}
            </p>
            <p className="mt-0.5 text-[10px] text-[#64748b]">{displayAge}</p>
          </div>
        </div>
        <ChevronDown
          size={17}
          className={`text-[#64748b] transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {isExpanded && (
        <div className="space-y-4 sm:space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <User size={13} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:review.physicalAttributes")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-4">
              <IconField
                label={t("cases:labels.gender")}
                value={displayGender}
                Icon={User}
              />
              <IconField
                label={t("cases:labels.approximateAge")}
                value={corpse.approximateAge ? `${corpse.approximateAge} ${t("cases:display.years")}` : ""}
                Icon={User}
              />
              <IconField
                label={t("cases:labels.approximateHeight")}
                value={corpse.approximateHeight ? `${corpse.approximateHeight} cm` : ""}
                Icon={Ruler}
              />
              <IconField label={t("cases:labels.weight")} value={translateWeight(corpse.weight)} Icon={Scale} />
            </div>
          </div>

          <SectionDivider />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 gap-x-6 gap-y-5">
            <Field
              label={t("cases:labels.discoveryCircumstances")}
              value={corpse.discoveryCircumstances}
            />
            <Field
              label={t("cases:labels.distinguishingMarks")}
              value={corpse.distinguishingMarks}
            />
          </div>

          <SectionDivider />

          <div>
            <div className="mb-2 flex items-center gap-2">
              <User size={13} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:review.clothing")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2">
              <Field
                label={t("cases:labels.underwear")}
                value={corpse.underwear}
              />
              <Field
                label={t("cases:labels.outerwear")}
                value={corpse.outerwear}
              />
            </div>
          </div>

          <SectionDivider />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Eye size={12} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.facialFeatures")}
                </p>
              </div>
              <div className="mt-1 mb-1">
                {facialFeaturesDisplay(corpse.facialFeatures) || (
                  <span className="text-sm text-[#94a3b8]">{t("cases:review.notProvided")}</span>
                )}
              </div>
              {corpse.facialFeatures === "unclear" && (
                <p className="mt-2 text-xs text-[#475569]">
                  <span className="font-semibold">{t("cases:review.reason")}:</span>{" "}
                  {corpse.facialFeaturesReason || (
                    <span className="text-[#94a3b8]">{t("cases:review.notProvided")}</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Hand size={12} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.handFingerprints")}
                </p>
              </div>
              <div className="mt-1 mb-1">
                {handFingerprintsDisplay(corpse.handFingerprints) || (
                  <span className="text-sm text-[#94a3b8]">{t("cases:review.notProvided")}</span>
                )}
              </div>
              {corpse.handFingerprints === "no" && (
                <p className="mt-2 text-xs text-[#475569]">
                  <span className="font-semibold">{t("cases:review.reason")}:</span>{" "}
                  {corpse.handFingerprintsReason || (
                    <span className="text-[#94a3b8]">{t("cases:review.notProvided")}</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Droplets size={12} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.biologicalSample")}
                </p>
              </div>
              <div className="mt-1">
                {biologicalSampleDisplay(corpse.biologicalSample) || (
                  <span className="text-sm text-[#94a3b8]">{t("cases:review.notProvided")}</span>
                )}
              </div>
            </div>
          </div>

          <SectionDivider />

          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Camera size={12} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:review.corpseImages")}
              </p>
            </div>
            {previewUrls.length === 0 ? (
              <p className="text-sm text-[#94a3b8]">{t("cases:review.notProvided")}</p>
            ) : (
              <div className="flex flex-wrap gap-3 mt-2">
                {previewUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`corpse-${cardIndex}-img-${idx}`}
                    className="h-24 w-32 rounded-lg border border-[#cbd5e1] object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <SectionDivider />

          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <StickyNote size={12} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:review.notes")}
              </p>
            </div>
            <Field label="" value={corpse.notes} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CorpsesReview() {
  const navigate = useNavigate();
  const { caseData, resetCase } = useCase();
  const { t } = useTranslation(["cases", "common"]);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => ({ 0: true }));

  const info = caseData.corpsesCaseInfo;
  const corpses = caseData.corpsesSpecifications;

  // Helper function to translate weight values
  const translateWeight = (weight: string): string => {
    if (!weight) return "";
    
    const normalizedWeight = weight.trim().toLowerCase();
    
    if (normalizedWeight === "slim") return t("cases:weightRanges.slim");
    if (normalizedWeight === "average") return t("cases:weightRanges.average");
    if (normalizedWeight === "overweight") return t("cases:weightRanges.overweight");
    
    return weight;
  };

  const caseFilled = Boolean(
    info.caseNumber ||
      info.dateOfDiscovery ||
      info.inspectionDate ||
      info.locationOfBodyPresence ||
      info.findingLocation ||
      info.photographyExpert ||
      info.fingerprintExpert ||
      info.note
  );

  const specsFilled = corpses.some(
    (specs) =>
      Boolean(
        specs.gender ||
          specs.approximateAge ||
          specs.approximateHeight ||
          specs.weight ||
          specs.discoveryCircumstances ||
          specs.distinguishingMarks ||
          specs.underwear ||
          specs.outerwear ||
          specs.facialFeatures ||
          specs.handFingerprints ||
          specs.biologicalSample.length ||
          specs.images.length ||
          specs.notes
      )
  );

  function validateCase(): string | null {
    if (!caseFilled) {
      return t("cases:review.caseEmpty");
    }
    if (!info.caseNumber?.trim()) {
      return t("cases:review.caseNumberRequired");
    }
    if (!info.dateOfDiscovery) {
      return t("cases:review.dateOfDiscoveryRequired");
    }
    if (!specsFilled) {
      return t("cases:review.specsRequired");
    }
    return null;
  }

  async function handleSubmit() {
    const error = validateCase();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSubmitting(true);

      const caseId: number = await submitCorpsesCase(caseData, true);
      console.log("🎯 Submitted corpses case ID:", caseId);

      toast.success(
        t("cases:review.submitSuccess"),
        {
          duration: 4000,
          icon: <CheckCircle2 className="text-green-600" size={20} />,
        }
      );

      try {
        const res = await api.get(`/cases/${caseId}/download/`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CorpsesCase_${info.caseNumber || caseId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast.success(t("cases:review.downloadSuccess"), { duration: 3000 });
      } catch (dlErr) {
        console.error(dlErr);
        toast.error(t("cases:review.downloadFailed"));
      }

      // Navigate immediately with replace to avoid context issues
      navigate("/user/dashboard", { replace: true });
      
      // Reset case after a small delay to ensure navigation completes
      setTimeout(() => {
        resetCase();
      }, 300);
    } catch (e) {
      console.error(e);
      toast.error(
        t("cases:review.submitFailed")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />

      <div className="mx-auto w-full max-w-6xl pb-6 px-3 sm:px-4">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f2942]">
              {t("cases:review.corpsesTitle")}
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {t("cases:review.corpsesSubtitle")}
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold text-[#64748b]">
              {t("cases:review.step3of3")}
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
            </div>
          </div>
        </div>

        {/* ===== SECTION 1: Corpses Case Info ===== */}
        <section className="mb-5 overflow-hidden rounded-xl border border-[#dbe5ec] bg-white">
          <SectionHeader
            title={t("cases:labels.corpseFiles")}
            Icon={FileText}
          />

          <div className="px-5 py-5 space-y-5">
            <div>
              
              <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-3">
                <IconField
                  label={t("cases:labels.caseNumber")}
                  value={info.caseNumber}
                  Icon={Hash}
                />
                <IconField
                  label={t("cases:labels.dateOfDiscovery")}
                  value={info.dateOfDiscovery}
                  Icon={CalendarDays}
                />
                <IconField
                  label={t("cases:labels.inspectionDate")}
                  value={info.inspectionDate}
                  Icon={CalendarDays}
                />
                <IconField
                  label={t("cases:labels.locationOfBodyPresence")}
                  value={info.locationOfBodyPresence}
                  Icon={Stethoscope}
                />
                <div className="md:col-span-2 xl:col-span-2">
                  <IconField
                    label={t("cases:labels.findingLocation")}
                    value={info.findingLocation}
                    Icon={MapPin}
                  />
                </div>
              </div>
            </div>

            <SectionDivider />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Camera size={13} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.inspectionTeam")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-2">
                <IconField
                  label={t("cases:labels.photographyExpert")}
                  value={info.photographyExpert}
                  Icon={Camera}
                />
                <IconField
                  label={t("cases:labels.fingerprintExpert")}
                  value={info.fingerprintExpert}
                  Icon={Fingerprint}
                />
                <div className="md:col-span-2 xl:col-span-2">
                  <Field label={t("cases:labels.note")} value={info.note} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: Corpses Specifications ===== */}
        <section className="mb-5 overflow-hidden rounded-xl border border-[#dbe5ec] bg-white">
          <SectionHeader
            title={`${t("cases:review.corpseSpecsCount")} — ${corpses.length} ${t("cases:steps.records")}`}
            Icon={Stethoscope}
          />

          <div className="px-5 py-5 space-y-4 sm:space-y-5">
            {corpses.map((corpse, index) => (
              <CorpseCard
                key={`corpse-review-${index}`}
                corpse={corpse}
                cardIndex={index}
                isExpanded={expanded[index] ?? index === corpses.length - 1}
                onToggleExpand={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [index]: !(prev[index] ?? true),
                  }))
                }
                translateWeight={translateWeight}
              />
            ))}
          </div>
        </section>

        {/* ===== Footer Buttons ===== */}
        <div className="flex items-center justify-between border-t border-[#dbe5ec] pt-5">
          <button
            type="button"
            onClick={() => navigate("/user/corpses/specifications")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9]"
          >
            <ArrowLeft size={16} />
            {t("cases:review.previous")}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#005588] px-6 text-sm font-semibold text-white transition hover:bg-[#00466f] disabled:bg-gray-400"
          >
            <Send size={16} />
            {submitting ? t("cases:review.submitting") : t("cases:review.submitCorpsesCase")}
          </button>
        </div>
      </div>
    </div>
  );
}
