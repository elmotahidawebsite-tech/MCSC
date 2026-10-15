import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    CalendarDays,
    ChevronDown,
    FolderOpen,
    MapPin,
    ArrowRight,
    FileText,
    FileUp,
    Upload,
    Video,
    Music,
    X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCase } from "@/context/CaseContext";
import type { PersonData } from "@/context/CaseContext";
import { caseInfoSchema } from "@/schemas/caseSchema";
import type { ZodFormattedError } from "zod";
import { GOVERNORATES_BILINGUAL } from "@/constants/governorates";

const EMPTY_REPORTER: PersonData = {
    fullName: "",
    nationalId: "",
    gender: "",
    nationality: "",
    note: "",
    images: [],
};
type MediaKind = "image" | "video" | "audio" | "document";

function mediaKind(f: File): MediaKind {
    if (f.type.startsWith("image/")) return "image";
    if (f.type.startsWith("video/")) return "video";
    if (f.type.startsWith("audio/")) return "audio";
    return "document";
}

function formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

type ReporterCardProps = {
    reporter: PersonData;
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

function ReporterCard({
    reporter,
    cardIndex,
    isExpanded,
    onToggleExpand,
    onUpdateField,
    onAddImages,
    onRemoveImage,
    onRemove,
    showRemove,
}: ReporterCardProps) {
    const { t } = useTranslation(["cases", "common"]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const displayName = reporter.fullName || t("cases:person.unnamedReporter");
    const displayId = reporter.nationalId || "—";

    useEffect(() => {
        const urls: string[] = [];
        for (const img of reporter.images) {
            urls.push(URL.createObjectURL(img));
        }
        setPreviewUrls(urls);
        return () => {
            for (const u of urls) URL.revokeObjectURL(u);
        };
    }, [reporter.images]);

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
                    toast.error(t(`cases:messages.${kind === 'image' ? 'fileTooLargeImage' : 'fileTooLargeOther'}`, {
                        name: f.name,
                        defaultValue: `"${f.name}" ${kind === 'image' ? 'is too large — max 25MB.' : 'is too large — max 150MB.'}`
                    }));
                    continue;
                }
                arr.push(f);
            }
            if (arr.length > 0) onAddImages(arr);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const inputCls =
        "h-9 sm:h-10 w-full rounded-md border border-[#dbe5ec] bg-white px-2.5 sm:px-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20";
    const selectCls =
        "h-9 sm:h-10 w-full appearance-none rounded-md border border-[#dbe5ec] bg-white px-2.5 sm:px-3 pr-8 sm:pr-9 text-xs sm:text-sm text-[#475569] outline-none focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20";
    const textareaCls =
        "w-full resize-none rounded-md border border-[#dbe5ec] bg-white px-2.5 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20";
    const labelCls =
        "mb-1.5 sm:mb-2 block text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#0875a8]";

    return (
        <div className="rounded-lg sm:rounded-xl border border-[#dbe5ec] bg-white p-3 sm:p-4">
            <div
                className="mb-3 sm:mb-4 md:mb-5 flex items-center justify-between border-b border-[#edf2f5] pb-3 sm:pb-4 cursor-pointer select-none"
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#dbe5ec] bg-[#f8fafc] text-[#64748b]">
                        <FileText size={15} className="sm:hidden" />
                        <FileText size={17} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-[#12385a] truncate">
                            {t("cases:person.cardLabel")} #{cardIndex + 1} • {displayName}
                        </p>
                        <p className="mt-0.5 text-[9px] sm:text-[10px] text-[#64748b] truncate">
                            {t("cases:sections.reporter")} • {displayId}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {showRemove && onRemove && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md border border-[#fee2e2] text-[#dc2626] hover:bg-[#fef2f2] transition"
                            aria-label={t("cases:person.removeReporter")}
                        >
                            <X size={12} className="sm:hidden" />
                            <X size={13} className="hidden sm:block" />
                        </button>
                    )}
                    <ChevronDown
                        size={15}
                        className={`text-[#64748b] transition-transform duration-200 sm:hidden ${isExpanded ? "rotate-180" : ""
                            }`}
                    />
                    <ChevronDown
                        size={17}
                        className={`hidden sm:block text-[#64748b] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                            }`}
                    />
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:gap-x-5 sm:gap-y-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
                        <div>
                            <label className={labelCls}>{t("cases:labels.fullName")}</label>
                            <input
                                type="text"
                                value={reporter.fullName}
                                onChange={(e) =>
                                    onUpdateField("fullName", e.target.value)
                                }
                                placeholder={t("cases:selects.e_gName")}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.nationalId")}</label>
                            <input
                                type="text"
                                value={reporter.nationalId}
                                onChange={(e) =>
                                    onUpdateField("nationalId", e.target.value)
                                }
                                placeholder={t("cases:selects.nationalId14Digit")}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.gender")}</label>
                            <div className="relative">
                                <select
                                    value={reporter.gender}
                                    onChange={(e) =>
                                        onUpdateField("gender", e.target.value)
                                    }
                                    className={selectCls}
                                >
                                    <option value="">{t("cases:selects.selectGender")}</option>
                                    <option value="Male">{t("cases:selects.male")}</option>
                                    <option value="Female">{t("cases:selects.female")}</option>
                                </select>
                                <ChevronDown
                                    size={13}
                                    className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#64748b] sm:hidden"
                                />
                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hidden sm:block"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.nationality")}</label>
                            <input
                                type="text"
                                value={reporter.nationality}
                                onChange={(e) =>
                                    onUpdateField("nationality", e.target.value)
                                }
                                placeholder={t("cases:selects.e_gNationality")}
                                className={inputCls}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>{t("cases:labels.note")}</label>
                            <textarea
                                rows={2}
                                value={reporter.note}
                                onChange={(e) =>
                                    onUpdateField("note", e.target.value)
                                }
                                className={`${textareaCls} sm:rows-3`}
                            />
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <div className="mb-2 flex items-center justify-between">
                            <label className="mb-0 block text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                                {t("cases:sections.reportersAttachments")}
                            </label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1 rounded-md border border-[#dbe5ec] bg-white px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-medium text-[#0875a8] hover:bg-[#f8fafc]"
                            >
                                <Upload size={10} className="sm:hidden" />
                                <Upload size={11} className="hidden sm:block" />
                                <span>{t("cases:person.addAttachments")}</span>
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

                        <div className="flex min-h-20 sm:min-h-24 flex-wrap items-center gap-2 sm:gap-3 rounded-md border border-[#dbe5ec] bg-[#f8fafc] p-2 sm:p-3">
                            {previewUrls.length === 0 ? (
                                <div className="flex h-20 w-28 sm:h-24 sm:w-32 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white text-[#94a3b8]">
                                    <FileText size={15} className="sm:hidden" />
                                    <FileText size={17} className="hidden sm:block" />
                                    <span className="mt-1 text-[9px] sm:text-[10px] text-center">{t("cases:person.noAttachments")}</span>
                                </div>
                            ) : (
                                previewUrls.map((url, idx) => {
                                    const file = reporter.images[idx];
                                    const fileName = file?.name?.toLowerCase() || "";
                                    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(fileName) || (file?.type?.startsWith("image/"));
                                    return (
                                        <div key={idx} className="relative flex items-center gap-2">
                                            {isImage ? (
                                                <img
                                                    src={url}
                                                    alt={t("cases:person.imageAlt")}
                                                    className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md border border-[#dbe5ec]"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-md border border-[#dbe5ec] bg-white text-[#64748b]">
                                                    <FileUp size={15} className="sm:hidden" />
                                                    <FileUp size={17} className="hidden sm:block" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onRemoveImage(idx)}
                                                aria-label={t("cases:person.removeFile")}
                                                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-[#fee2e2] bg-white text-[#dc2626] hover:bg-[#fef2f2] transition shadow-sm"
                                            >
                                                <X size={10} className="sm:hidden" />
                                                <X size={11} className="hidden sm:block" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}

                            {previewUrls.length > 0 && (
                                <div className="w-full text-[10px] sm:text-[11px] text-[#64748b]">
                                    {previewUrls.length}{" "}
                                    {previewUrls.length > 1
                                        ? t("cases:person.attachedPlural")
                                        : t("cases:person.attached")}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

type CaseInfoShape = {
    caseId: string;
    caseYear: string;
    incidentType: string;
    inspectionDate: string;
    description: string;
    governorate: string;
    policeDepartment: string;
    investigator: string;
    locationName: string;
    address: string;
    locationGovernorate: string;
    city: string;
    district: string;
    stationUsername?: string;
};
type CaseErrors = ZodFormattedError<CaseInfoShape>;
type CaseKey = keyof CaseInfoShape;

export default function CaseInfo() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(["cases", "common"]);
    const isRtl = i18n.resolvedLanguage === "ar";

    const { caseData, updateCaseInfo, setReporters } = useCase();
    const data = caseData.caseInfo;
    const reporters = caseData.reporters;

    const [reporterExpanded, setReporterExpanded] = useState<
        Record<number, boolean>
    >({});
    const [fieldErrors, setFieldErrors] = useState<CaseErrors | null>(null);

    function updateReporterField<K extends keyof PersonData>(
        index: number,
        field: K,
        value: PersonData[K]
    ): void {
        const updated = reporters.map((r, i) =>
            i === index ? { ...r, [field]: value } : r
        );
        setReporters(updated);
    }

    function addReporterImages(index: number, files: File[]): void {
        const updated = reporters.map((r, i) =>
            i === index ? { ...r, images: [...r.images, ...files] } : r
        );
        setReporters(updated);
    }

    function removeReporterImage(index: number, imageIndex: number): void {
        const updated = reporters.map((r, i) =>
            i === index
                ? { ...r, images: r.images.filter((_, j) => j !== imageIndex) }
                : r
        );
        setReporters(updated);
    }

    const displayReporters =
        reporters.length > 0 ? reporters : [EMPTY_REPORTER];

    function errFor(key: CaseKey): string | null {
        if (!fieldErrors) return null;
        const node = fieldErrors[key];
        if (!node) return null;
        const errs = (node as { _errors: string[] })._errors;
        return Array.isArray(errs) ? errs[0] ?? null : null;
    }

    const baseInput =
        "h-10 w-full rounded-md border bg-white px-3 text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:ring-1 transition";
    const baseSelect =
        "h-10 w-full appearance-none rounded-md border bg-white px-3 pr-9 text-sm text-[#475569] outline-none focus:ring-1 transition";
    const baseTextarea =
        "w-full resize-none rounded-md border bg-white px-3 py-3 text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:ring-1 transition";

    function inputCls(key: CaseKey): string {
        return errFor(key)
            ? `${baseInput} border-[#fecaca] focus:border-[#dc2626] focus:ring-[#dc2626]/20`
            : `${baseInput} border-[#dbe5ec] focus:border-[#0089c7] focus:ring-[#0089c7]/20`;
    }
    function selectCls(key: CaseKey): string {
        return errFor(key)
            ? `${baseSelect} border-[#fecaca] focus:border-[#dc2626] focus:ring-[#dc2626]/20`
            : `${baseSelect} border-[#dbe5ec] focus:border-[#0089c7] focus:ring-[#0089c7]/20`;
    }
    function textareaCls(key: CaseKey): string {
        return errFor(key)
            ? `${baseTextarea} border-[#fecaca] focus:border-[#dc2626] focus:ring-[#dc2626]/20`
            : `${baseTextarea} border-[#dbe5ec] focus:border-[#0089c7] focus:ring-[#0089c7]/20`;
    }

    const labelCls =
        "mb-2 block text-[13px] font-bold uppercase tracking-wider text-[#0875a8]";

    function FieldError({ msg }: { msg: string | null }) {
        if (!msg) return null;
        return (
            <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] font-medium text-[#dc2626]">
                {msg}
            </p>
        );
    }

    function validateAndGoNext(): void {
        const res = caseInfoSchema.safeParse(data);
        if (!res.success) {
            const formatted = res.error.format() as CaseErrors;
            setFieldErrors(formatted);
            const keys = Object.keys(formatted)
                .filter((k) => k !== "_errors") as CaseKey[];

            const firstKey = keys.find(
                (k) =>
                    (formatted[k] as { _errors?: string[] })?._errors?.length
            );
            if (firstKey) {
                const firstMsg =
                    (formatted[firstKey] as { _errors: string[] })._errors[0] ??
                    t("cases:validation.checkHighlighted");
                toast.error(firstMsg);
            } else {
                toast.error(t("cases:validation.fixErrorsBefore"));
            }
            return;
        }
        setFieldErrors(null);
        navigate("/user/cases/evidence");
    }

    return (
        <div className={`min-h-full ${isRtl ? "text-right font-[system-ui]" : ""}`}>
            <Toaster position={isRtl ? "top-left" : "top-right"} />
            <div className="mx-auto w-full max-w-6xl pb-6 px-3 sm:px-4 md:px-6 lg:pb-10">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#0f2942]">
                        {t("cases:steps.criminal.step1Title")}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-[#64748b]">
                        {t("cases:steps.criminal.step1Subtitle")}
                    </p>
                </div>

                <section className="mb-4 sm:mb-5 overflow-hidden rounded-lg sm:rounded-xl border border-[#dbe5ec] bg-white">
                    <div className="flex items-center gap-2 border-b border-[#e5edf2] px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4">
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                            <FolderOpen size={13} className="sm:hidden" />
                            <FolderOpen size={14} className="hidden sm:block" />
                        </div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#12385a]">
                            {t("cases:sections.generalInfo")}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 px-3 py-4 sm:gap-x-6 sm:gap-y-5 sm:px-4 sm:py-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6 md:px-5 md:py-6 xl:grid-cols-3">
                        <div>
                            <label className={labelCls}>{t("cases:labels.caseId")} </label>
                            <input
                                type="text"
                                value={data.caseId}
                                onChange={(e) => updateCaseInfo({ caseId: e.target.value })}
                                className={inputCls("caseId")}
                            />
                            <FieldError msg={errFor("caseId")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.caseYear")} </label>
                            <input
                                type="number"
                                min="1900"
                                max="2100"
                                value={data.caseYear}
                                onChange={(e) => updateCaseInfo({ caseYear: e.target.value })}
                                placeholder={t("cases:selects.caseYear")}
                                className={inputCls("caseYear")}
                            />
                            <FieldError msg={errFor("caseYear")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.governorate")} </label>
                            <div className="relative">
                                <select
                                    value={data.governorate}
                                    onChange={(e) => {
                                        updateCaseInfo({
                                            governorate: e.target.value,
                                            policeDepartment: "",
                                        });
                                    }}
                                    className={selectCls("governorate")}
                                >
                                    <option value="">{t("cases:selects.selectGovernorate")}</option>

                                    {Object.keys(GOVERNORATES_BILINGUAL).map((governorate) => (
                                        <option key={governorate} value={governorate}>
                                            {governorate}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#64748b] sm:hidden"
                                />
                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hidden sm:block"
                                />
                            </div>
                            <FieldError msg={errFor("governorate")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.policeDepartment")} </label>
                            <div className="relative">
                                <select
                                    value={data.policeDepartment}
                                    onChange={(e) =>
                                        updateCaseInfo({
                                            policeDepartment: e.target.value,
                                        })
                                    }
                                    disabled={!data.governorate}
                                    className={selectCls("policeDepartment")}
                                >
                                    <option value="">
                                        {data.governorate
                                            ? t("cases:selects.selectPoliceDept")
                                            : t("cases:selects.selectGovernorateFirst")}
                                    </option>

                                    {(GOVERNORATES_BILINGUAL[data.governorate] || []).map((department) => (
                                        <option key={department} value={department}>
                                            {department}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                                />
                            </div>
                            <FieldError msg={errFor("policeDepartment")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.incidentType")} </label>
                            <div className="relative">
                                <select
                                    value={data.incidentType}
                                    onChange={(e) => updateCaseInfo({ incidentType: e.target.value })}
                                    className={selectCls("incidentType")}
                                >
                                    <option value="">{t("cases:selects.selectOption")}</option>
                                    <option value="kill">{t(`cases:incidentTypes.kill`)}</option>
                                    <option value="robbery">{t(`cases:incidentTypes.robbery`)}</option>
                                    <option value="other">{t(`cases:incidentTypes.other`)}</option>

                                </select>
                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                                />
                            </div>
                            <FieldError msg={errFor("incidentType")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.inspectionDate")} </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={data.inspectionDate}
                                    onChange={(e) => updateCaseInfo({ inspectionDate: e.target.value })}
                                    className={`${inputCls("inspectionDate")}`}
                                />
                            </div>
                            <FieldError msg={errFor("inspectionDate")} />
                        </div>

                        <div className="md:col-span-2 xl:col-span-2">
                            <label className={labelCls}>{t("cases:labels.investigator")}</label>
                            <input
                                type="text"
                                value={data.investigator}
                                onChange={(e) => updateCaseInfo({ investigator: e.target.value })}
                                placeholder={t("cases:selects.fullname")}
                                className={inputCls("investigator")}
                            />
                            <FieldError msg={errFor("investigator")} />
                        </div>

                        <div className="md:col-span-2 xl:col-span-3">
                            <label className={labelCls}>{t("cases:labels.description")}</label>
                            <textarea
                                rows={4}
                                value={data.description}
                                onChange={(e) => updateCaseInfo({ description: e.target.value })}
                                placeholder={t("cases:selects.incidentDescription")}
                                className={textareaCls("description")}
                            />
                            <FieldError msg={errFor("description")} />
                        </div>
                    </div>
                </section>

                <section className="mb-4 sm:mb-5">
                    <div className="mb-2 sm:mb-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <FileText size={14} className="text-[#0875a8] sm:hidden" />
                            <FileText size={15} className="hidden sm:block text-[#0875a8]" />
                            <h2 className="text-xs sm:text-sm font-semibold text-[#12385a]">
                                {t("cases:sections.reporter")}
                            </h2>
                        </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        {displayReporters.map((r, index) => (
                            <ReporterCard
                                key={`reporter-${index}`}
                                reporter={r}
                                cardIndex={index}
                                isExpanded={
                                    reporters.length === 0
                                        ? true
                                        : reporterExpanded[index] ?? index === reporters.length - 1
                                }
                                onToggleExpand={() =>
                                    setReporterExpanded((prev) => ({
                                        ...prev,
                                        [index]: !(prev[index] ?? true),
                                    }))
                                }
                                onUpdateField={(field, value) =>
                                    reporters.length > 0 &&
                                    updateReporterField(index, field, value)
                                }
                                onAddImages={(files) =>
                                    reporters.length > 0 &&
                                    addReporterImages(index, files)
                                }
                                onRemoveImage={(imgIdx) =>
                                    reporters.length > 0 &&
                                    removeReporterImage(index, imgIdx)
                                }
                                showRemove={reporters.length > 1}
                            />
                        ))}
                    </div>
                </section>

                <section className="mb-6 sm:mb-8 overflow-hidden rounded-lg sm:rounded-xl border border-[#dbe5ec] bg-white">
                    <div className="flex items-center gap-2 border-b border-[#e5edf2] px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4">
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                            <MapPin size={13} className="sm:hidden" />
                            <MapPin size={14} className="hidden sm:block" />
                        </div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#12385a]">
                            {t("cases:sections.crimeSceneLocation")}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 px-3 py-4 sm:gap-x-6 sm:gap-y-5 sm:px-4 sm:py-5 md:grid-cols-3 md:gap-x-8 md:gap-y-6 md:px-5 md:py-6">
                        <div>
                            <label className={labelCls}>{t("cases:labels.locationName")} </label>
                            <input
                                type="text"
                                value={data.locationName}
                                onChange={(e) => updateCaseInfo({ locationName: e.target.value })}
                                placeholder={t("cases:selects.e_gLocation")}
                                className={inputCls("locationName")}
                            />
                            <FieldError msg={errFor("locationName")} />
                        </div>

                        <div>
                            <label className={labelCls}>
                                {t("cases:labels.locationGovernorate")}
                            </label>
                            <div className="relative">
                                <select
                                    value={data.locationGovernorate}
                                    onChange={(e) =>
                                        updateCaseInfo({
                                            locationGovernorate: e.target.value,
                                        })
                                    }
                                    className={selectCls("locationGovernorate")}
                                >
                                    <option value="">{t("cases:selects.selectGovernorate")}</option>
                                    {Object.keys(GOVERNORATES_BILINGUAL).map((governorate) => (
                                        <option key={governorate} value={governorate}>
                                            {governorate}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                                />
                            </div>
                            <FieldError msg={errFor("locationGovernorate")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.city")}</label>
                            <input
                                type="text"
                                value={data.city}
                                onChange={(e) => updateCaseInfo({ city: e.target.value })}
                                placeholder={t("cases:selects.city")}
                                className={inputCls("city")}
                            />
                            <FieldError msg={errFor("city")} />
                        </div>

                        <div>
                            <label className={labelCls}>{t("cases:labels.district")}</label>
                            <input
                                type="text"
                                value={data.district}
                                onChange={(e) => updateCaseInfo({ district: e.target.value })}
                                placeholder={t("cases:selects.district")}
                                className={inputCls("district")}
                            />
                            <FieldError msg={errFor("district")} />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>{t("cases:labels.address")}</label>
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => updateCaseInfo({ address: e.target.value })}
                                placeholder={t("cases:selects.e_gStreet")}
                                className={inputCls("address")}
                            />
                            <FieldError msg={errFor("address")} />
                        </div>
                    </div>
                </section>

                <div className={`flex items-center justify-between border-t border-[#dbe5ec] py-3 sm:py-4 md:py-5 px-3 sm:px-0 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <button
                        type="button"
                        onClick={validateAndGoNext}
                        className={`inline-flex ${isRtl ? "me-auto" : "ms-auto"} h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-lg bg-[#005588] px-4 sm:px-6 text-xs sm:text-sm font-medium text-white transition hover:bg-[#00466f] ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                        {t("common:actions.next", "Next")}
                        <ArrowRight size={14} className={`sm:hidden ${isRtl ? "rotate-180" : ""}`} />
                        <ArrowRight size={16} className={`hidden sm:block ${isRtl ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}
