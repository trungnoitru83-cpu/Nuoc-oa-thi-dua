import React, { useState } from 'react';
import { X, Bell, CheckCircle, Clock, Search, Filter, Copy, Check, Eye, FileSpreadsheet, AlertCircle, ArrowRight } from 'lucide-react';
import { Teacher, Role } from '../types';
import { ProgressStatistics, TeacherProgressStatus } from '../utils/updateProgressHelper';

interface RealtimeUpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ProgressStatistics;
  selectedMonth: number;
  selectedYear: number;
  onSelectTeacherForView: (teacher: Teacher, tab: 'profile' | 'evaluation') => void;
  onApplyFilterToTable?: (filterType: string) => void;
}

export const RealtimeUpdateStatusModal: React.FC<RealtimeUpdateStatusModalProps> = ({
  isOpen,
  onClose,
  stats,
  selectedMonth,
  selectedYear,
  onSelectTeacherForView,
  onApplyFilterToTable
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'UPDATED_ANY' | 'UPDATED_M01' | 'UPDATED_M02' | 'UPDATED_M03' | 'NOT_UPDATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen) return null;

  // Filter items
  const filteredItems = stats.items.filter(item => {
    // Search filter
    const matchesSearch = 
      item.teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.emulationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.teacher.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teacher.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (filterTab === 'UPDATED_ANY') return item.updatedAny;
    if (filterTab === 'UPDATED_M01') return item.form01Updated;
    if (filterTab === 'UPDATED_M02') return item.form02Updated;
    if (filterTab === 'UPDATED_M03') return item.form03Updated;
    if (filterTab === 'NOT_UPDATED') return !item.updatedAny;

    return true;
  });

  const handleCopyReminder = () => {
    const uncompleted = stats.items.filter(it => !it.updatedAny);
    let text = `📢 THÔNG BÁO TIẾN ĐỘ CẬP NHẬT THI ĐUA THÁNG ${selectedMonth}/${selectedYear} (PTDTNT NƯỚC OA)\n`;
    text += `⏰ Thời gian thực: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}\n`;
    text += `📊 Đã cập nhật (Mẫu 01, 02 hoặc 03): ${stats.totalUpdatedAny}/${stats.totalTeachers} viên chức (${stats.percentAny}%)\n`;
    text += ` • Mẫu 01: ${stats.totalUpdated01}/${stats.totalTeachers} viên chức\n`;
    text += ` • Mẫu 02 (CBQL): ${stats.totalUpdated02}/${stats.totalLeaders} cán bộ\n`;
    text += ` • Mẫu 03 (GV, NV): ${stats.totalUpdated03}/${stats.totalNonLeaders} viên chức\n\n`;

    if (uncompleted.length > 0) {
      text += `⚠️ Danh sách ${uncompleted.length} viên chức chưa cập nhật:\n`;
      uncompleted.forEach((it, idx) => {
        text += `${idx + 1}. [${it.emulationCode}] ${it.teacher.fullName} (${it.teacher.position || it.teacher.department})\n`;
      });
      text += `\nĐề nghị các thầy cô khẩn trương hoàn thành hồ sơ Mẫu 01 và chấm điểm thi đua!`;
    } else {
      text += `🎉 Chúc mừng! Toàn thể 100% viên chức đã hoàn thành cập nhật đúng hạn!`;
    }

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-indigo-500/40 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-indigo-700/50">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/30 text-amber-300 rounded-2xl border border-indigo-400/40 shadow-inner">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 bg-emerald-500 text-white text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  THỜI GIAN THỰC (REAL-TIME)
                </span>
                <span className="text-xs text-indigo-200 font-bold">
                  Tháng {selectedMonth}/{selectedYear}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Báo Cáo Tiến Độ Cập Nhật Mẫu 01, Mẫu 02 &amp; Mẫu 03
              </h2>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Tổng hợp số lượng viên chức đã cập nhật hồ sơ cá nhân và bảng chấm thi đua trực tiếp từ hệ thống.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Real-time Metric Cards */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Total Updated (Mẫu 01, 02 hoặc 03) */}
            <div 
              onClick={() => setFilterTab('UPDATED_ANY')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                filterTab === 'UPDATED_ANY'
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-transparent shadow-lg scale-102 ring-2 ring-indigo-400'
                  : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 text-slate-800 dark:text-slate-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase ${filterTab === 'UPDATED_ANY' ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  Đã cập nhật (01/02/03)
                </span>
                <CheckCircle className={`w-4 h-4 ${filterTab === 'UPDATED_ANY' ? 'text-emerald-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-1">
                {stats.totalUpdatedAny} <span className="text-xs sm:text-sm font-bold opacity-80">/ {stats.totalTeachers}</span>
              </p>
              <p className={`text-[11px] font-bold mt-1 ${filterTab === 'UPDATED_ANY' ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats.percentAny}% hoàn thành
              </p>
            </div>

            {/* Mẫu 01 */}
            <div 
              onClick={() => setFilterTab('UPDATED_M01')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                filterTab === 'UPDATED_M01'
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-700 text-white border-transparent shadow-lg scale-102 ring-2 ring-cyan-400'
                  : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60 hover:border-blue-400 text-slate-800 dark:text-slate-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase ${filterTab === 'UPDATED_M01' ? 'text-cyan-100' : 'text-blue-600 dark:text-blue-400'}`}>
                  Đã nộp Mẫu 01
                </span>
                <span className="text-xs font-mono font-bold opacity-80">M01</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-1">
                {stats.totalUpdated01} <span className="text-xs sm:text-sm font-bold opacity-80">/ {stats.totalTeachers}</span>
              </p>
              <p className={`text-[11px] font-bold mt-1 ${filterTab === 'UPDATED_M01' ? 'text-cyan-200' : 'text-blue-600 dark:text-blue-400'}`}>
                {stats.percent01}% viên chức
              </p>
            </div>

            {/* Mẫu 02 (CBQL) */}
            <div 
              onClick={() => setFilterTab('UPDATED_M02')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                filterTab === 'UPDATED_M02'
                  ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white border-transparent shadow-lg scale-102 ring-2 ring-amber-400'
                  : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 hover:border-amber-400 text-slate-800 dark:text-slate-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase ${filterTab === 'UPDATED_M02' ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'}`}>
                  Mẫu 02 (CBQL)
                </span>
                <span className="text-xs font-mono font-bold opacity-80">CBQL</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-1">
                {stats.totalUpdated02} <span className="text-xs sm:text-sm font-bold opacity-80">/ {stats.totalLeaders}</span>
              </p>
              <p className={`text-[11px] font-bold mt-1 ${filterTab === 'UPDATED_M02' ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'}`}>
                {stats.percent02}% cán bộ QL
              </p>
            </div>

            {/* Mẫu 03 (GV, NV) */}
            <div 
              onClick={() => setFilterTab('UPDATED_M03')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                filterTab === 'UPDATED_M03'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-transparent shadow-lg scale-102 ring-2 ring-emerald-400'
                  : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 text-slate-800 dark:text-slate-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase ${filterTab === 'UPDATED_M03' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Mẫu 03 (GV, NV)
                </span>
                <span className="text-xs font-mono font-bold opacity-80">GV/NV</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-1">
                {stats.totalUpdated03} <span className="text-xs sm:text-sm font-bold opacity-80">/ {stats.totalNonLeaders}</span>
              </p>
              <p className={`text-[11px] font-bold mt-1 ${filterTab === 'UPDATED_M03' ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats.percent03}% giáo viên/NV
              </p>
            </div>

          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Tất cả ({stats.totalTeachers})
            </button>

            <button
              onClick={() => setFilterTab('UPDATED_ANY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer flex items-center gap-1 ${
                filterTab === 'UPDATED_ANY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đã cập nhật ({stats.totalUpdatedAny})</span>
            </button>

            <button
              onClick={() => setFilterTab('UPDATED_M01')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                filterTab === 'UPDATED_M01'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
              }`}
            >
              Mẫu 01 ({stats.totalUpdated01})
            </button>

            <button
              onClick={() => setFilterTab('UPDATED_M02')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                filterTab === 'UPDATED_M02'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              Mẫu 02 ({stats.totalUpdated02})
            </button>

            <button
              onClick={() => setFilterTab('UPDATED_M03')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                filterTab === 'UPDATED_M03'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              Mẫu 03 ({stats.totalUpdated03})
            </button>

            <button
              onClick={() => setFilterTab('NOT_UPDATED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer flex items-center gap-1 ${
                filterTab === 'NOT_UPDATED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chưa cập nhật ({stats.totalNotUpdated})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên cán bộ, mã TĐ..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Teacher Status List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Không tìm thấy cán bộ giáo viên nào theo điều kiện lọc.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.teacherId}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-mono font-black text-xs text-slate-700 dark:text-slate-300 shrink-0">
                      {idx + 1}
                    </span>

                    <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-900 text-white dark:bg-slate-700 rounded-md shrink-0">
                      {item.emulationCode}
                    </span>

                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{item.teacher.fullName}</span>
                        {item.isLeader && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded border border-amber-300">
                            CBQL
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.teacher.position || item.teacher.subject} • {item.teacher.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {/* Badge Mẫu 01 */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                      item.form01Updated
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-600'
                    }`}>
                      {item.form01Updated ? <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <Clock className="w-3 h-3 text-slate-400" />}
                      <span>{item.form01Updated ? 'Mẫu 01: Đã nộp' : 'Mẫu 01: Chưa nộp'}</span>
                    </span>

                    {/* Badge Mẫu 02 or 03 */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                      item.evalUpdated
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}>
                      {item.evalUpdated ? <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-500" />}
                      <span>{item.isLeader ? 'Mẫu 02' : 'Mẫu 03'}: {item.evalUpdated ? 'Đã chấm' : 'Chưa chấm'}</span>
                    </span>

                    {/* Quick navigation buttons */}
                    <button
                      onClick={() => {
                        onClose();
                        onSelectTeacherForView(item.teacher, 'profile');
                      }}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Xem/Ký Mẫu 01"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mẫu 01</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectTeacherForView(item.teacher, 'evaluation');
                      }}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title={item.isLeader ? "Xem/Chấm Mẫu 02" : "Xem/Chấm Mẫu 03"}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{item.isLeader ? 'Mẫu 02' : 'Mẫu 03'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{filteredItems.length}</strong> / <strong>{stats.totalTeachers}</strong> viên chức • Dữ liệu tự động cập nhật thời gian thực
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyReminder}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
            >
              {copiedNotice ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedNotice ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép nhắc nhở Zalo'}</span>
            </button>

            {onApplyFilterToTable && (
              <button
                onClick={() => {
                  onApplyFilterToTable(filterTab);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                <span>Lọc trên bảng chính</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-black rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
