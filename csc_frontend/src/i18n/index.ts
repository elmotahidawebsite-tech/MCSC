import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import arCommon from "./locales/ar/common.json";

import enAuth from "./locales/en/auth.json";
import arAuth from "./locales/ar/auth.json";

import enDashboard from "./locales/en/dashboard.json";
import arDashboard from "./locales/ar/dashboard.json";

import enCases from "./locales/en/cases.json";
import arCases from "./locales/ar/cases.json";

import enSidebar from "./locales/en/sidebar.json";
import arSidebar from "./locales/ar/sidebar.json";

import enNavbar from "./locales/en/navbar.json";
import arNavbar from "./locales/ar/navbar.json";

import enUsers from "./locales/en/users.json";
import arUsers from "./locales/ar/users.json";

import enSettings from "./locales/en/settings.json";
import arSettings from "./locales/ar/settings.json";

const savedLanguage = localStorage.getItem("language") || "en";

if (typeof document !== "undefined") {
  document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = savedLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        cases: enCases,
        sidebar: enSidebar,
        navbar: enNavbar,
        users: enUsers,
        settings: enSettings,
      },
      ar: {
        common: arCommon,
        auth: arAuth,
        dashboard: arDashboard,
        cases: arCases,
        sidebar: arSidebar,
        navbar: arNavbar,
        users: arUsers,
        settings: arSettings,
      },
    },

    lng: savedLanguage,
    fallbackLng: "en",
    defaultNS: "common",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
