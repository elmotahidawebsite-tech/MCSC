import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserRound,
  Plus,
  ChevronDown,
  Upload,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  FileText,
  Video,
  Music,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCase } from "../../../context/CaseContext";
import type { PersonData } from "../../../context/CaseContext";

type PersonType = "victim" | "suspect" | "reporter";

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

type PersonCardProps = {
  type: PersonType;
  person: PersonData;
  cardIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateField: <K extends keyof PersonData>(
    field: K,
    value: PersonData[K]
  ) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imageIndex: number) => void;
  onRemove?: () => void;
  showRemove?: boolean;
};

function PersonCard({
  type,
  person,
  isExpanded,
  onToggleExpand,
  onUpdateField,
  onAddImages,
  onRemoveImage,
  onRemove,
  showRemove,
}: PersonCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { t } = useTranslation(["cases", "common"]);

  const typeLabel =
    type === "victim"
      ? t("cases:person.victimLabel")
      : type === "suspect"
        ? t("cases:person.suspectLabel")
        : t("cases:person.cardLabel");

  const displayName = person.fullName || (type === "reporter" ? t("cases:person.unnamedReporter") : t("cases:person.unnamed"));
  const displayId = person.nationalId || "—";

  useEffect(() => {
    const urls: string[] = [];
    for (const img of person.images) {
      urls.push(URL.createObjectURL(img));
    }
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [person.images]);

  // ✅ بيقبل صور + فيديو + صوت + مستندات
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
      if (arr.length > 0) onAddImages(arr);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-[#dbe5ec] bg-white p-4">
      <div
        className="mb-5 flex items-center justify-between border-b border-[#edf2f5] pb-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe5ec] bg-[#f8fafc] text-[#64748b]">
            {type === "reporter" ? <FileText size={17} /> : <UserRound size={17} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#12385a]">{displayName}</p>
            <p className="mt-0.5 text-[10px] text-[#64748b]">
              {typeLabel} • {displayId}
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
              aria-label={`${type === "reporter" ? t("cases:person.removeReporter") : t("cases:person.removePerson")} (${typeLabel})`}
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={17}
            className={`text-[#64748b] transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.nationalId")}
              </label>
              <input
                type="text"
                value={person.nationalId}
                onChange={(e) => onUpdateField("nationalId", e.target.value)}
                placeholder={t("cases:selects.nationalId14Digit")}
                className="h-9 w-full rounded-md border border-[#dbe5ec] bg-white px-3 text-xs text-[#475569] outline-none placeholder:text-[#94a3b8] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.gender")}
              </label>
              <div className="relative">
                <select
                  value={person.gender}
                  onChange={(e) => onUpdateField("gender", e.target.value)}
                  className="h-9 w-full appearance-none rounded-md border border-[#dbe5ec] bg-white px-3 pr-8 text-xs text-[#475569] outline-none focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20"
                >
                  <option value="">{t("cases:selects.selectGender")}</option>
                  <option value="Male">{t("cases:selects.male")}</option>
                  <option value="Female">{t("cases:selects.female")}</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.fullName")}
              </label>
              <input
                type="text"
                value={person.fullName}
                onChange={(e) => onUpdateField("fullName", e.target.value)}
                placeholder={t("cases:selects.e_gName")}
                className="h-9 w-full rounded-md border border-[#dbe5ec] bg-white px-3 text-xs text-[#475569] outline-none placeholder:text-[#94a3b8] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.nationality")}
              </label>
              <input
                type="text"
                value={person.nationality}
                onChange={(e) => onUpdateField("nationality", e.target.value)}
                placeholder={t("cases:selects.e_gNationality")}
                className="h-9 w-full rounded-md border border-[#dbe5ec] bg-white px-3 text-xs text-[#475569] outline-none placeholder:text-[#94a3b8] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:labels.note")} 
              </label>
              <textarea
                rows={3}
                value={person.note}
                onChange={(e) => onUpdateField("note", e.target.value)}
                className="w-full resize-none rounded-md border border-[#dbe5ec] bg-white px-3 py-2 text-xs text-[#475569] outline-none placeholder:text-[#94a3b8] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                {t("cases:sections.addImages")}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md border border-[#dbe5ec] bg-white px-2.5 py-1 text-[13px] font-medium text-[#0875a8] hover:bg-[#f8fafc]"
              >
                <Upload size={13} />
                {t("cases:person.uploadImages")}
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

            <div className="flex min-h-24 flex-wrap items-center gap-3 rounded-md border border-[#dbe5ec] bg-[#f8fafc] p-2">
              {previewUrls.length === 0 ? (
                <div className="flex h-20 w-28 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white text-[#94a3b8]">
                  <Upload size={17} />
                  <span className="mt-1 text-[9px]">{t("cases:person.noImages")}</span>
                </div>
              ) : (
                previewUrls.map((url, idx) => {
                  const file = person.images[idx];
                  const kind = file ? mediaKind(file) : "image";
                  return (
                    <div key={idx} className="relative">
                      {kind === "image" ? (
                        <img
                          src={url}
                          alt={`${typeLabel} ${t("cases:person.imageAlt")} ${idx + 1}`}
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
                        aria-label={`${t("cases:person.removeImage")} ${idx + 1}`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })
              )}
              {previewUrls.length > 0 && (
                <div className="text-[10px] text-[#64748b]">
                  {previewUrls.length === 1
                    ? `${previewUrls.length} ${t("cases:person.attached")}`
                    : `${previewUrls.length} ${t("cases:person.attachedPlural")}`}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY_PERSON: PersonData = {
  fullName: "",
  nationalId: "",
  gender: "",
  nationality: "",
  note: "",
  images: [],
};

export default function VictimsSuspectsReporters() {
  const navigate = useNavigate();
  const { caseData, setVictims, setSuspects, setReporters } = useCase();
  const { t, i18n } = useTranslation(["cases", "common"]);
  const isRtl = i18n.resolvedLanguage === "ar";

  const [victimExpanded, setVictimExpanded] = useState<Record<number, boolean>>(
    () => ({})
  );
  const [suspectExpanded, setSuspectExpanded] = useState<
    Record<number, boolean>
  >(() => ({}));
  const [reporterExpanded, setReporterExpanded] = useState<
    Record<number, boolean>
  >(() => ({}));

  useEffect(() => {
    if (caseData.victims.length === 0) {
      setVictims([{ ...EMPTY_PERSON }]);
      setVictimExpanded((prev) => ({ ...prev, 0: true }));
    }
    if (caseData.suspects.length === 0) {
      setSuspects([{ ...EMPTY_PERSON }]);
      setSuspectExpanded((prev) => ({ ...prev, 0: true }));
    }
    if (caseData.reporters.length === 0) {
      setReporters([{ ...EMPTY_PERSON }]);
      setReporterExpanded((prev) => ({ ...prev, 0: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addVictim() {
    setVictims((prev) => {
      const next = [...prev, { ...EMPTY_PERSON }];
      setVictimExpanded((pe) => ({ ...pe, [next.length - 1]: true }));
      return next;
    });
  }

  function addSuspect() {
    setSuspects((prev) => {
      const next = [...prev, { ...EMPTY_PERSON }];
      setSuspectExpanded((pe) => ({ ...pe, [next.length - 1]: true }));
      return next;
    });
  }

  function addReporter() {
    setReporters((prev) => {
      const next = [...prev, { ...EMPTY_PERSON }];
      setReporterExpanded((pe) => ({ ...pe, [next.length - 1]: true }));
      return next;
    });
  }

  function removeVictim(index: number) {
    setVictims((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setVictimExpanded((prev) => {
      const next: Record<number, boolean> = {};
      let offset = 0;
      for (const key of Object.keys(prev)) {
        const i = Number(key);
        if (i === index) { offset = 1; continue; }
        next[i - offset] = prev[i];
      }
      return next;
    });
  }

  function removeSuspect(index: number) {
    setSuspects((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setSuspectExpanded((prev) => {
      const next: Record<number, boolean> = {};
      let offset = 0;
      for (const key of Object.keys(prev)) {
        const i = Number(key);
        if (i === index) { offset = 1; continue; }
        next[i - offset] = prev[i];
      }
      return next;
    });
  }

  function removeReporter(index: number) {
    setReporters((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setReporterExpanded((prev) => {
      const next: Record<number, boolean> = {};
      let offset = 0;
      for (const key of Object.keys(prev)) {
        const i = Number(key);
        if (i === index) { offset = 1; continue; }
        next[i - offset] = prev[i];
      }
      return next;
    });
  }

  function updateVictimField<K extends keyof PersonData>(index: number, field: K, value: PersonData[K]) {
    setVictims((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }
  function updateSuspectField<K extends keyof PersonData>(index: number, field: K, value: PersonData[K]) {
    setSuspects((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }
  function updateReporterField<K extends keyof PersonData>(index: number, field: K, value: PersonData[K]) {
    setReporters((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addVictimImages(index: number, files: File[]) {
    setVictims((prev) => prev.map((v, i) => (i === index ? { ...v, images: [...v.images, ...files] } : v)));
  }
  function addSuspectImages(index: number, files: File[]) {
    setSuspects((prev) => prev.map((s, i) => (i === index ? { ...s, images: [...s.images, ...files] } : s)));
  }
  function addReporterImages(index: number, files: File[]) {
    setReporters((prev) => prev.map((r, i) => (i === index ? { ...r, images: [...r.images, ...files] } : r)));
  }

  function removeVictimImage(index: number, imageIndex: number) {
    setVictims((prev) => prev.map((v, i) => i === index ? { ...v, images: v.images.filter((_, j) => j !== imageIndex) } : v));
  }
  function removeSuspectImage(index: number, imageIndex: number) {
    setSuspects((prev) => prev.map((s, i) => i === index ? { ...s, images: s.images.filter((_, j) => j !== imageIndex) } : s));
  }
  function removeReporterImage(index: number, imageIndex: number) {
    setReporters((prev) => prev.map((r, i) => i === index ? { ...r, images: r.images.filter((_, j) => j !== imageIndex) } : r));
  }

  return (
    <div className="min-h-full">
      <Toaster position={isRtl ? "top-left" : "top-right"} />
      <div className="mx-auto w-full max-w-6xl pb-6">
        <div className={`mb-5 flex items-start justify-between ${isRtl ? "flex-row-reverse text-right" : ""}`}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f2942]">
              {t("cases:steps.criminal.step3Title")}
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {t("cases:steps.criminal.step3Subtitle")}
            </p>
          </div>

          <div className={`hidden sm:block ${isRtl ? "text-left" : "text-right"}`}>
            <p className="text-[10px] font-semibold text-[#64748b]">
              {t("cases:steps.criminal.step3of4")}
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#dbe5ec]" />
            </div>
          </div>
        </div>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserRound size={15} className="text-[#0875a8]" />
              <h2 className="text-sm font-semibold text-[#12385a]">{t("cases:sections.victims")}</h2>
            </div>
            <button type="button" onClick={addVictim}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#005588] px-4 text-[10px] font-semibold text-white transition hover:bg-[#00466f]">
              <Plus size={12} /> {t("cases:person.addVictim")}
            </button>
          </div>
          <div className="space-y-3">
            {caseData.victims.map((victim, index) => (
              <PersonCard key={`victim-${index}`} type="victim" person={victim} cardIndex={index}
                isExpanded={victimExpanded[index] ?? index === caseData.victims.length - 1}
                onToggleExpand={() => setVictimExpanded((prev) => ({ ...prev, [index]: !(prev[index] ?? true) }))}
                onUpdateField={(field, value) => updateVictimField(index, field, value)}
                onAddImages={(files) => addVictimImages(index, files)}
                onRemoveImage={(imgIdx) => removeVictimImage(index, imgIdx)}
                onRemove={() => removeVictim(index)}
                showRemove={caseData.victims.length > 1} />
            ))}
          </div>
        </section>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-[#dc2626]" />
              <h2 className="text-sm font-semibold text-[#12385a]">{t("cases:sections.suspects")}</h2>
            </div>
            <button type="button" onClick={addSuspect}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#fee2e2] px-4 text-[10px] font-semibold text-[#dc2626] transition hover:bg-[#fecaca]">
              <Plus size={12} /> {t("cases:person.addSuspect")}
            </button>
          </div>
          <div className="space-y-3">
            {caseData.suspects.map((suspect, index) => (
              <PersonCard key={`suspect-${index}`} type="suspect" person={suspect} cardIndex={index}
                isExpanded={suspectExpanded[index] ?? index === caseData.suspects.length - 1}
                onToggleExpand={() => setSuspectExpanded((prev) => ({ ...prev, [index]: !(prev[index] ?? true) }))}
                onUpdateField={(field, value) => updateSuspectField(index, field, value)}
                onAddImages={(files) => addSuspectImages(index, files)}
                onRemoveImage={(imgIdx) => removeSuspectImage(index, imgIdx)}
                onRemove={() => removeSuspect(index)}
                showRemove={caseData.suspects.length > 1} />
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-[#dbe5ec] pt-5">
          <button type="button" onClick={() => navigate("/user/cases/evidence")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9]">
            <ArrowLeft size={16} /> {t("common:actions.previous", "Previous")}
          </button>
          <button type="button" onClick={() => navigate("/user/cases/review")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#005588] px-6 text-sm font-medium text-white transition hover:bg-[#00466f]">
            {t("common:actions.next", "Next")} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}