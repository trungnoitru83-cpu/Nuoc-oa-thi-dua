import React from 'react';
import { LogIn, UserCheck, FileSpreadsheet, BarChart3, Calendar, Award, LogOut, ChevronDown, CloudCheck, Palette, Sun, Moon } from 'lucide-react';
import { Teacher, Role } from '../types';
import { isLeaderTeacher } from '../data/form03Criteria';
import { getTeacherEmulationCode } from '../data/mockTeachers';
import { ThemeConfig, THEME_OPTIONS } from '../lib/theme';

interface NavbarProps {
  activeTab: 'login' | 'profile' | 'evaluation' | 'summary';
  setActiveTab: (tab: 'login' | 'profile' | 'evaluation' | 'summary') => void;
  currentUser: Teacher | null;
  currentRole: Role;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onLogout: () => void;
  teacherCount: number;
  themeConfig: ThemeConfig;
  onOpenThemeModal: () => void;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  currentRole,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onLogout,
  teacherCount,
  themeConfig,
  onOpenThemeModal,
  onToggleDarkMode
}) => {
  const isLeader = isLeaderTeacher(currentUser || undefined);
  const themeOpt = THEME_OPTIONS.find(t => t.id === themeConfig.color) || THEME_OPTIONS[0];

  const roleLabel = {
    teacher: 'Giáo viên (Mẫu 03)',
    department_head: 'Tổ trưởng / TPCM (Mẫu 02)',
    principal: 'Ban Giám Hiệu / HT / HP (Mẫu 02)',
    staff: 'Nhân viên (Mẫu 03)'
  }[currentRole] || (isLeader ? 'Lãnh đạo (Mẫu 02)' : 'Cán bộ (Mẫu 03)');

  const formTabLabel = isLeader ? 'Trang 3: Chấm Điểm Mẫu 02' : 'Trang 3: Chấm Điểm Mẫu 03';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-2 sm:gap-4">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab(currentUser ? 'summary' : 'login')}>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all shrink-0"
              style={{ backgroundColor: themeOpt.dotColor }}
            >
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-base md:text-lg text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap">
                  THI ĐUA NƯỚC OA
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${themeOpt.accentBg} ${themeOpt.accentText} ${themeOpt.accentBorder} shrink-0`}>
                  {selectedYear}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800" title="Dữ liệu đồng bộ trực tuyến thời gian thực trên CSDL Đám mây (Firebase Cloud)">
                  <CloudCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Đám Mây Firestore</span>
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Quản lý & Chấm điểm thi đua giáo viên hàng tháng
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Hidden per request */}

          {/* Right Controls: Month & Year Selectors + Theme Toggle + User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Month & Year Selectors */}
            <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl px-2 sm:px-2.5 py-1.5 border-2 border-slate-400 dark:border-slate-600 shadow-xs">
              <Calendar className="w-4 h-4 mr-1 shrink-0" style={{ color: themeOpt.dotColor }} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-900 dark:text-slate-50 focus:outline-none cursor-pointer pr-0.5 appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m} className="dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    Tháng {m}
                  </option>
                ))}
              </select>
              <span className="text-slate-600 dark:text-slate-300 text-xs font-black mx-0.5">/</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-900 dark:text-slate-50 focus:outline-none cursor-pointer pr-0.5 appearance-none"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y} className="dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 pointer-events-none ml-0.5 shrink-0" />
            </div>

            {/* Theme / Palette Button */}
            <button
              onClick={onOpenThemeModal}
              title="Đổi màu sắc & giao diện trang"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-slate-400 dark:border-slate-600 rounded-xl text-xs font-black text-slate-900 dark:text-slate-100 transition shadow-xs cursor-pointer"
            >
              <div
                className="w-4 h-4 rounded-full shadow-xs shrink-0 ring-2 ring-black/20"
                style={{ backgroundColor: themeOpt.dotColor }}
              />
              <Palette className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200 hidden sm:inline" />
              <span className="hidden md:inline text-xs font-black">Đổi Màu</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title="Chuyển chế độ Sáng / Tối"
              className="p-1.5 sm:p-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-slate-400 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 transition shadow-xs cursor-pointer"
            >
              {themeConfig.mode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-900" />
              )}
            </button>

            {/* Current User Info or Login Button */}
            {currentUser ? (
              <div className={`flex items-center gap-2 p-1.5 pr-2.5 sm:pr-3 rounded-xl border-2 ${
                isLeader 
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 dark:border-amber-600' 
                  : `${themeOpt.accentBg} ${themeOpt.accentBorder}`
              }`}>
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0"
                  style={{ backgroundColor: isLeader ? '#b45309' : themeOpt.dotColor }}
                >
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-xs font-black text-slate-950 dark:text-white max-w-[140px] truncate">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-slate-950 text-white dark:bg-slate-700 rounded mr-1">
                      {currentUser.emulationCode || getTeacherEmulationCode(currentUser)}
                    </span>
                    {currentUser.fullName}
                  </p>
                  <p
                    className="text-[11px] font-black truncate max-w-[140px]"
                    style={{ color: isLeader ? '#92400e' : themeOpt.dotColor }}
                  >
                    {roleLabel}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  title="Đăng xuất / Chọn tài khoản khác"
                  className="p-1 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-black text-white rounded-xl shadow-lg transition hover:brightness-110 active:scale-95 shrink-0 cursor-pointer"
                style={{ backgroundColor: themeOpt.dotColor }}
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation Row - Removed per request */}

      </div>
    </header>
  );
};

