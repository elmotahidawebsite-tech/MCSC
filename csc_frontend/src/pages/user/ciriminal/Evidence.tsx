import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  ChevronDown,
  Upload,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  FileText,
  Video,
  Music,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCase } from "../../../context/CaseContext";
import type { EvidenceData } from "../../../context/CaseContext";
import { evidenceItemSchema, evidenceArraySchema } from "@/schemas/caseSchema";
import type { ZodFormattedError } from "zod";

type EvidenceItemShape = {
  evidenceId: string;
  evidenceType: string;
  collectedBy: string;
  description: string;
  images: File[];
};
type EvidenceItemErrors = ZodFormattedError<EvidenceItemShape>;
type EvidenceKey = keyof EvidenceItemShape;

// ================= ✅ أنواع الوسائط =================

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

type EvidenceCardProps = {
  evidence: EvidenceData;
  cardIndex: number;
  isExpanded: boolean;
  errors: EvidenceItemErrors | null;
  onToggleExpand: () => void;
  onUpdateField: <K extends keyof EvidenceData>(
    field: K,
    value: EvidenceData[K]
  ) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imageIndex: number) => void;
  onRemove?: () => void;
  showRemove?: boolean;
};

function errFor(
  errors: EvidenceItemErrors | null,
  key: EvidenceKey
): string | null {
  if (!errors) return null;
  const node = errors[key];
  if (!node) return null;
  const errs = (node as { _errors: string[] })._errors;
  return Array.isArray(errs) ? errs[0] ?? null : null;
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-[10px] font-medium text-[#dc2626]">{msg}</p>;
}

function EvidenceCard({
  evidence,
  cardIndex,
  isExpanded,
  errors,
  onToggleExpand,
  onUpdateField,
  onAddImages,
  onRemoveImage,
  onRemove,
  showRemove,
}: EvidenceCardProps) {
  const { t } = useTranslation(["cases", "common"]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const displayId = evidence.evidenceId || t("cases:evidenceSection.unassigned");
  const displayType = evidence.evidenceType || t("cases:evidenceSection.noType");

  useEffect(() => {
    const urls: string[] = [];
    for (const img of evidence.images) {
      urls.push(URL.createObjectURL(img));
    }
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [evidence.images]);

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
          toast.error(`الملف "${f.name}" كبير جدًا — الحد الأقصى ${kind === "image" ? 25 : 150}MB.`);
          continue;
        }
        arr.push(f);
      }
      if (arr.length > 0) onAddImages(arr);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const baseInput =
    "h-9 w-full rounded-md border bg-white text-xs text-[#475569] outline-none placeholder:text-[#94a3b8] focus:ring-1 transition";
  const baseSelect =
    "h-9 w-full appearance-none rounded-md border bg-white px-3 pr-8 text-xs text-[#475569] outline-none focus:ring-1 transition";
  const baseTextarea =
    "w-full resize-none rounded-md border bg-white px-3 py-2.5 text-xs text-[#475569] outline-none placeholder:text-[#94a3b8] focus:ring-1 transition";

  const inputCls = (key: EvidenceKey, extra = "") =>
    `${baseInput} ${extra} ${errFor(errors, key)
      ? "border-[#fecaca] focus:border-[#dc2626] focus:ring-[#dc2626]/20"
      : "border-[#dbe5ec] focus:border-[#0089c7] focus:ring-[#0089c7]/20"
    }`;
  const selectCls = (key: EvidenceKey) =>
    errFor(errors, key)
      ? `${baseSelect} border-[#fecaca] focus:border-[#dc2626] focus:ring-[#dc2626]/20`
      : `${baseSelect} border-[#dbe5ec] focus:border-[#0089c7] focus:ring-[#0089c7]/20`;
  const textareaCls = (key: EvidenceKey) =>
    errFor(errors, key)
      ? `${baseTextarea} border-[#fecaca] focus:border-[#dc2626] focus:ring-[#dc2626]/20`
      : `${baseTextarea} border-[#dbe5ec] focus:border-[#0089c7] focus:ring-[#0089c7]/20`;

  const labelCls =
    "mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]";

  return (
    <div className="rounded-xl border border-[#dbe5ec] bg-white p-4">
      <div
        className="mb-5 flex items-center justify-between border-b border-[#edf2f5] pb-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe5ec] bg-[#f8fafc] text-[#64748b]">
            <Fingerprint size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#12385a]">
              {t("cases:sections.evidence")} #{cardIndex + 1} • {displayType}
            </p>
            <p className="mt-0.5 text-[10px] text-[#64748b]">
              {displayId}
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
              aria-label={t("cases:person.removeEvidence")}
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={17}
            className={`text-[#64748b] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
              }`}
          />
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div>
              <label className={labelCls}>{t("common:fields.evidenceId")}</label>
              <div className="relative">
                <input
                  type="text"
                  value={evidence.evidenceId}
                  onChange={(e) => onUpdateField("evidenceId", e.target.value)}
                  placeholder={t("cases:selects.evidenceIdPlaceholder")}
                  className={inputCls("evidenceId", "pl-3 pr-10")}
                />
              </div>
              <FieldError msg={errFor(errors, "evidenceId")} />
            </div>

            <div>
              <label className={labelCls}>{t("cases:labels.evidenceType")}</label>
              <div className="relative">
                <select
                  value={evidence.evidenceType}
                  onChange={(e) => onUpdateField("evidenceType", e.target.value)}
                  className={selectCls("evidenceType")}
                >
                  <option value="">{t("cases:selects.selectOption")}</option>
                  <option value="finger">{t("cases:evidenceTypes.finger")}</option>
                  <option value="palm">{t("cases:evidenceTypes.palm")}</option>
                  <option value="undefined">{t("cases:evidenceTypes.undefined")}</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                />
              </div>
              <FieldError msg={errFor(errors, "evidenceType")} />
            </div>


            <div className="md:col-span-2">
              <label className={labelCls}>{t("cases:labels.description")}</label>
              <textarea
                rows={3}
                value={evidence.description}
                onChange={(e) => onUpdateField("description", e.target.value)}
                placeholder={t("cases:selects.evidenceDescriptionPlaceholder")}
                className={textareaCls("description")}
              />
              <FieldError msg={errFor(errors, "description")} />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:evidenceSection.addFiles")}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md border border-[#dbe5ec] bg-white px-2.5 py-1 text-[13px] font-medium text-[#0875a8] hover:bg-[#f8fafc]"
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
              className={`flex min-h-24 flex-wrap items-center gap-3 rounded-md border bg-[#f8fafc] p-2 ${errFor(errors, "images")
                ? "border-[#fecaca]"
                : "border-[#dbe5ec]"
                }`}
            >
              {previewUrls.length === 0 ? (
                <div className="flex h-20 w-28 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white text-[#94a3b8]">
                  <FileText size={17} />
                  <span className="mt-1 text-[9px]">{t("cases:evidenceSection.noFiles")}</span>
                </div>
              ) : (
                previewUrls.map((url, idx) => {
                  const file = evidence.images[idx];
                  const kind = file ? mediaKind(file) : "image";
                  return (
                    <div key={idx} className="relative">
                      {kind === "image" ? (
                        <img
                          src={url}
                          alt={`${t("cases:evidenceSection.imageAlt")} ${idx + 1}`}
                          className="h-20 w-28 rounded-md object-cover border border-[#dbe5ec]"
                        />
                      ) : (
                        <div className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-md border border-[#dbe5ec] bg-white px-1 text-center">
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
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-sm hover:opacity-100"
                        aria-label={`${t("cases:person.removeFile")} ${idx + 1}`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })
              )}
              {previewUrls.length > 0 && (
                <div className="text-[10px] text-[#64748b]">
                  {previewUrls.length} {previewUrls.length === 1 ? t("cases:evidenceSection.fileSingular") : t("cases:evidenceSection.filePlural")}
                </div>
              )}
            </div>
            <FieldError msg={errFor(errors, "images")} />
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY_EVIDENCE: EvidenceData = {
  evidenceId: "",
  evidenceType: "",
  description: "",
  images: [],
};

type PerIndexErrors = Record<number, EvidenceItemErrors | null>;
type TopLevelError = string | null;

export default function Evidence() {
  const navigate = useNavigate();
  const { t } = useTranslation(["cases", "common"]);
  const { caseData, setEvidence } = useCase();

  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => ({}));
  const [perIndexErrors, setPerIndexErrors] = useState<PerIndexErrors>({});
  const [topLevelError, setTopLevelError] = useState<TopLevelError>(null);

  useEffect(() => {
    if (caseData.evidence.length === 0) {
      setEvidence([{ ...EMPTY_EVIDENCE }]);
      setExpanded((prev) => ({ ...prev, 0: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addEvidence() {
    setEvidence((prev) => {
      const next = [...prev, { ...EMPTY_EVIDENCE }];
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

  function removeEvidence(index: number) {
    setEvidence((prev) =>
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

  function updateEvidenceField<K extends keyof EvidenceData>(
    index: number,
    field: K,
    value: EvidenceData[K]
  ) {
    setEvidence((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  }

  function addEvidenceImages(index: number, files: File[]) {
    setEvidence((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, images: [...e.images, ...files] } : e
      )
    );
  }

  function removeEvidenceImage(index: number, imageIndex: number) {
    setEvidence((prev) =>
      prev.map((e, i) =>
        i === index
          ? { ...e, images: e.images.filter((_, j) => j !== imageIndex) }
          : e
      )
    );
  }

  function validateAndGoNext(): void {
    const topRes = evidenceArraySchema.safeParse(caseData.evidence);
    if (!topRes.success) {
      const topFormatted = topRes.error.format();
      const topMsg =
        (topFormatted as { _errors?: string[] })._errors?.[0] ?? null;
      setTopLevelError(topMsg);

      const byIndex: PerIndexErrors = {};

      const all = (topFormatted as any) as Record<
        string,
        EvidenceItemErrors | undefined
      >;
      const numericKeys = Object.keys(all).filter(
        (k) => /^\d+$/.test(k)
      ) as unknown as string[];
      for (const k of numericKeys) {
        const i = Number(k);
        const itemErrors = all[k];
        if (itemErrors) byIndex[i] = itemErrors as EvidenceItemErrors;
      }

      setPerIndexErrors(byIndex);

      if (Object.keys(byIndex).length > 0) {
        const firstIdx = Math.min(
          ...Object.keys(byIndex).map((k) => Number(k))
        );
        setExpanded((prev) => ({ ...prev, [firstIdx]: true }));
        const firstErr = byIndex[firstIdx];
        let msg: string | null = null;
        if (firstErr) {
          const keys = Object.keys(firstErr)
            .filter((k) => k !== "_errors") as EvidenceKey[];

          for (const k of keys) {
            const node = firstErr[k];
            const m = (node as { _errors?: string[] })?._errors?.[0];

            if (m) {
              msg = `${t("cases:evidenceSection.errorPrefix")}${firstIdx + 1}: ${m}`;
              break;
            }
          }
        }
        toast.error(msg ?? t("cases:messages.fixEvidenceErrors"));
      } else if (topMsg) {
        toast.error(topMsg);
      } else {
        toast.error(t("cases:messages.checkEvidenceDetails"));
      }
      return;
    }

    const itemErrorsClone: PerIndexErrors = {};
    for (let i = 0; i < caseData.evidence.length; i++) {
      const oneRes = evidenceItemSchema.safeParse(caseData.evidence[i]);
      if (!oneRes.success) {
        itemErrorsClone[i] = oneRes.error.format() as EvidenceItemErrors;
      } else {
        itemErrorsClone[i] = null;
      }
    }
    setPerIndexErrors(itemErrorsClone);
    setTopLevelError(null);

    const anyBad = Object.values(itemErrorsClone).some(Boolean);
    if (anyBad) {
      const firstIdx = Math.min(
        ...Object.keys(itemErrorsClone)
          .filter((k) => itemErrorsClone[Number(k)])
          .map((k) => Number(k))
      );
      setExpanded((prev) => ({ ...prev, [firstIdx]: true }));
      const first = itemErrorsClone[firstIdx];
      let msg: string | null = null;
      if (first) {
        const keys = Object.keys(first)
          .filter((k) => k !== "_errors") as EvidenceKey[];

        for (const k of keys) {
          const m = (first[k] as { _errors?: string[] })?._errors?.[0];

          if (m) {
            msg = `${t("cases:evidenceSection.errorPrefix")}${firstIdx + 1}: ${m}`;
            break;
          }
        }
      }
      toast.error(msg ?? t("cases:messages.fixEvidenceErrors"));
      return;
    }

    setTopLevelError(null);
    navigate("/user/cases/victims-suspects-reporters");
  }

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />
      <div className="mx-auto w-full max-w-6xl pb-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f2942]">
              {t("cases:steps.criminal.step2Title")}
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {t("cases:steps.criminal.step2Subtitle")}
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold text-[#64748b]">
              {t("cases:steps.criminal.step2of4")}
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#dbe5ec]" />
              <span className="h-1 w-6 rounded-full bg-[#dbe5ec]" />
            </div>
          </div>
        </div>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint size={15} className="text-[#0875a8]" />
              <h2 className="text-sm font-semibold text-[#12385a]">
                {t("cases:sections.evidence")} {t("cases:steps.records")}
              </h2>
            </div>
            <button
              type="button"
              onClick={addEvidence}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#005588] px-4 text-[10px] font-semibold text-white transition hover:bg-[#00466f]"
            >
              <Plus size={12} />
              {t("cases:person.addNewEvidence")}
            </button>
          </div>

          {topLevelError && (
            <div className="mb-3 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] font-medium text-[#dc2626]">
              {topLevelError}
            </div>
          )}

          <div className="space-y-3 ">
            {caseData.evidence.map((item, index) => (
              <EvidenceCard
                key={`evidence-${index}`}
                evidence={item}
                cardIndex={index}
                isExpanded={expanded[index] ?? index === caseData.evidence.length - 1}
                errors={perIndexErrors[index] ?? null}
                onToggleExpand={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [index]: !(prev[index] ?? true),
                  }))
                }
                onUpdateField={(field, value) =>
                  updateEvidenceField(index, field, value)
                }
                onAddImages={(files) => addEvidenceImages(index, files)}
                onRemoveImage={(imgIdx) => removeEvidenceImage(index, imgIdx)}
                onRemove={() => removeEvidence(index)}
                showRemove={caseData.evidence.length > 1}
              />
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-[#dbe5ec] pt-5">
          <button
            type="button"
            onClick={() => navigate("/user/cases/info")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9]"
          >
            <ArrowLeft size={16} />
            {t("common:actions.previous", "Previous")}
          </button>

          <button
            type="button"
            onClick={validateAndGoNext}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#005588] px-6 text-sm font-medium text-white transition hover:bg-[#00466f]"
          >
            {t("cases:actions.nextStep")}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}