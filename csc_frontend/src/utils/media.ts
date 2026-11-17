/**
 * Media utility functions for file upload and display.
 * Used across criminal, civil, and corpses case forms.
 */

/**
 * Media type classification for uploaded files
 */
export type MediaKind = "image" | "video" | "audio" | "document";

/**
 * Determines media type based on File MIME type.
 * Fallback: anything not image/video/audio is treated as document.
 * 
 * @param file - Browser File object
 * @returns Media type classification
 */
export function mediaKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

/**
 * Formats byte size into human-readable string.
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "5.2 MB", "128 KB")
 */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/**
 * Safe version of formatSize that handles undefined/null.
 * Returns empty string for falsy values.
 * 
 * @param bytes - File size in bytes (optional)
 * @returns Formatted string or empty string
 */
export function formatSizeSafe(bytes?: number): string {
  if (!bytes) return "";
  return formatSize(bytes);
}
/**
 * Maximum combined size for all files in a single upload operation (200 MB)
 */
export const MAX_TOTAL_UPLOAD_SIZE = 200 * 1024 * 1024; // 200 MB in bytes

/**
 * Validates that the combined size of selected files and existing files does not exceed the limit
 * @param newFiles - Array of newly selected files
 * @param existingFiles - Array of already selected files (optional)
 * @returns Object with isValid flag and error message if invalid
 */
export function validateUploadSize(
  newFiles: File[],
  existingFiles: File[] = []
): { isValid: boolean; errorMessage?: string; totalSize: number } {
  const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);
  const existingFilesSize = existingFiles.reduce((sum, file) => sum + file.size, 0);
  const totalSize = newFilesSize + existingFilesSize;

  if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
    const maxMB = (MAX_TOTAL_UPLOAD_SIZE / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      errorMessage: `الحجم الإجمالي للملفات (${totalMB} MB) يتجاوز الحد الأقصى المسموح (${maxMB} MB)`,
      totalSize,
    };
  }

  return { isValid: true, totalSize };
}
