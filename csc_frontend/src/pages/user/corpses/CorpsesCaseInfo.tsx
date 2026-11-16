import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Hash,
  Building2,
  MapPin,
  Camera,
  Fingerprint,
  ArrowRight,
  FileText,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useCase } from "@/context/CaseContext";
import { GOVERNORATES_BILINGUAL } from "@/constants/governorates";

const inputCls = "h-10 sm:h-11 w-full rounded-lg border border-[#dbe5ec] bg-white pl-9 sm:pl-10 pr-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20 transition";

const selectCls = "h-10 sm:h-11 w-full appearance-none rounded-lg border border-[#dbe5ec] bg-white px-3 pr-9 text-xs sm:text-sm text-[#475569] outline-none focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20 transition";

const textareaCls = "w-full min-h-[110px] sm:min-h-[130px] resize-y rounded-lg border border-[#dbe5ec] bg-white px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#475569] outline-none placeholder:text-[#64748b] focus:border-[#0089c7] focus:ring-1 focus:ring-[#0089c7]/20 transition";

const labelCls =
  "mb-1.5 sm:mb-2 block text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#0875a8]";

const iconWrap =
  "pointer-events-none absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#64748b]";

export default function CorpsesCaseInfo() {
  const { t } = useTranslation(["cases", "common"]);
  const navigate = useNavigate();
  const { caseData, updateCorpsesCaseInfo, setCaseType, resetCase } =
    useCase();
  const data = caseData.corpsesCaseInfo;

  const [selectedGovernorate, setSelectedGovernorate] = useState<string>(
    data.governorate || ""
  );

  useEffect(() => {
    setCaseType("corpses");
  }, [setCaseType]);

  function validateAndGoNext(): void {
    navigate("/user/corpses/specifications");
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
                <FileText size={16} className="sm:hidden" />
                <FileText size={18} className="hidden sm:block" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#0f2942]">
                {t("cases:steps.corpses.step1Title")}
                
              </h1>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
              {t("cases:steps.corpses.step1Subtitle")}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold text-[#64748b]">
              {t("cases:steps.corpses.step1Of3")}
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="h-1 w-6 rounded-full bg-[#005588]" />
              <span className="h-1 w-6 rounded-full bg-[#dbe5ec]" />
              <span className="h-1 w-6 rounded-full bg-[#dbe5ec]" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dbe5ec] bg-white p-4 sm:p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
            <div>
              <label className={labelCls}>
                {t("cases:labels.caseNumber")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={data.caseNumber}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({ caseNumber: e.target.value })
                  }
                  placeholder={t("cases:selects.caseCodeExample")}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {t("cases:labels.caseYear")}
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={data.caseYear}
                onChange={(e) =>
                  updateCorpsesCaseInfo({ caseYear: e.target.value })
                }
                placeholder={t("cases:selects.caseYear")}
                className={selectCls.replace("appearance-none", "").replace("pr-9", "pr-3")}
              />
            </div>

            <div>
              <label className={labelCls}>
                {t("cases:labels.governorate")}
              </label>
              <div className="relative">
                <select
                  value={data.governorate}
                  onChange={(e) => {
                    const newGov = e.target.value;
                    setSelectedGovernorate(newGov);
                    updateCorpsesCaseInfo({
                      governorate: newGov,
                      policeDepartment: "",
                    });
                  }}
                  className={selectCls}
                >
                  <option value="">{t("cases:selects.selectGovernorate")}</option>
                  {Object.keys(GOVERNORATES_BILINGUAL).map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {t("cases:labels.policeDepartment")}
              </label>
              <div className="relative">
                <select
                  value={data.policeDepartment}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({
                      policeDepartment: e.target.value,
                    })
                  }
                  disabled={!selectedGovernorate}
                  className={selectCls}
                >
                  <option value="">
                    {selectedGovernorate
                      ? t("cases:selects.selectPoliceDepartment")
                      : t("cases:selects.selectGovernorateFirst")}
                  </option>
                  {selectedGovernorate &&
                    GOVERNORATES_BILINGUAL[selectedGovernorate]?.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {t("cases:labels.dateOfDiscovery")}
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <CalendarDays size={16} className="sm:hidden" />
                  <CalendarDays size={18} className="hidden sm:block" />
                </div>
                <input
                  type="date"
                  value={data.dateOfDiscovery}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({ dateOfDiscovery: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {t("cases:labels.inspectionDate")}
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <CalendarDays size={16} className="sm:hidden" />
                  <CalendarDays size={18} className="hidden sm:block" />
                </div>
                <input
                  type="date"
                  value={data.inspectionDate}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({ inspectionDate: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>
                {t("cases:labels.locationOfBodyPresence")}
              </label>
              <div className="relative">
                <div className={iconWrap}>
                  <Stethoscope size={16} className="sm:hidden" />
                  <Stethoscope size={18} className="hidden sm:block" />
                </div>
                <input
                  type="text"
                  value={data.locationOfBodyPresence}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({
                      locationOfBodyPresence: e.target.value,
                    })
                  }
                  placeholder={t("cases:selects.morgueHospitalEtc")}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>{t("cases:labels.findingLocation")}</label>
              <div className="relative">
                <div className={`${iconWrap} top-3 sm:top-3.5 -translate-y-0`}>
                  <MapPin size={16} className="sm:hidden" />
                  <MapPin size={18} className="hidden sm:block" />
                </div>
                <textarea
                  value={data.findingLocation}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({ findingLocation: e.target.value })
                  }
                  placeholder={t("cases:selects.findingLocationDetail")}
                  className={`${textareaCls} pl-9 sm:pl-10`}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 border-t border-[#e5edf2] pt-5 sm:pt-6 md:pt-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#12385a]">
                {t("cases:sections.inspectionTeam")}{" "}
                <span className="text-sm sm:text-base md:text-lg font-normal text-[#64748b]">
                  
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
              <div>
                <label className={labelCls}>
                  {t("cases:labels.photographyExpert")}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Camera size={16} className="sm:hidden" />
                    <Camera size={18} className="hidden sm:block" />
                  </div>
                  <input
                    type="text"
                    value={data.photographyExpert}
                    onChange={(e) =>
                      updateCorpsesCaseInfo({
                        photographyExpert: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  {t("cases:labels.fingerprintExpert")}
                </label>
                <div className="relative">
                  <div className={iconWrap}>
                    <Fingerprint size={16} className="sm:hidden" />
                    <Fingerprint size={18} className="hidden sm:block" />
                  </div>
                  <input
                    type="text"
                    value={data.fingerprintExpert}
                    onChange={(e) =>
                      updateCorpsesCaseInfo({ fingerprintExpert: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>{t("cases:labels.note")}</label>
                <textarea
                  value={data.note}
                  onChange={(e) =>
                    updateCorpsesCaseInfo({ note: e.target.value })
                  }
                  placeholder="Enter details of the circumstances surrounding the finding of the deceased..."
                  className={textareaCls}
                  rows={5}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="h-10 sm:h-12 px-6 sm:px-8 rounded-2xl border border-[#dbe5ec] bg-white text-xs sm:text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] hover:border-[#c5d4e0] transition"
          >
            {t("cases:actions.cancel")}
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

