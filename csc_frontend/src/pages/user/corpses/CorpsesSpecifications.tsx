import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  Ruler,
  Scale,
  Eye,
  Hand,
  Droplets,
  StickyNote,
  Upload,
  Camera,
  Video,
  Music,
  X,
  Plus,
  ChevronDown,
  Stethoscope,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { z } from "zod";
import { useCase } from "@/context/CaseContext";
import type { CorpsesSpecifications as CorpsesSpecsType } from "@/context/CaseContext";
import type { ZodFormattedError } from "zod";

// ================= ✅ نوع الوسيط =================

type MediaKind = "image" | "video" | "audio" | "document";

function mediaKind(f: File): MediaKind {
  if (f.type.startsWith("image/")) return "image";
  if (f.type.startsWith("video/")) return "video";
  if (f.type.startsWith("audio/")) return "audio";
  return "document";
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

const corpsesSpecsSchema = z.object({
  gender: z.string().optional(),
  approximateAge: z.string().optional(),
  approximateHeight: z.string().optional(),
  weight: z.string().optional(),
  discoveryCircumstances: z.string().optional(),
  distinguishingMarks: z.string().optional(),
  underwear: z.string().optional(),
  outerwear: z.string().optional(),
  facialFeatures: z.enum(["clear", "unclear", ""]).optional(),
  facialFeaturesReason: z.string().optional(),
  handFingerprints: z.enum(["yes", "no", ""]).optional(),
  handFingerprintsReason: z.string().optional(),
  biologicalSample: z.array(z.enum(["blood", "tissue", "bones", "none"])).optional(),
  images: z.array(z.any()).optional(),
  notes: z.string().optional(),
});

type CorpsesSpecsErrors = ZodFormattedError<CorpsesSpecsType>;
type CorpsesSpecsKey = keyof CorpsesSpecsType;

type PerIndexErrors = Record<number, CorpsesSpecsErrors | null>;

function errFor(
  errors: CorpsesSpecsErrors | null,
  key: CorpsesSpecsKey
): string | null {
  if (!errors) return null;
  const node = errors[key];
  if (!node) return null;
  const errs = (node as { _errors?: string[] })._errors;
  return Array.isArray(errs) ? errs[0] ?? null : null;
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-[10px] sm:text-[11px] font-medium text-[#dc2626]">
      {msg}
    </p>
  );
}

const inputCls = (hasError: boolean) =>
  `h-10 sm:h-11 w-full rounded-lg border ${
    hasError ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"
  } bg-white pl-9 sm:pl-10 pr-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`;

const selectCls = (hasError: boolean) =>
  `h-10 sm:h-11 w-full rounded-lg border appearance-none bg-no-repeat bg-right ${
    hasError ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"
  } bg-white pl-9 sm:pl-10 pr-9 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`;

const textareaCls = (hasError: boolean) =>
  `w-full min-h-[90px] sm:min-h-[100px] resize-y rounded-lg border ${
    hasError ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"
  } bg-white px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`;

const labelCls =
  "mb-1.5 sm:mb-2 block text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#0875a8]";

const iconWrap =
  "pointer-events-none absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#64748b]";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl sm:rounded-xl border border-[#dbe5ec] bg-[#f8fafc] p-4 sm:p-5">
      {children}
    </div>
  );
}

function RadioOption({
  value,
  checked,
  onChange,
  label,
  labelAr,
}: {
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  labelAr?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer mr-6 last:mr-0 mb-2 sm:mb-0">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        value={value}
        className="h-4 w-4 rounded-full border-[#cbd5e1] text-[#005588] focus:ring-[#005588]"
      />
      <span className="text-xs sm:text-sm text-[#475569]">
        {label}
        {labelAr && (
          <span className="text-[#64748b] ml-1">({labelAr})</span>
        )}
      </span>
    </label>
  );
}

function CheckboxOption({
  value,
  checked,
  onChange,
  label,
  labelAr,
}: {
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  labelAr?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer mr-6 last:mr-0 mb-2 sm:mb-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        value={value}
        className="h-4 w-4 rounded border-[#cbd5e1] text-[#005588] focus:ring-[#005588]"
      />
      <span className="text-xs sm:text-sm text-[#475569]">
        {label}
        {labelAr && (
          <span className="text-[#64748b] ml-1">({labelAr})</span>
        )}
      </span>
    </label>
  );
}

const ageRanges = [
  "0-10",
  "11-20",
  "21-30",
  "31-40",
  "41-50",
  "51-60",
  "61-70",
  "71-80",
  "81-90",
  "91-100",
  "100+",
];

const weightRanges = [
  "Slim",
  "Average",
  "Overweight",
];

type CorpseCardProps = {
  corpse: CorpsesSpecsType;
  cardIndex: number;
  isExpanded: boolean;
  errors: CorpsesSpecsErrors | null;
  onToggleExpand: () => void;
  onUpdateField: <K extends CorpsesSpecsKey>(
    field: K,
    value: CorpsesSpecsType[K]
  ) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imageIndex: number) => void;
  onRemove?: () => void;
  showRemove?: boolean;
};

function CorpseCard({
  corpse,
  cardIndex,
  isExpanded,
  errors,
  onToggleExpand,
  onUpdateField,
  onAddImages,
  onRemoveImage,
  onRemove,
  showRemove,
}: CorpseCardProps) {
  const { t } = useTranslation(["cases", "common"]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function hasErr(key: CorpsesSpecsKey): boolean {
    return !!errFor(errors, key);
  }

  // ✅ بيقبل صور + فيديو + صوت + مستندات مع حماية الحجم
  function handleImagesChange(e: ChangeEvent<HTMLInputElement>): void {
    const files = e.target.files;
    if (files && files.length > 0) {
      const arr: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const kind = mediaKind(f);
        const limit = kind === "image" ? 25 * 1024 * 1024 : 150 * 1024 * 1024;
        if (f.size > limit) {
          toast.error(`"${f.name}" كبير جدًا — الحد الأقصى ${kind === "image" ? 25 : 150}MB.`);
          continue;
        }
        arr.push(f);
      }
      if (arr.length > 0) {
        onAddImages(arr);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleBiologicalSample(value: "blood" | "tissue" | "bones" | "none") {
    const current = corpse.biologicalSample;
    const isPresent = current.includes(value);
    let next: string[];
    if (value === "none") {
      next = isPresent ? [] : ["none"];
    } else {
      const filtered = current.filter((v) => v !== "none");
      if (isPresent) {
        next = filtered.filter((v) => v !== value);
      } else {
        next = [...filtered, value];
      }
    }
    onUpdateField("biologicalSample", next);
  }

  const displayGender = corpse.gender === "male" ? t("cases:display.maleArabic")
    : corpse.gender === "female" ? t("cases:display.femaleArabic") 
    : corpse.gender === "none" ? t("cases:display.noneArabic")
    : corpse.gender || t("cases:display.notSet");

  const displayAge = corpse.approximateAge ? `${corpse.approximateAge} ${t("cases:display.years")}` : t("cases:display.noAge");

  return (
    <div className="rounded-2xl sm:rounded-xl border border-[#dbe5ec] bg-white p-4 sm:p-5">
      <div
        className="mb-5 flex items-center justify-between border-b border-[#edf2f5] pb-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe5ec] bg-[#e5f5fc] text-[#005588]">
            <Stethoscope size={17} />
          </div>
          <div>
            <p className="text-sm sm:text-base font-semibold text-[#12385a]">
              {t("cases:display.corpseNumber")} #{cardIndex + 1} • {displayGender}
            </p>
            <p className="mt-0.5 text-[10px] text-[#64748b]">
              {displayAge}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#fee2e2] text-[#dc2626] hover:bg-[#fef2f2] transition"
              aria-label={t("cases:person.removeCorpse")}
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={17}
            className={`text-[#64748b] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
            <Card>
              <label className={labelCls}>
              {t("cases:labels.gender")} 
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <User size={16} className="sm:hidden" />
                  <User size={18} className="hidden sm:block" />
                </div>
                <select
                  value={corpse.gender}
                  onChange={(e) => onUpdateField("gender", e.target.value)}
                  className={selectCls(hasErr("gender"))}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundSize: "18px", backgroundPosition: "right 10px center" }}
                >
                  <option value="">{t("cases:genderOptions.selectGender")}</option>
                  <option value="male">{t("cases:genderOptions.male")}</option>
                  <option value="female">{t("cases:genderOptions.female")}</option>
                  <option value="none">{t("cases:genderOptions.none")}</option>
                </select>
              </div>
              <FieldError msg={errFor(errors, "gender")} />
            </Card>

            <Card>
              <label className={labelCls}>
                {t("cases:labels.approximateAge")} 
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <User size={16} className="sm:hidden" />
                  <User size={18} className="hidden sm:block" />
                </div>
                <select
                  value={corpse.approximateAge}
                  onChange={(e) => onUpdateField("approximateAge", e.target.value)}
                  className={selectCls(hasErr("approximateAge"))}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundSize: "18px", backgroundPosition: "right 10px center" }}
                >
                  <option value="">{t("cases:selects.selectRange")}</option>
                  {ageRanges.map((r) => (
                    <option key={r} value={r}>{t(`cases:ageRanges.${r}`)}</option>
                  ))}
                </select>
              </div>
              <FieldError msg={errFor(errors, "approximateAge")} />
            </Card>

            <Card>
              <label className={labelCls}>
                {t("cases:labels.approximateHeight")}
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <Ruler size={16} className="sm:hidden" />
                  <Ruler size={18} className="hidden sm:block" />
                </div>
                <input
                  type="number"
                  value={corpse.approximateHeight}
                  onChange={(e) => onUpdateField("approximateHeight", e.target.value)}
                  placeholder={t("cases:selects.approximateHeightCm")}
                  className={inputCls(hasErr("approximateHeight"))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-[#64748b]">
                  cm
                </span>
              </div>
              <FieldError msg={errFor(errors, "approximateHeight")} />
            </Card>

            <Card>
              <label className={labelCls}>
                {t("cases:labels.weight")}
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <Scale size={16} className="sm:hidden" />
                  <Scale size={18} className="hidden sm:block" />
                </div>
                <select
                  value={corpse.weight}
                  onChange={(e) => onUpdateField("weight", e.target.value)}
                  className={selectCls(hasErr("weight"))}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundSize: "18px", backgroundPosition: "right 10px center" }}
                >
                  <option value="">{t("cases:selects.selectWeight")}</option>
                  {weightRanges.map((r) => (
                    <option key={r} value={r}>{t(`cases:weightRanges.${r.toLowerCase().trim()}`)}</option>
                  ))}
                </select>
              </div>
              <FieldError msg={errFor(errors, "weight")} />
            </Card>
          </div>

          <Card>
            <label className={labelCls}>
              {t("cases:labels.discoveryCircumstances")} 
            </label>
            <textarea
              value={corpse.discoveryCircumstances}
              onChange={(e) => onUpdateField("discoveryCircumstances", e.target.value)}
              placeholder={t("cases:selects.describeCircumstances")}
              className={textareaCls(hasErr("discoveryCircumstances"))}
              rows={2}
            />
            <FieldError msg={errFor(errors, "discoveryCircumstances")} />
          </Card>

          <Card>
            <label className={labelCls}>
              {t("cases:labels.distinguishingMarks")}
            </label>
            <textarea
              value={corpse.distinguishingMarks}
              onChange={(e) => onUpdateField("distinguishingMarks", e.target.value)}
              placeholder={t("cases:selects.describeTattoosScars")}
              className={textareaCls(hasErr("distinguishingMarks"))}
              rows={2}
            />
            <FieldError msg={errFor(errors, "distinguishingMarks")} />
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
            <Card>
              <label className={labelCls}>
                {t("cases:labels.underwear")}
              </label>
              <textarea
                value={corpse.underwear}
                onChange={(e) => onUpdateField("underwear", e.target.value)}
                placeholder={t("cases:selects.describeUnderwear")}
                className={textareaCls(hasErr("underwear"))}
                rows={2}
              />
              <FieldError msg={errFor(errors, "underwear")} />
            </Card>

            <Card>
              <label className={labelCls}>
                {t("cases:labels.outerwear")}
              </label>
              <textarea
                value={corpse.outerwear}
                onChange={(e) => onUpdateField("outerwear", e.target.value)}
                placeholder={t("cases:selects.describeOuterwear")}
                className={textareaCls(hasErr("outerwear"))}
                rows={2}
              />
              <FieldError msg={errFor(errors, "outerwear")} />
            </Card>
          </div>

          <Card>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={14} className="text-[#0875a8]" />
                  <label className="!mb-0 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#0875a8]">
                    {t("cases:labels.facialFeatures")}
                  </label>
                </div>
                <div className="flex flex-wrap">
                  <RadioOption
                    value="clear"
                    checked={corpse.facialFeatures === "clear"}
                    onChange={() => onUpdateField("facialFeatures", "clear")}
                    label={t("cases:facialFeaturesOptions.clear")}
                  />
                  <RadioOption
                    value="unclear"
                    checked={corpse.facialFeatures === "unclear"}
                    onChange={() => onUpdateField("facialFeatures", "unclear")}
                    label={t("cases:facialFeaturesOptions.unclear")}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>
                  {t("cases:labels.reasonIfUnclear")}
                </label>
                <input
                  type="text"
                  value={corpse.facialFeaturesReason}
                  onChange={(e) => onUpdateField("facialFeaturesReason", e.target.value)}
                  placeholder={t("cases:selects.provideReason")}
                  className={`h-10 sm:h-11 w-full rounded-lg border ${
                    hasErr("facialFeaturesReason") ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"
                  } bg-white px-3 sm:px-4 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`}
                />
                <FieldError msg={errFor(errors, "facialFeaturesReason")} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Hand size={14} className="text-[#0875a8]" />
                  <label className="!mb-0 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#0875a8]">
                    {t("cases:labels.handFingerprints")}
                  </label>
                </div>
                <div className="flex flex-wrap">
                  <RadioOption
                    value="yes"
                    checked={corpse.handFingerprints === "yes"}
                    onChange={() => onUpdateField("handFingerprints", "yes")}
                    label={t("cases:fingerprintOptions.yes")}
                  />
                  <RadioOption
                    value="no"
                    checked={corpse.handFingerprints === "no"}
                    onChange={() => onUpdateField("handFingerprints", "no")}
                    label={t("cases:fingerprintOptions.no")}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>
                  {t("cases:labels.reasonIfNo")}
                </label>
                <input
                  type="text"
                  value={corpse.handFingerprintsReason}
                  onChange={(e) => onUpdateField("handFingerprintsReason", e.target.value)}
                  placeholder={t("cases:selects.provideReason")}
                  className={`h-10 sm:h-11 w-full rounded-lg border ${
                    hasErr("handFingerprintsReason") ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"
                  } bg-white px-3 sm:px-4 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`}
                />
                <FieldError msg={errFor(errors, "handFingerprintsReason")} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-[#0875a8]" />
              <label className="!mb-0 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.biologicalSample")}
              </label>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <CheckboxOption
                value="blood"
                checked={corpse.biologicalSample.includes("blood")}
                onChange={() => toggleBiologicalSample("blood")}
                label={t("cases:biologicalSamples.blood")}
              />
              <CheckboxOption
                value="tissue"
                checked={corpse.biologicalSample.includes("tissue")}
                onChange={() => toggleBiologicalSample("tissue")}
                label={t("cases:biologicalSamples.tissue")}
              />
              <CheckboxOption
                value="bones"
                checked={corpse.biologicalSample.includes("bones")}
                onChange={() => toggleBiologicalSample("bones")}
                label={t("cases:biologicalSamples.bones")}
              />
              <CheckboxOption
                value="none"
                checked={corpse.biologicalSample.includes("none")}
                onChange={() => toggleBiologicalSample("none")}
                label={t("cases:biologicalSamples.none")}
              />
            </div>
            <FieldError msg={errFor(errors, "biologicalSample")} />
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-[#0875a8]" />
                <label className="!mb-0 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:labels.corpseFiles")}
                </label>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#005588] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#00466f]"
              >
                <Upload size={13} />
                {t("cases:evidenceSection.uploadFiles")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />
            </div>
            <div
              className={`flex min-h-24 flex-wrap items-center gap-3 rounded-md border bg-[#f8fafc] p-2 ${
                hasErr("images") ? "border-[#fecaca]" : "border-[#dbe5ec]"
              }`}
            >
              {previewUrls.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white text-[#94a3b8] transition hover:border-[#0089c7] hover:text-[#0089c7]"
                >
                  <Camera size={20} />
                  <span className="mt-1 text-[9px]">{t("cases:selects.clickToAddFiles")}</span>
                </div>
              ) : (
                previewUrls.map((url, idx) => {
                  const file = corpse.images[idx];
                  const kind = file ? mediaKind(file) : "image";
                  return (
                    <div key={idx} className="relative">
                      {kind === "image" ? (
                        <img
                          src={url}
                          alt={`corpse-img-${idx}`}
                          className="h-20 w-28 rounded-md border border-[#cbd5e1] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-md border border-[#cbd5e1] bg-white px-1 text-center">
                          {kind === "video" ? (
                            <Video size={18} className="text-[#7c3aed]" />
                          ) : kind === "audio" ? (
                            <Music size={18} className="text-[#0891b2]" />
                          ) : (
                            <FileText size={18} className="text-[#0875a8]" />
                          )}
                          <span className="w-full truncate text-[8px] font-medium text-[#475569]" title={file?.name}>
                            {file?.name}
                          </span>
                          <span className="text-[8px] text-[#94a3b8]">
                            {file ? formatSize(file.size) : ""}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveImage(idx)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-sm transition hover:bg-[#b91c1c]"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })
              )}
              {previewUrls.length > 0 && (
                <div className="text-[10px] text-[#64748b]">
                  {previewUrls.length} {previewUrls.length > 1 ? t("cases:evidenceSection.filePlural") : t("cases:evidenceSection.fileSingular")}
                </div>
              )}
            </div>
            <FieldError msg={errFor(errors, "images")} />
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} className="text-[#0875a8]" />
              <label className="!mb-0 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.notes")}
              </label>
            </div>
            <textarea
              value={corpse.notes}
              onChange={(e) => onUpdateField("notes", e.target.value)}
              placeholder={t("cases:selects.additionalNotes")}
              className={textareaCls(hasErr("notes"))}
              rows={2}
            />
            <FieldError msg={errFor(errors, "notes")} />
          </Card>
        </div>
      )}
    </div>
  );
}

const EMPTY_CORPSE: CorpsesSpecsType = {
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

export default function CorpsesSpecifications() {
  const { t } = useTranslation(["cases", "common"]);
  const navigate = useNavigate();
  const { caseData, setCorpsesSpecifications, setCaseType } = useCase();
  const corpses = caseData.corpsesSpecifications;

  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => ({ 0: true }));
  const [perIndexErrors, setPerIndexErrors] = useState<PerIndexErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCaseType("corpses");
  }, [setCaseType]);

  function addCorpse() {
    setCorpsesSpecifications((prev) => {
      const next = [...prev, { ...EMPTY_CORPSE }];
      setExpanded((pe) => ({
        ...pe,
        [next.length - 1]: true,
      }));
      setPerIndexErrors((prevE) => {
        const copy: PerIndexErrors = {};
        const keys = Object.keys(prevE);
        for (const k of keys) {
          const i = Number(k);
          if (i < next.length - 1) copy[i] = prevE[i] ?? null;
        }
        return copy;
      });
      return next;
    });
  }

  function removeCorpse(index: number) {
    setCorpsesSpecifications((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
    setExpanded((prev) => {
      const next: Record<number, boolean> = {};
      let offset = 0;
      for (const key of Object.keys(prev)) {
        const i = Number(key);
        if (i === index) {
          offset = 1;
          continue;
        }
        next[i - offset] = prev[i];
      }
      return next;
    });
    setPerIndexErrors((prev) => {
      const next: PerIndexErrors = {};
      let offset = 0;
      for (const key of Object.keys(prev)) {
        const i = Number(key);
        if (i === index) {
          offset = 1;
          continue;
        }
        next[i - offset] = prev[i] ?? null;
      }
      return next;
    });
  }

  function updateCorpseField<K extends CorpsesSpecsKey>(
    index: number,
    field: K,
    value: CorpsesSpecsType[K]
  ) {
    setCorpsesSpecifications((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function addCorpseImages(index: number, files: File[]) {
    setCorpsesSpecifications((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, images: [...c.images, ...files] } : c
      )
    );
  }

  function removeCorpseImage(index: number, imageIndex: number) {
    setCorpsesSpecifications((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, images: c.images.filter((_, j) => j !== imageIndex) }
          : c
      )
    );
  }

  function validateAndGoNext(): void {
    const itemErrorsClone: PerIndexErrors = {};
    let firstErrorIdx: number | null = null;
    let firstErrorMsg: string | null = null;

    for (let i = 0; i < corpses.length; i++) {
      const oneRes = corpsesSpecsSchema.safeParse(corpses[i]);
      if (!oneRes.success) {
        itemErrorsClone[i] = oneRes.error.format() as CorpsesSpecsErrors;
        if (firstErrorIdx === null) {
          firstErrorIdx = i;
          const keys = Object.keys(itemErrorsClone[i]!)
            .filter((k) => k !== "_errors") as CorpsesSpecsKey[];
          for (const k of keys) {
            const node = (itemErrorsClone[i] as any)[k];
            const m = (node as { _errors?: string[] })?._errors?.[0];
            if (m) {
              firstErrorMsg = `${t("cases:display.corpseErrorPrefix")}${i + 1}: ${m}`;
              break;
            }
          }
        }
      } else {
        itemErrorsClone[i] = null;
      }
    }

    setPerIndexErrors(itemErrorsClone);

    const anyBad = Object.values(itemErrorsClone).some(Boolean);
    if (anyBad) {
      if (firstErrorIdx !== null) {
        setExpanded((prev) => ({ ...prev, [firstErrorIdx]: true }));
      }
      toast.error(firstErrorMsg ?? t("cases:validation.checkHighlighted"));
      return;
    }

    navigate("/user/corpses/review");
  }

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />
      <div className="mx-auto w-full max-w-5xl pb-6 px-3 sm:px-4 md:px-6 lg:pb-10">
        <div className="mb-5 sm:mb-7 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#e5f5fc] text-[#005588]">
                <FileText size={16} className="sm:hidden" />
                <FileText size={18} className="hidden sm:block" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#0f2942]">
                {t("cases:steps.corpses.step2Title")}
                <span className="text-base sm:text-lg md:text-xl font-normal text-[#64748b]">
                  (الخطوة الثانية: مواصفات الجثث)
                </span>
              </h1>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
              {t("cases:steps.corpses.step2Subtitle")}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold text-[#64748b]">
              {t("cases:steps.corpses.step2Of3")}
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#dbe5ec]" />
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope size={15} className="text-[#0875a8]" />
              <h2 className="text-sm font-semibold text-[#12385a]">
                {t("cases:steps.corpsesRecords")} ({corpses.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={addCorpse}
              className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-[#005588] px-4 sm:px-5 text-[11px] sm:text-xs font-semibold text-white transition hover:bg-[#00466f]"
            >
              <Plus size={13} />
              {t("cases:person.addNewCorpse")}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dbe5ec] bg-white p-4 sm:p-6 md:p-8 shadow-sm space-y-4 sm:space-y-5">
          {corpses.map((corpse, index) => (
            <CorpseCard
              key={`corpse-${index}`}
              corpse={corpse}
              cardIndex={index}
              isExpanded={expanded[index] ?? index === corpses.length - 1}
              errors={perIndexErrors[index] ?? null}
              onToggleExpand={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [index]: !(prev[index] ?? true),
                }))
              }
              onUpdateField={(field, value) =>
                updateCorpseField(index, field, value)
              }
              onAddImages={(files) => addCorpseImages(index, files)}
              onRemoveImage={(imgIdx) => removeCorpseImage(index, imgIdx)}
              onRemove={() => removeCorpse(index)}
              showRemove={corpses.length > 1}
            />
          ))}
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/user/corpses/info")}
            className="inline-flex h-10 sm:h-12 items-center gap-2 rounded-2xl border border-[#dbe5ec] bg-white px-5 sm:px-7 text-xs sm:text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc] hover:border-[#c5d4e0]"
          >
            <ArrowLeft size={16} className="sm:hidden" />
            <ArrowLeft size={18} className="hidden sm:block" />
            {t("common:actions.previous", "Previous")}
          </button>
          <button
            type="button"
            onClick={validateAndGoNext}
            className="inline-flex h-10 sm:h-12 items-center gap-2 sm:gap-2.5 rounded-2xl bg-[#005588] px-6 sm:px-8 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#00466f] shadow-sm shadow-[#005588]/20"
          >
            {t("cases:actions.nextStep")}
            <ArrowRight size={16} className="sm:hidden" />
            <ArrowRight size={18} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </div>
  );
}