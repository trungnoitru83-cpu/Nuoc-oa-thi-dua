export interface CredentialChangeLog {
  id: string;
  timestamp: string;
  targetTeacherName: string;
  emulationCode: string;
  actionType: 'Đổi mật khẩu' | 'Sửa tên đăng nhập' | 'Thêm viên chức mới' | 'Xóa viên chức';
  details: string;
  reportedTo: string; // Always 'trungnoitru83@gmail.com'
}

export const ADMIN_EMAIL = 'trungnoitru83@gmail.com';
export const PRINCIPAL_ADMIN_EMAIL = 'anh.nguyen@nuocoa.edu.vn';
export const ADMIN_EMAILS = ['trungnoitru83@gmail.com', 'anh.nguyen@nuocoa.edu.vn'];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(e => e.toLowerCase() === clean);
}

export function notifyCredentialChange(log: Omit<CredentialChangeLog, 'id' | 'timestamp' | 'reportedTo'>): CredentialChangeLog {
  const newLog: CredentialChangeLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleString('vi-VN'),
    reportedTo: 'trungnoitru83@gmail.com, anh.nguyen@nuocoa.edu.vn'
  };

  try {
    const existing = getCredentialLogs();
    const updated = [newLog, ...existing];
    localStorage.setItem('nuocoa_credential_logs', JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving credential log:', err);
  }

  // Console log for simulation & verification
  console.log(`[EMAIL NOTIFICATION SENT TO ADMINS: ${ADMIN_EMAILS.join(', ')}]`, newLog);

  return newLog;
}

export function getCredentialLogs(): CredentialChangeLog[] {
  try {
    const saved = localStorage.getItem('nuocoa_credential_logs');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
