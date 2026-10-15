import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Hash,
  Building2,
  MapPin,
  Camera,
  Fingerprint,
  Send,
  FileText,
  User,
  Scale,
  ChevronDown,
  CheckCircle2,
  Upload,
  Video,
  Music,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { ZodFormattedError } from "zod";
import { useCase } from "@/context/CaseContext";
import type { CivilCaseInfo as CivilCaseInfoType } from "@/context/CaseContext";
import { civilCaseInfoSchema } from "@/schemas/caseSchema";
import { submitCivilCase } from "@/api/cases";
import { api } from "@/api/client";
import { GOVERNORATES_BILINGUAL } from "@/constants/governorates";

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

type CivilCaseErrors = ZodFormattedError<CivilCaseInfoType>;
type CivilCaseKey = keyof CivilCaseInfoType;

function errFor(errors: CivilCaseErrors | null, key: CivilCaseKey): string | null {
  if (!errors) return null;
  const node = errors[key];
  if (!node) return null;
  const errs = (node as { _errors?: string[] })._errors;
  return Array.isArray(errs) ? errs[0] ?? null : null;
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-[10px] sm:text-[11px] font-medium text-[#dc2626]">{msg}</p>;
}

const inputCls = (hasError: boolean) =>
  `h-10 sm:h-11 w-full rounded-lg border ${hasError ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"} bg-white pl-9 sm:pl-10 pr-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`;

const selectCls = (hasError: boolean) =>
  `h-10 sm:h-11 w-full appearance-none rounded-lg border ${hasError ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"} bg-white pl-9 sm:pl-10 pr-10 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`;

const textareaCls = (hasError: boolean) =>
  `w-full min-h-[110px] sm:min-h-[130px] resize-y rounded-lg border ${hasError ? "border-[#fecaca] ring-1 ring-[#fecaca]" : "border-[#dbe5ec]"} bg-white pl-9 sm:pl-10 pr-3 py-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20`;

const labelCls = "mb-1.5 sm:mb-2 block text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#0875a8]";
const iconWrap = "pointer-events-none absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#64748b]";
const textareaIconWrap = "pointer-events-none absolute left-2.5 sm:left-3 top-3 text-[#64748b]";
const selectChevronWrap = "pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#64748b]";

const FINGERPRINT_TYPES = ["Digital", "Fingerprint (Document)"];
const FINGERPRINT_HOLDERS = ["Appellant", "Deceased", "Other"];
const COMPARISON_DOC_TYPES = ["Official", "Customary"];

export default function CivilCaseInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation(["cases", "common"]);
  const { caseData, updateCivilCaseInfo, setCaseType, resetCase } = useCase();
  const data = caseData.civilCaseInfo;

  const [fieldErrors, setFieldErrors] = useState<CivilCaseErrors | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const civilImagesFileInputRef = useRef<HTMLInputElement>(null);
  const [civilImagePreviewUrls, setCivilImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => { setCaseType("civil"); }, [setCaseType]);

  useEffect(() => {
    const urls: string[] = [];
    for (const img of data.caseFiles || data.images) urls.push(URL.createObjectURL(img));
    setCivilImagePreviewUrls(urls);
    return () => { for (const u of urls) URL.revokeObjectURL(u); };
  }, [data.caseFiles, data.images]);

  // ✅ بيقبل صور + فيديو + صوت + مستندات
  function handleCivilImagesChange(e: ChangeEvent<HTMLInputElement>): void {
    const files = e.target.files;
    if (files && files.length > 0) {
      const arr: File[] = [...data.images];
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
      updateCivilCaseInfo({ images: arr });
    }
    if (civilImagesFileInputRef.current) civilImagesFileInputRef.current.value = "";
  }

  function removeCivilImage(imageIndex: number): void {
    const updated = data.images.filter((_, j) => j !== imageIndex);
    updateCivilCaseInfo({ images: updated });
  }

  function hasErr(key: CivilCaseKey): boolean {
    return !!errFor(fieldErrors, key);
  }

  function validateAndSubmit(): void {
    const res = civilCaseInfoSchema.safeParse(data);
    if (!res.success) {
      const formatted = res.error.format() as CivilCaseErrors;
      setFieldErrors(formatted);
      const keys = Object.keys(formatted).filter((k) => k !== "_errors") as CivilCaseKey[];
      const firstKey = keys.find((k) => (formatted[k] as { _errors?: string[] })?._errors?.length);
      if (firstKey) {
        const firstMsg = (formatted[firstKey] as { _errors: string[] })._errors[0] ?? t("cases:validation.checkHighlighted");
        toast.error(firstMsg);
      } else {
        toast.error(t("cases:validation.fixErrorsBefore"));
      }
      return;
    }
    setFieldErrors(null);
    handleSubmit();
  }

  async function handleSubmit() {
    // Navigate to review page instead of direct submission
    navigate("/user/civil/review");
  }

  function handleCancel() {
    resetCase();
    navigate("/user/dashboard");
  }

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />
      <div className="mx-auto w-full max-w-5xl pb-6 px-3 sm:px-4 md:px-6 lg:pb-10">
        <div className="mb-5 sm:mb-7 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#e5f5fc] text-[#005588]">
                <Scale size={16} className="sm:hidden" />
                <Scale size={18} className="hidden sm:block" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#0f2942]">
                {t("cases:civil.generalInformation")}
              </h1>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
              {t("cases:steps.civil.subtitle")}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold text-[#64748b]">{t("cases:steps.civil.singleStep")}</p>
            <div className="mt-2 flex gap-1.5">
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dbe5ec] bg-white p-4 sm:p-6 md:p-8 shadow-sm">
          {/* ===== Section 1 ===== */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-[#e5edf2] pb-3 sm:pb-4">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-[#e5f5fc] text-[#005588]">
                <FileText size={14} className="sm:hidden" /><FileText size={16} className="hidden sm:block" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#12385a]">
                {t("cases:civil.generalInformation")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
              <div>
                <label className={labelCls}>{t("cases:civil.caseNumber")} <span className="text-[#dc2626]">*</span></label>
                <div className="relative">
                  <div className={iconWrap}><Hash size={16} className="sm:hidden" /><Hash size={18} className="hidden sm:block" /></div>
                  <input type="text" value={data.caseNumber} onChange={(e) => updateCivilCaseInfo({ caseNumber: e.target.value })} placeholder={t("cases:selects.civilCaseCodeExample")} className={inputCls(hasErr("caseNumber"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "caseNumber")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:labels.caseYear")}  <span className="text-[#dc2626]">*</span></label>
                <div className="relative">
                  <div className={iconWrap}><Hash size={16} className="sm:hidden" /><Hash size={18} className="hidden sm:block" /></div>
                  <input type="number" min="1900" max="2100" value={data.caseYear} onChange={(e) => updateCivilCaseInfo({ caseYear: e.target.value })} placeholder={t("cases:selects.caseYear")} className={inputCls(hasErr("caseYear"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "caseYear")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.dateOfReceipt")} </label>
                <div className="relative">
                  <div className={iconWrap}><CalendarDays size={16} className="sm:hidden" /><CalendarDays size={18} className="hidden sm:block" /></div>
                  <input type="date" value={data.dateOfReceipt} onChange={(e) => updateCivilCaseInfo({ dateOfReceipt: e.target.value })} className={inputCls(hasErr("dateOfReceipt"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "dateOfReceipt")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.receiptAuthority")}</label>
                <div className="relative">
                  <div className={iconWrap}><Building2 size={16} className="sm:hidden" /><Building2 size={18} className="hidden sm:block" /></div>
                  <input type="text" value={data.receiptAuthority} onChange={(e) => updateCivilCaseInfo({ receiptAuthority: e.target.value })} placeholder={t("cases:selects.receiptAuthorityPlaceholder")} className={inputCls(hasErr("receiptAuthority"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "receiptAuthority")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.dateOfTransfer")} </label>
                <div className="relative">
                  <div className={iconWrap}><CalendarDays size={16} className="sm:hidden" /><CalendarDays size={18} className="hidden sm:block" /></div>
                  <input type="date" value={data.dateOfTransfer} onChange={(e) => updateCivilCaseInfo({ dateOfTransfer: e.target.value })} className={inputCls(hasErr("dateOfTransfer"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "dateOfTransfer")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.transferredAuthority")} </label>
                <div className="relative">
                  <div className={iconWrap}><Building2 size={16} className="sm:hidden" /><Building2 size={18} className="hidden sm:block" /></div>
                  <input type="text" value={data.transferredAuthority} onChange={(e) => updateCivilCaseInfo({ transferredAuthority: e.target.value })} placeholder={t("cases:selects.transferredAuthorityPlaceholder")} className={inputCls(hasErr("transferredAuthority"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "transferredAuthority")} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>{t("cases:labels.governorate")} </label>
                <div className="relative">
                  <div className={iconWrap}><MapPin size={16} className="sm:hidden" /><MapPin size={18} className="hidden sm:block" /></div>
                  <select value={data.governorate} onChange={(e) => updateCivilCaseInfo({ governorate: e.target.value })} className={selectCls(hasErr("governorate"))}>
                    <option value="">{t("cases:selects.selectGovernorate")}</option>
                    {Object.keys(GOVERNORATES_BILINGUAL).map((g) => (<option key={g} value={g}>{g}</option>))}
                  </select>
                  <div className={selectChevronWrap}><ChevronDown size={16} className="sm:hidden" /><ChevronDown size={18} className="hidden sm:block" /></div>
                </div>
                <FieldError msg={errFor(fieldErrors, "governorate")} />
              </div>
            </div>
          </div>

          {/* ===== Section 2 ===== */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-[#e5edf2] pb-3 sm:pb-4">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-[#e5f5fc] text-[#005588]">
                <Fingerprint size={14} className="sm:hidden" /><Fingerprint size={16} className="hidden sm:block" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#12385a]">
                {t("cases:civil.fingerprintInformation")}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
              <div>
                <label className={labelCls}>{t("cases:civil.fingerprintType")}</label>
                <div className="relative">
                  <div className={iconWrap}><Fingerprint size={16} className="sm:hidden" /><Fingerprint size={18} className="hidden sm:block" /></div>
                  <select value={data.fingerprintType} onChange={(e) => updateCivilCaseInfo({ fingerprintType: e.target.value })} className={selectCls(hasErr("fingerprintType"))}>
                    <option value="">{t("cases:civil.selectFingerprintType")}</option>
                    {FINGERPRINT_TYPES.map((ft) => (<option key={ft} value={ft}>{ft === "Digital" ? t("cases:civil.digitalFingerprint") : t("cases:civil.documentFingerprint")}</option>))}
                  </select>
                  <div className={selectChevronWrap}><ChevronDown size={16} className="sm:hidden" /><ChevronDown size={18} className="hidden sm:block" /></div>
                </div>
                <FieldError msg={errFor(fieldErrors, "fingerprintType")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.fingerprintHolder")}</label>
                <div className="relative">
                  <div className={iconWrap}><User size={16} className="sm:hidden" /><User size={18} className="hidden sm:block" /></div>
                  <select value={data.fingerprintHolder} onChange={(e) => updateCivilCaseInfo({ fingerprintHolder: e.target.value })} className={selectCls(hasErr("fingerprintHolder"))}>
                    <option value="">{t("cases:civil.selectFingerprintHolder")}</option>
                    {FINGERPRINT_HOLDERS.map((h) => (<option key={h} value={h}>{h === "Appellant" ? t("cases:civil.appellant") : h === "Deceased" ? t("cases:civil.deceased") : t("cases:civil.other")}</option>))}
                  </select>
                  <div className={selectChevronWrap}><ChevronDown size={16} className="sm:hidden" /><ChevronDown size={18} className="hidden sm:block" /></div>
                </div>
                <FieldError msg={errFor(fieldErrors, "fingerprintHolder")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.comparisonDocument")}</label>
                <div className="relative">
                  <div className={iconWrap}><FileText size={16} className="sm:hidden" /><FileText size={18} className="hidden sm:block" /></div>
                  <input type="text" value={data.comparisonDocument} onChange={(e) => updateCivilCaseInfo({ comparisonDocument: e.target.value })} placeholder={t("cases:selects.comparisonDocumentPlaceholder")} className={inputCls(hasErr("comparisonDocument"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "comparisonDocument")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.typeOfComparisonDocument")}</label>
                <div className="relative">
                  <div className={iconWrap}><FileText size={16} className="sm:hidden" /><FileText size={18} className="hidden sm:block" /></div>
                  <select value={data.typeOfComparisonDocument} onChange={(e) => updateCivilCaseInfo({ typeOfComparisonDocument: e.target.value })} className={selectCls(hasErr("typeOfComparisonDocument"))}>
                    <option value="">{t("cases:civil.selectDocumentType")}</option>
                    {COMPARISON_DOC_TYPES.map((dt) => (<option key={dt} value={dt}>{dt === "Official" ? t("cases:civil.official") : t("cases:civil.customary")}</option>))}
                  </select>
                  <div className={selectChevronWrap}><ChevronDown size={16} className="sm:hidden" /><ChevronDown size={18} className="hidden sm:block" /></div>
                </div>
                <FieldError msg={errFor(fieldErrors, "typeOfComparisonDocument")} />
              </div>
            </div>
          </div>

          {/* ===== Section 3 ===== */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-[#e5edf2] pb-3 sm:pb-4">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-[#e5f5fc] text-[#005588]">
                <User size={14} className="sm:hidden" /><User size={16} className="hidden sm:block" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#12385a]">
                {t("cases:civil.inspectionTeamAndNotes")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
              <div>
                <label className={labelCls}>{t("cases:civil.expert")} </label>
                <div className="relative">
                  <div className={iconWrap}><Fingerprint size={16} className="sm:hidden" /><Fingerprint size={18} className="hidden sm:block" /></div>
                  <input type="text" value={data.expert} onChange={(e) => updateCivilCaseInfo({ expert: e.target.value })} placeholder={t("cases:selects.expertFullName")} className={inputCls(hasErr("expert"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "expert")} />
              </div>
              <div>
                <label className={labelCls}>{t("cases:civil.photographer")}</label>
                <div className="relative">
                  <div className={iconWrap}><Camera size={16} className="sm:hidden" /><Camera size={18} className="hidden sm:block" /></div>
                  <input type="text" value={data.photographer} onChange={(e) => updateCivilCaseInfo({ photographer: e.target.value })} placeholder={t("cases:selects.expertFullName")} className={inputCls(hasErr("photographer"))} />
                </div>
                <FieldError msg={errFor(fieldErrors, "photographer")} />
              </div>

              {/* Case Files */}
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <label className="mb-0 block text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                    {t("cases:civil.caseFiles")}
                  </label>
                  <button type="button" onClick={() => civilImagesFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe5ec] bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold text-[#0875a8] hover:bg-[#f8fafc] transition">
                    <Upload size={13} className="sm:hidden" /><Upload size={14} className="hidden sm:block" />
                    <span>{t("cases:civil.uploadFiles")}</span>
                  </button>
                  <input ref={civilImagesFileInputRef} type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    multiple onChange={handleCivilImagesChange} className="hidden" />
                </div>

                <div className="flex min-h-[100px] sm:min-h-[110px] flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-[#dbe5ec] bg-[#f8fafc] p-2.5 sm:p-3">
                  {civilImagePreviewUrls.length === 0 ? (
                    <div className="flex h-20 w-28 sm:h-24 sm:w-32 flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white text-[#94a3b8]">
                      <FileText size={15} className="sm:hidden" /><FileText size={17} className="hidden sm:block" />
                      <span className="mt-1 text-[8px] sm:text-[9px]">{t("cases:civil.noFiles")}</span>
                    </div>
                  ) : (
                    civilImagePreviewUrls.map((url, idx) => {
                      const file = data.images[idx];
                      const kind = file ? mediaKind(file) : "image";
                      return (
                        <div key={idx} className="relative group">
                          {kind === "image" ? (
                            <img src={url} alt={`${t("cases:civil.caseFileAlt")} ${idx + 1}`}
                              className="h-20 w-28 sm:h-24 sm:w-32 rounded-lg object-cover border border-[#dbe5ec]" />
                          ) : (
                            <div className="flex h-20 w-28 sm:h-24 sm:w-32 flex-col items-center justify-center gap-1 rounded-lg border border-[#dbe5ec] bg-white px-1 text-center">
                              {kind === "video" ? (
                                <Video size={20} className="sm:w-[22px] sm:h-[22px] text-[#7c3aed]" />
                              ) : kind === "audio" ? (
                                <Music size={20} className="sm:w-[22px] sm:h-[22px] text-[#0891b2]" />
                              ) : (
                                <FileText size={20} className="sm:w-[22px] sm:h-[22px] text-[#0875a8]" />
                              )}
                              <span className="w-full truncate text-[8px] sm:text-[9px] font-medium text-[#475569]" title={file?.name}>
                                {file?.name}
                              </span>
                              <span className="text-[8px] sm:text-[9px] text-[#94a3b8]">
                                {file ? formatSize(file.size) : ""}
                              </span>
                            </div>
                          )}
                          <button type="button" onClick={() => removeCivilImage(idx)}
                            className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-sm opacity-90 hover:opacity-100"
                            aria-label={`${t("cases:civil.removeFile")} ${idx + 1}`}>
                            <X size={10} className="sm:hidden" /><X size={11} className="hidden sm:block" />
                          </button>
                        </div>
                      );
                    })
                  )}
                  {civilImagePreviewUrls.length > 0 && (
                    <div className="text-[10px] sm:text-[11px] text-[#64748b] ml-1">
                      {civilImagePreviewUrls.length === 1 ? t("cases:civil.filesAttached") : `${civilImagePreviewUrls.length} ${t("cases:civil.filePlural")} attached`}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>{t("cases:civil.notes")}</label>
                <div className="relative">
                  <div className={textareaIconWrap}><FileText size={16} className="sm:hidden" /><FileText size={18} className="hidden sm:block" /></div>
                  <textarea value={data.notes} onChange={(e) => updateCivilCaseInfo({ notes: e.target.value })}
                    placeholder={t("cases:civil.enterNotes")} className={textareaCls(hasErr("notes"))} rows={5} />
                </div>
                <FieldError msg={errFor(fieldErrors, "notes")} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3 sm:gap-4">
          <button type="button" onClick={handleCancel}
            className="h-10 sm:h-12 px-6 sm:px-8 rounded-2xl border border-[#dbe5ec] bg-white text-xs sm:text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] hover:border-[#c5d4e0] transition">
            Cancel
          </button>
          <button type="button" onClick={validateAndSubmit} disabled={submitting}
            className="inline-flex h-10 sm:h-12 items-center gap-2 sm:gap-2.5 rounded-2xl bg-[#005588] px-6 sm:px-8 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#00466f] shadow-sm shadow-[#005588]/20 disabled:bg-gray-400">
            <Send size={16} className="sm:hidden" /><Send size={18} className="hidden sm:block" />
            {submitting ? t("cases:actions.submitting") : t("cases:actions.nextStep")}
          </button>
        </div>
      </div>
    </div>
  );
}