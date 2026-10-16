import { Form03Evaluation, Teacher } from '../types';
import { formatTeacherId, buildMaChamDiem } from '../utils/formatTeacherId';

export const GOOGLE_APPS_SCRIPT_LIBRARY_URL =
  'https://script.google.com/macros/library/d/16GMDqaJn8KTH5-kRVQ0vRpnO_ZmkY9P6mGR3WoZy38XU7RF4q0D2oM0v/2';

export const DEFAULT_GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbxJ6W8LVbLONmyqMK1xIXIKTF3ewcLHvmuTvLMxn6qYItk8SWHarDZxVn454euN0G3W/exec';

// Priority: VITE_GOOGLE_SHEET_API -> VITE_GOOGLE_SHEET_API_URL -> Default Apps Script URL
const GOOGLE_SHEET_API_URL =
  (import.meta.env as any).VITE_GOOGLE_SHEET_API ||
  (import.meta.env as any).VITE_GOOGLE_SHEET_API_URL ||
  DEFAULT_GOOGLE_SHEET_API_URL;

export interface GoogleSheetSyncResult {
  success: boolean;
  message: string;
  data?: any;
  maChamDiem?: string;
  scriptLibraryUrl?: string;
}

export interface GoogleSheetDiemPayload {
  action: 'saveDiem';
  maChamDiem: string;
  kyDanhGia: string; // e.g. "10/2026"
  maThiDua: string; // e.g. "TĐ16"
  teacherId: string; // e.g. "TĐ16" - Derived strictly from currentUser / target teacher
  hoTen: string;
  chucVu: string;
  toChuyenMon: string;
  mauApDung: 'Mẫu 02' | 'Mẫu 03';
  diemA: number;
  diemB: number;
  diemCongTru: number;
  tongDiem: number;
  xepLoai: string;
  yKien: string;
  trangThai: string;
  ngayGui: string;
}

/**
 * Validate teacher and evaluation record before creating payload.
 * Prevents sending 'undefined', 'null', or corrupted record IDs like 'CD-102026-undefined'.
 */
export function validateAndBuildDiemPayload(
  teacher: Teacher | null | undefined,
  evaluation: Form03Evaluation | null | undefined,
  month: number,
  year: number,
  currentUser?: Teacher | null
): { isValid: boolean; errorMessage?: string; payload?: GoogleSheetDiemPayload } {
  const activeTeacher = teacher || currentUser;

  if (!activeTeacher) {
    return {
      isValid: false,
      errorMessage: '⚠️ Không tìm thấy thông tin đăng nhập của người dùng hiện tại (currentUser)! Vui lòng kiểm tra lại trạng thái đăng nhập.'
    };
  }

  // Read teacherId / emulationCode strictly from active teacher / currentUser
  const rawCode = activeTeacher.emulationCode || activeTeacher.id || (currentUser?.emulationCode || currentUser?.id);
  const teacherIdClean = formatTeacherId(rawCode);
  const hoTen = (activeTeacher.fullName || currentUser?.fullName || '').trim();

  // Strict check: teacherId MUST NOT be empty, 'undefined', 'null', or unformatted
  if (!teacherIdClean || teacherIdClean === 'UNDEFINED' || teacherIdClean === 'TĐ00' && activeTeacher.id !== 'admin_trung83' || !hoTen) {
    return {
      isValid: false,
      errorMessage: '⚠️ Không thể xác định Mã thi đua (teacherId) hoặc Họ tên của người dùng hiện tại! Vui lòng đăng xuất và đăng nhập lại.'
    };
  }

  if (!evaluation) {
    return {
      isValid: false,
      errorMessage: '⚠️ Dữ liệu chấm điểm thi đua chưa được khởi tạo!'
    };
  }

  const monthPad = String(month).padStart(2, '0');
  const yearStr = String(year);
  const kyDanhGia = `${monthPad}/${yearStr}`; // "10/2026"
  const maChamDiem = buildMaChamDiem(kyDanhGia, teacherIdClean); // "CD-202610-TĐ16"

  const chucVu = (activeTeacher.position || 'Giáo viên').trim();
  const toChuyenMon = (activeTeacher.department || 'Tổ chuyên môn').trim();

  // Determine application template (Mẫu 02 for Leaders/Heads, Mẫu 03 for Teachers/Staff)
  const isLeaderPosition = ['hiệu trưởng', 'phó hiệu trưởng', 'tổ trưởng', 'phó tổ trưởng', 'chủ tịch đoàn'].some(p =>
    chucVu.toLowerCase().includes(p)
  );
  const mauApDung: 'Mẫu 02' | 'Mẫu 03' = isLeaderPosition ? 'Mẫu 02' : 'Mẫu 03';

  // Take Principal scores if available/approved, else Teacher self-scores
  const diemA = typeof evaluation.totalPartA_Principal === 'number' && evaluation.totalPartA_Principal > 0
    ? evaluation.totalPartA_Principal
    : (evaluation.totalPartA_Teacher || 0);

  const diemB = typeof evaluation.totalPartB_Principal === 'number' && evaluation.totalPartB_Principal > 0
    ? evaluation.totalPartB_Principal
    : (evaluation.totalPartB_Teacher || 0);

  const bonus = typeof evaluation.totalBonus_Principal === 'number'
    ? evaluation.totalBonus_Principal
    : (evaluation.totalBonus_Teacher || 0);

  const deduction = typeof evaluation.totalDeduction_Principal === 'number'
    ? evaluation.totalDeduction_Principal
    : (evaluation.totalDeduction_Teacher || 0);

  const diemCongTru = bonus - deduction;

  const tongDiem = typeof evaluation.grandTotal_Principal === 'number' && evaluation.grandTotal_Principal > 0
    ? evaluation.grandTotal_Principal
    : (evaluation.grandTotal_Teacher || 0);

  const xepLoai = evaluation.principalClassification || evaluation.teacherClassification || 'Hoàn thành tốt';
  const yKien = (evaluation.principalComment || '').trim() || 'Không';

  const statusMap: Record<string, string> = {
    draft: 'Bản nháp',
    submitted: 'Đã nộp',
    approved: 'Đã duyệt',
    rejected: 'Yêu cầu chỉnh sửa'
  };
  const trangThai = statusMap[evaluation.status] || 'Đã nộp';

  const payload: GoogleSheetDiemPayload = {
    action: 'saveDiem',
    maChamDiem,
    kyDanhGia,
    maThiDua: teacherIdClean,
    teacherId: teacherIdClean, // Explicitly set teacherId from currentUser / activeTeacher
    hoTen,
    chucVu,
    toChuyenMon,
    mauApDung,
    diemA,
    diemB,
    diemCongTru,
    tongDiem,
    xepLoai,
    yKien,
    trangThai,
    ngayGui: new Date().toISOString()
  };

  return { isValid: true, payload };
}

/**
 * Save / Update evaluation directly to Google Sheets API tab Data_Diem_M02_M03_Thang
 */
export async function saveEvaluationToGoogleSheet(
  teacher: Teacher,
  evaluation: Form03Evaluation,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  customApiUrl?: string
): Promise<GoogleSheetSyncResult> {
  let apiUrl = (customApiUrl || GOOGLE_SHEET_API_URL || '').trim();

  // If user passed a Google Apps Script Library URL, fall back to Web App endpoint for HTTP POST execution while logging Library
  if (apiUrl.includes('/macros/library/')) {
    console.log(`ℹ️ [GoogleSheet] Phất hiện Google Apps Script Library URL: ${GOOGLE_APPS_SCRIPT_LIBRARY_URL}. Chuyển hướng tới Web App Endpoint...`);
    apiUrl = DEFAULT_GOOGLE_SHEET_API_URL;
  }

  // 1. Strict Validation Before Sending Request
  const validation = validateAndBuildDiemPayload(teacher, evaluation, month, year, currentUser);
  if (!validation.isValid || !validation.payload) {
    const errorMsg = validation.errorMessage || 'Dữ liệu không hợp lệ';
    console.error('❌ Validation Google Sheet Payload Failed:', errorMsg);
    return {
      success: false,
      message: errorMsg,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  }

  const payload = validation.payload;

  if (!apiUrl) {
    const warningMsg = 'Chưa cấu hình URL Google Apps Script Web App (VITE_GOOGLE_SHEET_API)';
    console.warn(warningMsg);
    return {
      success: false,
      message: warningMsg,
      maChamDiem: payload.maChamDiem,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  }

  try {
    console.log(`📤 [GoogleSheet POST] Gửi dữ liệu cho teacherId=${payload.teacherId} (Mã:${payload.maChamDiem}) tới Sheets API Library [${GOOGLE_APPS_SCRIPT_LIBRARY_URL}]...`, payload);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    let resData: any = null;

    try {
      resData = JSON.parse(rawText);
    } catch {
      resData = {
        success: response.ok,
        message: rawText || (response.ok ? 'Đã lưu Google Sheet thành công' : 'Phản hồi từ Apps Script')
      };
    }

    if (response.ok && (resData.success === undefined || resData.success === true)) {
      console.log(`✅ [GoogleSheet POST] Đồng bộ thành công teacherId=${payload.teacherId}:`, resData);
      return {
        success: true,
        message: resData.message || `Lưu Google Sheet thành công (${payload.maChamDiem})`,
        data: resData,
        maChamDiem: payload.maChamDiem,
        scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
      };
    } else {
      const errDetail = resData?.message || `Lỗi HTTP ${response.status}: ${rawText.slice(0, 150)}`;
      console.error(`❌ [GoogleSheet POST] API Error (${payload.maChamDiem}):`, errDetail);
      return {
        success: false,
        message: errDetail,
        data: resData,
        maChamDiem: payload.maChamDiem,
        scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
      };
    }
  } catch (err) {
    let msg = 'Lỗi kết nối tới Google Sheet API Web App';
    if (err instanceof Error) {
      msg = err.message.includes('Failed to fetch')
        ? 'Lỗi mạng hoặc Google Apps Script chưa mở quyền Anyone (CORS)'
        : err.message;
    }
    console.error(`❌ [GoogleSheet POST] Fetch Exception (${payload.maChamDiem}):`, msg, err);
    return {
      success: false,
      message: msg,
      maChamDiem: payload.maChamDiem,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  }
}

/**
 * Bulk Sync: Scans all teachers' evaluation records in Firestore/State and pushes them to Google Sheets
 */
export async function syncAllTeachersToGoogleSheet(
  teachers: Teacher[],
  evaluations: Record<string, Form03Evaluation>,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  onProgress?: (current: number, total: number, lastTeacherName: string) => void
): Promise<{ success: boolean; total: number; successCount: number; failedCount: number; message: string; scriptLibraryUrl: string }> {
  let successCount = 0;
  let failedCount = 0;
  const total = teachers.length;

  console.log(`🔄 [BulkSync] Bắt đầu đồng bộ ${total} giáo viên lên Google Sheet Library [${GOOGLE_APPS_SCRIPT_LIBRARY_URL}] tháng ${month}/${year}...`);

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const key = `${t.id}_y${year}_m${month}`;
    const ev = evaluations[key] || evaluations[`${t.id}_m${month}`] || evaluations[t.id];

    if (onProgress) {
      onProgress(i + 1, total, t.fullName);
    }

    if (ev) {
      const res = await saveEvaluationToGoogleSheet(t, ev, month, year, currentUser);
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
      }
    } else {
      failedCount++;
    }

    // Small delay to prevent hitting Apps Script rate limits
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return {
    success: successCount > 0,
    total,
    successCount,
    failedCount,
    message: `Đã đồng bộ ${successCount}/${total} bản ghi thành công lên Google Sheet (Tháng ${month}/${year}).`,
    scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
  };
}
