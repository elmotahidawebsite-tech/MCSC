import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  ChevronDown,
  Droplets,
  FileText,
  FolderOpen,
  MapPin,
  Plus,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import type {
  CaseData,
  CorpsesCaseInfo,
  CorpsesSpecifications,
  EvidenceData,
} from "@/context/CaseContext";
import {
  type IndexedImageHandler,
  type RemoteImages,
  type RemoteImage,
  EditableField,
  EvidenceImage,
  EmptyHint,
  labeled,
  inputBase,
} from "../CaseDetailShared";

type CorpsesHandlers = {
  patchCorpsesCaseInfo: (p: Partial<CorpsesCaseInfo>) => void;
  patchCorpsesSpecifications: (i: number, p: Partial<CorpsesSpecifications>) => void;
  addCorpse: () => void;
  removeCorpse: (i: number) => void;
  handleCorpseImageAction: IndexedImageHandler;
  emptyCorpseSpecs: CorpsesSpecifications;
};

function genderLabel(v: string): string {
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  if (v === "none") return "None";
  return v || "Not Set";
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
  "Slim ",
  "Average ",
  "Overweight ",
];

function CorpseEditableCard({
  index,
  corpse,
  isExpanded,
  onToggleExpand,
  onPatch,
  onRemove,
  showRemove,
  imageUrls,
  onImageAction,
}: {
  index: number;
  corpse: CorpsesSpecifications;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPatch: (p: Partial<CorpsesSpecifications>) => void;
  onRemove: () => void;
  showRemove: boolean;
  imageUrls?: RemoteImage[];
  onImageAction: (action: "add" | "remove" | "remove-new", payload?: unknown) => void;
}) {
  const { t } = useTranslation(["cases", "common"]);
  const headerGender = genderLabel(corpse.gender);
  const headerAge = corpse.approximateAge ? `${corpse.approximateAge} yrs` : "No Age";

  function patch<K extends keyof CorpsesSpecifications>(key: K, v: CorpsesSpecifications[K]) {
    onPatch({ [key]: v } as Partial<CorpsesSpecifications>);
  }

  console.log(corpse);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div
        className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[#e5f5fc] text-[#005588]">
            <Stethoscope size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#12385a]">
              {t("cases:labels.corpse")} #{index + 1} · {headerGender}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">{headerAge}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
              title="Remove this corpse"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={17}
            className={`text-slate-500 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              {labeled(t("cases:labels.gender"))}
              <select
                value={corpse.gender}
                onChange={(e) => patch("gender", e.target.value)}
                className={inputBase()}
              >
                <option value="">{t("cases:selects.selectOption")}</option>
                <option value="male">{t("cases:selects.male")}</option>
                <option value="female">{t("cases:selects.female")}</option>
                <option value="none">{t("cases:selects.none")}</option>
              </select>
            </div>
            <div>
              {labeled(t("cases:labels.approximateAge"))}
              <select
                value={corpse.approximateAge}
                onChange={(e) => patch("approximateAge", e.target.value)}
                className={inputBase()}
              >
                <option value="">{t("cases:selects.selectRange")}</option>
                {ageRanges.map((r) => (
                  <option key={r} value={r}>{r} {t("cases:display.years")}</option>
                ))}
              </select>
            </div>
            <EditableField  
              label={t("cases:labels.approximateHeight")}
              value={corpse.approximateHeight}
              onChange={(v) => patch("approximateHeight", v)}
            />
            <div>
              {labeled(t("cases:labels.weight"))}
              <select
                value={corpse.weight}
                onChange={(e) => patch("weight", e.target.value)}
                className={inputBase()}
              >
                {/* <option value=""></option> */}
                <option value="slim">{t("cases:weightRanges.slim")}</option>
                <option value="average">{t("cases:weightRanges.average")}</option>
                <option value="overweight">{t("cases:weightRanges.overweight")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <EditableField
              label={t("cases:labels.discoveryCircumstances")}
              value={corpse.discoveryCircumstances}
              onChange={(v) => patch("discoveryCircumstances", v)}
              textarea
            />
            <EditableField
              label={t("cases:labels.distinguishingMarks")}
              value={corpse.distinguishingMarks}
              onChange={(v) => patch("distinguishingMarks", v)}
              textarea
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <EditableField
              label={t("cases:labels.underwear")}
              value={corpse.underwear}
              onChange={(v) => patch("underwear", v)}
              textarea
            />
            <EditableField
              label={t("cases:labels.outerwear")}
              value={corpse.outerwear}
              onChange={(v) => patch("outerwear", v)}
              textarea
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              {labeled(t("cases:labels.facialFeatures"))}
              <select
                value={corpse.facialFeatures}
                onChange={(e) =>
                  patch("facialFeatures", e.target.value as "clear" | "unclear" | "")
                }
                className={inputBase()}
              >
                <option value="">{t("cases:review.notProvided")}</option>
                <option value="clear">{t("cases:facialFeaturesOptions.clear")}</option>
                <option value="unclear">{t("cases:facialFeaturesOptions.unclear")}</option>
              </select>
              {corpse.facialFeatures === "unclear" && (
                <div className="mt-4">
                  <EditableField
                    label={t("cases:labels.facialFeaturesReason")}
                    value={corpse.facialFeaturesReason}
                    onChange={(v) => patch("facialFeaturesReason", v)}
                  />
                </div>
              )}
            </div>
            <div>
              {labeled(t("cases:labels.handFingerprints"))}
              <select
                value={corpse.handFingerprints}
                onChange={(e) =>
                  patch("handFingerprints", e.target.value as "yes" | "no" | "")
                }
                className={inputBase()}
              >
                <option value="">{t("cases:review.notProvided")}</option>
                <option value="yes">{t("cases:fingerprintOptions.yes")}</option>
                <option value="no">{t("cases:fingerprintOptions.no")}</option>
              </select>
              {corpse.handFingerprints === "no" && (
                <div className="mt-4">
                  <EditableField
                    label={t("cases:labels.handFingerprintsReason")}
                    value={corpse.handFingerprintsReason}
                    onChange={(v) => patch("handFingerprintsReason", v)}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Droplets size={14} className="text-[#0875a8]" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#0875a8]">
                {t("cases:labels.biologicalSample")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["blood", "tissue", "bones", "none"] as const).map((val) => {
                const checked = corpse.biologicalSample.includes(val);
                const labels: Record<string, string> = {
                  blood: t("cases:biologicalSamples.blood"),
                  tissue: t("cases:biologicalSamples.tissue"),
                  bones: t("cases:biologicalSamples.bones"),
                  none: t("cases:biologicalSamples.none"),
                };
                return (
                  <label
                    key={val}
                    className="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        let next: string[];
                        if (val === "none") {
                          next = checked ? [] : ["none"];
                        } else {
                          const filtered = corpse.biologicalSample.filter(
                            (v) => v !== "none"
                          );
                          next = checked
                            ? filtered.filter((v) => v !== val)
                            : [...filtered, val];
                        }
                        patch("biologicalSample", next);
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#005588] focus:ring-[#005588]"
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      {labels[val]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#fafcfe] p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f5fc] text-[#0089c7]">
                <Camera size={13} />
              </div>
              <p className="text-xs font-semibold text-[#12385a]">
                {t("cases:labels.corpseFiles")} #{index + 1}
              </p>
            </div>
            <EvidenceImage
              evidence={
                {
                  evidenceId: `corpse-${index}`,
                  evidenceType: "",
                  description: "",
                  images: corpse.images,
                } as EvidenceData
              }
              imageUrls={imageUrls}
              onChange={onImageAction}
            />
          </div>

          <EditableField
            label={t("cases:labels.notes")}
            value={corpse.notes}
            onChange={(v) => patch("notes", v)}
            textarea
          />
        </div>
      )}
    </div>
  );
}

export default function CorpsesCaseDetail({
  data,
  remoteImages,
  handlers,
}: {
  data: CaseData;
  remoteImages: RemoteImages;
  handlers: CorpsesHandlers;
}) {
  const corpsesInfo = data.corpsesCaseInfo;
  const corpsesList = Array.isArray(data.corpsesSpecifications)
    ? data.corpsesSpecifications
    : [data.corpsesSpecifications];
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => ({ 0: true }));
  const { t } = useTranslation(["cases", "common"]);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 bg-[#fef2f2]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <FileText size={15} />
          </div>
          <h2 className="text-xl font-bold text-[#12385a]">
            {t("cases:sections.corpsesCaseInfo")}
          </h2>
        </div>
        <div className="px-6 py-6 space-y-7">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen size={15} className="text-rose-500" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-rose-500">
                {t("cases:review.generalInfo")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <EditableField
                label={t("cases:labels.caseNumber")}
                value={corpsesInfo.caseNumber}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ caseNumber: v })}
              />
              <EditableField
                label={t("cases:labels.caseYear")}
                value={corpsesInfo.caseYear}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ caseYear: v })}
              />
              <EditableField
                label={t("cases:labels.governorate")}
                value={corpsesInfo.governorate}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ governorate: v })}
              />
              <EditableField
                label={t("cases:labels.policeDepartment")}
                value={corpsesInfo.policeDepartment}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ policeDepartment: v })}
              />
              <EditableField
                label={t("cases:labels.dateOfDiscovery")}
                value={corpsesInfo.dateOfDiscovery}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ dateOfDiscovery: v })}
                type="date"
              />
              <EditableField
                label={t("cases:labels.inspectionDate")}
                value={corpsesInfo.inspectionDate}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ inspectionDate: v })}
                type="date"
              />
              <EditableField
                label={t("cases:labels.photographyExpert")}
                value={corpsesInfo.photographyExpert}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ photographyExpert: v })}
              />
              <EditableField
                label={t("cases:labels.fingerprintExpert")}
                value={corpsesInfo.fingerprintExpert}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ fingerprintExpert: v })}
              />
              <EditableField
                label={t("cases:labels.notes")}
                value={corpsesInfo.note}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ note: v })}
                textarea
                full
              />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6">
            <div className="mb-5 flex items-center gap-2">
              <MapPin size={15} className="text-rose-500" />
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-rose-500">
                {t("cases:sections.location")} 
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <EditableField
                label={t("cases:labels.locationOfBodyPresence")}
                value={corpsesInfo.locationOfBodyPresence}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ locationOfBodyPresence: v })}
              />
              <EditableField
                label={t("cases:labels.findingLocation")}
                value={corpsesInfo.findingLocation}
                onChange={(v) => handlers.patchCorpsesCaseInfo({ findingLocation: v })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#fafcfe]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f5fc] text-[#0089c7]">
              <User size={15} />
            </div>
            <h2 className="text-xl font-bold text-[#12385a]">
              {t("cases:sections.corpsesSpecifications")} ({corpsesList.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={handlers.addCorpse}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#005588] px-4 text-[11px] font-semibold text-white transition hover:bg-[#00466f]"
          >
            <Plus size={13} />
            {t("cases:validation.addCorpse")}
          </button>
        </div>
        <div className="px-6 py-6 space-y-5">
          {corpsesList.length === 0 ? (
            <EmptyHint message={t("cases:validation.noCorpses")} />
          ) : (
            corpsesList.map((corpse, idx) => (
              <CorpseEditableCard
                key={`corpse-admin-card-${idx}`}
                index={idx}
                corpse={corpse}
                isExpanded={expanded[idx] ?? idx === corpsesList.length - 1}
                onToggleExpand={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [idx]: !(prev[idx] ?? true),
                  }))
                }
                onPatch={(p) => handlers.patchCorpsesSpecifications(idx, p)}
                onRemove={() => handlers.removeCorpse(idx)}
                showRemove={corpsesList.length > 1}
                imageUrls={remoteImages.corpseImages?.[idx] ?? []}
                onImageAction={(action, payload) =>
                  handlers.handleCorpseImageAction(idx, action, payload)
                }
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}