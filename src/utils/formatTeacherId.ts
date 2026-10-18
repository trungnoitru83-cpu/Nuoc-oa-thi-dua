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
  let monthStr = '01';
  let yearStr = '2026';

  if (kyDanhGia && kyDanhGia.includes('/')) {
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
  } else if (kyDanhGia && kyDanhGia.length === 6) {
    yearStr = kyDanhGia.slice(0, 4);
    monthStr = kyDanhGia.slice(4, 6);
  }

  const kyDanhGiaClean = `${yearStr}${monthStr}`;
  return `CD-${kyDanhGiaClean}-${cleanCode}`;
}

/**
 * Standardize Evaluation Period string to "MM/YYYY" (e.g. "07/2026", "10/2026")
 */
export function formatKyDanhGia(month: number | string, year: number | string): string {
  const parsedM = parseInt(String(month), 10);
  const m = (!isNaN(parsedM) && parsedM >= 1 && parsedM <= 12) ? parsedM : 1;
  const parsedY = parseInt(String(year), 10);
  const y = (!isNaN(parsedY) && parsedY >= 2020 && parsedY <= 2040) ? parsedY : 2026;
  const monthPad = String(m).padStart(2, '0');
  return `${monthPad}/${y}`;
}

/**
 * Deduplicate teachers list by normalized emulation code (ma_thi_dua).
 * Guarantees exactly 1 teacher per emulation code (1 Viên chức - 1 Kỳ - 1 Dòng duy nhất).
 */
export function deduplicateTeachers<T extends { id?: string; emulationCode?: string }>(teachers: T[]): T[] {
  const map = new Map<string, T>();
  for (const t of teachers) {
    const code = formatTeacherId(t.emulationCode || t.id).trim().toUpperCase();
    map.set(code, t);
  }
  return Array.from(map.values());
}

