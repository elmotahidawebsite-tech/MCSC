import { useEffect, useMemo, useState ,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Upload,ChevronLeft,ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "node_modules/react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../../api/client";
import {  useSearchParams } from "react-router-dom";

const PAGE_SIZE = 20;

type ApiCase = {
  id: number;
  case_code: string;
  case_number: string;
  case_type: string;
  report_number: string;
  incident_type: string;
  inspection_date: string | null;
  date_of_discovery: string | null;
  created_at: string;
  description: string;
  location_name: string;
  location_of_body_presence: string;
  address: string;
  governorate: string;
  city: string;
  district: string;
  created_by_username: string;
};

export default function Cases() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["cases", "common"]);
  const isRtl = i18n.resolvedLanguage === "ar";
  const ALL_STATIONS = t("cases:filters.allStations");

  const [stations, setStations] = useState<string[]>([ALL_STATIONS]);
  const [searchParams] = useSearchParams();
  const initialStation = searchParams.get("station") || ALL_STATIONS;


  const [stationFilter, setStationFilter] = useState<string>(initialStation);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [appliedStation, setAppliedStation] = useState<string>(initialStation);
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [importing, setImporting] = useState<boolean>(false);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const [cases, setCases] = useState<ApiCase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/");
        const names = (data ?? []).map((u: any) => u.username);
        setStations([ALL_STATIONS, ...names]);
      } catch (e) {
        console.error("Failed fetching users:", e);
      }
    })();
  }, [ALL_STATIONS]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));

        if (appliedStation && appliedStation !== ALL_STATIONS) {
          params.set("station", appliedStation);
        }
        if (appliedFrom) {
          params.set("date_after", appliedFrom);
        }
        if (appliedTo) {
          params.set("date_before", appliedTo);
        }

        const { data } = await api.get(`/cases/?${params.toString()}`);

        if (!cancelled) {
          setCases(data.results ?? []);
          setTotalCount(data.count ?? 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appliedStation, appliedFrom, appliedTo, page, ALL_STATIONS]);

  const filteredCount = totalCount;
  const scaledTotalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const safePage = Math.min(page, scaledTotalPages);
  const pagedCases = cases;

  function onApply(): void {
    setAppliedStation(stationFilter);
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setPage(1);
  }

  function goToPage(n: number): void {
    setPage(Math.max(1, Math.min(n, scaledTotalPages)));
  }

  function visiblePageNumbers(): (number | "dots")[] {
    const total = scaledTotalPages;
    const cur = safePage;
    if (total <= 7) {
      const arr: number[] = [];
      for (let i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    const result: (number | "dots")[] = [1];
    if (cur > 3) result.push("dots");
    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (cur < total - 2) result.push("dots");
    result.push(total);
    return result;
  }

 async function handleImport(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
  const file = e.target.files?.[0];
  if (!file) return;

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".json") && !lower.endsWith(".zip")) {
    toast.error(t("cases:import.invalidFileType"));
    if (importFileRef.current) importFileRef.current.value = "";
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    toast.error(t("cases:import.fileTooLarge"));
    if (importFileRef.current) importFileRef.current.value = "";
    return;
  }

  setImporting(true);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/cases/import/", fd);
    toast.success(
      t("cases:import.success") + ` · ${data.case_code}`,
      { duration: 4000 }
    );
    setPage(1);
    const params = new URLSearchParams();
    params.set("page", "1");
    if (appliedStation && appliedStation !== ALL_STATIONS) params.set("station", appliedStation);
    if (appliedFrom) params.set("date_after", appliedFrom);
    if (appliedTo) params.set("date_before", appliedTo);
    const { data: refreshed } = await api.get(`/cases/?${params.toString()}`);
    setCases(refreshed.results ?? []);
    setTotalCount(refreshed.count ?? 0);
  } catch (err: any) {
    console.error(err);
    const detail = err?.response?.data?.detail;
    toast.error(detail ? `Import failed: ${detail}` : t("cases:import.failed"));
  } finally {
    setImporting(false);
    if (importFileRef.current) importFileRef.current.value = "";
  }
}

  const ColumnHeader = ({ key1, key2 }: { key1: string; key2?: string }) => (
    <th className={`px-6 py-5 font-semibold text-[11px] text-gray-500 tracking-wider uppercase ${isRtl ? "text-right" : "text-left"}`}>
      {t(key1)}
      {key2 ? (
        <span className="block text-[9px] font-normal text-gray-400 mt-0.5 tracking-normal normal-case">
          {t(key2)}
        </span>
      ) : null}
    </th>
  );

  return (
    <div className={`space-y-8 ${isRtl ? "text-right font-[system-ui]" : ""}`}>
      <Toaster position={isRtl ? "top-left" : "top-right"} />

      {/* Filters */}
      <div className="bg-slate-50/80 rounded-3xl border border-slate-200/70 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              {t("cases:filters.station")}
            </label>
            

            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className={`w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#005588]/30 focus:border-[#005588] appearance-none cursor-pointer ${isRtl ? "text-right" : ""}`}
            >
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              {t("cases:filters.fromDate")}
            </label>
            
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#005588]/30 focus:border-[#005588]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              {t("cases:filters.toDate")}
            </label>
            
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#005588]/30 focus:border-[#005588]"
            />
          </div>

          <div className="md:col-span-3">
            <button
              onClick={onApply}
              className={`w-full h-12 px-6 rounded-2xl bg-[#005588] text-white font-semibold text-sm hover:bg-[#004670] transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-[#005588]/20 ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <Filter size={18} strokeWidth={2.5} />
              {t("cases:filters.apply")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="px-8 py-8 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t("cases:repository.title")}
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                {t("cases:repository.subtitle")}{" "}
                <span className="font-semibold text-gray-700">
                  {filteredCount.toLocaleString()}
                </span>{" "}
                {t("cases:repository.subtitleCount")}{" "}
                <span className="font-semibold text-gray-700">
                  {Math.max(0, stations.length - 1)}
                </span>{" "}
                {t("cases:repository.subtitleStations")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              disabled={importing}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <Upload size={17} />
              {importing ? t("cases:import.inProgress") : t("cases:import.button")}
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept=".json,.zip,application/json,application/zip"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>

        {loading ? (
          <div className="px-8 py-16 text-center text-gray-500">
            {t("cases:table.loading")}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isRtl ? "text-right" : "text-left"}`}>
                <thead>
                  <tr className="bg-slate-50/80 border-t border-b border-slate-100">
                    <ColumnHeader key1="cases:table.caseCode" />
                    <ColumnHeader key1="cases:table.caseType" />
                    <ColumnHeader key1="cases:table.caseId" />
                    
                    <ColumnHeader key1="cases:table.station" />
                  </tr>
                </thead>
                <tbody>
                  {pagedCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center px-6 py-16 text-gray-400 text-sm">
                        {t("cases:table.noMatches")}
                      </td>
                    </tr>
                  ) : (
                    pagedCases.map((c: ApiCase) => {
                      const isBody = c.case_type === "body";
                      const isCivil = c.case_type === "civil";
                      const displayId = isBody ? (c.report_number || c.case_number || "—") : (c.case_number || "—");
                      const displayIncidentType = isBody ? `${t("cases:incident.bodyType")} (${t("cases:caseTypeLabels.corpsesAr")})` : (c.incident_type || "—");
                      const displayDate = isBody
                        ? (c.date_of_discovery ? c.date_of_discovery.slice(0, 10) : (c.inspection_date ? c.inspection_date.slice(0, 10) : "—"))
                        : (c.inspection_date ? c.inspection_date.slice(0, 10) : "—");
                      const displayScene = isBody ? (c.location_of_body_presence || c.location_name || "—") : (c.location_name || "—");
                      let typeBadge = "bg-blue-50 text-[#0875a8] border-blue-200";
                      let typeLabel = `${t("cases:caseTypeLabels.criminal")}`;
                      if (isBody) {
                        typeBadge = "bg-rose-50 text-rose-600 border-rose-200";
                        typeLabel = `${t("cases:incident.bodyType")}`;
                      } else if (isCivil) {
                        typeBadge = "bg-amber-50 text-amber-700 border-amber-200";
                        typeLabel = `${t("cases:caseTypeLabels.civil")} `;
                      }
                      return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/admin/cases/${c.id}`)}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-5 font-bold text-[15px] text-[#005588] whitespace-nowrap">
                          {c.case_code}
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeBadge}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-gray-800 font-semibold whitespace-nowrap">
                          {displayId}
                        </td>
                        
                        <td className="px-6 py-5 text-gray-600 whitespace-nowrap">
                          {c.created_by_username}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={`px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/40 ${isRtl ? "md:flex-row-reverse" : ""}`}>
              <p className="text-sm text-gray-500">
                {t("cases:pagination.pageLabel")}{" "}
                <span className="font-semibold text-gray-700">{safePage}</span>{" "}
                {t("cases:pagination.of")}{" "}
                <span className="font-semibold text-gray-700">{scaledTotalPages}</span>
              </p>

              <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={() => goToPage(1)}
                  disabled={safePage === 1}
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-gray-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center"
                  aria-label={t("cases:pagination.first")}
                >
                  {isRtl ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                </button>
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-gray-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center"
                  aria-label={t("cases:pagination.previous")}
                >
                  {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>

                {visiblePageNumbers().map((p, idx) =>
                  p === "dots" ? (
                    <span
                      key={`dots-${idx}`}
                      className="h-10 w-10 inline-flex items-center justify-center text-gray-400 text-sm"
                    >
                      ···
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-10 min-w-10 px-3 rounded-xl text-sm font-semibold transition ${
                        p === safePage
                          ? "bg-[#005588] text-white shadow-lg shadow-[#005588]/30"
                          : "border border-slate-200 bg-white text-gray-700 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === scaledTotalPages}
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-gray-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center"
                  aria-label={t("cases:pagination.next")}
                >
                  {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
                <button
                  onClick={() => goToPage(scaledTotalPages)}
                  disabled={safePage === scaledTotalPages}
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-gray-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center"
                  aria-label={t("cases:pagination.last")}
                >
                  {isRtl ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
