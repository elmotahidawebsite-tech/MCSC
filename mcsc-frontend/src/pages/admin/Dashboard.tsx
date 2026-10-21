import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "node_modules/react-i18next";
import {
  Building2,
  FolderOpen,
  ArrowRight,
  Tablet,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../../api/client";

interface Station {
  id: string;
  name: string;
  username: string;
  role: string;
  casesCount: number;
  icon: typeof Building2;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const isRtl = i18n.resolvedLanguage === "ar";

  const [totalStations, setTotalStations] = useState<number>(0);
  const [totalCases, setTotalCases] = useState<number>(0);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const usersRes = await api.get("/users/");
        const users: any[] = usersRes.data ?? [];
        const stationUsers = users.filter((u) => u.role !== "admin");

        const casesRes = await api.get("/cases/?page=1");
        const casesCount = casesRes.data?.count ?? 0;

        if (cancelled) return;

        const stationsWithCounts: Station[] = await Promise.all(
          stationUsers.map(async (u) => {
            try {
              const userCases = await api.get(
                `/cases/?page=1&station=${encodeURIComponent(u.username)}`
              );
              return {
                id: u.username,
                name: u.username.charAt(0).toUpperCase() + u.username.slice(1),
                username: u.username,
                role: u.role,
                casesCount: userCases.data?.count ?? 0,
                icon: Tablet,
              };
            } catch {
              return {
                id: u.username,
                name: u.username.charAt(0).toUpperCase() + u.username.slice(1),
                username: u.username,
                role: u.role,
                casesCount: 0,
                icon: Tablet,
              };
            }
          })
        );

        setStations(stationsWithCounts);
        setTotalStations(stationUsers.length);
        setTotalCases(casesCount);
      } catch (e) {
        console.error(e);
        toast.error(t("common:messages.errorOccurred"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
}, []);

  function viewStationCases(username: string) {
    navigate(`/admin/cases?station=${encodeURIComponent(username)}`);
  }

  return (
    <div className={`space-y-12 ${isRtl ? "text-right font-[system-ui]" : ""}`}>
      <Toaster position={isRtl ? "top-left" : "top-right"} />

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className={`relative bg-slate-50/80 rounded-3xl border border-slate-200/70 p-8 overflow-hidden`}>
          <p className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">
            {t("dashboard:stats.totalStations")}
          </p>
          <div className={`mt-4 flex items-end justify-between`}>
            {loading ? (
              <div className="h-14 w-24 bg-slate-200 rounded-xl animate-pulse" />
            ) : (
              <p className="text-5xl font-bold text-gray-900">{totalStations}</p>
            )}
            <Building2
              size={72}
              className={`text-slate-200 absolute top-1/2 -translate-y-1/2 ${
                isRtl ? "left-6" : "right-6"
              }`}
              strokeWidth={1}
            />
          </div>
        </div>

        <div className={`relative bg-slate-50/80 rounded-3xl border border-slate-200/70 p-8 overflow-hidden`}>
          <p className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">
            {t("dashboard:stats.totalCases")}
          </p>
          <div className={`mt-4 flex items-end justify-between`}>
            {loading ? (
              <div className="h-14 w-24 bg-slate-200 rounded-xl animate-pulse" />
            ) : (
              <p className="text-5xl font-bold text-gray-900">
                {totalCases.toLocaleString()}
              </p>
            )}
            <FolderOpen
              size={72}
              className={`text-slate-200 absolute top-1/2 -translate-y-1/2 ${
                isRtl ? "left-6" : "right-6"
              }`}
              strokeWidth={1}
            />
          </div>
        </div>
      </div>

      {/* ===== Section Header ===== */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">{t("dashboard:admin.title")}</h2>
        <p className="text-gray-500">
          {t("dashboard:admin.subtitle")}
        </p>
      </div>

      {/* ===== Stations Grid ===== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200/80 p-7 flex flex-col gap-6 h-64"
            >
              <div className="flex items-start justify-between">
                <div className="h-6 w-16 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-12 w-12 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
              <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse" />
              <div className="border-t border-slate-100 pt-5 space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-12 bg-slate-200 rounded-2xl animate-pulse mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {stations.map((station) => {
            const Icon = station.icon;
            return (
              <div
                key={station.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-7 flex flex-col gap-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div className={`flex items-start justify-between`}>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-[#005588] text-xs font-bold tracking-wide">
                    {station.role === "admin" ? t("dashboard:stationType.admin") : t("dashboard:stationType.station")}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <Icon size={22} className="text-[#005588]" strokeWidth={2} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {station.name}
                </h3>

                <div className="border-t border-slate-100 pt-5 space-y-1">
                  <p className="text-sm text-gray-500">{t("dashboard:admin.totalCases")}</p>
                  <p className="text-2xl font-bold text-[#005588]">
                    {station.casesCount}
                  </p>
                </div>

                <button
                  onClick={() => viewStationCases(station.username)}
                  className={`mt-2 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white border border-slate-200 text-gray-800 font-semibold text-sm hover:bg-[#005588] hover:text-white hover:border-[#005588] transition-all duration-200 group ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  {t("dashboard:admin.viewCases")}
                  <ArrowRight
                    size={18}
                    className={`transition-transform ${
                      isRtl
                        ? "group-hover:-translate-x-0.5 rotate-180"
                        : "group-hover:translate-x-0.5"
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            );
          })}

          {stations.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              {t("dashboard:admin.noStationsFound")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
