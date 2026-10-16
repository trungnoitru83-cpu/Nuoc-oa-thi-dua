import React, { useState } from 'react';
import { X, UserPlus, Trash2, Edit2, Check, Save, Shield, MailCheck, History } from 'lucide-react';
import { Teacher } from '../types';
import { SCHOOL_NAME, getTeacherEmulationCode } from '../data/mockTeachers';
import { formatTeacherId } from '../utils/formatTeacherId';
import { notifyCredentialChange, getCredentialLogs, ADMIN_EMAIL } from '../lib/credentialNotifier';

interface ManageTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  initialAddAdmin?: boolean;
}

export const ManageTeachersModal: React.FC<ManageTeachersModalProps> = ({
  isOpen,
  onClose,
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  initialAddAdmin = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(initialAddAdmin);
  const [isAddAdminMode, setIsAddAdminMode] = useState(initialAddAdmin);
  const [notifyNotice, setNotifyNotice] = useState<string>('');

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emulationCode, setEmulationCode] = useState('');
  const [dob, setDob] = useState('01/01/1985');
  const [subject, setSubject] = useState('Quản lý chung');
  const [department, setDepartment] = useState('Ban Quản trị');
  const [position, setPosition] = useState('Quản trị viên');

  if (!isOpen) return null;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const nextNumber = teachers.filter(t => t.id !== 'admin_trung83').length + 1;
    const autoCode = emulationCode.trim() ? formatTeacherId(emulationCode) : (isAddAdminMode ? 'TĐ00' : formatTeacherId(nextNumber));
    const userEmail = email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@nuocoa.edu.vn`;

    const newTeacher: Teacher = {
      id: isAddAdminMode ? `admin_${Date.now()}` : `gv_${Date.now()}`,
      emulationCode: autoCode,
      fullName: fullName.trim(),
      email: userEmail,
      phone: phone.trim() || '0905123483',
      dob,
      position: isAddAdminMode ? (position.trim() || 'Quản trị viên Hệ thống') : position,
      subject: isAddAdminMode ? 'Quản trị hệ thống' : subject,
      department: isAddAdminMode ? 'Ban Quản trị' : department,
      school: SCHOOL_NAME,
      isAdmin: isAddAdminMode,
      role: isAddAdminMode ? 'admin' : 'teacher'
    };

    onAddTeacher(newTeacher);

    // Notify Admin via email log
    notifyCredentialChange({
      targetTeacherName: newTeacher.fullName,
      emulationCode: autoCode,
      actionType: 'Thêm viên chức mới',
      details: isAddAdminMode
        ? `🔑 Bổ sung Quản trị viên mới: ${newTeacher.fullName} (${userEmail}) - Chức vụ: ${newTeacher.position} - Mật khẩu: 123456`
        : `Đã bổ sung viên chức mới: ${newTeacher.fullName} (${autoCode}) - Email: ${userEmail} - Mật khẩu mặc định: 123456`
    });

    setNotifyNotice(
      isAddAdminMode
        ? `✅ Đã bổ sung Quản trị viên mới "${newTeacher.fullName}" (${userEmail}) thành công!`
        : `✅ Đã thêm viên chức mới "${newTeacher.fullName}" và báo thông báo tới Quản trị viên (${ADMIN_EMAIL})!`
    );

    setFullName('');
    setEmail('');
    setPhone('');
    setEmulationCode('');
    setShowAddForm(false);
  };

  const startEdit = (t: Teacher) => {
    setEditingId(t.id);
    setFullName(t.fullName);
    setEmail(t.email);
    setEmulationCode(t.emulationCode || getTeacherEmulationCode(t));
    setDob(t.dob);
    setSubject(t.subject);
    setDepartment(t.department);
    setPosition(t.position || 'Giáo viên');
  };

  const handleToggleAdminRole = (t: Teacher) => {
    const newIsAdmin = !t.isAdmin && t.role !== 'admin';
    const updated: Teacher = {
      ...t,
      isAdmin: newIsAdmin,
      role: newIsAdmin ? 'admin' : 'teacher',
      position: newIsAdmin && !t.position?.includes('Quản trị') ? `${t.position || 'Cán bộ'} (Quản trị viên)` : t.position
    };

    onUpdateTeacher(updated);
    notifyCredentialChange({
      targetTeacherName: t.fullName,
      emulationCode: t.emulationCode || getTeacherEmulationCode(t),
      actionType: 'Sửa tên đăng nhập',
      details: newIsAdmin
        ? `🛡️ Cấp quyền Quản trị viên (Admin) cho cán bộ: ${t.fullName} (${t.email})`
        : `⚙️ Thu hồi quyền Quản trị viên cán bộ: ${t.fullName}`
    });

    setNotifyNotice(
      newIsAdmin
        ? `🛡️ Đã cấp quyền Quản trị viên (Admin) cho "${t.fullName}" thành công!`
        : `⚙️ Đã chuyển "${t.fullName}" về tài khoản viên chức thông thường.`
    );
  };

  const handleSaveEdit = (t: Teacher) => {
    const updatedCode = formatTeacherId(emulationCode.trim() || t.emulationCode || getTeacherEmulationCode(t));
    const updatedEmail = email.trim() || t.email;

    const updated: Teacher = {
      ...t,
      fullName,
      email: updatedEmail,
      emulationCode: updatedCode,
      dob,
      subject,
      department,
      position
    };

    onUpdateTeacher(updated);

    if (t.email !== updatedEmail || t.emulationCode !== updatedCode || t.fullName !== fullName) {
      notifyCredentialChange({
        targetTeacherName: updated.fullName,
        emulationCode: updatedCode,
        actionType: 'Sửa tên đăng nhập',
        details: `Cập nhật thông tin cán bộ: ${fullName} (${updatedCode}) - Email: ${updatedEmail}`
      });
      setNotifyNotice(`✅ Đã cập nhật Tên đăng nhập / Mã thi đua cán bộ và báo thông báo về Gmail Quản trị viên (${ADMIN_EMAIL})!`);
    }

    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋 Quản Lý Danh Sách CBGV &amp; Quản Trị Viên ({teachers.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Chỉnh sửa thông tin, phân quyền Quản trị viên, thêm mới hoặc xóa nhân sự
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={() => {
                setIsAddAdminMode(false);
                setPosition('Giáo viên');
                setSubject('Ngữ văn');
                setDepartment('Tổ Xã hội');
                setShowAddForm(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 btn-teacher text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Thêm Giáo Viên / NV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Alert Banner */}
        {notifyNotice && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span>{notifyNotice}</span>
            <button onClick={() => setNotifyNotice('')} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white text-xs font-black">✕</button>
          </div>
        )}

        {/* Form Add New Teacher or Admin */}
        {showAddForm && (
          <form onSubmit={handleCreateNew} className={`p-6 border-b ${isAddAdminMode ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' : 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-xs font-extrabold uppercase flex items-center gap-1.5 ${isAddAdminMode ? 'text-amber-900 dark:text-amber-300' : 'text-blue-900 dark:text-blue-300'}`}>
                {isAddAdminMode ? <Shield className="w-4 h-4 text-amber-600" /> : <UserPlus className="w-4 h-4 text-blue-600" />}
                <span>{isAddAdminMode ? 'THÊM TÀI KHOẢN QUẢN TRỊ VIÊN MỚI (ADMIN)' : 'THÊM VIÊN CHỨC / GIÁO VIÊN MỚI'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Đóng form ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  placeholder="Họ và tên..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  placeholder="email@nuocoa.edu.vn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Chức vụ / Quyền hạn</label>
                <input
                  type="text"
                  placeholder={isAddAdminMode ? "Quản trị viên Hệ thống" : "Giáo viên..."}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Mã thi đua (Tự tạo nếu trống)</label>
                <input
                  type="text"
                  placeholder={isAddAdminMode ? "TĐ_ADMIN01" : "TĐ0037..."}
                  value={emulationCode}
                  onChange={(e) => setEmulationCode(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 italic">
                {isAddAdminMode 
                  ? '🔑 Tài khoản Quản trị viên mới có toàn quyền xem Bảng tổng hợp thi đua, quản lý cán bộ và phê duyệt Mẫu 03.'
                  : 'Mật khẩu khởi tạo mặc định là 123456. Cán bộ có thể tự đổi mật khẩu sau khi đăng nhập.'}
              </p>
              <button
                type="submit"
                className={`flex items-center gap-1.5 px-4 py-2 font-black text-xs text-white rounded-xl shadow-sm transition cursor-pointer ${isAddAdminMode ? 'bg-amber-600 hover:bg-amber-700' : 'btn-teacher'}`}
              >
                {isAddAdminMode ? <Shield className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{isAddAdminMode ? 'Xác nhận tạo Quản trị viên' : 'Xác nhận thêm GV'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Teachers List Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-10 text-center">STT</th>
                <th className="p-3 min-w-[160px]">Họ và tên</th>
                <th className="p-3 min-w-[180px]">Email</th>
                <th className="p-3 w-28">Mã TĐ</th>
                <th className="p-3 w-32">Chức vụ</th>
                <th className="p-3 w-28 text-center">Vai trò Admin</th>
                <th className="p-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {teachers.map((t, idx) => {
                const isEditing = editingId === t.id;
                const isUserAdmin = t.isAdmin === true || t.role === 'admin' || t.email === 'trungnoitru83@gmail.com' || t.position?.toLowerCase().includes('quản trị');
                return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>

                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      {isEditing ? (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="p-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{t.fullName}</span>
                          {isUserAdmin && (
                            <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded border border-amber-300 shrink-0">
                              ADMIN
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-slate-500">
                      {isEditing ? (
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="p-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        t.email
                      )}
                    </td>

                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400 font-bold">
                      {t.emulationCode || getTeacherEmulationCode(t)}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="p-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300">{t.position || 'Giáo viên'}</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleAdminRole(t)}
                        title={isUserAdmin ? "Bấm để thu hồi quyền Admin" : "Bấm để cấp quyền Quản trị viên"}
                        className={`px-2 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                          isUserAdmin
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isUserAdmin ? 'Đã có Admin' : '+ Cấp Admin'}</span>
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(t)}
                            title="Lưu"
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(t)}
                            title="Sửa"
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteTeacher(t.id)}
                          title="Xóa"
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 font-medium">
            Tất cả các thay đổi sẽ tự động đồng bộ hóa toàn bộ các trang chấm điểm thi đua
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
