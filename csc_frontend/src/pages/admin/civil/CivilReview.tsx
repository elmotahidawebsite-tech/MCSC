import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Hash,
  CalendarDays,
  Building2,
  Fingerprint,
  Camera,
  User,
  FileImage,
} from "lucide-react";
import type { CaseData } from "../../../context/CaseContext";
import { api } from "../../../api/client";

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

export default function AdminCivilReview() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["cases", "common"]);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);

  // Helper function to translate civil case enum values
  const translateCivilValue = (value: string): string => {
    if (!value) return "";
    
    // Trim and normalize the value
    const normalizedValue = value.trim();
    
    // Debug log to check the value
    console.log('Translating civil value:', { original: value, normalized: normalizedValue });
    
    // Fingerprint Type translations
    if (normalizedValue === "Digital") return t("cases:civil.digitalFingerprint");
    if (normalizedValue === "Fingerprint (Document)" || normalizedValue === "Document") return t("cases:civil.documentFingerprint");
    
    // Fingerprint Holder translations
    if (normalizedValue === "Appellant") return t("cases:civil.appellant");
    if (normalizedValue === "Deceased") return t("cases:civil.deceased");
    
    // Type of Comparison Document translations
    if (normalizedValue === "Official") return t("cases:civil.official");
    if (normalizedValue === "Customary") return t("cases:civil.customary");
    
    // If value equals "Other", translate it
    if (normalizedValue === "Other") return t("cases:civil.other");
    
    // Return original value if no translation found
    console.log('No translation found for:', normalizedValue);
    return value;
  };

  useEffect(() => {
    async function fetchCase() {
      try {
        const response = await api.get(`/cases/${caseId}`);
        setCaseData(response.data);
        
        // For file URLs - in real implementation, these would come from the API
        if (response.data.civilCaseInfo?.caseFileUrls) {
          setFileUrls(response.data.civilCaseInfo.caseFileUrls);
        }
      } catch (error) {
        console.error("Failed to fetch case:", error);
        toast.error(t("cases:review.failedToLoadCase"));
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

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
      a.download = `CivilCase_${caseData?.civilCaseInfo?.caseNumber || caseId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success(t("cases:review.downloadSuccess"), { duration: 3000 });
    } catch (error) {
      console.error("Download failed:", error);
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

  if (!caseData || !caseData.civilCaseInfo) {
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

  const info = caseData.civilCaseInfo;

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />

      <div className="mx-auto w-full max-w-6xl pb-6 px-3 sm:px-4">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f2942]">
              {t("cases:review.civilTitle")} - {info.caseNumber}
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {t("cases:review.civilSubtitle")}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] disabled:opacity-50"
            >
              <Download size={16} />
              {downloading ? t("cases:review.downloading") : t("cases:review.downloadCase")}
            </button>
          </div>
        </div>

        {/* ===== SECTION 1: Civil Case Information ===== */}
        <section className="mb-5 overflow-hidden rounded-xl border border-[#dbe5ec] bg-white">
          <SectionHeader
            title={t("cases:review.civilCaseInfo")}
            Icon={FileText}
          />

          <div className="px-5 py-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Hash size={13} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.generalInfo")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-3">
                <IconField
                  label={t("cases:civil.caseNumber")}
                  value={info.caseNumber}
                  Icon={Hash}
                />
                <IconField
                  label={t("cases:civil.dateOfReceipt")}
                  value={info.dateOfReceipt}
                  Icon={CalendarDays}
                />
                <IconField
                  label={t("cases:civil.receiptAuthority")}
                  value={info.receiptAuthority}
                  Icon={Building2}
                />
                <IconField
                  label={t("cases:civil.dateOfTransfer")}
                  value={info.dateOfTransfer}
                  Icon={CalendarDays}
                />
                <IconField
                  label={t("cases:civil.transferredAuthority")}
                  value={info.transferredAuthority}
                  Icon={Building2}
                />
              </div>
            </div>

            <SectionDivider />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Fingerprint size={13} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.fingerprintInformation")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-3">
                <IconField
                  label={t("cases:civil.fingerprintType")}
                  value={translateCivilValue(info.fingerprintType)}
                  Icon={Fingerprint}
                />
                <IconField
                  label={t("cases:civil.fingerprintHolder")}
                  value={translateCivilValue(info.fingerprintHolder)}
                  Icon={User}
                />
                <IconField
                  label={t("cases:civil.comparisonDocument")}
                  value={info.comparisonDocument}
                  Icon={FileText}
                />
                <div className="xl:col-span-2">
                  <IconField
                    label={t("cases:civil.typeOfComparisonDocument")}
                    value={translateCivilValue(info.typeOfComparisonDocument)}
                    Icon={FileText}
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
              <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2">
                <IconField
                  label={t("cases:civil.expert")}
                  value={info.expert}
                  Icon={User}
                />
                <IconField
                  label={t("cases:civil.photographer")}
                  value={info.photographer}
                  Icon={Camera}
                />
                <div className="md:col-span-2">
                  <Field label={t("cases:civil.notes")} value={info.notes} />
                </div>
              </div>
            </div>

            <SectionDivider />

            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <FileImage size={12} className="text-[#0875a8]" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:civil.caseFiles")}
                </p>
              </div>
              {fileUrls.length === 0 ? (
                <p className="text-sm text-[#94a3b8]">{t("cases:review.notProvided")}</p>
              ) : (
                <div className="space-y-2 mt-2">
                  <p className="text-sm text-[#475569]">
                    {fileUrls.length} {fileUrls.length !== 1 ? t("cases:civil.filePlural") : t("cases:civil.fileSingular")}
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {fileUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#475569]">
                            Case File #{idx + 1}
                          </p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#0875a8] hover:underline"
                          >
                            View File
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== Footer Buttons ===== */}
        <div className="flex items-center justify-between border-t border-[#dbe5ec] pt-5">
          <button
            type="button"
            onClick={() => navigate("/admin/cases")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe5ec] bg-white px-5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9]"
          >
            <ArrowLeft size={16} />
            {t("cases:review.backToCases")}
          </button>
        </div>
      </div>
    </div>
  );
}