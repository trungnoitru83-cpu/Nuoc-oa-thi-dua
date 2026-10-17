import { Teacher, Role } from '../types';

export interface AuthorizedManager {
  email: string;
  altEmail?: string;
  emulationCode: string;
  fullName: string;
  position: string;
  role: Role;
  canSignForm01: boolean;
  canViewSummary: boolean;
  signatureTitle: string; // e.g. "Phó Hiệu trưởng", "Tổ trưởng chuyên môn"
}

export const AUTHORIZED_MANAGERS: AuthorizedManager[] = [
  // Quản trị viên
  {
    email: 'trungnoitru83@gmail.com',
    emulationCode: 'TĐ00',
    fullName: 'Quản Trị Viên (Trung)',
    position: 'Quản trị viên Hệ thống',
    role: 'admin',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Quản trị viên Hệ thống'
  },
  // Hiệu trưởng
  {
    email: 'anh.nguyen@nuocoa.edu.vn',
    emulationCode: 'TĐ01',
    fullName: 'Nguyễn Xuân Ảnh',
    position: 'Hiệu trưởng',
    role: 'principal',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Hiệu trưởng'
  },
  // Phó Hiệu trưởng: Hồ Thị Hiến
  {
    email: 'hohien1975@gmail.com',
    altEmail: 'hien.ho@nuocoa.edu.vn',
    emulationCode: 'TĐ02',
    fullName: 'Hồ Thị Hiến',
    position: 'Phó Hiệu trưởng',
    role: 'principal',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Phó Hiệu trưởng'
  },
  // Phó Hiệu trưởng: Đinh Hữu Phước
  {
    email: 'dinhphuocedu@gmail.com',
    altEmail: 'phuoc.dinh@nuocoa.edu.vn',
    emulationCode: 'TĐ03',
    fullName: 'Đinh Hữu Phước',
    position: 'Phó Hiệu trưởng',
    role: 'principal',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Phó Hiệu trưởng'
  },
  // Văn phòng / Thẩm định hồ sơ: Nguyễn Thị Hồng
  {
    email: 'nguyenhong08csm@gmail.com',
    altEmail: 'hong.nguyen@nuocoa.edu.vn',
    emulationCode: 'TĐ04',
    fullName: 'Nguyễn Thị Hồng',
    position: 'Thẩm định hồ sơ / Văn phòng',
    role: 'staff',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Thẩm định hồ sơ Văn phòng'
  },
  // Tổ trưởng CM KHXH2: Nguyễn Đình Lâu
  {
    email: 'launuocoa@gmail.com',
    altEmail: 'lau.nguyen@nuocoa.edu.vn',
    emulationCode: 'TĐ10',
    fullName: 'Nguyễn Đình Lâu',
    position: 'Tổ trưởng chuyên môn KHXH2',
    role: 'department_head',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Tổ trưởng chuyên môn KHXH2'
  },
  // Tổ trưởng CM KHTN: Phạm Lý Nghĩa
  {
    email: 'lynghiant@gmail.com',
    altEmail: 'nghia.pham@nuocoa.edu.vn',
    emulationCode: 'TĐ22',
    fullName: 'Phạm Lý Nghĩa',
    position: 'Tổ trưởng chuyên môn KHTN',
    role: 'department_head',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Tổ trưởng chuyên môn KHTN'
  },
  // Tổ phó / Phụ trách CM: Nguyễn Văn Sĩ
  {
    email: 'vansybtm@gmail.com',
    altEmail: 'si.nguyen@nuocoa.edu.vn',
    emulationCode: 'TĐ30',
    fullName: 'Nguyễn Văn Sĩ',
    position: 'Tổ phó / Phụ trách chuyên môn KHTN',
    role: 'department_head',
    canSignForm01: true,
    canViewSummary: true,
    signatureTitle: 'Tổ phó chuyên môn'
  }
];

export const SPECIAL_AUTHORIZED_EMAILS = [
  'hohien1975@gmail.com',
  'dinhphuocedu@gmail.com',
  'nguyenhong08csm@gmail.com',
  'launuocoa@gmail.com',
  'lynghiant@gmail.com',
  'vansybtm@gmail.com'
];

export const AUTHORIZED_EMAILS = AUTHORIZED_MANAGERS.map(m => m.email.toLowerCase());
export const ALL_MANAGER_EMAILS = [
  ...AUTHORIZED_EMAILS,
  ...SPECIAL_AUTHORIZED_EMAILS,
  ...AUTHORIZED_MANAGERS.filter(m => m.altEmail).map(m => m.altEmail!.toLowerCase())
];

/**
 * Tra cứu thông tin cán bộ quản lý được phân quyền theo Email, Mã thi đua hoặc đối tượng Teacher
 */
export function getAuthorizedManager(emailOrUser?: string | Teacher | null): AuthorizedManager | undefined {
  if (!emailOrUser) return undefined;
  if (typeof emailOrUser === 'string') {
    const clean = emailOrUser.trim().toLowerCase();
    return AUTHORIZED_MANAGERS.find(
      m => m.email.toLowerCase() === clean || 
           (m.altEmail && m.altEmail.toLowerCase() === clean) || 
           m.emulationCode.toLowerCase() === clean ||
           m.fullName.toLowerCase() === clean
    );
  }
  const teacher = emailOrUser;
  const cleanEmail = (teacher.email || '').trim().toLowerCase();
  const cleanCode = (teacher.emulationCode || teacher.id || '').trim().toLowerCase();
  const cleanName = (teacher.fullName || '').trim().toLowerCase();

  return AUTHORIZED_MANAGERS.find(
    m => m.email.toLowerCase() === cleanEmail ||
         (m.altEmail && m.altEmail.toLowerCase() === cleanEmail) ||
         m.emulationCode.toLowerCase() === cleanCode ||
         m.fullName.toLowerCase() === cleanName
  );
}

/**
 * Kiểm tra xem người dùng có quyền Ký xác nhận Mẫu 01 (Vị trí 1 hoặc Vị trí 2) hay không
 */
export function canSignForm01(user?: Teacher | null): boolean {
  if (!user) return false;
  if (user.isAdmin || user.role === 'admin') return true;

  const cleanEmail = (user.email || '').trim().toLowerCase();
  if (SPECIAL_AUTHORIZED_EMAILS.includes(cleanEmail)) return true;

  const mgr = getAuthorizedManager(user);
  if (mgr && mgr.canSignForm01) return true;

  const pos = (user.position || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  return (
    pos.includes('hiệu trưởng') ||
    pos.includes('phó hiệu trưởng') ||
    pos.includes('tổ trưởng') ||
    pos.includes('tổ phó') ||
    dept.includes('ban giám hiệu') ||
    dept.includes('bgh')
  );
}

/**
 * Kiểm tra xem người dùng có quyền xem Bảng Tổng Hợp thi đua toàn trường hay không
 */
export function canViewSummary(user?: Teacher | null, currentRole?: Role): boolean {
  if (!user) return false;
  if (user.isAdmin || user.role === 'admin' || currentRole === 'admin' || currentRole === 'principal') return true;

  const cleanEmail = (user.email || '').trim().toLowerCase();
  if (SPECIAL_AUTHORIZED_EMAILS.includes(cleanEmail)) return true;

  const mgr = getAuthorizedManager(user);
  if (mgr && mgr.canViewSummary) return true;

  const pos = (user.position || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  return (
    pos.includes('hiệu trưởng') ||
    pos.includes('phó hiệu trưởng') ||
    pos.includes('quản trị') ||
    pos.includes('tổ trưởng') ||
    pos.includes('tổ phó') ||
    dept.includes('ban giám hiệu') ||
    dept.includes('bgh')
  );
}

