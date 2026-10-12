  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { useTranslation } from "react-i18next";
  import toast, { Toaster } from "react-hot-toast";
  import {
    ArrowLeft,
    CheckCircle2,
    Send,
    FolderOpen,
    MapPin,
    UserRound,
    AlertTriangle,
    FileText,
    Fingerprint,
    Image,
  } from "lucide-react";
  import { useCase } from "../../../context/CaseContext";
  import type { PersonData, EvidenceData } from "../../../context/CaseContext";
  import { submitCase } from "../../../api/cases";
import { api } from "../../../api/client";


  function PersonPreviewImages({ person }: { person: PersonData }) {
    const [urls, setUrls] = useState<string[]>([]);
    const { t } = useTranslation(["cases", "common"]);

    useEffect(() => {
      const generated: string[] = [];
      for (const img of person.images) {
        generated.push(URL.createObjectURL(img));
      }
      setUrls(generated);
      return () => {
        for (const u of generated) URL.revokeObjectURL(u);
      };
    }, [person.images]);

    if (urls.length === 0) {
      return (
        <div className="flex h-16 w-20 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-[#94a3b8] shrink-0">
          <Image size={15} />
          <span className="mt-1 text-[9px]">{t("cases:review.noImages")}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {urls.map((u, idx) => (
          <img
            key={idx}
            src={u}
            alt={`${person.fullName || "Person"} ${idx + 1}`}
            className="h-16 w-20 rounded-md object-cover border border-[#dbe5ec]"
          />
        ))}
      </div>
    );
  }

  function EvidencePreviewImages({
    evidence,
  }: {
    evidence: EvidenceData;
  }) {
    const [urls, setUrls] = useState<string[]>([]);
    const { t } = useTranslation(["cases", "common"]);

    useEffect(() => {
      const generated: string[] = [];
      for (const img of evidence.images) {
        generated.push(URL.createObjectURL(img));
      }
      setUrls(generated);
      return () => {
        for (const u of generated) URL.revokeObjectURL(u);
      };
    }, [evidence.images]);

    if (urls.length === 0) {
      return (
        <div className="flex h-16 w-20 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-[#94a3b8] shrink-0">
          <Image size={15} />
          <span className="mt-1 text-[9px]">{t("cases:review.noImages")}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {urls.map((u, idx) => (
          <img
            key={idx}
            src={u}
            alt={`Evidence ${evidence.evidenceId || "N/A"} ${idx + 1}`}
            className="h-16 w-20 rounded-md object-cover border border-[#dbe5ec]"
          />
        ))}
      </div>
    );
  }

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

  function PersonCard({
    title,
    icon: Icon,
    iconColor,
    person,
  }: {
    title: string;
    icon: typeof UserRound;
    iconColor: string;
    person: PersonData;
  }) {
    const { t } = useTranslation(["cases", "common"]);
    return (
      <div className="rounded-lg border border-[#e5edf2] bg-[#fafcfe] p-4">
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-md ${iconColor}`}
          >
            <Icon size={13} />
          </div>
          <p className="text-xs font-semibold text-[#12385a]">{title}</p>
        </div>
        <div className="flex gap-4">
          <PersonPreviewImages person={person} />
          <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label={t("cases:labels.fullName")} value={person.fullName} />
            <Field label={t("cases:labels.nationalId")} value={person.nationalId} />
            <Field label={t("cases:labels.gender")} value={person.gender} />
            <Field label={t("cases:labels.nationality")} value={person.nationality} />
            <Field label={t("cases:labels.note")} value={person.note} />

            {person.images.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#0875a8]">
                  {t("cases:review.imagesCount")}
                </p>
                <p className="mt-1 text-sm text-[#475569]">
                  {person.images.length} {person.images.length !== 1 ? t("cases:review.images") : t("cases:review.image")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  export default function Review() {
    const navigate = useNavigate();
    const { caseData, resetCase } = useCase();
    const { t } = useTranslation(["cases", "common"]);
    const [submitting, setSubmitting] = useState(false);

    const info = caseData.caseInfo;
    
    // Helper function to translate incident types
    const translateIncidentType = (type: string): string => {
      if (!type) return "";
      
      const normalizedType = type.trim().toLowerCase();
      
      console.log('🔍 Translating incident type:', { original: type, normalized: normalizedType });
      
      // Map common incident types
      if (normalizedType === "kill") return t("cases:incidentTypes.kill");
      if (normalizedType === "assault") return t("cases:incidentTypes.assault");
      if (normalizedType === "robbery") return t("cases:incidentTypes.robbery");
      if (normalizedType === "burglary") return t("cases:incidentTypes.burglary");
      if (normalizedType === "drugrelated" || normalizedType === "drug related") return t("cases:incidentTypes.drugRelated");
      if (normalizedType === "fraud") return t("cases:incidentTypes.fraud");
      if (normalizedType === "other") return t("cases:incidentTypes.other");
      
      console.log('⚠️ No translation found for incident type:', normalizedType);
      return type;
    };
    
    // Helper function to translate evidence types
    const translateEvidenceType = (type: string): string => {
      if (!type) return "";
      
      const normalizedType = type.trim().toLowerCase();
      
      console.log('🔍 Translating evidence type:', { original: type, normalized: normalizedType });
      
      if (normalizedType === "finger") return t("cases:evidenceTypes.finger");
      if (normalizedType === "palm") return t("cases:evidenceTypes.palm");
      if (normalizedType === "undefined") return t("cases:evidenceTypes.undefined");
      
      console.log('⚠️ No translation found for evidence type:', normalizedType);
      return type;
    };
    
    const caseFilled = Boolean(
      info.caseId ||
      info.caseYear ||
      info.incidentType ||
      info.inspectionDate ||
      info.description ||
      info.policeDepartment ||
      info.governorate ||
      info.investigator ||
      info.locationName ||
      info.address ||
      info.locationGovernorate ||
      info.city ||
      info.district
    );

    function validateCase(): string | null {
      if (!caseFilled) {
        return t("cases:review.caseEmpty");
      }
      if (!info.caseId?.trim()) {
        return t("cases:review.caseIdRequired");
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

          // ✅ submitCase بترجع caseId (رقم) مباشرة
          const caseId: number = await submitCase(caseData, true);
          console.log("🎯 Submitted case ID:", caseId);

          toast.success(t("cases:review.submitSuccess"), {
            duration: 4000,
            icon: <CheckCircle2 className="text-green-600" size={20} />,
          });

          // تنزيل تقرير الـ PDF (ZIP كامل)
          try {
            const res = await api.get(`/cases/${caseId}/download/`, {
              responseType: "blob",
            });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Case_${info.caseId || caseId}.zip`;
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
          toast.error(t("cases:review.submitFailed"));
        } finally {
          setSubmitting(false);
        }
      }

    return (
      <div className="min-h-full ">
        <Toaster position="top-right" />

        <div className="mx-auto w-full max-w-6xl pb-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0f2942]">
                {t("cases:review.criminalTitle")}
              </h1>
              <p className="mt-1 text-sm text-[#64748b]">
                {t("cases:review.criminalSubtitle")}
              </p>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-semibold text-[#64748b]">
                {t("cases:review.step4of4")}
              </p>
              <div className="mt-2 flex gap-1.5">
                <span className="h-1 w-6 rounded-full bg-[#005588]" />
                <span className="h-1 w-6 rounded-full bg-[#005588]" />
                <span className="h-1 w-6 rounded-full bg-[#005588]" />
                <span className="h-1 w-6 rounded-full bg-[#005588]" />
              </div>
            </div>
          </div>

          <section className="mb-5 overflow-hidden rounded-xl border border-[#dbe5ec] bg-white">
            <div className="flex items-center gap-2 border-b border-[#e5edf2] px-5 py-4 bg-[#fafcfe]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                <FolderOpen size={14} />
              </div>
              <h2 className="text-sm font-semibold text-[#12385a]">
                {t("cases:review.caseInfo")}
              </h2>
            </div>

            <div className="px-5 py-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <FolderOpen size={13} className="text-[#0875a8]" />
                  <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                    {t("cases:review.generalInfo")}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-3">
                  <Field label={t("cases:labels.caseId")} value={info.caseId} />
                  <Field label={t("cases:labels.caseYear")} value={info.caseYear} />
                  <Field label={t("cases:labels.incidentType")} value={translateIncidentType(info.incidentType)} />
                  <Field
                    label={t("cases:labels.inspectionDate")}
                    value={info.inspectionDate}
                  />
                  <Field label={t("cases:labels.governorate")} value={info.governorate} />
                  <Field
                    label={t("cases:labels.policeDepartment")}
                    value={info.policeDepartment}
                  />
                  <div className="md:col-span-2 xl:col-span-3">
                    <Field label={t("cases:labels.investigator")} value={info.investigator} />
                  </div>
                  <div className="md:col-span-2 xl:col-span-3">
                    <Field label={t("cases:labels.description")} value={info.description} />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#edf2f5] pt-5">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin size={13} className="text-[#0875a8]" />
                  <p className="text-[13px] font-bold uppercase tracking-wider text-[#0875a8]">
                    {t("cases:review.crimeSceneLocation")}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2 xl:grid-cols-3">
                  <Field label={t("cases:labels.locationName")} value={info.locationName} />
                  <div className="md:col-span-2">
                    <Field label={t("cases:labels.address")} value={info.address} />
                  </div>
                  <Field
                    label={t("cases:labels.locationGovernorate")}
                    value={info.locationGovernorate}
                  />
                  <Field label={t("cases:labels.city")} value={info.city} />
                  <Field label={t("cases:labels.district")} value={info.district} />
                </div>
              </div>
            </div>
          </section>

          {caseData.victims.length > 0 && (
            <section className="mb-5 rounded-xl border border-[#dbe5ec] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                  <UserRound size={14} />
                </div>
                <h2 className="text-sm font-semibold text-[#12385a]">
                  {t("cases:review.victimCount")} ({caseData.victims.length})
                </h2>
              </div>
              <div className="space-y-3">
                {caseData.victims.map((v, i) => (
                  <PersonCard
                    key={`victim-${i}`}
                    title={`${t("cases:review.victimNumber")} #${i + 1}`}
                    icon={UserRound}
                    iconColor="bg-[#e5f5fc] text-[#0089c7]"
                    person={v}
                  />
                ))}
              </div>
            </section>
          )}

          {caseData.suspects.length > 0 && (
            <section className="mb-5 rounded-xl border border-[#dbe5ec] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#fef2f2] text-[#dc2626]">
                  <AlertTriangle size={14} />
                </div>
                <h2 className="text-sm font-semibold text-[#12385a]">
                  {t("cases:review.suspectCount")} ({caseData.suspects.length})
                </h2>
              </div>
              <div className="space-y-3">
                {caseData.suspects.map((s, i) => (
                  <PersonCard
                    key={`suspect-${i}`}
                    title={`${t("cases:review.suspectNumber")} #${i + 1}`}
                    icon={AlertTriangle}
                    iconColor="bg-[#fef2f2] text-[#dc2626]"
                    person={s}
                  />
                ))}
              </div>
            </section>
          )}

          {caseData.reporters.length > 0 && (
            <section className="mb-5 rounded-xl border border-[#dbe5ec] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                  <FileText size={14} />
                </div>
                <h2 className="text-sm font-semibold text-[#12385a]">
                  {t("cases:review.reporterCount")} ({caseData.reporters.length})
                </h2>
              </div>
              <div className="space-y-3">
                {caseData.reporters.map((r, i) => (
                  <PersonCard
                    key={`reporter-${i}`}
                    title={`${t("cases:review.reporterNumber")} #${i + 1}`}
                    icon={FileText}
                    iconColor="bg-[#e5f5fc] text-[#0089c7]"
                    person={r}
                  />
                ))}
              </div>
            </section>
          )}

          {caseData.evidence.length > 0 && (
            <section className="mb-6 rounded-xl border border-[#dbe5ec] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                  <Fingerprint size={14} />
                </div>
                <h2 className="text-sm font-semibold text-[#12385a]">
                  {t("cases:review.evidenceCount")} ({caseData.evidence.length})
                </h2>
              </div>
              <div className="space-y-3">
                {caseData.evidence.map((ev, i) => (
                  <div
                    key={`evidence-${i}`}
                    className="rounded-lg border border-[#e5edf2] bg-[#fafcfe] p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                        <Fingerprint size={13} />
                      </div>
                      <p className="text-xs font-semibold text-[#12385a]">
                        {t("cases:review.evidenceNumber")} #{i + 1} • {translateEvidenceType(ev.evidenceType) || t("cases:labels.evidenceNoType")}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <EvidencePreviewImages evidence={ev} />
                      <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Field label={t("cases:labels.evidenceId")} value={ev.evidenceId} />
                        <Field
                          label={t("cases:labels.evidenceType")}
                          value={translateEvidenceType(ev.evidenceType)}
                        />
                        <div className="sm:col-span-2">
                          <Field label={t("cases:labels.description")} value={ev.description} />
                        </div>
                        {ev.images.length > 0 && (
                          <div className="sm:col-span-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#0875a8]">
                              {t("cases:review.imagesCount")}
                            </p>
                            <p className="mt-1 text-sm text-[#475569]">
                              {ev.images.length} {ev.images.length !== 1 ? t("cases:review.images") : t("cases:review.image")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex items-center justify-between border-t border-[#dbe5ec] pt-5">
            <button
              type="button"
              onClick={() => navigate("/user/cases/victims-suspects-reporters")}
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
              {submitting ? t("cases:review.submitting") : t("cases:review.submitCriminalCase")}
            </button>
          </div>
        </div>
      </div>
    );
  }