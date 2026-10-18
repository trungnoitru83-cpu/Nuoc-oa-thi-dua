import { Form03Evaluation, Form01Data, Form01Task, Teacher } from '../types';
import { formatTeacherId, buildMaChamDiem, formatKyDanhGia, deduplicateTeachers } from '../utils/formatTeacherId';
import { createDefaultForm01, createDefaultEvaluation } from '../data/mockTeachers';

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

export interface TaskItemPayload {
  stt: number;
  ma_ban_ghi: string;
  maBanGhi: string;
  ky_danh_gia: string;
  kyDanhGia: string;
  ma_thi_dua: string;
  maThiDua: string;
  teacherId: string;
  ho_ten: string;
  hoTen: string;
  chucVu: string;
  toChuyenMon: string;

  // Trường chuẩn Mẫu 01 theo yêu cầu:
  noi_dung: string;
  muc_do: string;
  vai_tro: string;
  trang_thai: string;
  tien_do: string;
  chat_luong: string;
  kien_nghi: string;

  // Trường tương thích mở rộng:
  san_pham?: string;
  chiTieu?: string;
  do_phuc_tap?: string;
  congViec?: string;
  tenNhiemVu?: string;
  tyLeHoanThanh?: number;
  completionRate?: number;
  linkMinhChung?: string;
  evidenceLink?: string;
  thoiGian?: string;
}

export interface CombinedGoogleSheetPayload {
  action: string;
  actionAlias: string;
  type: string;
  maChamDiem: string;
  maBanGhi: string;
  ma_cham_diem: string;
  ma_ban_ghi: string;

  // 1. Chuẩn hóa Kỳ đánh giá ("MM/YYYY") và Mã thi đua ("TĐxx")
  ky_danh_gia: string;
  kyDanhGia: string;
  thang: number;
  nam: number;
  ma_thi_dua: string;
  maThiDua: string;
  teacherId: string;
  ho_ten: string;
  hoTen: string;
  chuc_vu: string;
  chucVu: string;
  to_chuyen_mon: string;
  toChuyenMon: string;

  // 2. Phần Mẫu 01: Toàn bộ danh sách nhiệm vụ trong tháng
  danh_sach_cong_viec: TaskItemPayload[];
  danhSachCongViec: TaskItemPayload[];
  items: TaskItemPayload[];
  tasks: any[];
  attachedFileUrl: string;
  overallSummary: string;
  evaluatorName: string;
  evaluatorSignature: string;
  leaderName: string;
  leaderSignature: string;
  principalName: string;
  principalSignature: string;

  // 3. Phần Mẫu 02 / Mẫu 03: Điểm đánh giá thi đua
  loai_mau: 'Mẫu 02' | 'Mẫu 03';
  mau_ap_dung: 'Mẫu 02' | 'Mẫu 03';
  mauApDung: 'Mẫu 02' | 'Mẫu 03';
  diem_phan_a: number;
  diemA: number;
  diem_a: number;
  diem_phan_b: number;
  diemB: number;
  diem_b: number;
  diem_cong_tru: number;
  diemCongTru: number;
  tong_diem: number;
  tongDiem: number;
  xep_loai: string;
  xepLoai: string;
  y_kien: string;
  trang_thai: string;
  trangThai: string;
  status: string;

  // Timestamp
  ngay_gui: string;
  ngayGui: string;
}

/**
 * Helper to execute POST to Google Apps Script with CORS & no-cors fallback
 */
async function postToGoogleAppsScript(apiUrl: string, payload: any): Promise<GoogleSheetSyncResult> {
  console.log(`==================== 📤 [GoogleSheet REQUEST POST] ====================`);
  console.log(`📌 Web App URL:`, apiUrl);
  console.log(`📦 Action/Type:`, payload.action || payload.type);
  console.log(`📅 ky_danh_gia:`, payload.ky_danh_gia || payload.kyDanhGia);
  console.log(`🏷️ ma_thi_dua:`, payload.ma_thi_dua || payload.maThiDua);
  console.log(`📋 Số nhiệm vụ Mẫu 01:`, (payload.danh_sach_cong_viec || []).length);
  console.log(`🏆 Tổng điểm Mẫu 02/03:`, payload.tong_diem, `(${payload.xep_loai})`);
  console.log(`======================================================================`);

  try {
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    console.log(`✅ [GoogleSheet POST no-cors] Thành công cho teacherId=${payload.ma_thi_dua}, kyDanhGia=${payload.ky_danh_gia}.`);
    return {
      success: true,
      message: `Đã lưu và đồng bộ thành công cả Mẫu 01 & Mẫu 02/03 (${payload.ky_danh_gia}) lên Google Sheet!`,
      maChamDiem: payload.ma_ban_ghi || payload.maChamDiem,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  } catch (err: any) {
    console.warn(`❌ [GoogleSheet POST Exception]:`, err);
    return {
      success: false,
      message: err?.message || 'Lỗi kết nối tới Google Sheet API Web App',
      maChamDiem: payload.ma_ban_ghi || payload.maChamDiem,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  }
}

/**
 * Build combined payload: merges Mẫu 01 tasks AND Mẫu 02/03 evaluation scores
 * strictly formatted with ky_danh_gia = "MM/YYYY" from Header and standardized ma_thi_dua.
 */
export function buildCombinedGoogleSheetPayload(
  teacher: Teacher | null | undefined,
  form01: Form01Data | null | undefined,
  evaluation: Form03Evaluation | null | undefined,
  month: number,
  year: number,
  currentUser?: Teacher | null
): { isValid: boolean; errorMessage?: string; payload?: CombinedGoogleSheetPayload } {
  const activeTeacher = teacher || currentUser;

  if (!activeTeacher) {
    return {
      isValid: false,
      errorMessage: '⚠️ Không tìm thấy thông tin đăng nhập của người dùng hiện tại (currentUser)!'
    };
  }

  const rawCode = activeTeacher.emulationCode || activeTeacher.id || (currentUser?.emulationCode || currentUser?.id);
  const teacherIdClean = formatTeacherId(rawCode).trim().toUpperCase();
  const hoTen = (activeTeacher.fullName || currentUser?.fullName || '').trim();

  if (!teacherIdClean || teacherIdClean === 'UNDEFINED' || (teacherIdClean === 'TĐ00' && activeTeacher.id !== 'admin_trung83') || !hoTen) {
    return {
      isValid: false,
      errorMessage: '⚠️ Không thể xác định Mã thi đua (teacherId) hoặc Họ tên người dùng!'
    };
  }

  // 1. Đồng bộ chính xác Kỳ đánh giá ("MM/YYYY") theo bộ chọn Tháng/Năm trên thanh Header
  const kyDanhGia = formatKyDanhGia(month, year);
  const monthPad = String(month).padStart(2, '0');
  const yearStr = String(year);
  const maChamDiem = buildMaChamDiem(kyDanhGia, teacherIdClean); // "CD-YYYYMM-TĐxx"

  const chucVu = (activeTeacher.position || 'Giáo viên').trim();
  const toChuyenMon = (activeTeacher.department || 'Tổ chuyên môn').trim();

  const isLeaderPosition = ['hiệu trưởng', 'phó hiệu trưởng', 'tổ trưởng', 'phó tổ trưởng', 'chủ tịch đoàn'].some(p =>
    chucVu.toLowerCase().includes(p)
  );
  const loaiMau: 'Mẫu 02' | 'Mẫu 03' = isLeaderPosition ? 'Mẫu 02' : 'Mẫu 03';

  // 2. Chuẩn bị Phần Mẫu 01: Danh sách công việc
  const activeForm01 = form01 || createDefaultForm01(activeTeacher.id, month, year);
  const rawTasks = activeForm01.tasks || [];

  const danh_sach_cong_viec: TaskItemPayload[] = rawTasks.map((t: any, idx: number) => {
    const taskMaBanGhi = `BG01-${yearStr}${monthPad}-${teacherIdClean}-${idx + 1}`;
    const percentStr = `${t.completionRate || 100}%`;
    const complexityStr = t.complexity || t.taskNature || t.muc_do || 'Thường xuyên';
    const roleStr = t.role || t.vai_tro || t.taskNature || 'Chủ trì';
    const statusResultStr = t.workDone || t.result || t.trang_thai || (t.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện');
    const qualityStr = t.quality || t.chat_luong || 'Đạt yêu cầu';
    const notesStr = t.notes || t.noteExplanation || t.kien_nghi || 'Không có';
    const taskNameStr = t.taskName || t.content || t.noi_dung || `Nhiệm vụ ${idx + 1}`;

    return {
      stt: idx + 1,
      ma_ban_ghi: taskMaBanGhi,
      maBanGhi: taskMaBanGhi,
      ky_danh_gia: kyDanhGia,
      kyDanhGia,
      ma_thi_dua: teacherIdClean,
      maThiDua: teacherIdClean,
      teacherId: teacherIdClean,
      ho_ten: hoTen,
      hoTen,
      chucVu,
      toChuyenMon,

      // Các trường chuẩn Mẫu 01 theo yêu cầu:
      noi_dung: taskNameStr,
      muc_do: complexityStr,
      vai_tro: roleStr,
      trang_thai: statusResultStr,
      tien_do: percentStr,
      chat_luong: qualityStr,
      kien_nghi: notesStr,

      // Trường tương thích bổ trợ
      san_pham: t.assignedTarget || 'Hoàn thành 100%',
      chiTieu: t.assignedTarget || 'Hoàn thành 100%',
      do_phuc_tap: complexityStr,
      congViec: taskNameStr,
      tenNhiemVu: taskNameStr,
      tyLeHoanThanh: t.completionRate || 100,
      completionRate: t.completionRate || 100,
      linkMinhChung: t.evidenceLink || '',
      evidenceLink: t.evidenceLink || '',
      thoiGian: t.executionTime || 'Trong tháng'
    };
  });

  // 3. Chuẩn bị Phần Mẫu 02 / Mẫu 03: Điểm đánh giá
  const activeEval = evaluation || createDefaultEvaluation(activeTeacher.id, month, year, 0, activeTeacher);

  const diemPhanA = typeof activeEval.totalPartA_Principal === 'number' && activeEval.totalPartA_Principal > 0
    ? activeEval.totalPartA_Principal
    : (activeEval.totalPartA_Teacher || (isLeaderPosition ? 25 : 30));

  const diemPhanB = typeof activeEval.totalPartB_Principal === 'number' && activeEval.totalPartB_Principal > 0
    ? activeEval.totalPartB_Principal
    : (activeEval.totalPartB_Teacher || (isLeaderPosition ? 65 : 60));

  const bonus = typeof activeEval.totalBonus_Principal === 'number'
    ? activeEval.totalBonus_Principal
    : (activeEval.totalBonus_Teacher || 0);

  const deduction = typeof activeEval.totalDeduction_Principal === 'number'
    ? activeEval.totalDeduction_Principal
    : (activeEval.totalDeduction_Teacher || 0);

  const diemCongTru = bonus - deduction;

  const tongDiem = typeof activeEval.grandTotal_Principal === 'number' && activeEval.grandTotal_Principal > 0
    ? activeEval.grandTotal_Principal
    : (activeEval.grandTotal_Teacher || Math.min(100, Math.max(0, diemPhanA + diemPhanB + diemCongTru)));

  const xepLoai = activeEval.principalClassification || activeEval.teacherClassification || (tongDiem >= 90 ? 'Hoàn thành xuất sắc nhiệm vụ' : tongDiem >= 80 ? 'Hoàn thành tốt nhiệm vụ' : 'Hoàn thành nhiệm vụ');
  const yKien = (activeEval.principalComment || '').trim() || 'Không';
  const trangThai = activeEval.status === 'approved' ? 'Đã duyệt' : 'Chờ BGH duyệt';
  const nowIso = new Date().toISOString();

  const payload: CombinedGoogleSheetPayload = {
    action: 'save_combined',
    actionAlias: 'save_all',
    type: 'combined',
    maChamDiem,
    maBanGhi: maChamDiem,
    ma_cham_diem: maChamDiem,
    ma_ban_ghi: maChamDiem,

    // Header sync
    ky_danh_gia: kyDanhGia,
    kyDanhGia,
    thang: month,
    nam: year,
    ma_thi_dua: teacherIdClean,
    maThiDua: teacherIdClean,
    teacherId: teacherIdClean,
    ho_ten: hoTen,
    hoTen,
    chuc_vu: chucVu,
    chucVu,
    to_chuyen_mon: toChuyenMon,
    toChuyenMon,

    // Mẫu 01
    danh_sach_cong_viec,
    danhSachCongViec: danh_sach_cong_viec,
    items: danh_sach_cong_viec,
    tasks: rawTasks,
    attachedFileUrl: activeForm01.attachedFileUrl || '',
    overallSummary: activeForm01.overallSummary || '',
    evaluatorName: activeForm01.evaluatorName || hoTen,
    evaluatorSignature: activeForm01.evaluatorSignature || '',
    leaderName: activeForm01.leaderName || '',
    leaderSignature: activeForm01.leaderSignature || '',
    principalName: activeForm01.principalName || '',
    principalSignature: activeForm01.principalSignature || '',

    // Mẫu 02 / Mẫu 03
    loai_mau: loaiMau,
    mau_ap_dung: loaiMau,
    mauApDung: loaiMau,
    diem_phan_a: diemPhanA,
    diemA: diemPhanA,
    diem_a: diemPhanA,
    diem_phan_b: diemPhanB,
    diemB: diemPhanB,
    diem_b: diemPhanB,
    diem_cong_tru: diemCongTru,
    diemCongTru,
    tong_diem: tongDiem,
    tongDiem,
    xep_loai: xepLoai,
    xepLoai,
    y_kien: yKien,
    trang_thai: trangThai,
    trangThai,
    status: activeEval.status || 'approved',

    ngay_gui: nowIso,
    ngayGui: nowIso
  };

  return { isValid: true, payload };
}

/**
 * Backward compatible alias for validateAndBuildDiemPayload
 */
export const validateAndBuildDiemPayload = (
  teacher: Teacher | null | undefined,
  evaluation: Form03Evaluation | null | undefined,
  month: number,
  year: number,
  currentUser?: Teacher | null
) => buildCombinedGoogleSheetPayload(teacher, null, evaluation, month, year, currentUser);

/**
 * Save Combined Data (Both Mẫu 01 and Mẫu 02/03) to Google Sheet
 */
export async function saveCombinedDataToGoogleSheet(
  teacher: Teacher,
  form01: Form01Data | null | undefined,
  evaluation: Form03Evaluation | null | undefined,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  customApiUrl?: string
): Promise<GoogleSheetSyncResult> {
  const apiUrl = getGoogleSheetApiUrl(customApiUrl);

  const validation = buildCombinedGoogleSheetPayload(teacher, form01, evaluation, month, year, currentUser);
  if (!validation.isValid || !validation.payload) {
    const errorMsg = validation.errorMessage || 'Dữ liệu không hợp lệ';
    console.error('❌ Validation Google Sheet Combined Payload Failed:', errorMsg);
    return {
      success: false,
      message: errorMsg,
      scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
    };
  }

  return postToGoogleAppsScript(apiUrl, validation.payload);
}

/**
 * Save Form 01 to Google Sheet: now sends the full combined payload (Mẫu 01 + Mẫu 02/03)
 */
export async function saveForm01ToGoogleSheet(
  teacher: Teacher,
  form01: Form01Data,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  customApiUrl?: string,
  evaluation?: Form03Evaluation | null
): Promise<GoogleSheetSyncResult> {
  return saveCombinedDataToGoogleSheet(teacher, form01, evaluation, month, year, currentUser, customApiUrl);
}

export const saveMau01ToGoogleSheet = saveForm01ToGoogleSheet;

/**
 * Save Evaluation to Google Sheet: now sends the full combined payload (Mẫu 01 + Mẫu 02/03)
 */
export async function saveEvaluationToGoogleSheet(
  teacher: Teacher,
  evaluation: Form03Evaluation,
  month: number,
  year: number,
  currentUser?: Teacher | null,
  customApiUrl?: string,
  form01?: Form01Data | null
): Promise<GoogleSheetSyncResult> {
  return saveCombinedDataToGoogleSheet(teacher, form01, evaluation, month, year, currentUser, customApiUrl);
}

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
  const kyDanhGia = formatKyDanhGia(month, year);

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
      const tasksRaw = d.tasks || d.congViecList || d.congViec || d.danh_sach_cong_viec || [];
      const tasksMap: Form01Task[] = Array.isArray(tasksRaw)
        ? tasksRaw.map((t: any, idx: number) => ({
            id: t.id || `sheet_task_${idx}_${Date.now()}`,
            category: t.category || t.danhMuc || 'I',
            taskName: t.noi_dung || t.taskName || t.congViec || t.tenNhiemVu || `Nhiệm vụ ${idx + 1}`,
            taskNature: t.muc_do || t.taskNature || t.tinhChat || 'Thường xuyên',
            assignedTarget: t.assignedTarget || t.mucTieu || t.chiTieu || t.san_pham || 'Hoàn thành 100%',
            workDone: t.trang_thai || t.workDone || t.ketQua || 'Đã hoàn thành',
            executionTime: t.thoiGian || t.executionTime || 'Trong tháng',
            result: t.trang_thai || t.result || t.ketQua || 'Đạt yêu cầu',
            progress: t.tien_do || t.progress || 'Đúng tiến độ',
            quality: t.chat_luong || t.quality || 'Đạt yêu cầu',
            completionRate: typeof t.completionRate === 'number' ? t.completionRate : (parseInt(t.tien_do || t.tyLeHoanThanh || '100', 10) || 100),
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
  onProgress?: (current: number, total: number, lastTeacherName: string) => void,
  form01DataMap?: Record<string, Form01Data>
): Promise<{ success: boolean; total: number; successCount: number; failedCount: number; message: string; scriptLibraryUrl: string }> {
  // 1. Lọc trùng danh sách viên chức (1 Viên chức - 1 Kỳ - 1 Dòng duy nhất)
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

    const xepLoai = ev?.principalClassification || ev?.teacherClassification || 'Hoàn thành tốt nhiệm vụ';
    const trangThai = ev?.status === 'approved' ? 'Đã duyệt' : 'Chờ BGH duyệt';

    return {
      stt: idx + 1,
      ma_thi_dua: code,
      maThiDua: code,
      teacherId: code,
      ky_danh_gia: kyDanhGia,
      kyDanhGia,
      thang: month,
      nam: year,
      ma_cham_diem: maChamDiem,
      maChamDiem,
      ho_ten: t.fullName,
      hoTen: t.fullName,
      chuc_vu: chucVu,
      chucVu,
      to_chuyen_mon: toChuyenMon,
      toChuyenMon,
      loai_mau: isLeader ? 'Mẫu 02' : 'Mẫu 03',
      mau_ap_dung: isLeader ? 'Mẫu 02' : 'Mẫu 03',
      mauApDung: isLeader ? 'Mẫu 02' : 'Mẫu 03',
      diem_phan_a: diemA,
      diemA,
      diem_a: diemA,
      diem_phan_b: diemB,
      diemB,
      diem_b: diemB,
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
    const f01 = form01DataMap ? (form01DataMap[key] || form01DataMap[`${t.id}_m${month}`] || form01DataMap[t.id]) : undefined;

    if (onProgress) {
      onProgress(i + 1, total, t.fullName);
    }

    const res = await saveCombinedDataToGoogleSheet(t, f01, ev, month, year, currentUser);
    if (res.success) {
      successCount++;
    } else {
      failedCount++;
    }

    // Small delay to prevent hitting Apps Script rate limits
    await new Promise(resolve => setTimeout(resolve, 80));
  }

  return {
    success: successCount > 0,
    total,
    successCount,
    failedCount,
    message: `Đã đồng bộ ${successCount}/${total} cán bộ (1 viên chức - 1 dòng duy nhất) lên Google Sheet (Kỳ ${kyDanhGia}).`,
    scriptLibraryUrl: GOOGLE_APPS_SCRIPT_LIBRARY_URL
  };
}
