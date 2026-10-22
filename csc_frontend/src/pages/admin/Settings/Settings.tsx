import React from "react";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation(["settings", "common"]);
  const isRtl = i18n.resolvedLanguage === "ar";

  return (
    <div className={`space-y-8 ${isRtl ? "text-right font-[system-ui]" : ""}`}>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("settings:title")}
        </h2>
        <p className="text-gray-500">
          {t("settings:subtitle")}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <SettingsIcon size={32} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">
              {t("settings:sections.general")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {t("common:pleaseWait")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
