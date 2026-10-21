import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "node_modules/react-i18next";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.resolvedLanguage === "ar";

  return (
    <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-800 mt-5">
          403 — {t("common:permissionDenied")}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {t("common:permissionDenied")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 h-11 px-6 bg-[#005588] hover:bg-[#00466f] rounded-lg text-white font-semibold"
        >
          {t("common:back")}
        </button>
      </div>
    </main>
  );
}
