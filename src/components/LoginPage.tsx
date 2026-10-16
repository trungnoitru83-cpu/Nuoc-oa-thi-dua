import React, { useState, useMemo } from 'react';
import {
  Lock,
  ShieldCheck,
  User,
  Users,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  KeyRound,
  UserCheck,
  ListOrdered,
  UserPlus,
  Shield,
  MailCheck,
  Hash,
  Sparkles,
  Check
} from 'lucide-react';
import { Teacher, Role } from '../types';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  isLeaderTeacher,
  getDefaultRoleForTeacher
} from '../data/form03Criteria';
import { getTeacherEmulationCode, ADMIN_TEACHER } from '../data/mockTeachers';
import { notifyCredentialChange, ADMIN_EMAIL, PRINCIPAL_ADMIN_EMAIL, ADMIN_EMAILS, isAdminEmail, getCredentialLogs } from '../lib/credentialNotifier';

interface LoginPageProps {
  teachers: Teacher[];
  onLogin: (teacher: Teacher, role: Role) => void;
  onSelectTeacherForDemo?: (teacher: Teacher, role: Role) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  teachers,
  onLogin
}) => {
  // Login Inputs
  const [loginIdentifier, setLoginIdentifier] = useState('TĐ0001');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<Role>('principal');
  const [errorMessage, setErrorMessage] = useState('');

  // 36 Emulation Codes Directory Modal State (Hidden by default)
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Admin Verification Modal State
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // New Teacher Modal inside Admin Directory View
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmulationCode, setNewEmulationCode] = useState('');
  const [newSubject, setNewSubject] = useState('Ngữ văn');
  const [newDepartment, setNewDepartment] = useState('KHXH1');
  const [newPosition, setNewPosition] = useState('Giáo viên');
  const [addSuccessNotice, setAddSuccessNotice] = useState('');

  // Google Auth Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('trungnoitru83@gmail.com');
  const [googlePasswordInput, setGooglePasswordInput] = useState('');
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState('');
  const [googleModalError, setGoogleModalError] = useState('');

  // Change Password Modal State
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [changePassIdentifier, setChangePassIdentifier] = useState('TĐ0001');
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmNewPassInput, setConfirmNewPassInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  // Helper: Find teacher by Mã thi đua (TĐ0001 - TĐ0036), Email or Name
  const findTeacher = (input: string): { teacher: Teacher; index: number } | null => {
    const raw = input.trim();
    if (!raw) return null;
    const clean = raw.toLowerCase();
    const cleanNoAccent = clean.replace(/đ/g, 'd');

    // Check if searching for admin email directly
    if (clean === ADMIN_EMAIL.toLowerCase() || clean === PRINCIPAL_ADMIN_EMAIL.toLowerCase() || clean === 'td0000' || clean === 'admin') {
      return { teacher: ADMIN_TEACHER, index: 0 };
    }

    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      const code = (t.emulationCode || getTeacherEmulationCode(t, i)).toLowerCase();
      const codeNoAccent = code.replace(/đ/g, 'd');
      const teacherNum = parseInt(t.id.replace(/\D/g, ''), 10) || (i + 1);
      const rawNum = parseInt(clean.replace(/\D/g, ''), 10);

      if (
        code === clean ||
        codeNoAccent === cleanNoAccent ||
        (cleanNoAccent.startsWith('td') && cleanNoAccent === codeNoAccent) ||
        (!isNaN(rawNum) && rawNum === teacherNum && clean.length <= 6) ||
        t.email.toLowerCase() === clean ||
        t.fullName.toLowerCase() === clean ||
        t.id.toLowerCase() === clean
      ) {
        return { teacher: t, index: i };
      }
    }
    return null;
  };

  // Password verification helper
  const verifyPassword = (matchedTeacher: Teacher, inputPass: string): boolean => {
    const cleanInput = inputPass.trim();
    const cleanEmail = matchedTeacher.email.toLowerCase();
    const code = (matchedTeacher.emulationCode || getTeacherEmulationCode(matchedTeacher)).toLowerCase();

    // Admin default passwords (trungnoitru83@gmail.com & anh.nguyen@nuocoa.edu.vn - Nguyễn Xuân Ảnh)
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() || cleanEmail === PRINCIPAL_ADMIN_EMAIL.toLowerCase() || code === 'td0001') {
      if (cleanInput === '123456' || cleanInput === 'nuocoa2026' || cleanInput === 'trungnoitru83' || cleanInput === 'anh.nguyen@nuocoa.edu.vn' || cleanInput === 'anhnguyen') return true;
    }

    try {
      const customPasswords = JSON.parse(localStorage.getItem('nuocoa_user_passwords') || '{}');
      if (customPasswords[code]) return cleanInput === customPasswords[code];
      if (customPasswords[cleanEmail]) return cleanInput === customPasswords[cleanEmail];
      if (customPasswords[matchedTeacher.id]) return cleanInput === customPasswords[matchedTeacher.id];
    } catch (e) {
      console.error(e);
    }
    return cleanInput === '123456' || cleanInput === 'nuocoa2026';
  };

  // Matched teacher for live indicator
  const matchedTeacherData = useMemo(() => {
    return findTeacher(loginIdentifier);
  }, [loginIdentifier, teachers]);

  // Handle open 36 Emulation Codes Directory Modal (Admin restriction)
  const handleOpen36CodesModal = () => {
    // Check if user is already verified admin or role is admin or identifier is admin email / TĐ0001
    const cleanId = loginIdentifier.trim().toLowerCase();
    if (isAdminUnlocked || role === 'admin' || isAdminEmail(cleanId) || cleanId === 'td0001' || cleanId === 'td0000') {
      setShowCodesModal(true);
    } else {
      setShowAdminAuthModal(true);
    }
  };

  // Handle Admin Auth Submission
  const handleVerifyAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    const input = adminPassInput.trim().toLowerCase();
    if (input === '123456' || input === 'nuocoa2026' || input === 'trungnoitru83' || input === 'anh.nguyen@nuocoa.edu.vn' || input === 'anhnguyen') {
      setIsAdminUnlocked(true);
      setShowAdminAuthModal(false);
      setShowCodesModal(true);
      setAdminPassInput('');
    } else {
      setAdminAuthError('Mật khẩu Quản trị viên không chính xác! Vui lòng thử lại.');
    }
  };

  // Handle Submit Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanInput = loginIdentifier.trim();
    const cleanPassword = password.trim();

    if (!cleanInput) {
      setErrorMessage('Vui lòng nhập Mã thi đua hoặc Email cán bộ!');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu đăng nhập!');
      return;
    }

    // Special check for Admin emails (trungnoitru83@gmail.com & anh.nguyen@nuocoa.edu.vn)
    if (isAdminEmail(cleanInput) || (cleanInput.toUpperCase() === 'TĐ0001' && role === 'admin')) {
      if (cleanPassword === '123456' || cleanPassword === 'nuocoa2026' || cleanPassword === 'trungnoitru83' || cleanPassword === 'anh.nguyen@nuocoa.edu.vn' || cleanPassword === 'anhnguyen') {
        const adminUser = (cleanInput.toLowerCase() === PRINCIPAL_ADMIN_EMAIL.toLowerCase() || cleanInput.toUpperCase() === 'TĐ0001')
          ? (teachers.find(t => t.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL.toLowerCase() || t.emulationCode === 'TĐ0001') || ADMIN_TEACHER)
          : ADMIN_TEACHER;
        onLogin(adminUser, 'admin');
        return;
      } else {
        setErrorMessage(`⛔ Mật khẩu không chính xác cho tài khoản Quản trị viên (${cleanInput}).`);
        return;
      }
    }

    const matched = findTeacher(cleanInput);

    if (!matched) {
      setErrorMessage(`⛔ ĐĂNG NHẬP THẤT BẠI: Mã thi đua hoặc Email "${loginIdentifier}" KHÔNG TỒN TẠI trong hệ thống. Vui lòng kiểm tra lại.`);
      return;
    }

    const { teacher: foundTeacher } = matched;

    if (!verifyPassword(foundTeacher, cleanPassword)) {
      setErrorMessage(`⛔ SAI MẬT KHẨU: Mật khẩu bạn nhập cho cán bộ "${foundTeacher.fullName}" (${foundTeacher.emulationCode || getTeacherEmulationCode(foundTeacher)}) KHÔNG CHÍNH XÁC.`);
      return;
    }

    onLogin(foundTeacher, role);
  };

  // Handle Send OTP
  const handleSendPhoneOtp = (teacher: Teacher) => {
    setIsSendingOtp(true);
    setChangePassError('');
    setOtpSentNotice('');

    setTimeout(() => {
      setIsSendingOtp(false);
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtpCode(randomOtp);
      const phoneDisplay = teacher.phone || '09051234xx';
      setOtpSentNotice(`Mã OTP đã gửi tới SĐT ${phoneDisplay} liên kết với Gmail: ${teacher.email}. [Mã thử nghiệm: ${randomOtp}]`);
    }, 600);
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    const cleanInput = changePassIdentifier.trim();
    const cleanCurrent = currentPassInput.trim();
    const cleanOtp = phoneOtpInput.trim();
    const cleanNew = newPassInput.trim();
    const cleanConfirm = confirmNewPassInput.trim();

    if (!cleanInput) {
      setChangePassError('Vui lòng chọn Mã thi đua / Email cần đổi mật khẩu!');
      return;
    }

    const matched = findTeacher(cleanInput);
    if (!matched) {
      setChangePassError(`⛔ Mã thi đua hoặc Email "${cleanInput}" không tồn tại trong hệ thống.`);
      return;
    }

    const { teacher: found } = matched;

    if (!cleanCurrent) {
      setChangePassError('Vui lòng nhập Mật khẩu hiện tại!');
      return;
    }

    if (!verifyPassword(found, cleanCurrent)) {
      setChangePassError('⛔ Mật khẩu hiện tại không chính xác!');
      return;
    }

    if (sentOtpCode && cleanOtp !== sentOtpCode) {
      setChangePassError('⛔ Mã xác nhận OTP không chính xác!');
      return;
    }

    if (!cleanNew) {
      setChangePassError('Vui lòng nhập Mật khẩu mới!');
      return;
    }

    if (cleanNew.length < 6) {
      setChangePassError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setChangePassError('⛔ Mật khẩu mới và Nhập lại mật khẩu mới KHÔNG TRÙNG KHỚP!');
      return;
    }

    try {
      const customPasswords = JSON.parse(localStorage.getItem('nuocoa_user_passwords') || '{}');
      const code = (found.emulationCode || getTeacherEmulationCode(found)).toLowerCase();
      customPasswords[code] = cleanNew;
      customPasswords[found.email.toLowerCase()] = cleanNew;
      localStorage.setItem('nuocoa_user_passwords', JSON.stringify(customPasswords));

      // CRITICAL: Notify Admin trungnoitru83@gmail.com
      notifyCredentialChange({
        targetTeacherName: found.fullName,
        emulationCode: found.emulationCode || getTeacherEmulationCode(found),
        actionType: 'Đổi mật khẩu',
        details: `Cán bộ ${found.fullName} (${code}) đã đổi mật khẩu thành công. Mật khẩu mới: ${cleanNew}`
      });

      setChangePassSuccess(`✅ Đã đổi mật khẩu thành công và gửi thông báo trực tiếp tới Gmail Quản trị viên (${ADMIN_EMAIL})!`);
      setLoginIdentifier(found.emulationCode || getTeacherEmulationCode(found));
      setPassword(cleanNew);

      setTimeout(() => {
        setIsChangePassModalOpen(false);
        setCurrentPassInput('');
        setPhoneOtpInput('');
        setSentOtpCode('');
        setOtpSentNotice('');
        setNewPassInput('');
        setConfirmNewPassInput('');
        setChangePassSuccess('');
      }, 1600);
    } catch (err) {
      setChangePassError('Không thể lưu mật khẩu mới. Vui lòng thử lại!');
    }
  };

  // Google Popup Auth
  const handleFirebaseGooglePopup = async () => {
    setErrorMessage('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userGoogleEmail = result.user?.email?.toLowerCase();

      if (!userGoogleEmail) {
        setErrorMessage('⛔ Không thể lấy thông tin Email từ tài khoản Google.');
        return;
      }

      if (userGoogleEmail === ADMIN_EMAIL.toLowerCase()) {
        onLogin(ADMIN_TEACHER, 'admin');
        return;
      }

      const matched = findTeacher(userGoogleEmail);
      if (!matched) {
        await auth.signOut();
        setErrorMessage(`⛔ Tài khoản Google (${userGoogleEmail}) chưa được cấp quyền trong hệ thống. Quản trị viên là ${ADMIN_EMAIL}`);
        return;
      }

      onLogin(matched.teacher, role);
    } catch (err: any) {
      setGoogleEmailInput(ADMIN_EMAIL);
      setGooglePasswordInput('');
      setGoogleModalError('');
      setGoogleSuccessMsg('');
      setIsGoogleModalOpen(true);
    }
  };

  const handleGoogleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleModalError('');
    setGoogleSuccessMsg('');

    const cleanEmail = googleEmailInput.trim().toLowerCase();
    const cleanPassword = googlePasswordInput.trim();

    if (!cleanEmail) {
      setGoogleModalError('Vui lòng nhập Email tài khoản Google!');
      return;
    }

    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      if (cleanPassword === '123456' || cleanPassword === 'nuocoa2026' || cleanPassword === 'trungnoitru83') {
        setGoogleSuccessMsg(`✅ Đăng nhập Quản trị viên thành công (${ADMIN_EMAIL})!`);
        setTimeout(() => {
          setIsGoogleModalOpen(false);
          onLogin(ADMIN_TEACHER, 'admin');
        }, 600);
        return;
      } else {
        setGoogleModalError(`⛔ Sai mật khẩu cho Quản trị viên ${ADMIN_EMAIL}.`);
        return;
      }
    }

    const matched = findTeacher(cleanEmail);
    if (!matched) {
      setGoogleModalError(`⛔ Email Google "${cleanEmail}" không thuộc hệ thống cán bộ giáo viên.`);
      return;
    }

    if (!verifyPassword(matched.teacher, cleanPassword)) {
      setGoogleModalError(`⛔ Mật khẩu không chính xác cho tài khoản ${cleanEmail}.`);
      return;
    }

    setGoogleSuccessMsg(`✅ Xác thực tài khoản thành công (${matched.teacher.fullName})!`);
    setTimeout(() => {
      setIsGoogleModalOpen(false);
      onLogin(matched.teacher, role);
    }, 600);
  };

  // Add New Staff by Admin
  const handleAddNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    const nextIdx = teachers.length + 1;
    const autoCode = newEmulationCode.trim() || `TĐ${String(nextIdx).padStart(4, '0')}`;
    const autoEmail = newEmail.trim() || `${newFullName.toLowerCase().replace(/\s+/g, '.')}@nuocoa.edu.vn`;

    const newTeacherObj: Teacher = {
      id: `gv_${Date.now()}`,
      emulationCode: autoCode,
      fullName: newFullName.trim(),
      email: autoEmail,
      dob: '01/01/1990',
      position: newPosition,
      subject: newSubject,
      department: newDepartment,
      school: 'Trường PTDTNT THCS và THPT Nước Oa'
    };

    teachers.push(newTeacherObj);
    localStorage.setItem('nuocoa_teachers', JSON.stringify(teachers));

    notifyCredentialChange({
      targetTeacherName: newFullName.trim(),
      emulationCode: autoCode,
      actionType: 'Thêm viên chức mới',
      details: `Đã bổ sung cán bộ mới: ${newFullName.trim()} (${autoCode}) - Email: ${autoEmail}`
    });

    setAddSuccessNotice(`✅ Đã bổ sung viên chức mới "${newFullName.trim()}" (${autoCode}) và báo về Gmail ${ADMIN_EMAIL}!`);

    setNewFullName('');
    setNewEmail('');
    setNewEmulationCode('');
    setShowAddTeacherForm(false);
  };

  // Filtered teachers for hidden modal
  const filteredTeachers = useMemo(() => {
    if (!searchFilter.trim()) return teachers;
    const q = searchFilter.toLowerCase();
    return teachers.filter((t, idx) => {
      const code = (t.emulationCode || getTeacherEmulationCode(t, idx)).toLowerCase();
      return (
        code.includes(q) ||
        t.fullName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    });
  }, [teachers, searchFilter]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">

      {/* Header Banner */}
      <div className="bg-theme-gradient text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 border border-white/20 relative overflow-hidden text-center sm:text-left">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-black bg-white/20 text-white rounded-full border border-white/30 backdrop-blur-xs">
                TRANG 1: ĐĂNG NHẬP XÁC THỰC
              </span>
              <span className="px-3 py-1 text-xs font-black bg-emerald-500/30 text-emerald-200 rounded-full border border-emerald-400/40 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                ADMIN: trungnoitru83@gmail.com
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Phần Mềm Chấm Thi Đua Hàng Tháng
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl mt-1 font-medium">
              Đăng nhập bằng <strong>Mã Thi Đua</strong>, Email cán bộ hoặc tài khoản Quản trị viên.
            </p>
          </div>

          {/* Button to open hidden 36 Emulation Codes Directory (Admin Only) */}
          <button
            type="button"
            onClick={handleOpen36CodesModal}
            className="flex items-center gap-2.5 px-5 py-3 bg-white text-slate-900 dark:bg-slate-800 dark:text-white hover:bg-slate-100 font-black text-xs rounded-2xl shadow-lg border border-white/40 transition shrink-0 cursor-pointer active:scale-95"
          >
            <ListOrdered className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <p className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Danh mục 36 mã</p>
              <p className="text-xs font-black text-slate-900 dark:text-white">Xem Danh Sách &amp; Thêm Mới</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Streamlined Login Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-slate-200 dark:border-slate-800 max-w-xl mx-auto">

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-2xl mb-3 border-2 border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Xác Thực Đăng Nhập Hệ Thống
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Nhập thông tin Mã thi đua, Mật khẩu và Lựa chọn Vai trò công tác
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-900 dark:bg-rose-950/90 dark:text-rose-100 rounded-2xl text-xs font-bold border-2 border-rose-400 dark:border-rose-800 flex items-start gap-3 shadow-md animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-xs text-rose-950 dark:text-rose-50 uppercase">TỪ CHỐI TRUY CẬP</p>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-200 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}



        <form onSubmit={handleFormSubmit} className="space-y-5">

          {/* 1. Mã Thi Đua Đăng Nhập */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-900 dark:text-slate-100">
                Tài khoản đăng nhập
              </label>
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-700 dark:text-slate-300 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => {
                  const val = e.target.value;
                  setLoginIdentifier(val);
                  setErrorMessage('');
                  if (val.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                    setRole('admin');
                  } else {
                    const matched = findTeacher(val);
                    if (matched) {
                      setRole(getDefaultRoleForTeacher(matched.teacher));
                    }
                  }
                }}
                placeholder="Nhập Mã thi đua hoặc Email..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded-xl text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase placeholder:normal-case placeholder:font-normal"
              />
            </div>
          </div>

          {/* 2. Mật Khẩu Đăng Nhập */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-900 dark:text-slate-100">
                Mật khẩu đăng nhập
              </label>
              <button
                type="button"
                onClick={() => {
                  setChangePassIdentifier(loginIdentifier || 'TĐ0001');
                  setCurrentPassInput('');
                  setNewPassInput('');
                  setConfirmNewPassInput('');
                  setChangePassError('');
                  setChangePassSuccess('');
                  setIsChangePassModalOpen(true);
                }}
                className="text-[11px] text-amber-700 dark:text-amber-400 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Nhập mật khẩu (Mặc định: 123456)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded-xl text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* 3. Vai Trò Trong Hệ Thống */}
          <div>
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100 mb-2">
              Vai trò trong hệ thống
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-blue-700 border-blue-900 text-white font-black shadow-md'
                    : 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-black hover:bg-slate-200'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-0.5 shrink-0" />
                <span className="text-xs">Giáo viên</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('department_head')}
                className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                  role === 'department_head'
                    ? 'bg-indigo-700 border-indigo-900 text-white font-black shadow-md'
                    : 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-black hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-0.5 shrink-0" />
                <span className="text-xs">Tổ trưởng</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                  role === 'staff'
                    ? 'bg-emerald-700 border-emerald-900 text-white font-black shadow-md'
                    : 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-black hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4 mx-auto mb-0.5 shrink-0" />
                <span className="text-xs">Nhân viên</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('principal')}
                className={`p-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                  role === 'principal'
                    ? 'bg-amber-800 border-amber-950 text-white font-black shadow-md'
                    : 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-black hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-0.5 shrink-0" />
                <span className="text-xs">Hiệu trưởng / HP</span>
              </button>
            </div>
          </div>

          {/* 4. Nút Xác Thực Đăng Nhập System */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border-2 border-slate-950"
          >
            <span>Xác Thực &amp; Đăng Nhập Hệ Thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-6 font-bold">
          📧 Mọi thay đổi Tên đăng nhập &amp; Mật khẩu đều báo trực tiếp tới Gmail: <strong className="text-slate-900 dark:text-white font-mono">{ADMIN_EMAIL}</strong>
        </p>

      </div>

      {/* Admin Authentication Modal for 36 Codes View Access */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-slate-300 dark:border-slate-800 relative animate-in fade-in zoom-in-95">

            <button
              onClick={() => setShowAdminAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-2xl shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Xác Thực Quyền Quản Trị Viên
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Quản trị viên (<strong className="text-rose-700 dark:text-rose-400">{ADMIN_EMAIL}</strong> &amp; <strong className="text-rose-700 dark:text-rose-400">Nguyễn Xuân Ảnh - {PRINCIPAL_ADMIN_EMAIL}</strong>) mới được xem Danh mục 36 mã thi đua và Bổ sung viên chức mới.
                </p>
              </div>
            </div>

            {adminAuthError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-900 rounded-xl text-xs font-bold border border-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAdminAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-100 mb-1">
                  Mật khẩu Quản trị viên (trungnoitru83@gmail.com / anh.nguyen@nuocoa.edu.vn)
                </label>
                <input
                  type="password"
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="Nhập mật khẩu Admin (Mặc định: 123456)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminAuthModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Xác Thực Quản Trị
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 36 Emulation Codes Directory Modal (Hidden Drawer - Accessible by Admin) */}
      {showCodesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-4xl w-full shadow-2xl border-2 border-slate-300 dark:border-slate-800 relative max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 rounded-lg font-black text-xs">
                    CHỈ QUẢN TRỊ VIÊN
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Danh Mục 36 Mã Thi Đua &amp; Quản Lý Viên Chức
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đã xác thực Quản trị viên: <strong>{ADMIN_EMAIL}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherForm(!showAddTeacherForm)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddTeacherForm ? 'Đóng Form Thêm' : '+ Bổ Sung Viên Chức Mới'}</span>
                </button>

                <button
                  onClick={() => setShowCodesModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Success Notice Banner */}
            {addSuccessNotice && (
              <div className="my-3 p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold border border-emerald-300 flex items-center justify-between">
                <span>{addSuccessNotice}</span>
                <button onClick={() => setAddSuccessNotice('')} className="text-emerald-800 dark:text-emerald-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Add New Staff Form inside Modal */}
            {showAddTeacherForm && (
              <form onSubmit={handleAddNewStaff} className="my-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>Bổ Sung Viên Chức Mới Vào Hệ Thống</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Họ và tên..."
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Mã thi đua (Tự động nếu để trống)..."
                    value={newEmulationCode}
                    onChange={(e) => setNewEmulationCode(e.target.value)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                  <input
                    type="email"
                    placeholder="Email công tác..."
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Bộ môn giảng dạy..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="KHXH1">Tổ KHXH1</option>
                    <option value="KHXH2">Tổ KHXH2</option>
                    <option value="KHTN">Tổ KHTN</option>
                    <option value="Văn phòng">Tổ Văn phòng</option>
                    <option value="QLNT">Tổ QLNT</option>
                  </select>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="Giáo viên">Giáo viên</option>
                    <option value="Tổ trưởng chuyên môn">Tổ trưởng chuyên môn</option>
                    <option value="Nhân viên">Nhân viên</option>
                    <option value="Phó Hiệu trưởng">Phó Hiệu trưởng</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Lưu Viên Chức Mới &amp; Gửi Báo Gmail
                  </button>
                </div>
              </form>
            )}

            {/* Search Filter */}
            <div className="my-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm kiếm theo mã TĐ0001 - TĐ0036, tên cán bộ hoặc email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            {/* Codes List Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTeachers.map((t, idx) => {
                const code = t.emulationCode || getTeacherEmulationCode(t, idx);
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setLoginIdentifier(code);
                      setShowCodesModal(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 cursor-pointer border border-slate-200 dark:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded-lg">
                        {code}
                      </span>
                      <div>
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {t.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {t.position || t.subject} • {t.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 bg-blue-700 text-white text-[10px] font-black rounded-lg cursor-pointer hover:bg-blue-800"
                    >
                      Chọn Đăng Nhập
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Tổng số: <strong>{filteredTeachers.length}</strong> cán bộ viên chức</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Mail báo: {ADMIN_EMAIL}</span>
            </div>

          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-slate-300 dark:border-slate-800 relative animate-in fade-in zoom-in-95">

            <button
              onClick={() => {
                setIsChangePassModalOpen(false);
                setChangePassError('');
                setChangePassSuccess('');
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Đổi Mật Khẩu Đăng Nhập
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Mọi thay đổi đều được báo trực tiếp về Gmail <strong>{ADMIN_EMAIL}</strong>
                </p>
              </div>
            </div>

            {changePassError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-bold border border-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{changePassError}</span>
              </div>
            )}

            {changePassSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {changePassSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn Mã Thi Đua / Cán bộ giáo viên
                  </label>
                  <select
                    value={changePassIdentifier}
                    onChange={(e) => {
                      setChangePassIdentifier(e.target.value);
                      setChangePassError('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn cán bộ đổi mật khẩu --</option>
                    {teachers.map((t, idx) => {
                      const code = t.emulationCode || getTeacherEmulationCode(t, idx);
                      return (
                        <option key={t.id} value={code}>
                          {code} - {t.fullName} ({t.position || t.subject})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={currentPassInput}
                    onChange={(e) => {
                      setCurrentPassInput(e.target.value);
                      setChangePassError('');
                    }}
                    placeholder="Mật khẩu hiện tại (Mặc định: 123456)"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu mới (Tối thiểu 6 ký tự)
                  </label>
                  <input
                    type="password"
                    value={newPassInput}
                    onChange={(e) => {
                      setNewPassInput(e.target.value);
                      setChangePassError('');
                    }}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassInput}
                    onChange={(e) => {
                      setConfirmNewPassInput(e.target.value);
                      setChangePassError('');
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 border border-amber-300 font-bold flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mật khẩu mới đổi sẽ được gửi báo cáo trực tiếp về Gmail Quản trị viên: <strong>{ADMIN_EMAIL}</strong></span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePassModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Lưu Mật Khẩu &amp; Báo Gmail</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Google Link Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-slate-300 dark:border-slate-800 relative animate-in fade-in zoom-in-95">

            <button
              onClick={() => setIsGoogleModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-700 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Xác Thực Đăng Nhập Google
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Đăng nhập với email Google công tác hoặc Quản trị viên
                </p>
              </div>
            </div>

            {googleModalError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{googleModalError}</span>
              </div>
            )}

            {googleSuccessMsg ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {googleSuccessMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleGoogleLinkSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ Email Google
                  </label>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => {
                      setGoogleEmailInput(e.target.value);
                      setGoogleModalError('');
                    }}
                    placeholder="trungnoitru83@gmail.com"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu (Mặc định: 123456)
                  </label>
                  <input
                    type="password"
                    value={googlePasswordInput}
                    onChange={(e) => {
                      setGooglePasswordInput(e.target.value);
                      setGoogleModalError('');
                    }}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGoogleModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    Xác Thực &amp; Đăng Nhập
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
