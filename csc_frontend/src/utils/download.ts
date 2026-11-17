/**
 * Sanitizes a filename by removing invalid characters and limiting length
 * @param filename - The filename to sanitize
 * @param maxLength - Maximum length for the filename (default: 200)
 * @returns Sanitized filename safe for downloads
 */
export function sanitizeFilename(filename: string, maxLength: number = 200): string {
  // Remove invalid filename characters: \ / : * ? " < > |
  let sanitized = filename.replace(/[\\/:*?"<>|]/g, '_');
  
  // Replace multiple spaces with single underscore
  sanitized = sanitized.replace(/\s+/g, '_');
  
  // Remove leading/trailing underscores and dots
  sanitized = sanitized.replace(/^[._]+|[._]+$/g, '');
  
  // Limit length while preserving extension
  if (sanitized.length > maxLength) {
    const ext = sanitized.lastIndexOf('.');
    if (ext > 0) {
      const extension = sanitized.substring(ext);
      const name = sanitized.substring(0, maxLength - extension.length);
      sanitized = name + extension;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }
  
  // Fallback if empty after sanitization
  return sanitized || 'download';
}
