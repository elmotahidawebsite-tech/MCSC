
import { useTranslation } from "react-i18next";

export function LoadingScreen() {
  const { t } = useTranslation("common");
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("common:actions.loading")}
      className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
       
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 h-full w-full rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-transparent border-t-[#005588] border-r-[#005588]" />
        </div>

        <p className="text-sm font-medium text-slate-600 tracking-wide">
          {t("common:actions.loading")}
        </p>

        <span className="sr-only">{t("common:pleaseWait")}</span>
      </div>
    </div>
  );
}
