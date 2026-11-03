export type Role = 'teacher' | 'department_head' | 'principal' | 'staff' | 'admin';

export type ClassificationType = 
  | 'HOAN_THANH_XUAT_SAC' // >= 90
  | 'HOAN_THANH_TOT'      // 80 - <90
  | 'HOAN_THANH'          // 50 - <80
  | 'KHONG_HOAN_THANH';   // < 50

export interface EntryStatusData {
  month: number;
  year: number;
  isEntered: boolean;
  enteredAt: string;
  enteredBy: string;
  docKey?: string;
}

export interface Teacher {
  id: string;
  emulationCode?: string; // Mã thi đua: TĐ0001 - TĐ0036
  fullName: string;
  email: string;
  phone?: string; // Số điện thoại đăng ký
  dob: string; // DD/MM/YYYY
  position?: string; // Chức vụ: Hiệu trưởng, Phó hiệu trưởng, TTCM, Giáo viên...
  subject: string; // Bộ môn giảng dạy
  department: string; // Tổ chuyên môn
  school: string; // Trường
  avatar?: string;
  isAdmin?: boolean;
  role?: Role;
  teacherSignature?: string; // Data URL or Image URL
  principalSignature?: string; // Data URL or Image URL
}

export interface Form01Task {
  id: string;
  category?: 'I' | 'II' | 'III' | 'IV' | string; // I. Kế hoạch năm, II. Chuyên môn TX, III. Đột xuất, IV. Khác
  taskName: string; // Tên nhiệm vụ trong tháng (Textbox)
  taskNature?: string; // Tính chất công việc (Dropdown)
  assignedTarget: string; // Sản phẩm / Chỉ tiêu giao (Textbox)
  workDone?: string; // Công việc đã thực hiện trong kỳ đánh giá (Textbox)
  executionTime?: string; // Thời gian thực hiện (Textbox/Dropdown)
  result?: string; // Kết quả đạt được
  progress?: 'Đúng hạn' | 'Trước tiến độ' | 'Chậm tiến độ (có lý do)' | 'Chậm tiến độ (không lý do)' | 'Đang thực hiện' | string; // Mức độ thực hiện (Dropdown)
  quality?: 'Đạt chất lượng cao / Vượt yêu cầu' | 'Đạt yêu cầu' | 'Cần cải thiện' | 'Chưa đạt yêu cầu' | string; // Chất lượng công việc (Dropdown)
  completionRate: number; // 0 - 100%
  status: 'completed' | 'in_progress' | 'not_completed';
  noteExplanation?: string; // Kiến nghị, giải trình (Dropdown/Text)
  evidenceLink?: string; // Link đính kèm minh chứng
  // Bổ sung các trường Mẫu 01:
  complexity?: string;     // Độ phức tạp / Tính chất (Thường xuyên, Phức tạp...)
  role?: string;           // Vai trò (Chủ trì, Phối hợp...)
  progressStatus?: string; // Tiến độ (Đúng tiến độ, Chậm tiến độ...)
  notes?: string;          // Kiến nghị / Giải trình
}

export interface Form01Data {
  teacherId: string;
  month: number; // 1 - 12
  year: number;
  tasks: Form01Task[];
  overallSummary: string; // Đánh giá chung mức độ hoàn thành
  attachedFileUrl?: string; // Link đính kèm file Mẫu 01 gốc
  updatedAt: string;
  
  // Signature Block fields for Mẫu 01 (Cá nhân người tự đánh giá - PHT/TTCM - Hiệu trưởng)
  evaluatorName?: string; // Họ và tên người tự đánh giá
  evaluatorSignature?: string; // Data URL / URL Chữ ký người tự đánh giá
  leaderName?: string; // Họ và tên PHT / Tổ trưởng chuyên môn
  leaderSignature?: string; // Data URL / URL Chữ ký PHT / TTCM
  principalName?: string; // Họ và tên Hiệu trưởng
  principalSignature?: string; // Data URL / URL Chữ ký Hiệu trưởng
  isUpdated?: boolean; // Đánh dấu đã cập nhật theo thời gian thực
  isSubmitted?: boolean; // Đánh dấu đã nộp
}

export interface BenchmarkTier {
  code: string;
  label: string;
  points: number;
}

export interface CriteriaItem {
  id: string;
  section: 'A' | 'B' | 'BONUS' | 'DEDUCTION';
  category: string;
  code: string; // e.g. A1, A2, B1, B2...
  title: string; // Tên tiêu chí
  description?: string;
  maxPoints: number;
  scoreOptions: number[]; // e.g. [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, ...]
  tiers?: BenchmarkTier[];
}

export interface CriteriaScore {
  criteriaId: string;
  code?: string; // Mã tiêu chí: e.g. A.I.1.a, B.I.1.a
  title?: string; // Tên tiêu chí
  description?: string; // Nội dung đánh giá
  maxPoints?: number; // Điểm tối đa
  teacherScore: number; // Điểm giáo viên tự chấm
  leaderScore?: number; // Điểm tổ trưởng đề xuất
  principalScore: number; // Điểm hiệu trưởng phê duyệt
  evidenceText?: string; // Nội dung minh chứng
  evidenceFiles?: string[]; // Danh sách tệp minh chứng
  note?: string; // Ý kiến nhận xét
  status?: 'draft' | 'submitted' | 'leader_reviewed' | 'approved' | 'rejected';
}

export interface Form03Evaluation {
  id: string; // Khóa định danh: e.g. "TĐ0023_2026_01" hoặc docKey tương thích
  evaluationId?: string; // Mã đánh giá duy nhất
  teacherId: string;
  month: number; // 1 - 12
  year: number;
  scores: Record<string, CriteriaScore>; // criteriaId -> CriteriaScore đầy đủ
  criteriaScores?: CriteriaScore[]; // Danh sách tiêu chí chi tiết dạng mảng
  
  // Totals calculated - Giáo viên, Tổ trưởng đề xuất, Hiệu trưởng duyệt
  totalPartA_Teacher: number;
  totalPartA_Leader?: number;
  totalPartA_Principal: number;
  
  totalPartB_Teacher: number;
  totalPartB_Leader?: number;
  totalPartB_Principal: number;
  
  totalBonus_Teacher: number;
  totalBonus_Leader?: number;
  totalBonus_Principal: number;
  
  totalDeduction_Teacher: number;
  totalDeduction_Leader?: number;
  totalDeduction_Principal: number;
  
  grandTotal_Teacher: number;
  grandTotal_Leader?: number;
  grandTotal_Principal: number;
  
  teacherClassification: ClassificationType;
  leaderClassification?: ClassificationType;
  principalClassification: ClassificationType;

  // Ý kiến nhận xét ba cấp
  teacherComment?: string;
  leaderComment?: string;
  principalComment?: string;
  
  teacherSignatureDate?: string;
  principalSignatureDate?: string;
  
  teacherSignatureImg?: string;
  principalSignatureImg?: string;
  
  status: 'draft' | 'submitted' | 'leader_reviewed' | 'approved' | 'rejected';
  isLocked?: boolean; // Khóa kỳ đánh giá
  lockedAt?: string;
  lockedBy?: string;

  // Trạng thái đồng bộ Google Sheets
  syncedToGoogleSheet?: boolean;
  lastSyncedAt?: string;
  sheetSyncError?: string;

  // Phiên bản dữ liệu và lịch sử
  version?: number;
  updatedBy?: string;
  isUpdated?: boolean; // Đánh dấu đã cập nhật theo thời gian thực
  updatedAt: string;
}

export interface EvaluationAuditLog {
  id: string;
  evaluationId: string;
  teacherId: string;
  teacherName: string;
  month: number;
  year: number;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  actorEmail?: string;
  actionType: 'create' | 'self_score' | 'leader_review' | 'approve' | 'reject' | 'edit_score' | 'lock' | 'unlock';
  oldGrandTotal?: number;
  newGrandTotal?: number;
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  modifiedFields?: string[];
  snapshotSummary?: string;
}

export interface SystemBackup {
  id: string;
  backupId?: string;
  createdAt: string;
  createdBy: string;
  scope?: 'all' | 'year' | 'month' | 'teacher';
  backupType?: string;
  year?: number;
  month?: number;
  teacherId?: string;
  version?: string;
  totalTeachers?: number;
  totalEvaluations?: number;
  totalForm01?: number;
  totalAuditLogs?: number;
  dataSummary?: any;
  note?: string;
  payload?: {
    teachers: Teacher[];
    evaluations: Record<string, Form03Evaluation>;
    form01: Record<string, Form01Data>;
    auditLogs?: EvaluationAuditLog[];
    entryStatuses?: Record<string, EntryStatusData>;
  };
}

export interface SystemSetting {
  id: string;
  lockedPeriods?: Record<string, boolean>; // key: "y2026_m11" -> true
  defaultYear?: number;
  backupAutoFrequency?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MonthlyEmulationSummary {
  teacher: Teacher;
  form01Submitted: boolean;
  evaluation?: Form03Evaluation;
}

