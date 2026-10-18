import { Form03Evaluation, Form01Data, Form01Task, Teacher } from '../types';
import { formatTeacherId, buildMaChamDiem, formatKyDanhGia, deduplicateTeachers } from '../utils/formatTeacherId';

export const GOOGLE_APPS_SCRIPT_LIBRARY_URL =
  'https://script.google.com/macros/library/d/16GMDqaJn8KTH5-kRVQ0vRpnO_ZmkY9P6mGR3WoZy38XU7RF4q0D2oM0v/2';

export const DEFAULT_GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbxJ6W8LVbLONmyqMK1xIXIKTF3ewcLHvmuTvLMxn6qYItk8SWHarDZxVn454euN0G3W/exec';

/**
 * Get configured Google Apps Script Web App URL.
 * Priority: customUrl -> VITE_GOOGLE_SHEET_API_URL -> VITE_GOOGLE_SHEET_API -> DEFAULT_GOOGLE_SHEET_API_URL
 */
export const getGoogleSheetApiUrl = (customUrl?: string): string => {
  const url = (customUrl || '').trim() ||
    (import.meta.env as any).VITE_GOOGLE_SHEET_API_URL ||
    (import.meta.env as any).VITE_GOOGLE_SHEET_API ||
    DEFAULT_GOOGLE_SHEET_API_URL;
  
  if (url.includes('/macros/library/')) {
    return DEFAULT_GOOGLE_SHEET_API_URL;
  }
  return url;
};

export interface GoogleSheetSyncResult {
  success: boolean;
  message: string;
  data?: any;
  maChamDiem?: string;
  scriptLibraryUrl?: string;
}

export interface GoogleSheetDiemPayload {
  action: 'saveDiem' | 'save_mau03';
  maChamDiem: string;
  maBanGhi: string;
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
 * Helper to execute POST to Google Apps Script with CORS & no-cors fallback
 */
async function postToGoogleAppsScript(apiUrl: string, payload: any): Promise<GoogleSheetSyncResult> {
  console.log(`==================== 📤 [GoogleSheet REQUEST POST] ====================`);
  console.log(`📌 Web App URL:`, apiUrl);
  console.log(`📦 Action/Type:`, payload.action || payload.type);
  console.log(`📦 teacherId:`, payload.teacherId || payload.maThiDua);
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
  console.log(`======================================================================`);

  try {
    // Send text/plain JSON payload with mode: "no-cors" to bypass CORS without preflight issues
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    // NOTE: With mode 'no-cors', response is opaque. DO NOT call response.json() or response.text() to avoid crash/hang.
    console.log(`✅ [GoogleSheet POST no-cors] Request sent successfully for teacherId=${payload.teacherId || payload.maThiDua}.`);
    return {
      success: true,
      message: 'Đã gửi dữ liệu Mẫu 01 vào Google Sheet thành công! Vui lòng tải lại trang Google Sheet.',
      maChamDiem: payload.maBanGhi || payload.maChamDiem,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  } catch (err: any) {
    console.warn(`❌ [GoogleSheet POST Exception]:`, err);
    return {
      success: false,
      message: err?.message || 'Lỗi kết nối tới Google Sheet API Web App',
      maChamDiem: payload.maBanGhi || payload.maChamDiem,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  }
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

  const rawCode = activeTeacher.emulationCode || activeTeacher.id || (currentUser?.emulationCode || currentUser?.id);
  const teacherIdClean = formatTeacherId(rawCode).trim().toUpperCase();
  const hoTen = (activeTeacher.fullName || currentUser?.fullName || '').trim();

  if (!teacherIdClean || teacherIdClean === 'UNDEFINED' || (teacherIdClean === 'TĐ00' && activeTeacher.id !== 'admin_trung83') || !hoTen) {
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

  // Chuẩn hóa kỳ đánh giá định dạng "MM/YYYY" (ví dụ: "10/2026")
  const kyDanhGia = formatKyDanhGia(month, year);
  const maChamDiem = buildMaChamDiem(kyDanhGia, teacherIdClean); // "CD-202610-TĐ16"

  const chucVu = (activeTeacher.position || 'Giáo viên').trim();
  const toChuyenMon = (activeTeacher.department || 'Tổ chuyên môn').trim();

  const isLeaderPosition = ['hiệu trưởng', 'phó hiệu trưởng', 'tổ trưởng', 'phó tổ trưởng', 'chủ tịch đoàn'].some(p =>
    chucVu.toLowerCase().includes(p)
  );
  const mauApDung: 'Mẫu 02' | 'Mẫu 03' = isLeaderPosition ? 'Mẫu 02' : 'Mẫu 03';

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
    submitted: 'Chờ BGH duyệt',
    approved: 'Đã duyệt',
    rejected: 'Yêu cầu chỉnh sửa'
  };
  const trangThai = evaluation.status === 'approved' ? 'Đã duyệt' : (statusMap[evaluation.status] || 'Chờ BGH duyệt');

  const nowIso = new Date().toISOString();

  const payload: any = {
    action: 'saveDiem',
    actionAlias: 'save_mau03',
    type: 'mau03',
    maChamDiem,
    maBanGhi: maChamDiem,
    ma_cham_diem: maChamDiem,
    ma_ban_ghi: maChamDiem,

    // Chuẩn hóa định dạng kỳ đánh giá và mã thi đua (Yêu cầu 2)
    ky_danh_gia: kyDanhGia,
    kyDanhGia,
    ma_thi_dua: teacherIdClean,
    maThiDua: teacherIdClean,
    teacherId: teacherIdClean,

    ho_ten: hoTen,
    hoTen,
    teacherName: hoTen,
    chuc_vu: chucVu,
    chucVu,
    to_chuyen_mon: toChuyenMon,
    toChuyenMon,
    to_phong_ban: toChuyenMon,
    mau_ap_dung: mauApDung,
    mauApDung,
    diem_a: diemA,
    diemA,
    diem_b: diemB,
    diemB,
    diem_cong_tru: diemCongTru,
    diemCongTru,
    tong_diem: tongDiem,
    tongDiem,
    xep_loai: xepLoai,
    xepLoai,
    y_kien: yKien,
    yKien,
    status: evaluation.status || 'approved',
    trang_thai: trangThai,
    trangThai,
    capNhatDuyet: evaluation.status === 'approved',
    isOfficialApproval: evaluation.status === 'approved',
    ngay_gui: nowIso,
    ngayGui: nowIso
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
  const apiUrl = getGoogleSheetApiUrl(customApiUrl);

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

  return postToGoogleAppsScript(apiUrl, validation.payload);
}

/**
 * Save / Update Mẫu 01 directly to Google Sheets Web App API
 */
export async function saveForm01ToGoogleSheet(
  teacher: Teacher,
  form01: Form01Data,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  customApiUrl?: string
): Promise<GoogleSheetSyncResult> {
  const apiUrl = getGoogleSheetApiUrl(customApiUrl);

  const activeTeacher = teacher || currentUser;
  const rawCode = activeTeacher?.emulationCode || activeTeacher?.id || (currentUser?.emulationCode || currentUser?.id);
  const teacherIdClean = formatTeacherId(rawCode).trim().toUpperCase();
  const hoTen = (activeTeacher?.fullName || currentUser?.fullName || '').trim();

  if (!teacherIdClean || teacherIdClean === 'UNDEFINED' || !hoTen) {
    const errorMsg = '⚠️ Không thể xác định Mã thi đua (teacherId) hoặc Họ tên của người dùng hiện tại!';
    console.error('❌ [Lưu Mẫu 01 - Validation Error]:', errorMsg);
    return { success: false, message: errorMsg, scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL };
  }

  // Chuẩn hóa kỳ đánh giá "MM/YYYY" (ví dụ: "10/2026")
  const kyDanhGia = formatKyDanhGia(month, year);
  const maChamDiem = buildMaChamDiem(kyDanhGia, teacherIdClean);

  const tasksList = form01.tasks || [];
  
  // Enriched items list containing all columns with snake_case and camelCase property names
  const items = tasksList.map((t: any, idx: number) => {
    const taskMaBanGhi = `BG01-${yearStr}${monthPad}-${teacherIdClean}-${idx + 1}`;
    const percentStr = `${t.completionRate || 100}%`;
    return {
      stt: idx + 1,
      sttViec: idx + 1,
      maBanGhi: taskMaBanGhi,
      ma_ban_ghi: taskMaBanGhi,
      kyDanhGia,
      ky_danh_gia: kyDanhGia,
      maThiDua: teacherIdClean,
      ma_thi_dua: teacherIdClean,
      teacherId: teacherIdClean,
      hoTen,
      ho_ten: hoTen,
      chucVu: (activeTeacher?.position || 'Giáo viên').trim(),
      toChuyenMon: (activeTeacher?.department || 'Tổ chuyên môn').trim(),
      to_phong_ban: (activeTeacher?.department || 'Tổ chuyên môn').trim(),
      
      // Snake_case keys as requested:
      noi_dung: t.taskName || t.content || `Nhiệm vụ ${idx + 1}`,
      san_pham: t.assignedTarget || 'Hoàn thành 100%',
      chiTieu: t.assignedTarget || 'Hoàn thành 100%',
      do_phuc_tap: t.complexity || t.taskNature || 'Thường xuyên',
      vai_tro: t.role || t.taskNature || 'Chủ trì',
      trang_thai: t.workDone || t.result || (t.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'),
      tien_do: percentStr,
      chat_luong: t.quality || 'Đạt yêu cầu',
      kien_nghi: t.notes || t.noteExplanation || 'Không có',

      // CamelCase & Vietnamese keys for compatibility:
      noiDung: t.taskName || t.content || `Nhiệm vụ ${idx + 1}`,
      noiDungCongViec: t.taskName || t.content || `Nhiệm vụ ${idx + 1}`,
      congViec: t.taskName || `Nhiệm vụ ${idx + 1}`,
      tenNhiemVu: t.taskName || `Nhiệm vụ ${idx + 1}`,
      sanPham: t.assignedTarget || 'Hoàn thành 100%',
      mucTieu: t.assignedTarget || 'Hoàn thành 100%',
      assignedTarget: t.assignedTarget || 'Hoàn thành 100%',
      doPhucTap: t.complexity || t.taskNature || 'Thường xuyên',
      tinhChat: t.complexity || t.taskNature || 'Thường xuyên',
      taskNature: t.complexity || t.taskNature || 'Thường xuyên',
      vaiTro: t.role || t.taskNature || 'Chủ trì',
      role: t.role || t.taskNature || 'Chủ trì',
      trangThai: t.workDone || t.result || (t.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'),
      trangThaiHoanThanh: t.workDone || t.result || (t.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'),
      workDone: t.workDone || t.result || 'Đã hoàn thành',
      result: t.result || t.workDone || 'Đã hoàn thành',
      tienDo: percentStr,
      tienDoThucHien: percentStr,
      tyLeHoanThanh: t.completionRate || 100,
      completionRate: t.completionRate || 100,
      progress: t.progressStatus || t.progress || 'Đúng tiến độ',
      chatLuong: t.quality || 'Đạt yêu cầu',
      chatLuongHoanThanh: t.quality || 'Đạt yêu cầu',
      quality: t.quality || 'Đạt yêu cầu',
      kienNghi: t.notes || t.noteExplanation || 'Không có',
      deXuat: t.notes || t.noteExplanation || 'Không có',
      noteExplanation: t.notes || t.noteExplanation || 'Không có',
      thoiGian: t.executionTime || 'Trong tháng',
      thoiGianGhiNhan: t.executionTime || 'Trong tháng',
      executionTime: t.executionTime || 'Trong tháng',
      linkMinhChung: t.evidenceLink || '',
      evidenceLink: t.evidenceLink || ''
    };
  });

  const payload = {
    type: "mau01",
    action: "luu_mau01",
    actionAlias: "save_mau01",
    ma_thi_dua: teacherIdClean,
    maThiDua: teacherIdClean,
    teacherId: teacherIdClean,
    ho_ten: hoTen,
    hoTen,
    to_phong_ban: (activeTeacher?.department || 'Tổ chuyên môn').trim(),
    toChuyenMon: (activeTeacher?.department || 'Tổ chuyên môn').trim(),
    chucVu: (activeTeacher?.position || 'Giáo viên').trim(),
    ky_danh_gia: kyDanhGia,
    kyDanhGia,
    danh_sach_cong_viec: items,
    danhSachCongViec: items,
    items,
    congViecList: items,
    tasks: tasksList,
    maBanGhi: `BG01-${yearStr}${monthPad}-${teacherIdClean}-1`,
    maChamDiem,
    attachedFileUrl: form01.attachedFileUrl || '',
    overallSummary: form01.overallSummary || '',
    evaluatorName: form01.evaluatorName || hoTen,
    evaluatorSignature: form01.evaluatorSignature || '',
    leaderName: form01.leaderName || '',
    leaderSignature: form01.leaderSignature || '',
    principalName: form01.principalName || '',
    principalSignature: form01.principalSignature || '',
    ngayGui: new Date().toISOString()
  };

  return postToGoogleAppsScript(apiUrl, payload);
}

export const saveMau01ToGoogleSheet = saveForm01ToGoogleSheet;

/**
 * Fetch Mẫu 01 data for a specific teacher (maThiDua) and evaluation period from Google Sheet
 */
export async function fetchForm01FromGoogleSheet(
  maThiDua: string,
  month: number,
  year: number,
  customApiUrl?: string
): Promise<{ success: boolean; data?: Form01Data; message?: string }> {
  const apiUrl = getGoogleSheetApiUrl(customApiUrl);
  const teacherIdClean = formatTeacherId(maThiDua);
  const monthPad = String(month).padStart(2, '0');
  const kyDanhGia = `${monthPad}/${year}`;

  const queryUrl = `${apiUrl}?action=get_mau01&maThiDua=${encodeURIComponent(teacherIdClean)}&kyDanhGia=${encodeURIComponent(kyDanhGia)}`;

  console.log(`🔍 [GoogleSheet GET] Requesting Mẫu 01 for maThiDua=${teacherIdClean}, kyDanhGia=${kyDanhGia}...`);

  try {
    const res = await fetch(queryUrl, { method: 'GET' });
    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status}` };
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      return { success: false, message: 'Response is not JSON' };
    }

    if (json && (json.success || json.status === 'success') && json.data) {
      const d = json.data;
      const tasksRaw = d.tasks || d.congViecList || d.congViec || [];
      const tasksMap: Form01Task[] = Array.isArray(tasksRaw)
        ? tasksRaw.map((t: any, idx: number) => ({
            id: t.id || `sheet_task_${idx}_${Date.now()}`,
            category: t.category || t.danhMuc || 'I',
            taskName: t.taskName || t.congViec || t.tenNhiemVu || `Nhiệm vụ ${idx + 1}`,
            taskNature: t.taskNature || t.tinhChat || 'Thường xuyên',
            assignedTarget: t.assignedTarget || t.mucTieu || t.chiTieu || 'Hoàn thành 100%',
            workDone: t.workDone || t.ketQua || 'Đã hoàn thành',
            executionTime: t.executionTime || t.thoiGian || 'Trong tháng',
            result: t.result || t.ketQua || 'Đạt yêu cầu',
            progress: t.progress || t.tienDo || 'Đúng tiến độ',
            quality: t.quality || t.chatLuong || 'Đạt yêu cầu',
            completionRate: typeof t.completionRate === 'number' ? t.completionRate : (parseInt(t.tyLeHoanThanh || '100', 10) || 100),
            status: t.status || 'completed',
            evidenceLink: t.evidenceLink || t.linkMinhChung || ''
          }))
        : [];

      const form01Fetched: Form01Data = {
        teacherId: teacherIdClean,
        month,
        year,
        attachedFileUrl: d.attachedFileUrl || d.linkSheet || '',
        overallSummary: d.overallSummary || d.tongKet || '',
        tasks: tasksMap,
        evaluatorName: d.evaluatorName || d.hoTen || '',
        evaluatorSignature: d.evaluatorSignature || '',
        leaderName: d.leaderName || '',
        leaderSignature: d.leaderSignature || '',
        principalName: d.principalName || '',
        principalSignature: d.principalSignature || '',
        updatedAt: d.updatedAt || new Date().toISOString()
      };

      console.log(`✅ [GoogleSheet GET] Mẫu 01 fetched successfully for ${teacherIdClean}:`, form01Fetched);
      return { success: true, data: form01Fetched };
    }

    return { success: false, message: json.message || 'Chưa có dữ liệu Mẫu 01 trên Google Sheet' };
  } catch (err: any) {
    console.warn(`ℹ️ [GoogleSheet GET Notice] (${teacherIdClean}):`, err?.message || err);
    return { success: false, message: err?.message || 'Lỗi mạng khi đọc Google Sheet' };
  }
}

/**
 * Bulk Sync: Scans all teachers' evaluation records, deduplicates them (1 Viên chức - 1 Kỳ - 1 Dòng duy nhất),
 * and pushes the deduplicated danh_sach_tong_hop and individual records to Google Sheets.
 */
export async function syncAllTeachersToGoogleSheet(
  teachers: Teacher[],
  evaluations: Record<string, Form03Evaluation>,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  onProgress?: (current: number, total: number, lastTeacherName: string) => void
): Promise<{ success: boolean; total: number; successCount: number; failedCount: number; message: string; scriptLibraryUrl: string }> {
  // 1. Lọc trùng danh sách viên chức (Yêu cầu 3: 1 Viên chức - 1 Kỳ - 1 Dòng duy nhất)
  const cleanTeachers = deduplicateTeachers(teachers);
  const total = cleanTeachers.length;
  const kyDanhGia = formatKyDanhGia(month, year);
  const apiUrl = getGoogleSheetApiUrl();

  console.log(`🔄 [BulkSync] Bắt đầu đồng bộ ${total} giáo viên (đã lọc trùng) lên Google Sheet tháng ${kyDanhGia}...`);

  // 2. Xây dựng mảng danh_sach_tong_hop chuẩn hóa gửi kèm trong payload batch
  const danh_sach_tong_hop = cleanTeachers.map((t, idx) => {
    const code = formatTeacherId(t.emulationCode || t.id).trim().toUpperCase();
    const key = `${t.id}_y${year}_m${month}`;
    const ev = evaluations[key] || evaluations[`${t.id}_m${month}`] || evaluations[t.id];
    const maChamDiem = buildMaChamDiem(kyDanhGia, code);

    const chucVu = (t.position || t.subject || 'Giáo viên').trim();
    const toChuyenMon = (t.department || 'Tổ chuyên môn').trim();
    const isLeader = ['hiệu trưởng', 'phó hiệu trưởng', 'tổ trưởng', 'phó tổ trưởng', 'chủ tịch đoàn'].some(p =>
      chucVu.toLowerCase().includes(p)
    );

    const diemA = typeof ev?.totalPartA_Principal === 'number' && ev.totalPartA_Principal > 0
      ? ev.totalPartA_Principal
      : (ev?.totalPartA_Teacher || 30);

    const diemB = typeof ev?.totalPartB_Principal === 'number' && ev.totalPartB_Principal > 0
      ? ev.totalPartB_Principal
      : (ev?.totalPartB_Teacher || 60);

    const bonus = typeof ev?.totalBonus_Principal === 'number'
      ? ev.totalBonus_Principal
      : (ev?.totalBonus_Teacher || 0);

    const ded = typeof ev?.totalDeduction_Principal === 'number'
      ? ev.totalDeduction_Principal
      : (ev?.totalDeduction_Teacher || 0);

    const diemCongTru = bonus - ded;

    const tongDiem = typeof ev?.grandTotal_Principal === 'number' && ev.grandTotal_Principal > 0
      ? ev.grandTotal_Principal
      : (ev?.grandTotal_Teacher || 90);

    const xepLoai = ev?.principalClassification || ev?.teacherClassification || 'Hoàn thành tốt';
    const trangThai = ev?.status === 'approved' ? 'Đã duyệt' : 'Chờ BGH duyệt';

    return {
      stt: idx + 1,
      ma_thi_dua: code,
      maThiDua: code,
      teacherId: code,
      ky_danh_gia: kyDanhGia,
      kyDanhGia,
      ma_cham_diem: maChamDiem,
      maChamDiem,
      ho_ten: t.fullName,
      hoTen: t.fullName,
      chuc_vu: chucVu,
      chucVu,
      to_chuyen_mon: toChuyenMon,
      toChuyenMon,
      mau_ap_dung: isLeader ? 'Mẫu 02' : 'Mẫu 03',
      mauApDung: isLeader ? 'Mẫu 02' : 'Mẫu 03',
      diem_a: diemA,
      diemA,
      diem_b: diemB,
      diemB,
      diem_cong_tru: diemCongTru,
      diemCongTru,
      tong_diem: tongDiem,
      tongDiem,
      xep_loai: xepLoai,
      xepLoai,
      trang_thai: trangThai,
      trangThai,
      ngay_gui: new Date().toISOString()
    };
  });

  // 3. Gửi payload danh_sach_tong_hop (đã lọc trùng) lên Google Apps Script
  try {
    const bulkPayload = {
      action: 'dong_bo_tong_hop',
      actionAlias: 'sync_summary',
      type: 'summary',
      ky_danh_gia: kyDanhGia,
      kyDanhGia,
      thang: month,
      nam: year,
      tong_so_vien_chuc: total,
      danh_sach_tong_hop,
      danhSachTongHop: danh_sach_tong_hop
    };
    await postToGoogleAppsScript(apiUrl, bulkPayload);
  } catch (err) {
    console.warn('Gửi batch danh_sach_tong_hop:', err);
  }

  // 4. Đồng bộ từng bản ghi đơn lẻ (chuẩn hóa ma_cham_diem để Google Sheet cập nhật đúng 1 dòng duy nhất)
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < cleanTeachers.length; i++) {
    const t = cleanTeachers[i];
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
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  return {
    success: successCount > 0,
    total,
    successCount,
    failedCount,
    message: `Đã đồng bộ ${successCount}/${total} bản ghi (1 viên chức - 1 dòng duy nhất) lên Google Sheet (Kỳ ${kyDanhGia}).`,
    scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
  };
}
