import * as fflate from 'fflate';

/**
 * Checks if a byte buffer starts with the zip signature 'PK\x03\x04'.
 */
export function isZipBuffer(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = new Uint8Array(buffer);
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07);
}

/**
 * Normalizes common date string representations into standard ISO 'YYYY-MM-DD'.
 * Handles:
 * - 'YYYY-MM-DD'
 * - 'DD-MM-YYYY' (e.g. '05-09-2026' -> '2026-09-05')
 * - 'DD/MM/YYYY'
 * - ISO strings ('2026-09-04T23:44:45.242Z')
 */
export function normalizeToYyyyMmDd(dateStr: unknown): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // ISO timestamps with date prefix
  if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }

  // Fallback to JS Date parsing
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch (_) {
    // fallback
  }

  return null;
}

/**
 * Robustly extracts text files from any Zip archive buffer.
 * Gracefully handles:
 * - Standard zip archives
 * - Flutter / Dart archive_io zips where uncompressed size header is off by a few bytes
 * - Extensionless files containing zip payload
 */
export function extractTextFilesFromZip(buffer: ArrayBuffer | Uint8Array): Record<string, string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const result: Record<string, string> = {};

  // 1. Attempt standard fflate decompression
  try {
    const files = fflate.unzipSync(bytes);
    for (const [name, content] of Object.entries(files)) {
      result[name] = fflate.strFromU8(content);
    }
  } catch (_) {
    // If standard unzip fails, fall back to manual local file header traversal below
  }

  // 2. Validate extracted JSON files; if incomplete or none found, perform resilient local header traversal
  const jsonKeys = Object.keys(result).filter(k => k.toLowerCase().endsWith('.json'));
  let needsRawExtraction = jsonKeys.length === 0;
  for (const k of jsonKeys) {
    try {
      JSON.parse(result[k]);
    } catch {
      needsRawExtraction = true;
      break;
    }
  }

  if (needsRawExtraction) {
    let offset = 0;
    while (offset < bytes.length - 30) {
      if (
        bytes[offset] === 0x50 &&
        bytes[offset + 1] === 0x4b &&
        bytes[offset + 2] === 0x03 &&
        bytes[offset + 3] === 0x04
      ) {
        const method = bytes[offset + 8] | (bytes[offset + 9] << 8);
        const compSize =
          (bytes[offset + 18] >>> 0) |
          ((bytes[offset + 19] << 8) >>> 0) |
          ((bytes[offset + 20] << 16) >>> 0) |
          ((bytes[offset + 21] << 24) >>> 0);
        const nameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
        const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
        const fileName = fflate.strFromU8(nameBytes);
        const dataStart = offset + 30 + nameLen + extraLen;

        if (compSize > 0 && dataStart + compSize <= bytes.length) {
          const compData = bytes.subarray(dataStart, dataStart + compSize);
          try {
            if (method === 8) {
              // Deflate
              const decompressed = fflate.inflateSync(compData);
              result[fileName] = fflate.strFromU8(decompressed);
            } else if (method === 0) {
              // Stored (no compression)
              result[fileName] = fflate.strFromU8(compData);
            }
          } catch (e) {
            console.warn(`[ZipExtractor] Failed manual inflation for ${fileName}:`, e);
          }
          offset = dataStart + compSize;
          continue;
        }
      }
      offset++;
    }
  }

  return result;
}
