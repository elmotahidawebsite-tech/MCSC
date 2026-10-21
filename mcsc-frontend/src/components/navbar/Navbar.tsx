import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "node_modules/react-i18next";

export function Navbar() {
    const { user } = useAuth();
    const location = useLocation();

    const { t, i18n } = useTranslation("navbar");
    const [languageOpen, setLanguageOpen] = useState(false);

    const getTitle = () => {
        if (location.pathname.startsWith("/admin/dashboard")) {
            return t("titles.adminDashboard");
        }

        if (location.pathname.startsWith("/admin/cases")) {
            return t("titles.adminCases");
        }

        if (location.pathname.startsWith("/admin/users")) {
            return t("titles.adminUsers");
        }

        if (location.pathname.startsWith("/admin/settings")) {
            return t("titles.adminSettings");
        }

        if (location.pathname.startsWith("/user/dashboard")) {
            return t("titles.userDashboard");
        }

        return t("titles.default");
    };

    const changeLanguage = (language: "en" | "ar") => {
        i18n.changeLanguage(language);

        localStorage.setItem("language", language);

        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = language;

        setLanguageOpen(false);
    };

    const avatarInitial = user?.username?.toUpperCase() ?? "A";

    const currentLanguage = i18n.language === "ar" ? t("language.arabic") : t("language.english");

    return (
        <header className="flex h-20 items-center justify-between border-b bg-white px-4 ps-16 xl:px-10">

            <h1 className="text-xl font-bold text-gray-800">
                {getTitle()}
            </h1>

            <div className="flex items-center gap-4 ms-auto">

                {/* Language Dropdown */}
                <div className="relative">

                    <button
                        onClick={() => setLanguageOpen(!languageOpen)}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-slate-100"
                    >
                        <span>
                            {currentLanguage}
                        </span>

                        <ChevronDown
                            size={16}
                            className={`transition-transform ${
                                languageOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {languageOpen && (
                        <div className="absolute end-0 z-50 mt-2 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">

                            <button
                                onClick={() => changeLanguage("en")}
                                className={`flex w-full items-center px-4 py-2 text-sm transition hover:bg-slate-100 ${
                                    i18n.language === "en"
                                        ? "bg-slate-50 font-semibold"
                                        : ""
                                }`}
                            >
                                🇬🇧 {t("language.english")}
                            </button>

                            <button
                                onClick={() => changeLanguage("ar")}
                                className={`flex w-full items-center px-4 py-2 text-sm transition hover:bg-slate-100 ${
                                    i18n.language === "ar"
                                        ? "bg-slate-50 font-semibold"
                                        : ""
                                }`}
                            >
                                🇪🇬 {t("language.arabic")}
                            </button>

                        </div>
                    )}

                </div>

                {/* Avatar */}
                <div className="flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 p-2 text-base font-semibold text-[#005588]">
                    {avatarInitial}
                </div>

            </div>
        </header>
    );
}