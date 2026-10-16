import { Form03Evaluation, Teacher } from '../types';

const DEFAULT_GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbxJ6W8LVbLONmyqMK1xIXIKTF3ewcLHvmuTvLMxn6qYItk8SWHarDZxVn454euN0G3W/exec';

const GOOGLE_SHEET_API_URL =
  import.meta.env.VITE_GOOGLE_SHEET_API_URL || DEFAULT_GOOGLE_SHEET_API_URL;

export interface GoogleSheetSyncResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function saveEvaluationToGoogleSheet(
  teacher: Teacher,
  evaluation: Form03Evaluation,
  month: number,
  year: number,
  customApiUrl?: string
): Promise<GoogleSheetSyncResult> {
  const apiUrl = customApiUrl || GOOGLE_SHEET_API_URL;

  if (!apiUrl || typeof apiUrl !== 'string' || !apiUrl.trim()) {
    const warningMsg = 'Chưa cấu hình URL Google Apps Script Web App (VITE_GOOGLE_SHEET_API_URL)';
    console.warn(warningMsg);
    return {
      success: false,
      message: warningMsg
    };
  }

  // Chuẩn hóa toàn bộ payload dữ liệu gửi sang Google Sheet
  const payload = {
    teacherId: teacher.id,
    hoTen: teacher.fullName,
    chucVu: teacher.position || '',
    ngaySinh: teacher.dob || '',
    boMon: teacher.subject || '',
    toChuyenMon: teacher.department || '',
    truong: teacher.school || '',

    thang: month,
    nam: year,

    // Điểm số phần A, B, Cộng, Trừ và Tổng của Giáo viên
    diemA_GiaoVien: typeof evaluation.totalPartA_Teacher === 'number' ? evaluation.totalPartA_Teacher : 0,
    diemB_GiaoVien: typeof evaluation.totalPartB_Teacher === 'number' ? evaluation.totalPartB_Teacher : 0,
    diemCong_GiaoVien: typeof evaluation.totalBonus_Teacher === 'number' ? evaluation.totalBonus_Teacher : 0,
    diemTru_GiaoVien: typeof evaluation.totalDeduction_Teacher === 'number' ? evaluation.totalDeduction_Teacher : 0,
    tongDiem_GiaoVien: typeof evaluation.grandTotal_Teacher === 'number' ? evaluation.grandTotal_Teacher : 0,
    xepLoai_GiaoVien: evaluation.teacherClassification || '',

    // Điểm số phần A, B, Cộng, Trừ và Tổng của Hiệu trưởng / Cán bộ đánh giá
    diemA_HieuTruong: typeof evaluation.totalPartA_Principal === 'number' ? evaluation.totalPartA_Principal : 0,
    diemB_HieuTruong: typeof evaluation.totalPartB_Principal === 'number' ? evaluation.totalPartB_Principal : 0,
    diemCong_HieuTruong: typeof evaluation.totalBonus_Principal === 'number' ? evaluation.totalBonus_Principal : 0,
    diemTru_HieuTruong: typeof evaluation.totalDeduction_Principal === 'number' ? evaluation.totalDeduction_Principal : 0,
    tongDiem_HieuTruong: typeof evaluation.grandTotal_Principal === 'number' ? evaluation.grandTotal_Principal : 0,
    xepLoai_HieuTruong: evaluation.principalClassification || '',

    // Xếp loại chung và nhận xét
    xepLoai: evaluation.principalClassification || evaluation.teacherClassification || '',
    trangThai: evaluation.status || 'submitted',
    yKienHieuTruong: evaluation.principalComment || '',
    ngayKyGiaoVien: evaluation.teacherSignatureDate || '',
    ngayKyHieuTruong: evaluation.principalSignatureDate || '',

    ngayCapNhat: new Date().toISOString()
  };

  try {
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const rawResponseText = await response.text();
    let responseData: any = null;

    try {
      responseData = JSON.parse(rawResponseText);
    } catch {
      // Phản hồi dạng chuỗi thuần từ Apps Script
      responseData = {
        success: response.ok,
        message: rawResponseText || (response.ok ? 'Đồng bộ Google Sheet thành công' : 'Lỗi phản hồi từ Google Apps Script')
      };
    }

    if (response.ok && (responseData.success === undefined || responseData.success === true)) {
      console.log('✅ Đã lưu Google Sheet thành công:', responseData);
      return {
        success: true,
        message: responseData.message || 'Đã lưu Google Sheet thành công',
        data: responseData
      };
    } else {
      const errorMsg = responseData?.message || `Lỗi HTTP ${response.status}: ${rawResponseText.slice(0, 150)}`;
      console.error('❌ Lỗi từ Google Sheet API:', errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: responseData
      };
    }
  } catch (error) {
    let errorDetail = 'Không thể kết nối đến Google Sheet Web App';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorDetail = 'Lỗi mạng hoặc Google Apps Script chưa cấp quyền truy cập "Anyone" (CORS block)';
      } else {
        errorDetail = error.message;
      }
    }

    console.error('❌ Lỗi kết nối Google Sheet:', errorDetail, error);

    return {
      success: false,
      message: errorDetail
    };
  }
}

/**
 * Tự động đồng bộ toàn bộ bảng điểm tháng của tất cả cán bộ giáo viên sang Google Sheet
 */
export async function syncAllTeachersToGoogleSheet(
  teachers: Teacher[],
  evaluations: Record<string, Form03Evaluation>,
  month: number,
  year: number
): Promise<{ success: boolean; total: number; successCount: number; message: string }> {
  let successCount = 0;

  for (const t of teachers) {
    const ev = evaluations[`${t.id}_y${year}_m${month}`] || evaluations[`${t.id}_y2026_m${month}`] || evaluations[t.id];
    if (ev) {
      const res = await saveEvaluationToGoogleSheet(t, ev, month, year);
      if (res.success) {
        successCount++;
      }
    }
  }

  return {
    success: successCount > 0,
    total: teachers.length,
    successCount,
    message: `Đã tự động lưu thành công dữ liệu ${successCount}/${teachers.length} cán bộ lên Google Sheet tháng ${month}/${year}`
  };
}
