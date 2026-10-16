import { Teacher, Form01Data, Form03Evaluation } from '../types';
import { getClassification, getCriteriaForTeacher } from './form03Criteria';

export const SCHOOL_NAME = 'Trường PTDTNT THCS và THPT Nước Oa';

export function getTeacherEmulationCode(teacher?: Teacher | null, index?: number): string {
  if (!teacher) return '';
  if (teacher.emulationCode) return teacher.emulationCode;
  const num = parseInt(teacher.id.replace(/\D/g, ''), 10);
  const n = !isNaN(num) && num > 0 ? num : (index !== undefined ? index + 1 : 1);
  return `TĐ${String(n).padStart(4, '0')}`;
}

export const ADMIN_TEACHER: Teacher = {
  id: 'admin_trung83',
  emulationCode: 'TĐ0000',
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
  { id: 'gv01', emulationCode: 'TĐ0001', fullName: 'Nguyễn Xuân Ảnh', email: 'anh.nguyen@nuocoa.edu.vn', phone: '0905123401', dob: '15/04/1975', position: 'Hiệu trưởng', subject: 'Quản lý chung', department: 'Ban Giám Hiệu', school: SCHOOL_NAME },
  { id: 'gv02', emulationCode: 'TĐ0002', fullName: 'Hồ Thị Hiến', email: 'hien.ho@nuocoa.edu.vn', phone: '0905123402', dob: '22/08/1978', position: 'Phó Hiệu trưởng', subject: 'Quản lý chuyên môn', department: 'Ban Giám Hiệu', school: SCHOOL_NAME },
  { id: 'gv03', emulationCode: 'TĐ0003', fullName: 'Đinh Hữu Phước', email: 'phuoc.dinh@nuocoa.edu.vn', phone: '0905123403', dob: '10/11/1980', position: 'Phó Hiệu trưởng', subject: 'Quản lý CSVC-Nội trú', department: 'Ban Giám Hiệu', school: SCHOOL_NAME },
  { id: 'gv04', emulationCode: 'TĐ0004', fullName: 'Nguyễn Thị Hồng', email: 'hong.nguyen@nuocoa.edu.vn', phone: '0905123404', dob: '05/01/1985', position: 'Nhân viên', subject: 'Hành chính', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv05', emulationCode: 'TĐ0005', fullName: 'Lương Văn Hơn', email: 'hon.luong@nuocoa.edu.vn', phone: '0905123405', dob: '18/09/1982', position: 'Nhân viên', subject: 'Bảo vệ - Thiết bị', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv06', emulationCode: 'TĐ0006', fullName: 'Ng.Thị Tường Vy', email: 'vy.nguyen@nuocoa.edu.vn', phone: '0905123406', dob: '30/03/1988', position: 'Nhân viên', subject: 'Văn thư - Thủ quỹ', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv07', emulationCode: 'TĐ0007', fullName: 'Vũ Thị Hồng Ngọc', email: 'ngoc.vu@nuocoa.edu.vn', phone: '0905123407', dob: '12/07/1989', position: 'Nhân viên', subject: 'Kế toán', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv08', emulationCode: 'TĐ0008', fullName: 'Nguyễn Đình Lâu', email: 'lau.nguyen@nuocoa.edu.vn', phone: '0905123408', dob: '25/02/1981', position: 'Tổ trưởng chuyên môn', subject: 'Lịch sử', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv09', emulationCode: 'TĐ0009', fullName: 'Hồ Thị Hiếu', email: 'hieu.ho@nuocoa.edu.vn', phone: '0905123409', dob: '08/12/1987', position: 'Giáo viên', subject: 'Địa lý', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv10', emulationCode: 'TĐ0010', fullName: 'Lữ Văm Lam', email: 'lam.lu@nuocoa.edu.vn', phone: '0905123410', dob: '14/06/1986', position: 'Giáo viên', subject: 'Toán học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv11', emulationCode: 'TĐ0011', fullName: 'Nguyễn Hùng Vỹ', email: 'vy.nguyenhung@nuocoa.edu.vn', phone: '0905123411', dob: '03/05/1984', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv12', emulationCode: 'TĐ0012', fullName: 'Huỳnh Thị Bích Lợi', email: 'loi.huynh@nuocoa.edu.vn', phone: '0905123412', dob: '19/10/1988', position: 'Giáo viên', subject: 'Lịch sử', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv13', emulationCode: 'TĐ0013', fullName: 'Phạm Lý Nghĩa', email: 'nghia.pham@nuocoa.edu.vn', phone: '0905123413', dob: '27/01/1983', position: 'Tổ trưởng chuyên môn', subject: 'Vật lý', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv14', emulationCode: 'TĐ0014', fullName: 'Nguyễn Văn Trung', email: 'trung.nguyen@nuocoa.edu.vn', phone: '0905123414', dob: '11/08/1985', position: 'Giáo viên - TKHĐ', subject: 'Tin học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv15', emulationCode: 'TĐ0015', fullName: 'Huỳnh Thị Mi Sa', email: 'misa.huynh@nuocoa.edu.vn', phone: '0905123415', dob: '09/04/1989', position: 'Giáo viên', subject: 'Hóa học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv16', emulationCode: 'TĐ0016', fullName: 'Bùi Thị Mỹ An', email: 'an.bui@nuocoa.edu.vn', phone: '0905123416', dob: '16/09/1990', position: 'Giáo viên', subject: 'Sinh học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv17', emulationCode: 'TĐ0017', fullName: 'Nguyễn Văn Ân Tình', email: 'tinh.nguyen@nuocoa.edu.vn', phone: '0905123417', dob: '02/11/1987', position: 'Giáo viên', subject: 'Toán học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv18', emulationCode: 'TĐ0018', fullName: 'Bùi Thị Hồng Thắm', email: 'tham.bui@nuocoa.edu.vn', phone: '0905123418', dob: '20/06/1991', position: 'Giáo viên', subject: 'Vật lý', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv19', emulationCode: 'TĐ0019', fullName: 'Trần Thị Kim Tuyến', email: 'tuyen.tran@nuocoa.edu.vn', phone: '0905123419', dob: '13/03/1988', position: 'Giáo viên', subject: 'Hóa học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv20', emulationCode: 'TĐ0020', fullName: 'Cao Thị Hà My', email: 'my.cao@nuocoa.edu.vn', phone: '0905123420', dob: '07/07/1992', position: 'Giáo viên', subject: 'Sinh học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv21', emulationCode: 'TĐ0021', fullName: 'Lê Thị Hoa', email: 'hoa.le@nuocoa.edu.vn', phone: '0905123421', dob: '29/01/1986', position: 'Giáo viên', subject: 'Công nghệ', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv22', emulationCode: 'TĐ0022', fullName: 'Trần Thị Kiều Hương', email: 'huong.tran@nuocoa.edu.vn', phone: '0905123422', dob: '17/05/1989', position: 'Giáo viên', subject: 'Tin học', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv23', emulationCode: 'TĐ0023', fullName: 'Nguyễn Văn Sĩ', email: 'si.nguyen@nuocoa.edu.vn', phone: '0905123423', dob: '21/10/1984', position: 'Giáo viên', subject: 'Thể dục', department: 'KHTN', school: SCHOOL_NAME },
  { id: 'gv24', emulationCode: 'TĐ0024', fullName: 'Huỳnh Thị Minh Hằng', email: 'hang.huynh@nuocoa.edu.vn', phone: '0905123424', dob: '04/02/1990', position: 'Nhân viên QLNT', subject: 'Quản lý nội trú', department: 'QLNT', school: SCHOOL_NAME },
  { id: 'gv25', emulationCode: 'TĐ0025', fullName: 'Trần Văn Hảo', email: 'hao.tran@nuocoa.edu.vn', phone: '0905123425', dob: '18/12/1985', position: 'Giáo viên', subject: 'GDCD', department: 'KHXH2', school: SCHOOL_NAME },
  { id: 'gv26', emulationCode: 'TĐ0026', fullName: 'Lê Văn Lập', email: 'lap.le@nuocoa.edu.vn', phone: '0905123426', dob: '06/08/1987', position: 'Bí thư Đoàn trường', subject: ' Hoạt động trải nghiệm', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv27', emulationCode: 'TĐ0027', fullName: 'Hoàng Văn Hùng', email: 'hung.hoang@nuocoa.edu.vn', phone: '0905123427', dob: '31/05/1983', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv28', emulationCode: 'TĐ0028', fullName: 'Huỳnh Thị Trang', email: 'trang.huynh@nuocoa.edu.vn', phone: '0905123428', dob: '15/09/1990', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv29', emulationCode: 'TĐ0029', fullName: 'Hồ Thị Bờ', email: 'bo.ho@nuocoa.edu.vn', phone: '0905123429', dob: '23/11/1991', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv30', emulationCode: 'TĐ0030', fullName: 'Nguyễn Thị Hồng Châu', email: 'chau.nguyen@nuocoa.edu.vn', phone: '0905123430', dob: '10/03/1986', position: 'Giáo viên', subject: 'Âm nhạc', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv31', emulationCode: 'TĐ0031', fullName: 'Lê Thị Phương Uyên', email: 'uyen.le@nuocoa.edu.vn', phone: '0905123431', dob: '28/07/1992', position: 'Giáo viên', subject: 'Mỹ thuật', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv32', emulationCode: 'TĐ0032', fullName: 'Nguyễn Duy Vũ', email: 'vu.nguyen@nuocoa.edu.vn', phone: '0905123432', dob: '12/01/1988', position: 'Nhân viên', subject: 'Y tế học đường', department: 'Văn phòng', school: SCHOOL_NAME },
  { id: 'gv33', emulationCode: 'TĐ0033', fullName: 'Nguyễn Thị Hoà', email: 'hoa.nguyen@nuocoa.edu.vn', phone: '0905123433', dob: '05/06/1989', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv34', emulationCode: 'TĐ0034', fullName: 'Trần Thị Nhật', email: 'nhat.tran@nuocoa.edu.vn', phone: '0905123434', dob: '19/02/1990', position: 'Giáo viên', subject: 'Ngữ văn', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv35', emulationCode: 'TĐ0035', fullName: 'Nguyễn Phạm Trúc Phương', email: 'phuong.nguyen@nuocoa.edu.vn', phone: '0905123435', dob: '14/11/1993', position: 'Giáo viên', subject: 'Tiếng Anh', department: 'KHXH1', school: SCHOOL_NAME },
  { id: 'gv36', emulationCode: 'TĐ0036', fullName: 'Nguyễn Văn Hoài', email: 'hoai.nguyen@nuocoa.edu.vn', phone: '0905123436', dob: '26/04/1991', position: 'Giáo viên', subject: 'Toán học', department: 'KHTN', school: SCHOOL_NAME }
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

  // Base scores variation based on teacher index to give realistic distribution
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
      tScore = 0; // Default bonus and deduction to 0
    } else if (!isTop) {
      if (isGood) {
        tScore = Math.max(0, c.maxPoints - (c.maxPoints >= 5 ? 1 : 0.25));
      } else {
        tScore = Math.max(0, c.maxPoints - (c.maxPoints >= 5 ? 2 : 0.5));
      }
    }
    
    // Slight principal adjustment
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

  // Cap Part A at 30 points and Part B at 70 points
  const cappedA_Teacher = Math.min(30, partA_Teacher);
  const cappedA_Principal = Math.min(30, partA_Principal);
  const cappedB_Teacher = Math.min(70, partB_Teacher);
  const cappedB_Principal = Math.min(70, partB_Principal);

  // Grand total formula: Part A (A.1..A.27) + Part B (B.1..B.6) + Bonus (C) - Deduction (D) = max 100
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
