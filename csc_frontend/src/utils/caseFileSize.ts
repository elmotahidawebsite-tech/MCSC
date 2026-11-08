/**
 * Global case-level file size tracking and validation
 * Ensures the total size of ALL attachments in ONE case never exceeds 200 MB
 */

import type { CaseData, PersonData, EvidenceData, CorpsesSpecifications } from "@/context/CaseContext";

/**
 * Maximum total file size for all attachments in a single case (200 MB)
 */
export const MAX_CASE_TOTAL_SIZE = 200 * 1024 * 1024; // 200 MB in bytes
import { useTranslation } from "react-i18next";

/**
 * Calculate the total size of all files attached to a person
 */
function getPersonFilesSize(person: PersonData): number {
  return person.images.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Calculate the total size of all files attached to evidence
 */
function getEvidenceFilesSize(evidence: EvidenceData): number {
  return evidence.images.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Calculate the total size of all files attached to corpses specifications
 */
function getCorpsesSpecsFilesSize(specs: CorpsesSpecifications): number {
  return specs.images.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Calculate the total size of ALL attachments in the entire case
 */
export function calculateCaseTotalSize(caseData: CaseData): number {
  let total = 0;

  // Criminal case files
  if (caseData.caseType === "criminal") {
    // Victims
    total += caseData.victims.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Suspects
    total += caseData.suspects.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Reporters
    total += caseData.reporters.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Evidence
    total += caseData.evidence.reduce(
      (sum, evidence) => sum + getEvidenceFilesSize(evidence),
      0
    );
  }

  // Corpses case files
  if (caseData.caseType === "corpses") {
    // Victims
    total += caseData.victims.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Suspects
    total += caseData.suspects.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Reporters
    total += caseData.reporters.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Evidence
    total += caseData.evidence.reduce(
      (sum, evidence) => sum + getEvidenceFilesSize(evidence),
      0
    );

    // Corpses specifications (multiple corpses)
    total += caseData.corpsesSpecifications.reduce(
      (sum, specs) => sum + getCorpsesSpecsFilesSize(specs),
      0
    );
  }

  // Civil case files
  if (caseData.caseType === "civil") {
    // Civil case info images
    total += (caseData.civilCaseInfo.images || []).reduce(
      (sum, file) => sum + file.size,
      0
    );

    // Victims
    total += caseData.victims.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Suspects
    total += caseData.suspects.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Reporters
    total += caseData.reporters.reduce(
      (sum, person) => sum + getPersonFilesSize(person),
      0
    );

    // Evidence
    total += caseData.evidence.reduce(
      (sum, evidence) => sum + getEvidenceFilesSize(evidence),
      0
    );
  }

  return total;
}

/**
 * Calculate the size of an array of files
 */
export function calculateFilesSize(files: File[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    const { t } = useTranslation(["cases", "common"]);

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${t("fileSize.megabyte")}`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} ${t("fileSize.kilobyte")}`;
  }
  return `${bytes} ${t("fileSize.byte")}`;
}

/**
 * Validate if adding new files would exceed the case total limit
 */
export interface CaseFileSizeValidation {
  isValid: boolean;
  errorMessage?: string;
  currentTotal: number;
  newFilesSize: number;
  projectedTotal: number;
  remainingCapacity: number;
  maxAllowed: number;
}

export function validateCaseFileSize(
  caseData: CaseData,
  newFiles: File[]
): CaseFileSizeValidation {
  const currentTotal = calculateCaseTotalSize(caseData);
  const newFilesSize = calculateFilesSize(newFiles);
  const projectedTotal = currentTotal + newFilesSize;
  const remainingCapacity = MAX_CASE_TOTAL_SIZE - currentTotal;
  const maxAllowed = MAX_CASE_TOTAL_SIZE;

  if (projectedTotal > MAX_CASE_TOTAL_SIZE) {
    return {
      isValid: false,
      errorMessage: `تجاوز الحد الأقصى للملفات. الحجم الحالي: ${formatBytes(currentTotal)} · الملفات الجديدة: ${formatBytes(newFilesSize)} · المتاح: ${formatBytes(remainingCapacity)} · الحد الأقصى: ${formatBytes(maxAllowed)}`,
      currentTotal,
      newFilesSize,
      projectedTotal,
      remainingCapacity,
      maxAllowed,
    };
  }

  return {
    isValid: true,
    currentTotal,
    newFilesSize,
    projectedTotal,
    remainingCapacity,
    maxAllowed,
  };
}

/**
 * Get case file size statistics for display
 */
export interface CaseFileSizeStats {
  totalUsed: number;
  totalUsedFormatted: string;
  remainingCapacity: number;
  remainingCapacityFormatted: string;
  maxAllowed: number;
  maxAllowedFormatted: string;
  usagePercentage: number;
}

export function getCaseFileSizeStats(caseData: CaseData): CaseFileSizeStats {
  const totalUsed = calculateCaseTotalSize(caseData);
  const remainingCapacity = MAX_CASE_TOTAL_SIZE - totalUsed;
  const usagePercentage = (totalUsed / MAX_CASE_TOTAL_SIZE) * 100;

  return {
    totalUsed,
    totalUsedFormatted: formatBytes(totalUsed),
    remainingCapacity,
    remainingCapacityFormatted: formatBytes(remainingCapacity),
    maxAllowed: MAX_CASE_TOTAL_SIZE,
    maxAllowedFormatted: formatBytes(MAX_CASE_TOTAL_SIZE),
    usagePercentage,
  };
}
