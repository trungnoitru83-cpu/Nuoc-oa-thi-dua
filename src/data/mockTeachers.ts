import { Teacher, Form01Data, Form03Evaluation } from '../types';
import { getClassification, getCriteriaForTeacher } from './form03Criteria';
import { formatTeacherId } from '../utils/formatTeacherId';

export const SCHOOL_NAME = 'Trường PTDTNT THCS và THPT Nước Oa';

export interface EmployeeItem {
  id: string; // e.g. "TĐ01"
  name: string; // e.g. "Nguyễn Xuân Ảnh"
}

// Full 50-Employee Standardized Mapping Array
export const EMPLOYEES: EmployeeItem[] = [
  { id: "TĐ01", name: "Nguyễn Xuân Ảnh" },
  { id: "TĐ02", name: "Hồ Thị Hiến" },
  { id: "TĐ03", name: "Đinh Hữu Phước" },
  { id: "TĐ04", name: "Nguyễn Thị Hồng" },
  { id: "TĐ05", name: "Vũ Thị Hồng Ngọc" },
  { id: "TĐ06", name: "Lương Văn Hơn" },
  { id: "TĐ07", name: "Nguyễn Thị Tường Vy" },
  { id: "TĐ08", name: "Nguyễn Phạm Trúc Phương" },
  { id: "TĐ09", name: "Huỳnh Thị Minh Hằng" },
  { id: "TĐ10", name: "Nguyễn Đình Lâu" },
  { id: "TĐ11", name: "Hồ Thị Hiếu" },
  { id: "TĐ12", name: "Lê Văn Lập" },
  { id: "TĐ13", name: "Hoàng Văn Hùng" },
  { id: "TĐ14", name: "Nguyễn Thị Hồng Châu" },
  { id: "TĐ15", name: "Trần Thị Nhật" },
  { id: "TĐ16", name: "Lê Thị Phương Uyên" },
  { id: "TĐ17", name: "Nguyễn Duy Vũ" },
  { id: "TĐ18", name: "Hồ Thị Bờ" },
  { id: "TĐ19", name: "Nguyễn Thị Hoà" },
  { id: "TĐ20", name: "Huỳnh Thị Trang" },
  { id: "TĐ21", name: "Huỳnh Thị Bích Lợi" },
  { id: "TĐ22", name: "Phạm Lý Nghĩa" },
  { id: "TĐ23", name: "Nguyễn Văn Trung" },
  { id: "TĐ24", name: "Nguyễn Văn Ân Tình" },
  { id: "TĐ25", name: "Trần Thị Kim Tuyến" },
  { id: "TĐ26", name: "Lê Thị Hoa" },
  { id: "TĐ27", name: "Bùi Thị Hồng Thắm" },
  { id: "TĐ28", name: "Bùi Thị Mỹ An" },
  { id: "TĐ29", name: "Trần Thị Kiều Hương" },
  { id: "TĐ30", name: "Nguyễn Văn Sĩ" },
  { id: "TĐ31", name: "Nguyễn Hùng Vỹ" },
  { id: "TĐ32", name: "Cao Thị Hà My" },
  { id: "TĐ33", name: "Huỳnh Thị Mi Sa" },
  { id: "TĐ34", name: "Lữ Văn Lam" },
  { id: "TĐ35", name: "Trần Văn Hảo" },
  { id: "TĐ36", name: "Huỳnh Văn Bình" },
  { id: "TĐ37", name: "Nguyễn Quốc Hội" },
  { id: "TĐ38", name: "Đặng Thị Thùy Nga" },
  { id: "TĐ39", name: "Nguyễn Thị Thủy" },
  { id: "TĐ40", name: "Trương Thị Hoài Thu" },
  { id: "TĐ41", name: "Trần Thị Phương Loan" },
  { id: "TĐ42", name: "(Nhập họ tên viên chức mới 42)" },
  { id: "TĐ43", name: "(Nhập họ tên viên chức mới 43)" },
  { id: "TĐ44", name: "(Nhập họ tên viên chức mới 44)" },
  { id: "TĐ45", name: "(Nhập họ tên viên chức mới 45)" },
  { id: "TĐ46", name: "(Nhập họ tên viên chức mới 46)" },
  { id: "TĐ47", name: "(Nhập họ tên viên chức mới 47)" },
  { id: "TĐ48", name: "(Nhập họ tên viên chức mới 48)" },
  { id: "TĐ49", name: "(Nhập họ tên viên chức mới 49)" },
  { id: "TĐ50", name: "(Nhập họ tên viên chức mới 50)" }
];

export function getTeacherEmulationCode(teacher?: Teacher | null, index?: number): string {
  if (!teacher) return '';
  if (teacher.emulationCode) return formatTeacherId(teacher.emulationCode);
  const num = parseInt(teacher.id.replace(/\D/g, ''), 10);
  const n = !isNaN(num) && num > 0 ? num : (index !== undefined ? index + 1 : 1);
  return formatTeacherId(n);
}

export const ADMIN_TEACHER: Teacher = {
  id: 'admin_trung83',
  emulationCode: 'TĐ00',
  fullName: 'Quản Trị Viên (Trung)',
  email: 'trungnoitru83@gmail.com',
  phone: '0905123483',
  dob: '15/08/1983',
  position: 'Quản trị viên Hệ thống',
  subject: 'Quản trị hệ thống',
  department: 'Ban Quản trị',
  school: SCHOOL_NAME
};

export const INITIAL_TEACHERS: Teacher[] = [
  ADMIN_TEACHER,
  { id: 'gv01', emulationCode: 'TĐ01', fullName: 'Nguyễn Xuân Ảnh', email: 'anh.nguyen@nuocoa.edu.vn', phone: '0905123401', dob: '15/04/1975', position: 'Hiệu trưởng', subject: 'Quản lý chung', department: 'Ban Giám Hiệu', school: SCHOOL_NAME },
  { id: 'gv02', emulationCode: 'TĐ02', fullName: 'Hồ Thị Hiến', email: 'hohien1975@gmail.com', phone: '0905123402', dob: '22/08/1978', position: 'Phó Hiệu trưởng', subject: 'Quản lý chuyên môn', department: 'Ban Giám Hiệu', school: SCHOOL_NAME },
  { id: 'gv03', emulationCode: 'TĐ03', fullName: 'Đinh Hữu Phước', email: 'dinhphuocedu@gmail.com', phone: '0905123403', dob: '10/11/1980', position: 'Phó Hiệu trưởng', subject: 'Quản lý CSVC-Nội trú', department: 'Ban Giám Hiệu', school: SCHOOL_NAME },
  { id: 'gv04', emulationCode: 'TĐ04', fullName: 'Nguyễn Thị Hồng', email: 'nguyenhong08csm@gmail.com', phone: '0905123404', dob: '05/01/1985', position: 'Nhân viên', subject: 'Hành chính', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv05', emulationCode: 'TĐ05', fullName: 'Vũ Thị Hồng Ngọc', email: 'ngoc.vu@nuocoa.edu.vn', phone: '0905123405', dob: '12/07/1989', position: 'Nhân viên', subject: 'Kế toán', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv06', emulationCode: 'TĐ06', fullName: 'Lương Văn Hơn', email: 'hon.luong@nuocoa.edu.vn', phone: '0905123406', dob: '18/09/1982', position: 'Nhân viên', subject: 'Bảo vệ - Thiết bị', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv07', emulationCode: 'TĐ07', fullName: 'Nguyễn Thị Tường Vy', email: 'vy.nguyen@nuocoa.edu.vn', phone: '0905123407', dob: '30/03/1988', position: 'Nhân viên', subject: 'Văn thư - Thủ quỹ', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv08', emulationCode: 'TĐ08', fullName: 'Nguyễn Phạm Trúc Phương', email: 'phuong.nguyen@nuocoa.edu.vn', phone: '0905123408', dob: '14/11/1993', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv09', emulationCode: 'TĐ09', fullName: 'Huỳnh Thị Minh Hằng', email: 'hang.huynh@nuocoa.edu.vn', phone: '0905123409', dob: '04/02/1990', position: 'Nhân viên QLNT', subject: 'Quản lý nội trú', department: 'QLNT', school: SCHOOL_NAME },
  { id: 'gv10', emulationCode: 'TĐ10', fullName: 'Nguyễn Đình Lâu', email: 'launuocoa@gmail.com', phone: '0905123410', dob: '25/02/1981', position: 'Tổ trưởng chuyên môn', subject: 'Lịch sử', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv11', emulationCode: 'TĐ11', fullName: 'Hồ Thị Hiếu', email: 'hieu.ho@nuocoa.edu.vn', phone: '0905123411', dob: '08/12/1987', position: 'Giáo viên', subject: 'Địa lý', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv12', emulationCode: 'TĐ12', fullName: 'Lê Văn Lập', email: 'lap.le@nuocoa.edu.vn', phone: '0905123412', dob: '06/08/1987', position: 'Bí thư Đoàn trường', subject: 'Hoạt động trải nghiệm', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv13', emulationCode: 'TĐ13', fullName: 'Hoàng Văn Hùng', email: 'hung.hoang@nuocoa.edu.vn', phone: '0905123413', dob: '31/05/1983', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv14', emulationCode: 'TĐ14', fullName: 'Nguyễn Thị Hồng Châu', email: 'chau.nguyen@nuocoa.edu.vn', phone: '0905123414', dob: '10/03/1986', position: 'Giáo viên', subject: 'Âm nhạc', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv15', emulationCode: 'TĐ15', fullName: 'Trần Thị Nhật', email: 'nhat.tran@nuocoa.edu.vn', phone: '0905123415', dob: '19/02/1990', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv16', emulationCode: 'TĐ16', fullName: 'Lê Thị Phương Uyên', email: 'uyenltp@nuocoa.edu.vn', phone: '0905123416', dob: '28/07/1992', position: 'Giáo viên', subject: 'Ngữ văn', department: 'Tổ KHXH', school: SCHOOL_NAME },
  { id: 'gv17', emulationCode: 'TĐ17', fullName: 'Nguyễn Duy Vũ', email: 'vu.nguyen@nuocoa.edu.vn', phone: '0905123417', dob: '12/01/1988', position: 'Nhân viên', subject: 'Y tế học đường', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv18', emulationCode: 'TĐ18', fullName: 'Hồ Thị Bờ', email: 'bo.ho@nuocoa.edu.vn', phone: '0905123418', dob: '23/11/1991', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv19', emulationCode: 'TĐ19', fullName: 'Nguyễn Thị Hoà', email: 'hoa.nguyen@nuocoa.edu.vn', phone: '0905123419', dob: '05/06/1989', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv20', emulationCode: 'TĐ20', fullName: 'Huỳnh Thị Trang', email: 'trang.huynh@nuocoa.edu.vn', phone: '0905123420', dob: '15/09/1990', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv21', emulationCode: 'TĐ21', fullName: 'Huỳnh Thị Bích Lợi', email: 'loi.huynh@nuocoa.edu.vn', phone: '0905123421', dob: '19/10/1988', position: 'Giáo viên', subject: 'Lịch sử', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv22', emulationCode: 'TĐ22', fullName: 'Phạm Lý Nghĩa', email: 'lynghiant@gmail.com', phone: '0905123422', dob: '27/01/1983', position: 'Tổ trưởng chuyên môn', subject: 'Vật lý', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv23', emulationCode: 'TĐ23', fullName: 'Nguyễn Văn Trung', email: 'trung.nguyen@nuocoa.edu.vn', phone: '0905123423', dob: '11/08/1985', position: 'Giáo viên - TKHĐ', subject: 'Tin học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv24', emulationCode: 'TĐ24', fullName: 'Nguyễn Văn Ân Tình', email: 'tinh.nguyen@nuocoa.edu.vn', phone: '0905123424', dob: '02/11/1987', position: 'Giáo viên', subject: 'Toán học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv25', emulationCode: 'TĐ25', fullName: 'Trần Thị Kim Tuyến', email: 'tuyen.tran@nuocoa.edu.vn', phone: '0905123425', dob: '13/03/1988', position: 'Giáo viên', subject: 'Hóa học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv26', emulationCode: 'TĐ26', fullName: 'Lê Thị Hoa', email: 'hoa.le@nuocoa.edu.vn', phone: '0905123426', dob: '29/01/1986', position: 'Giáo viên', subject: 'Công nghệ', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv27', emulationCode: 'TĐ27', fullName: 'Bùi Thị Hồng Thắm', email: 'tham.bui@nuocoa.edu.vn', phone: '0905123427', dob: '20/06/1991', position: 'Giáo viên', subject: 'Vật lý', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv28', emulationCode: 'TĐ28', fullName: 'Bùi Thị Mỹ An', email: 'anbtm@nuocoa.edu.vn', phone: '0905123428', dob: '16/09/1990', position: 'Giáo viên', subject: 'KHTN', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv29', emulationCode: 'TĐ29', fullName: 'Trần Thị Kiều Hương', email: 'huong.tran@nuocoa.edu.vn', phone: '0905123429', dob: '17/05/1989', position: 'Giáo viên', subject: 'Tin học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv30', emulationCode: 'TĐ30', fullName: 'Nguyễn Văn Sĩ', email: 'vansybtm@gmail.com', phone: '0905123430', dob: '21/10/1984', position: 'Giáo viên', subject: 'Thể dục', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv31', emulationCode: 'TĐ31', fullName: 'Nguyễn Hùng Vỹ', email: 'vy.nguyenhung@nuocoa.edu.vn', phone: '0905123431', dob: '03/05/1984', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv32', emulationCode: 'TĐ32', fullName: 'Cao Thị Hà My', email: 'my.cao@nuocoa.edu.vn', phone: '0905123432', dob: '07/07/1992', position: 'Giáo viên', subject: 'Sinh học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv33', emulationCode: 'TĐ33', fullName: 'Huỳnh Thị Mi Sa', email: 'misa.huynh@nuocoa.edu.vn', phone: '0905123433', dob: '09/04/1989', position: 'Giáo viên', subject: 'Hóa học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv34', emulationCode: 'TĐ34', fullName: 'Lữ Văn Lam', email: 'lam.lu@nuocoa.edu.vn', phone: '0905123434', dob: '14/06/1986', position: 'Giáo viên', subject: 'Toán học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv35', emulationCode: 'TĐ35', fullName: 'Trần Văn Hảo', email: 'hao.tran@nuocoa.edu.vn', phone: '0905123435', dob: '18/12/1985', position: 'Giáo viên', subject: 'GDCD', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv36', emulationCode: 'TĐ36', fullName: 'Huỳnh Văn Bình', email: 'binh.huynh@nuocoa.edu.vn', phone: '0905123436', dob: '26/04/1991', position: 'Giáo viên', subject: 'Thể dục', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv37', emulationCode: 'TĐ37', fullName: 'Nguyễn Quốc Hội', email: 'hoi.nguyen@nuocoa.edu.vn', phone: '0905123437', dob: '10/10/1988', position: 'Giáo viên', subject: 'Toán học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv38', emulationCode: 'TĐ38', fullName: 'Đặng Thị Thùy Nga', email: 'nga.dang@nuocoa.edu.vn', phone: '0905123438', dob: '15/03/1992', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv39', emulationCode: 'TĐ39', fullName: 'Nguyễn Thị Thủy', email: 'thuy.nguyen@nuocoa.edu.vn', phone: '0905123439', dob: '20/08/1990', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv40', emulationCode: 'TĐ40', fullName: 'Trương Thị Hoài Thu', email: 'thu.truong@nuocoa.edu.vn', phone: '0905123440', dob: '05/12/1991', position: 'Giáo viên', subject: 'Địa lý', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv41', emulationCode: 'TĐ41', fullName: 'Trần Thị Phương Loan', email: 'loan.tran@nuocoa.edu.vn', phone: '0905123441', dob: '28/02/1989', position: 'Giáo viên', subject: 'Hóa học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv42', emulationCode: 'TĐ42', fullName: '(Nhập họ tên viên chức mới 42)', email: 'vienchuc42@nuocoa.edu.vn', phone: '0905123442', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv43', emulationCode: 'TĐ43', fullName: '(Nhập họ tên viên chức mới 43)', email: 'vienchuc43@nuocoa.edu.vn', phone: '0905123443', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv44', emulationCode: 'TĐ44', fullName: '(Nhập họ tên viên chức mới 44)', email: 'vienchuc44@nuocoa.edu.vn', phone: '0905123444', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv45', emulationCode: 'TĐ45', fullName: '(Nhập họ tên viên chức mới 45)', email: 'vienchuc45@nuocoa.edu.vn', phone: '0905123445', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv46', emulationCode: 'TĐ46', fullName: '(Nhập họ tên viên chức mới 46)', email: 'vienchuc46@nuocoa.edu.vn', phone: '0905123446', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv47', emulationCode: 'TĐ47', fullName: '(Nhập họ tên viên chức mới 47)', email: 'vienchuc47@nuocoa.edu.vn', phone: '0905123447', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv48', emulationCode: 'TĐ48', fullName: '(Nhập họ tên viên chức mới 48)', email: 'vienchuc48@nuocoa.edu.vn', phone: '0905123448', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv49', emulationCode: 'TĐ49', fullName: '(Nhập họ tên viên chức mới 49)', email: 'vienchuc49@nuocoa.edu.vn', phone: '0905123449', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME },
  { id: 'gv50', emulationCode: 'TĐ50', fullName: '(Nhập họ tên viên chức mới 50)', email: 'vienchuc50@nuocoa.edu.vn', phone: '0905123450', dob: '01/01/1990', position: 'Giáo viên', subject: 'Chưa phân công', department: 'Tổ chuyên môn', school: SCHOOL_NAME }
];

// Helper to build initial Form 01 for a teacher
export function createDefaultForm01(teacherId: string, month: number, year: number = 2026): Form01Data {
  return {
    teacherId,
    month,
    year,
    tasks: [
      {
        id: 't1',
        taskName: 'Giảng dạy theo thời khóa biểu & Thực hiện quy chế chuyên môn',
        assignedTarget: 'Đảm bảo đủ 100% tiết dạy, chuẩn bị giáo án trước 2 ngày',
        result: 'Đã thực hiện đầy đủ 100% số tiết, giáo án đúng tiến độ',
        completionRate: 100,
        status: 'completed',
        evidenceLink: 'https://drive.google.com/file/d/sample-giao-an-nuocoa'
      },
      {
        id: 't2',
        taskName: 'Bồi dưỡng học sinh giỏi & Phụ đạo học sinh yếu kém',
        assignedTarget: '4 tiết/tuần bồi dưỡng đội tuyển HSG, phụ đạo 10 em học sinh yếu',
        result: 'Hoàn thành bồi dưỡng 16 tiết trong tháng, học sinh tiến bộ',
        completionRate: 100,
        status: 'completed',
        evidenceLink: 'https://drive.google.com/file/d/sample-so-boi-duong'
      },
      {
        id: 't3',
        taskName: 'Sinh hoạt tổ chuyên môn, dự giờ thăm lớp & làm đồ dùng dạy học',
        assignedTarget: 'Dự 2 tiết/tháng, làm 1 đồ dùng dạy học ứng dụng CNTT',
        result: 'Đã dự đủ 2 tiết, thiết kế bài giảng E-learning trên Canva/PPT',
        completionRate: 100,
        status: 'completed',
        evidenceLink: 'https://drive.google.com/file/d/sample-bai-giang-cntt'
      }
    ],
    overallSummary: '3/3 nhiệm vụ hoàn thành xuất sắc trong tháng. Tỷ lệ hoàn thành nhiệm vụ đạt 100%.',
    attachedFileUrl: 'https://docs.google.com/spreadsheets/d/1sLOpOWvtufbaFHkcuJAa0BpC2zA4ePFZMSjY-hc-DM8/edit?gid=0#gid=0',
    updatedAt: new Date().toISOString()
  };
}

// Helper to generate mock scores for a teacher
export function createDefaultEvaluation(teacherId: string, month: number, year: number = 2026, offset: number = 0, teacherObj?: Teacher): Form03Evaluation {
  const scores: Record<string, any> = {};
  
  const teacher = teacherObj || INITIAL_TEACHERS.find(t => t.id === teacherId);
  const criteriaList = getCriteriaForTeacher(teacher);

  const idx = parseInt(teacherId.replace('gv', ''), 10) || 1;
  const isTop = idx <= 12 || idx % 3 === 0;
  const isGood = !isTop && (idx % 2 === 0);
  
  let partA_Teacher = 0;
  let partA_Principal = 0;
  let partB_Teacher = 0;
  let partB_Principal = 0;
  let bonus_Teacher = 0;
  let bonus_Principal = 0;
  let deduction_Teacher = 0;
  let deduction_Principal = 0;

  criteriaList.forEach(c => {
    let tScore = c.maxPoints;
    if (c.section === 'BONUS' || c.section === 'DEDUCTION') {
      tScore = 0;
    } else if (!isTop) {
      if (isGood) {
        tScore = Math.max(0, c.maxPoints - (c.maxPoints >= 5 ? 1 : 0.25));
      } else {
        tScore = Math.max(0, c.maxPoints - (c.maxPoints >= 5 ? 2 : 0.5));
      }
    }
    
    let pScore = tScore;
    if (idx === 15 && c.id === 'A_I_1_a') pScore = Math.max(0, tScore - 0.25);

    scores[c.id] = {
      criteriaId: c.id,
      teacherScore: tScore,
      principalScore: pScore,
      note: ''
    };

    if (c.section === 'A') {
      partA_Teacher += tScore;
      partA_Principal += pScore;
    } else if (c.section === 'B') {
      partB_Teacher += tScore;
      partB_Principal += pScore;
    } else if (c.section === 'BONUS') {
      bonus_Teacher += tScore;
      bonus_Principal += pScore;
    } else if (c.section === 'DEDUCTION') {
      deduction_Teacher += tScore;
      deduction_Principal += pScore;
    }
  });

  const cappedA_Teacher = Math.min(30, partA_Teacher);
  const cappedA_Principal = Math.min(30, partA_Principal);
  const cappedB_Teacher = Math.min(70, partB_Teacher);
  const cappedB_Principal = Math.min(70, partB_Principal);

  const grandTotal_Teacher = Math.min(100, Math.max(0, Math.round((cappedA_Teacher + cappedB_Teacher + bonus_Teacher - deduction_Teacher) * 100) / 100));
  const grandTotal_Principal = Math.min(100, Math.max(0, Math.round((cappedA_Principal + cappedB_Principal + bonus_Principal - deduction_Principal) * 100) / 100));

  const padM = month < 10 ? `0${month}` : `${month}`;

  return {
    id: `eval_${teacherId}_m${month}`,
    teacherId,
    month,
    year,
    scores,
    totalPartA_Teacher: cappedA_Teacher,
    totalPartA_Principal: cappedA_Principal,
    totalPartB_Teacher: cappedB_Teacher,
    totalPartB_Principal: cappedB_Principal,
    totalBonus_Teacher: bonus_Teacher,
    totalBonus_Principal: bonus_Principal,
    totalDeduction_Teacher: deduction_Teacher,
    totalDeduction_Principal: deduction_Principal,
    grandTotal_Teacher,
    grandTotal_Principal,
    teacherClassification: getClassification(grandTotal_Teacher),
    principalClassification: getClassification(grandTotal_Principal),
    status: idx % 4 === 0 ? 'approved' : 'submitted',
    teacherSignatureDate: `28/${padM}/${year}`,
    principalSignatureDate: `30/${padM}/${year}`,
    updatedAt: new Date().toISOString()
  };
}
