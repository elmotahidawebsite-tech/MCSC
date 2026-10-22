import {
  AlertTriangle,
  FileText,
  Fingerprint,
  FolderOpen,
  MapPin,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  CaseData,
  EvidenceData,
  PersonData,
} from "@/context/CaseContext";
import {
  type IndexedImageHandler,
  type ImageHandler,
  type RemoteImages,
  EditableField,
  EvidenceImage,
  PersonEditableCard,
  EmptyHint,
} from "../CaseDetailShared";

type CriminalHandlers = {
  patchCaseInfo: (p: Partial<CaseData["caseInfo"]>) => void;
  addVictim: () => void;
  removeVictim: (i: number) => void;
  patchVictim: (i: number, p: PersonData) => void;
  handleVictimImageAction: IndexedImageHandler;
  addSuspect: () => void;
  removeSuspect: (i: number) => void;
  patchSuspect: (i: number, p: PersonData) => void;
  handleSuspectImageAction: IndexedImageHandler;
  patchReporter: (p: PersonData | null) => void;
  handleReporterImageAction: ImageHandler;
  addEvidence: () => void;
  removeEvidence: (i: number) => void;
  patchEvidence: (i: number, p: EvidenceData) => void;
  handleEvidenceImageAction: IndexedImageHandler;
  emptyPerson: PersonData;
};

export default function CriminalCaseDetail({
  data,
  remoteImages,
  handlers,
}: {
  data: CaseData;
  remoteImages: RemoteImages;
  handlers: CriminalHandlers;
}) {
  const info = data.caseInfo;
  const { t } = useTranslation(["cases", "common"]);

  // Helper function to translate incident types
  const translateIncidentType = (type: string): string => {
    if (!type) return "";
    
    const normalizedType = type.trim().toLowerCase();
    
    if (normalizedType === "kill") return t("cases:incidentTypes.kill");
    if (normalizedType === "assault") return t("cases:incidentTypes.assault");
    if (normalizedType === "robbery") return t("cases:incidentTypes.robbery");
    if (normalizedType === "burglary") return t("cases:incidentTypes.burglary");
    if (normalizedType === "drugrelated" || normalizedType === "drug related") return t("cases:incidentTypes.drugRelated");
    if (normalizedType === "fraud") return t("cases:incidentTypes.fraud");
    if (normalizedType === "other") return t("cases:incidentTypes.other");
    
    return type;
  };
  
  // Helper function to translate evidence types
  const translateEvidenceType = (type: string): string => {
    if (!type) return "";
    
    const normalizedType = type.trim().toLowerCase();
    
    if (normalizedType === "finger") return t("cases:evidenceTypes.finger");
    if (normalizedType === "palm") return t("cases:evidenceTypes.palm");
    if (normalizedType === "undefined") return t("cases:evidenceTypes.undefined");
    
    return type;
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 bg-[#fafcfe]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f5fc] text-[#0089c7]">
            <FolderOpen size={15} />
          </div>
          <h2 className="text-xl font-bold text-[#12385a]">{t("cases:review.caseInfo")}</h2>
        </div>

        <div className="px-6 py-6 space-y-7">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen size={15} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#0875a8]">{t("cases:review.generalInfo")}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EditableField label={t("cases:labels.caseId")} value={info.caseId} onChange={(v) => handlers.patchCaseInfo({ caseId: v })} />
              <EditableField label={t("cases:labels.caseYear")} value={info.caseYear} onChange={(v) => handlers.patchCaseInfo({ caseYear: v })} type="number" />
              <EditableField label={t("cases:labels.incidentType")} value={translateIncidentType(info.incidentType)} onChange={(v) => handlers.patchCaseInfo({ incidentType: v })} />
              <EditableField label={t("cases:labels.inspectionDate")} value={info.inspectionDate} onChange={(v) => handlers.patchCaseInfo({ inspectionDate: v })} type="date" />
              <EditableField label={t("cases:labels.governorate")} value={info.governorate} onChange={(v) => handlers.patchCaseInfo({ governorate: v })} />
              <EditableField label={t("cases:labels.policeDepartment")} value={info.policeDepartment} onChange={(v) => handlers.patchCaseInfo({ policeDepartment: v })} />
              <EditableField label={t("cases:labels.investigator")} value={info.investigator} onChange={(v) => handlers.patchCaseInfo({ investigator: v })} />
              <EditableField label={t("cases:labels.description")} value={info.description} onChange={(v) => handlers.patchCaseInfo({ description: v })} textarea full />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="mb-5 flex items-center gap-2">
              <MapPin size={15} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#0875a8]">{t("cases:review.crimeSceneLocation")}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EditableField label={t("cases:labels.locationName")} value={info.locationName} onChange={(v) => handlers.patchCaseInfo({ locationName: v })} />
              <EditableField label={t("cases:labels.address")} value={info.address} onChange={(v) => handlers.patchCaseInfo({ address: v })} />
              <EditableField label={t("cases:labels.locationGovernorate")} value={info.locationGovernorate} onChange={(v) => handlers.patchCaseInfo({ locationGovernorate: v })} />
              <EditableField label={t("cases:labels.city")} value={info.city} onChange={(v) => handlers.patchCaseInfo({ city: v })} />
              <EditableField label={t("cases:labels.district")} value={info.district} onChange={(v) => handlers.patchCaseInfo({ district: v })} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f5fc] text-[#0089c7]">
              <UserRound size={15} />
            </div>
            <h2 className="text-xl font-bold text-[#12385a]">{t("cases:sections.victims")} ({data.victims.length})</h2>
          </div>
          <button onClick={handlers.addVictim} className="print:hidden h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-[#005588] text-xs font-semibold transition">
            <UserPlus size={14} />
            {t("cases:validation.addVictim")}
          </button>
        </div>
        {data.victims.length === 0 ? (
          <EmptyHint message={t("cases:validation.noVictims")} />
        ) : (
          <div className="space-y-4">
            {data.victims.map((v, i) => (
              <div key={`victim-${i}`} className="relative">
                <button onClick={() => handlers.removeVictim(i)} className="print:hidden absolute top-3 right-3 z-10 text-[11px] font-bold text-gray-400 hover:text-rose-500 transition">{t("cases:validation.remove")}</button>
                <PersonEditableCard
                  title={`${t("cases:review.victimNumber")} #${i + 1}`}
                  icon={UserRound}
                  iconColor="bg-[#e5f5fc] text-[#0089c7]"
                  person={v}
                  imageUrls={remoteImages.victims[i]}
                  onChange={(p) => handlers.patchVictim(i, p)}
                  onImageAction={(action, payload) => handlers.handleVictimImageAction(i, action, payload)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef2f2] text-[#dc2626]">
              <AlertTriangle size={15} />
            </div>
            <h2 className="text-xl font-bold text-[#12385a]">{t("cases:sections.suspects")} ({data.suspects.length})</h2>
          </div>
          <button onClick={handlers.addSuspect} className="print:hidden h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-[#005588] text-xs font-semibold transition">
            <UserPlus size={14} />
            {t("cases:validation.addSuspect")}
          </button>
        </div>
        {data.suspects.length === 0 ? (
          <EmptyHint message={t("cases:validation.noSuspects")} />
        ) : (
          <div className="space-y-4">
            {data.suspects.map((s, i) => (
              <div key={`suspect-${i}`} className="relative">
                <button onClick={() => handlers.removeSuspect(i)} className="print:hidden absolute top-3 right-3 z-10 text-[11px] font-bold text-gray-400 hover:text-rose-500 transition">{t("cases:validation.remove")}</button>
                <PersonEditableCard
                  title={`${t("cases:review.suspectNumber")} #${i + 1}`}
                  icon={AlertTriangle}
                  iconColor="bg-[#fef2f2] text-[#dc2626]"
                  person={s}
                  imageUrls={remoteImages.suspects[i]}
                  onChange={(p) => handlers.patchSuspect(i, p)}
                  onImageAction={(action, payload) => handlers.handleSuspectImageAction(i, action, payload)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f5fc] text-[#0089c7]">
              <FileText size={15} />
            </div>
            <h2 className="text-xl font-bold text-[#12385a]">{t("cases:sections.reporter")}</h2>
          </div>
          {data.reporters[0] ? (
            <button onClick={() => handlers.patchReporter(null)} className="print:hidden text-[11px] font-bold text-gray-400 hover:text-rose-500 transition">{t("cases:validation.clearReporter")}</button>
          ) : null}
        </div>
        {!data.reporters[0] ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center text-gray-400 hover:border-[#005588] hover:text-[#005588] transition cursor-pointer" onClick={() => handlers.patchReporter({ ...handlers.emptyPerson })}>
            <UserPlus size={20} className="mb-2" />
            <p className="text-sm font-semibold">{t("cases:validation.noReporter")}</p>
          </div>
        ) : (
          <PersonEditableCard
            title={t("cases:sections.reporter")}
            icon={FileText}
            iconColor="bg-[#e5f5fc] text-[#0089c7]"
            person={data.reporters[0]}
            imageUrls={remoteImages.reporters[0]}
            onChange={handlers.patchReporter}
            onImageAction={handlers.handleReporterImageAction}
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f5fc] text-[#0089c7]">
              <Fingerprint size={15} />
            </div>
            <h2 className="text-xl font-bold text-[#12385a]">{t("cases:sections.evidence")} ({data.evidence.length})</h2>
          </div>
          <button onClick={handlers.addEvidence} className="print:hidden h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 text-[#005588] text-xs font-semibold transition">
            <Fingerprint size={14} />
            {t("cases:validation.addEvidence")}
          </button>
        </div>

        {data.evidence.length === 0 ? (
          <EmptyHint message={t("cases:validation.noEvidenceLogged")} />
        ) : (
          <div className="space-y-4">
            {data.evidence.map((ev, i) => {
              function patch<K extends keyof EvidenceData>(key: K, v: EvidenceData[K]): void {
                handlers.patchEvidence(i, { ...ev, [key]: v });
              }
              return (
                <div key={`evidence-${i}`} className="rounded-2xl border border-slate-200 bg-[#fafcfe] p-5 relative">
                  <button onClick={() => handlers.removeEvidence(i)} className="print:hidden absolute top-3 right-3 z-10 text-[11px] font-bold text-gray-400 hover:text-rose-500 transition">{t("cases:validation.remove")}</button>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f5fc] text-[#0089c7]">
                      <Fingerprint size={13} />
                    </div>
                    <p className="text-xs font-semibold text-[#12385a]">{t("cases:review.evidenceNumber")} #{i + 1} • {translateEvidenceType(ev.evidenceType) || t("cases:labels.evidenceNoType")}</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:max-h-[420px] lg:overflow-y-auto">
                      <p className="mb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        صور الدليل
                      </p>
                      <EvidenceImage
                        evidence={ev}
                        imageUrls={remoteImages.evidences[i]}
                        onChange={(action, payload) => handlers.handleEvidenceImageAction(i, action, payload)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                      <EditableField label={t("cases:labels.evidenceId")} value={ev.evidenceId} onChange={(v) => patch("evidenceId", v)} />
                      <EditableField label={t("cases:labels.evidenceType")} value={translateEvidenceType(ev.evidenceType)} onChange={(v) => patch("evidenceType", v)} />
                      <div className="sm:col-span-2">
                        <EditableField label={t("cases:labels.description")} value={ev.description} onChange={(v) => patch("description", v)} textarea />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
