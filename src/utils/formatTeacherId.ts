/**
 * Utility function to standardize Teacher Emulation Codes (Mã thi đua).
 * Format: 2-digit uppercase code (TĐ01, TĐ02, ..., TĐ09, TĐ10, TĐ16, TĐ28, etc.).
 * Converts inputs like '16', '016', 'TĐ0016', 'td16', 'td016', 'TĐ16', '1', '01' -> 'TĐ16', 'TĐ01'.
 */
export function formatTeacherId(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return 'TĐ01';

  const raw = String(input).trim();
  if (!raw) return 'TĐ01';

  const upper = raw.toUpperCase();

  // Special cases for Admin / Master accounts
  if (upper === 'TĐ0000' || upper === 'TĐ00' || upper === 'ADMIN' || upper === 'TRUNGNOITRU83@GMAIL.COM') {
    return 'TĐ00';
  }

  // Extract digits from the string
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return upper;
  }

  const num = parseInt(digits, 10);
  if (isNaN(num) || num <= 0) {
    return 'TĐ01';
  }

  // Format to 2-digit TĐ code (e.g. TĐ01, TĐ16, TĐ28)
  const padded = String(num).padStart(2, '0');
  return `TĐ${padded}`;
}

/**
 * Standardize Score Record ID (Mã chấm điểm)
 * Format: CD-${kyDanhGiaClean}-${maThiDua} (Example: CD-202610-TĐ16)
 */
export function buildMaChamDiem(kyDanhGia: string, maThiDua: string): string {
  const cleanCode = formatTeacherId(maThiDua);
  
  // Parse month and year from kyDanhGia (e.g. "10/2026" or "2026/10" or "202610")
  let monthStr = '10';
  let yearStr = '2026';

  if (kyDanhGia.includes('/')) {
    const parts = kyDanhGia.split('/');
    if (parts.length === 2) {
      if (parts[0].length === 4) {
        yearStr = parts[0];
        monthStr = String(parseInt(parts[1], 10)).padStart(2, '0');
      } else {
        monthStr = String(parseInt(parts[0], 10)).padStart(2, '0');
        yearStr = parts[1];
      }
    }
  } else if (kyDanhGia.length === 6) {
    yearStr = kyDanhGia.slice(0, 4);
    monthStr = kyDanhGia.slice(4, 6);
  }

  const kyDanhGiaClean = `${yearStr}${monthStr}`;
  return `CD-${kyDanhGiaClean}-${cleanCode}`;
}
