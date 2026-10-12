import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Fingerprint,
  FolderOpen,
  MapPin,
  Scale,
  User,
  Camera,
} from "lucide-react";
import type {
  CaseData,
  CivilCaseInfo,
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
  MediaTile,
  guessMediaKind,
  formatSize,
} from "../CaseDetailShared";
import {
  AlertTriangle,
  FileText as FileTextIcon,
  UserPlus,
  UserRound,
} from "lucide-react";

type CivilHandlers = {
  patchCivilCaseInfo: (p: Partial<CivilCaseInfo>) => void;
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
  handleCivilImageAction: ImageHandler;
  emptyPerson: PersonData;
};

export default function CivilCaseDetail({
  data,
  remoteImages,
  handlers,
}: {
  data: CaseData;
  remoteImages: RemoteImages;
  handlers: CivilHandlers;
}) {
  const info = data.civilCaseInfo;
  const civilImagesFileRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation(["cases", "common"]);

  // Helper function to translate civil case enum values
  const translateCivilValue = (value: string): string => {
    if (!value) return "";
    
    const normalizedValue = value.trim();
    
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
    return value;
  };

  function onPickCivilImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => handlers.handleCivilImageAction("add", f));
    if (civilImagesFileRef.current) civilImagesFileRef.current.value = "";
  }

  const civilRemoteImages = remoteImages.civilImages ?? [];

  return (
    <>
      {/* ===== Section 1: Civil Case Info ===== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 bg-amber-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Scale size={15} />
          </div>
          <h2 className="text-xl font-bold text-[#12385a]">
            {t("cases:review.civilCaseInfo")} 
          </h2>
        </div>
        <div className="px-6 py-6 space-y-7">
          {/* General Info */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen size={15} className="text-amber-600" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-amber-600">
                {t("cases:review.generalInfo")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EditableField
                label={t("cases:labels.caseNumber")}
                value={info.caseNumber}
                onChange={(v) => handlers.patchCivilCaseInfo({ caseNumber: v })}
              />
              <EditableField
                label={t("cases:labels.caseYear")}
                value={info.caseYear}
                onChange={(v) => handlers.patchCivilCaseInfo({ caseYear: v })}
                type="number"
              />
              <EditableField
                label={t("cases:labels.dateOfReceipt")}
                value={info.dateOfReceipt}
                onChange={(v) => handlers.patchCivilCaseInfo({ dateOfReceipt: v })}
                type="date"
              />
              <EditableField
                label={t("cases:labels.receiptAuthority")}
                value={info.receiptAuthority}
                onChange={(v) => handlers.patchCivilCaseInfo({ receiptAuthority: v })}
              />
              <EditableField
                label={t("cases:labels.dateOfTransfer")}
                value={info.dateOfTransfer}
                onChange={(v) => handlers.patchCivilCaseInfo({ dateOfTransfer: v })}
                type="date"
              />
              <EditableField
                label={t("cases:labels.transferredAuthority")}
                value={info.transferredAuthority}
                onChange={(v) => handlers.patchCivilCaseInfo({ transferredAuthority: v })}
              />
              <EditableField
                label={t("cases:labels.governorate")}
                value={info.governorate}
                onChange={(v) => handlers.patchCivilCaseInfo({ governorate: v })}
              />
            </div>
          </div>

          {/* Fingerprint Info */}
          <div className="border-t border-slate-100 pt-6">
            <div className="mb-5 flex items-center gap-2">
              <Fingerprint size={15} className="text-amber-600" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-amber-600">
                {t("cases:sections.fingerprintInfo")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EditableField
                label={t("cases:labels.fingerprintType")}
                value={translateCivilValue(info.fingerprintType)}
                onChange={(v) => handlers.patchCivilCaseInfo({ fingerprintType: v })}
              />
              <EditableField
                label={t("cases:labels.fingerprintHolder")}
                value={translateCivilValue(info.fingerprintHolder)}
                onChange={(v) => handlers.patchCivilCaseInfo({ fingerprintHolder: v })}
              />
              <EditableField
                label={t("cases:labels.comparisonDocument")}
                value={info.comparisonDocument}
                onChange={(v) => handlers.patchCivilCaseInfo({ comparisonDocument: v })}
              />
              <EditableField
                label={t("cases:labels.typeOfComparisonDocument")}
                value={translateCivilValue(info.typeOfComparisonDocument)}
                onChange={(v) => handlers.patchCivilCaseInfo({ typeOfComparisonDocument: v })}
              />
            </div>
          </div>

          {/* Team & Notes */}
          <div className="border-t border-slate-100 pt-6">
            <div className="mb-5 flex items-center gap-2">
              <User size={15} className="text-amber-600" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-amber-600">
                {t("cases:sections.inspectionTeamAndNotes")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EditableField
                label={t("cases:labels.expert")}
                value={info.expert}
                onChange={(v) => handlers.patchCivilCaseInfo({ expert: v })}
              />
              <EditableField
                label={t("cases:labels.photographer")}
                value={info.photographer}
                onChange={(v) => handlers.patchCivilCaseInfo({ photographer: v })}
              />
              <EditableField
                label={t("cases:labels.notes")}
                value={info.notes}
                onChange={(v) => handlers.patchCivilCaseInfo({ notes: v })}
                textarea
                full
              />
            </div>

            {/* Case Files */}
            <div className="mt-7">
              <div className="mb-4 flex items-center gap-2">
                <Camera size={15} className="text-amber-600" />
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-amber-600">
                  {t("cases:labels.caseFiles")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-col items-start gap-3">
                  <div className="flex flex-wrap gap-3">
                    {civilRemoteImages.map((img) => {
                      const kind =
                        img.media_type ||
                        (img.url?.startsWith("data:") ? "image" : guessMediaKind({ name: img.file_name }));
                      return (
                        <MediaTile
                          key={`srv-${img.id}`}
                          kind={kind}
                          src={img.url}
                          fileName={img.file_name}
                          alt={`Case file ${img.id}`}
                          downloadUrl={img.url}
                          isRemote
                          variant="wide"
                          onRemove={() => handlers.handleCivilImageAction("remove", img.id)}
                        />
                      );
                    })}

                    {info.images.map((f, i) => {
                      const kind = guessMediaKind({ type: f.type, name: f.name });
                      return (
                        <MediaTile
                          key={`new-${i}`}
                          kind={kind}
                          src={URL.createObjectURL(f)}
                          fileName={f.name}
                          size={formatSize(f.size)}
                          alt={`New case file ${i + 1}`}
                          variant="wide"
                          onRemove={() => handlers.handleCivilImageAction("remove-new", i)}
                        />
                      );
                    })}

                    <label onClick={() => civilImagesFileRef.current?.click()} className="group cursor-pointer">
                      <div className="h-24 w-28 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50 transition flex flex-col items-center justify-center text-slate-400 group-hover:text-amber-600">
                        <Camera size={18} />
                        <span className="text-[10px] mt-1 font-semibold">Add File</span>
                        <span className="text-[9px] mt-0.5 font-medium">إضافة ملف</span>
                      </div>
                    </label>
                  </div>
                  <input
                    ref={civilImagesFileRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    multiple
                    className="hidden"
                    onChange={onPickCivilImages}
                  />

                  {civilRemoteImages.length === 0 && info.images.length === 0 ? (
                    <p className="text-xs text-slate-400 mt-1">
                      No files attached yet
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      {civilRemoteImages.length + info.images.length} file
                      {(civilRemoteImages.length + info.images.length) !== 1 ? "s" : ""} attached
                      {civilRemoteImages.length + info.images.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </>
  );
}
