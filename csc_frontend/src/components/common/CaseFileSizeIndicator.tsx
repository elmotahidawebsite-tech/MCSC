import { useTranslation } from "react-i18next";
import { useCase } from "@/context/CaseContext";
import { getCaseFileSizeStats } from "@/utils/caseFileSize";
import { HardDrive } from "lucide-react";

/**
 * Displays the current file storage usage for the entire case
 * Shows total used, remaining capacity, and progress bar
 */
export function CaseFileSizeIndicator() {
  const { t } = useTranslation(["cases", "common"]);
  const { caseData } = useCase();
  const stats = getCaseFileSizeStats(caseData);

  // Don't show if nothing uploaded yet
  if (stats.totalUsed === 0) {
    return null;
  }

  // Color based on usage percentage
  const getColor = () => {
    if (stats.usagePercentage >= 90) return "text-rose-600 bg-rose-50 border-rose-200";
    if (stats.usagePercentage >= 70) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  const getProgressColor = () => {
    if (stats.usagePercentage >= 90) return "bg-rose-500";
    if (stats.usagePercentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={`rounded-lg border p-3 ${getColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        <HardDrive size={16} />
        <span className="text-xs font-bold">{t("cases:fileSize.totalCaseFileSize")}</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{t("cases:fileSize.used")}: {stats.totalUsedFormatted}</span>
          <span>{t("cases:fileSize.remaining")}: {stats.remainingCapacityFormatted}</span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
          />
        </div>
        
        <div className="text-[10px] opacity-75">
          {t("cases:fileSize.maxLimit")}: {stats.maxAllowedFormatted} ({stats.usagePercentage.toFixed(1)}% {t("cases:fileSize.usedPercent")})
        </div>
      </div>
    </div>
  );
}
