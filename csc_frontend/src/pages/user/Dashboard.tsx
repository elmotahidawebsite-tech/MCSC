import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FilePlus, ArrowRight, ShieldCheck, Stethoscope, Scale } from "lucide-react";
import { useCase } from "@/context/CaseContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { resetCase, setCaseType } = useCase();
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const isRtl = i18n.resolvedLanguage === "ar";

  function goToCaseInfo() {
    resetCase();
    setCaseType("criminal");
    navigate("/user/cases/info");
  }

  function goToCorpsesCaseInfo() {
    resetCase();
    setCaseType("corpses");
    navigate("/user/corpses/info");
  }

  function goToCivilCaseInfo() {
    resetCase();
    setCaseType("civil");
    navigate("/user/civil/info");
  }

  const caseCards = [
    {
      key: "criminal",
      onClick: goToCaseInfo,
      Icon: FilePlus,
      gradientClass: "from-[#005588] via-[#0089c7] to-[#005588]",
    },
    {
      key: "corpses",
      onClick: goToCorpsesCaseInfo,
      Icon: Stethoscope,
      gradientClass: "from-[#005588] via-[#0089c7] to-[#005588]",
    },
    {
      key: "civil",
      onClick: goToCivilCaseInfo,
      Icon: Scale,
      gradientClass: "from-[#005588] via-[#0089c7] to-[#005588]",
    },
  ];

  return (
    <div className={`mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 ${isRtl ? "text-right font-[system-ui]" : ""}`}>
      {/* Welcome Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f2942]">
          {t("dashboard:user.welcomeTitle")}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
          {t("dashboard:user.welcomeSubtitle")}
        </p>
      </div>

      {caseCards.map((card) => {
        const { key, onClick, Icon, gradientClass } = card;
        return (
          <div
            key={key}
            onClick={onClick}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#dbe5ec] bg-white p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 shadow-sm transition hover:shadow-md hover:border-[#c5d4e0]"
          >

            <div className={`flex sm:items-center sm:justify-between gap-4 sm:gap-6 mt-6 sm:mt-0 flex-col sm:flex-row ${isRtl ? "sm:flex-row-reverse" : ""}`}>
              <div className={`flex items-start gap-3 sm:gap-5 ${isRtl ? "flex-row-reverse" : ""}`}>
                {/* Icon square */}
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-[#005588] text-white shadow-sm shadow-[#005588]/20">
                  <Icon size={22} className="sm:hidden" />
                  <Icon size={24} className="hidden sm:block" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0f2942]">
                    {t(`dashboard:user.cards.${key}.title`)}
                  </h2>

                  {/* Subtle trust indicator */}
                  <div className={`mt-3 sm:mt-4 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-[#e5f5fc] text-[#0089c7]">
                      <ShieldCheck size={12} className="sm:hidden" />
                      <ShieldCheck size={13} className="hidden sm:block" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#475569]">
                      {t(`dashboard:user.cards.${key}.badge`)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow CTA */}
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1f7fb] text-[#005588] transition group-hover:bg-[#005588] group-hover:text-white">
                <ArrowRight
                  size={18}
                  className={`sm:hidden ${isRtl ? "rotate-180" : ""}`}
                />
                <ArrowRight
                  size={20}
                  className={`hidden sm:block ${isRtl ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {/* Decorative subtle gradient bar */}
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${gradientClass}`} />
          </div>
        );
      })}
    </div>
  );
}
