import React, { useState, useEffect } from 'react';
import { Award, Search, Filter, Printer, Download, UserPlus, Eye, FileSpreadsheet, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, FileText, Check, RefreshCw, CloudCheck, ShieldAlert, Clock, XCircle, UserCheck } from 'lucide-react';
import { Teacher, Form03Evaluation, Form01Data, ClassificationType, Role, EntryStatusData } from '../types';
import { CLASSIFICATION_RULES, getClassificationLabel, getClassification, isLeaderTeacher } from '../data/form03Criteria';
import { getTeacherEmulationCode } from '../data/mockTeachers';
import { exportToWord } from '../lib/wordExport';
import { syncAllTeachersToGoogleSheet } from '../lib/googleSheetService';

interface SummaryTablePageProps {
  currentUser?: Teacher | null;
  currentRole?: Role;
  teachers: Teacher[];
  evaluations: Record<string, Form03Evaluation>;
  form01DataMap?: Record<string, Form01Data>;
  selectedMonth: number;
  selectedYear?: number;
  entryStatus?: EntryStatusData;
  onMarkEntryStatus?: (month: number, year: number, isEntered: boolean) => void;
  onSelectTeacherForView: (teacher: Teacher, tab: 'profile' | 'evaluation') => void;
  onOpenManageTeachersModal: (initialAddAdmin?: boolean) => void;
  onOpenPrintModal: (type: 'summary', teacherId?: string) => void;
}

export const SummaryTablePage: React.FC<SummaryTablePageProps> = ({
  currentUser,
  currentRole,
  teachers,
  evaluations,
  form01DataMap,
  selectedMonth,
  selectedYear = 2026,
  entryStatus,
  onMarkEntryStatus,
  onSelectTeacherForView,
  onOpenManageTeachersModal,
  onOpenPrintModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [isSyncingGoogleSheet, setIsSyncingGoogleSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Helper to fetch monthly evaluation for a teacher
  const getEval = (teacherId: string): Form03Evaluation | undefined => {
    return evaluations[`${teacherId}_y${selectedYear}_m${selectedMonth}`] || evaluations[`${teacherId}_y2026_m${selectedMonth}`] || evaluations[teacherId];
  };

  // Helper to fetch monthly Form 01 for a teacher
  const getForm01 = (teacherId: string): Form01Data | undefined => {
    return form01DataMap ? (form01DataMap[`${teacherId}_y${selectedYear}_m${selectedMonth}`] || form01DataMap[teacherId]) : undefined;
  };

  // Tự động đồng bộ lên Google Sheet mỗi khi dữ liệu hoặc tháng thay đổi
  useEffect(() => {
    let isMounted = true;
    const autoSync = async () => {
      try {
        const res = await syncAllTeachersToGoogleSheet(teachers, evaluations, selectedMonth, selectedYear);
        if (isMounted && res.success) {
          setSyncMessage(`File Tháng ${selectedMonth}/${selectedYear} đã tự động lưu trên Google Sheet (${res.successCount}/${teachers.length} cán bộ)`);
        }
      } catch (err) {
        console.warn('Lưu ngầm Google Sheet:', err);
      }
    };
    
    // Tự động lưu ngầm
    const timer = setTimeout(() => {
      autoSync();
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedMonth, selectedYear, teachers.length, evaluations]);

  const handleManualSyncGoogleSheet = async () => {
    setIsSyncingGoogleSheet(true);
    try {
      const res = await syncAllTeachersToGoogleSheet(teachers, evaluations, selectedMonth, selectedYear);
      setSyncMessage(res.message);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setSyncMessage('Có lỗi khi kết nối Google Sheet. Dữ liệu vẫn được lưu an toàn trong hệ thống.');
    } finally {
      setIsSyncingGoogleSheet(false);
    }
  };

  // Filter teachers list
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.position && t.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = departmentFilter === 'ALL' || t.department === departmentFilter;

    const ev = getEval(t.id);
    const partA = ev ? Math.min(30, ev.totalPartA_Principal) : 30;
    const partB = ev ? Math.min(70, ev.totalPartB_Principal) : 60;
    const bonus = ev ? (ev.totalBonus_Principal || 0) : 0;
    const ded = ev ? (ev.totalDeduction_Principal || 0) : 0;
    const score = ev ? (ev.grandTotal_Principal ?? Math.min(100, Math.max(0, Math.round((partA + partB + bonus - ded) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((partA + partB) * 100) / 100));
    const cls = getClassification(score);
    const matchesClass = classificationFilter === 'ALL' || cls === classificationFilter;

    return matchesSearch && matchesDept && matchesClass;
  });

  // Calculate statistics across all teachers
  let totalExcellent = 0; // >= 90
  let totalGood = 0;      // 80 - <90
  let totalPass = 0;      // 50 - <80
  let totalFail = 0;      // < 50
  let totalPointsSum = 0;

  teachers.forEach((t) => {
    const ev = getEval(t.id);
    const partA = ev ? Math.min(30, ev.totalPartA_Principal) : 30;
    const partB = ev ? Math.min(70, ev.totalPartB_Principal) : 60;
    const bonus = ev ? (ev.totalBonus_Principal || 0) : 0;
    const ded = ev ? (ev.totalDeduction_Principal || 0) : 0;
    const score = ev ? (ev.grandTotal_Principal ?? Math.min(100, Math.max(0, Math.round((partA + partB + bonus - ded) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((partA + partB) * 100) / 100));
    totalPointsSum += score;

    if (score >= 90) totalExcellent++;
    else if (score >= 80) totalGood++;
    else if (score >= 50) totalPass++;
    else totalFail++;
  });

  const avgSchoolScore = teachers.length > 0 ? (totalPointsSum / teachers.length).toFixed(1) : '0';

  // Export to CSV / Excel helper with GV/NV self-assessment score
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `BẢNG TỔNG HỢP XẾP LOẠI THI ĐUA CÁN BỘ GIÁO VIÊN THÁNG ${selectedMonth}/${selectedYear}\n`;
    csvContent += `Trường PTDTNT THCS và THPT Nước Oa\n\n`;
    csvContent += `STT,Mã Thi Đua,Họ và tên cán bộ giáo viên,Chức vụ,Ngày sinh,Bộ môn,Tổ chuyên môn,Trường,Điểm GV/NV tự chấm,Điểm A (HT duyệt),Điểm B (HT duyệt),Điểm Cộng (+C),Điểm Trừ (-D),Tổng điểm Hiệu trưởng đánh giá,Xếp loại thi đua,Trạng thái\n`;

    teachers.forEach((t, idx) => {
      const code = t.emulationCode || getTeacherEmulationCode(t, idx);
      const ev = getEval(t.id);
      const pos = t.position || t.subject;
      const tPartA = ev ? Math.min(30, ev.totalPartA_Teacher ?? 30) : 30;
      const tPartB = ev ? Math.min(70, ev.totalPartB_Teacher ?? 60) : 60;
      const tBonus = ev ? (ev.totalBonus_Teacher || 0) : 0;
      const tDed = ev ? (ev.totalDeduction_Teacher || 0) : 0;
      const teacherTotal = ev ? (ev.grandTotal_Teacher ?? Math.min(100, Math.max(0, Math.round((tPartA + tPartB + tBonus - tDed) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((tPartA + tPartB) * 100) / 100));

      const partA = ev ? Math.min(30, ev.totalPartA_Principal) : 30;
      const partB = ev ? Math.min(70, ev.totalPartB_Principal) : 60;
      const bonusPrincipal = ev ? (ev.totalBonus_Principal || 0) : 0;
      const dedPrincipal = ev ? (ev.totalDeduction_Principal || 0) : 0;
      const grandTotal = ev ? (ev.grandTotal_Principal ?? Math.min(100, Math.max(0, Math.round((partA + partB + bonusPrincipal - dedPrincipal) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((partA + partB) * 100) / 100));
      const clsLabel = getClassificationLabel(getClassification(grandTotal));
      const statusLabel = ev?.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';

      csvContent += `${idx + 1},"${code}","${t.fullName}","${pos}","${t.dob}","${t.subject}","${t.department}","${t.school}",${teacherTotal},${partA},${partB},${bonusPrincipal},${dedPrincipal},${grandTotal},"${clsLabel}","${statusLabel}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Tong_Hop_Thi_Dua_Thang_${selectedMonth}_${selectedYear}_Nuoc_Oa.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export summary table to Word .doc format with GV/NV self-assessment score
  const handleExportWord = () => {
    let html = `<div class="title">BẢNG TỔNG HỢP XẾP LOẠI THI ĐUA ${teachers.length} CÁN BỘ GIÁO VIÊN THÁNG ${selectedMonth}/${selectedYear}</div>`;
    html += `<div class="subtitle">Trường PTDTNT THCS và THPT Nước Oa</div>`;
    html += `<table><thead><tr>
      <th>STT</th><th>Họ và tên</th><th>Chức vụ</th><th>Bộ môn</th><th>Tổ chuyên môn</th><th>Điểm GV tự chấm</th><th>Điểm A</th><th>Điểm B</th><th>Điểm Cộng</th><th>Điểm Trừ</th><th>Tổng điểm HT</th><th>Xếp loại</th>
    </tr></thead><tbody>`;

    teachers.forEach((t, idx) => {
      const ev = getEval(t.id);
      const pos = t.position || t.subject;
      const tPartA = ev ? Math.min(30, ev.totalPartA_Teacher ?? 30) : 30;
      const tPartB = ev ? Math.min(70, ev.totalPartB_Teacher ?? 60) : 60;
      const tBonus = ev ? (ev.totalBonus_Teacher || 0) : 0;
      const tDed = ev ? (ev.totalDeduction_Teacher || 0) : 0;
      const teacherTotal = ev ? (ev.grandTotal_Teacher ?? Math.min(100, Math.max(0, Math.round((tPartA + tPartB + tBonus - tDed) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((tPartA + tPartB) * 100) / 100));

      const partA = ev ? Math.min(30, ev.totalPartA_Principal) : 30;
      const partB = ev ? Math.min(70, ev.totalPartB_Principal) : 60;
      const bonusPrincipal = ev ? (ev.totalBonus_Principal || 0) : 0;
      const dedPrincipal = ev ? (ev.totalDeduction_Principal || 0) : 0;
      const grandTotal = ev ? (ev.grandTotal_Principal ?? Math.min(100, Math.max(0, Math.round((partA + partB + bonusPrincipal - dedPrincipal) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((partA + partB) * 100) / 100));
      const clsLabel = getClassificationLabel(getClassification(grandTotal));

      html += `<tr>
        <td style="text-align:center">${idx + 1}</td>
        <td><strong>${t.fullName}</strong></td>
        <td>${pos}</td>
        <td>${t.subject}</td>
        <td>${t.department}</td>
        <td style="text-align:center;font-weight:bold;color:#1e40af">${teacherTotal}</td>
        <td style="text-align:center">${partA}</td>
        <td style="text-align:center">${partB}</td>
        <td style="text-align:center">+${bonusPrincipal}</td>
        <td style="text-align:center">-${dedPrincipal}</td>
        <td style="text-align:center"><strong>${grandTotal}</strong></td>
        <td>${clsLabel}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
    exportToWord(html, `Bang_Tong_Hop_Thi_Dua_36_GV_Thang_${selectedMonth}_${selectedYear}`);
  };

  // Check Admin permission
  const isAdmin =
    currentUser?.isAdmin === true ||
    currentUser?.email === 'trungnoitru83@gmail.com' ||
    currentUser?.email === 'anh.nguyen@nuocoa.edu.vn' ||
    currentUser?.emulationCode === 'TĐ0001' ||
    currentUser?.role === 'admin' ||
    currentRole === 'admin' ||
    currentRole === 'principal' ||
    Boolean(currentUser?.position?.toLowerCase().includes('hiệu trưởng')) ||
    Boolean(currentUser?.position?.toLowerCase().includes('quản trị'));

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-300 dark:border-amber-700 shadow-xl text-center">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-amber-50 dark:ring-amber-950/40">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
          Quyền Truy Cập Bị Hạn Chế (Chỉ Admin)
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
          Trang <strong className="text-slate-900 dark:text-white">File Bảng Tổng Hợp</strong> chỉ dành riêng cho <strong className="text-amber-600 dark:text-amber-400">Quản trị viên (Admin) / Ban Giám Hiệu</strong>. Tài khoản của bạn (<span className="font-bold text-blue-600 dark:text-blue-400">{currentUser?.fullName || currentUser?.email || 'Viên chức'}</span>) không có quyền xem thông tin file tổng hợp thi đua.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <button
            onClick={() => onSelectTeacherForView(currentUser || teachers[0], 'profile')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Về Trang Cá Nhân Mẫu 01</span>
          </button>
          <button
            onClick={() => onSelectTeacherForView(currentUser || teachers[0], 'evaluation')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>Về Trang Chấm Điểm Mẫu 03</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Title & Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full">
              BẢNG TỔNG HỢP THI ĐUA TOÀN TRƯỜNG
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Tháng {selectedMonth}/{selectedYear}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Bảng Tổng Hợp Xếp Loại Thi Đua {teachers.length} Cán Bộ Giáo Viên
          </h1>
          <p className="text-xs text-slate-500">
            Trường PTDTNT THCS và THPT Nước Oa. Tự động lưu file Tháng {selectedMonth}/{selectedYear} trên Google Sheet và cập nhật điểm đánh giá theo thời gian thực.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cloud Auto-Save Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 text-xs font-black rounded-2xl shadow-xs">
            <CloudCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
            <span>Lưu file: Tháng {selectedMonth}/{selectedYear}</span>
          </div>

          <button
            onClick={() => onOpenManageTeachersModal(false)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>Quản lý {teachers.length} CBGV</span>
          </button>

          <button
            onClick={handleManualSyncGoogleSheet}
            disabled={isSyncingGoogleSheet}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md transition disabled:opacity-60 cursor-pointer"
            title="Quét tất cả bản ghi đã lưu trên Firestore và đẩy bổ sung đầy đủ sang Google Sheet"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingGoogleSheet ? 'animate-spin' : ''}`} />
            <span>{isSyncingGoogleSheet ? 'Đang đồng bộ dữ liệu...' : 'Đồng bộ toàn bộ dữ liệu lên Google Sheet'}</span>
          </button>

          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs rounded-2xl transition shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Xuất file Word</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-2xl transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel/CSV</span>
          </button>

          <button
            onClick={() => onOpenPrintModal('summary')}
            className="flex items-center gap-1.5 px-4 py-2.5 btn-theme font-black text-xs rounded-2xl shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Bảng Tổng Hợp (A4)</span>
          </button>
        </div>
      </div>

      {/* Panel Báo đã nhập & Ngày giờ đã nhập */}
      <div className={`mb-6 p-5 rounded-3xl border-2 transition-all shadow-sm ${
        entryStatus?.isEntered
          ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/40 dark:border-emerald-700/60'
          : 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/40 dark:border-amber-700/60'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            <div className={`p-3 rounded-2xl shrink-0 ${
              entryStatus?.isEntered
                ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-500/20'
                : 'bg-amber-500 text-white shadow-md ring-4 ring-amber-500/20'
            }`}>
              {entryStatus?.isEntered ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-0.5 text-xs font-black rounded-full uppercase tracking-wider ${
                  entryStatus?.isEntered
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/90 dark:text-emerald-100'
                    : 'bg-amber-200 text-amber-900 dark:bg-amber-900/90 dark:text-amber-100'
                }`}>
                  {entryStatus?.isEntered ? 'ĐÃ BÁO NHẬP DỮ LIỆU' : 'CHƯA BÁO NHẬP DỮ LIỆU'}
                </span>
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  Tháng {selectedMonth}/{selectedYear}
                </span>
              </div>

              {entryStatus?.isEntered ? (
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-700 dark:text-emerald-400 font-black">Ngày giờ đã nhập:</span>
                  <span className="font-mono bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 font-black text-slate-900 dark:text-white shadow-xs">
                    {entryStatus.enteredAt}
                  </span>
                  {entryStatus.enteredBy && (
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                      (Bởi Quản trị viên: <strong>{entryStatus.enteredBy}</strong>)
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                  Nhấn nút bên cạnh để xác nhận và ghi nhận mốc ngày giờ đã hoàn thành nhập dữ liệu thi đua Tháng {selectedMonth}/{selectedYear}.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!entryStatus?.isEntered ? (
              <button
                onClick={() => onMarkEntryStatus && onMarkEntryStatus(selectedMonth, selectedYear, true)}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ring-4 ring-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5 text-emerald-100" />
                <span>BÁO ĐÃ NHẬP DỮ LIỆU</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => onMarkEntryStatus && onMarkEntryStatus(selectedMonth, selectedYear, true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Nhấn để cập nhật lại thời gian báo nhập mới nhất"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cập nhật ngày giờ</span>
                </button>
                <button
                  onClick={() => onMarkEntryStatus && onMarkEntryStatus(selectedMonth, selectedYear, false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Hủy xác nhận báo nhập"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hủy báo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100 rounded-2xl border border-emerald-400 flex items-center justify-between gap-3 font-bold text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        </div>
      )}

      {/* 4 Classification Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        {/* Total Teachers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Tổng viên chức / NLĐ</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{teachers.length} người</span>
            <span className="text-xs font-bold text-slate-500">100%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">ĐTB: {avgSchoolScore} điểm (Mẫu 01 & 03)</p>
        </div>

        {/* 1. Hoàn thành xuất sắc (>= 90đ) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <p className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300 uppercase flex items-center justify-between">
            <span>Xuất sắc (≥90đ)</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{totalExcellent} người</span>
            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">
              {teachers.length > 0 ? ((totalExcellent / teachers.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">{totalExcellent}/{teachers.length} viên chức đạt xuất sắc</p>
        </div>

        {/* 2. Hoàn thành tốt (80 - <90đ) */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xs">
          <p className="text-[11px] font-extrabold text-blue-900 dark:text-blue-300 uppercase flex items-center justify-between">
            <span>Tốt (80 - &lt;90đ)</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{totalGood} người</span>
            <span className="text-xs font-extrabold text-blue-800 dark:text-blue-400">
              {teachers.length > 0 ? ((totalGood / teachers.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">{totalGood}/{teachers.length} viên chức đạt loại tốt</p>
        </div>

        {/* 3. Hoàn thành (50 - <80đ) */}
        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs">
          <p className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 uppercase flex items-center justify-between">
            <span>Hoàn thành (50 - &lt;80đ)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{totalPass} người</span>
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-400">
              {teachers.length > 0 ? ((totalPass / teachers.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">{totalPass}/{teachers.length} viên chức hoàn thành</p>
        </div>

        {/* 4. Không hoàn thành (<50đ) */}
        <div className="bg-rose-50/70 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-xs">
          <p className="text-[11px] font-extrabold text-rose-900 dark:text-rose-300 uppercase flex items-center justify-between">
            <span>Không HT (&lt;50đ)</span>
            <HelpCircle className="w-4 h-4 text-rose-600" />
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{totalFail} người</span>
            <span className="text-xs font-extrabold text-rose-800 dark:text-rose-400">
              {teachers.length > 0 ? ((totalFail / teachers.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1">{totalFail}/{teachers.length} viên chức chưa đạt</p>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên giáo viên, môn học..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Department & Classification Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Tổ chuyên môn</option>
              <option value="Tổ Xã hội">Tổ Xã hội</option>
              <option value="Tổ Tự nhiên">Tổ Tự nhiên</option>
              <option value="Tổ Năng khiếu">Tổ Năng khiếu</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Mức xếp loại</option>
              <option value="HOAN_THANH_XUAT_SAC">Hoàn thành xuất sắc (≥90đ)</option>
              <option value="HOAN_THANH_TOT">Hoàn thành tốt (80-&lt;90đ)</option>
              <option value="HOAN_THANH">Hoàn thành (50-&lt;80đ)</option>
              <option value="KHONG_HOAN_THANH">Không hoàn thành (&lt;50đ)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Info Banner for Implicit Data Transfer & Permanent Storage */}
      <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 dark:text-emerald-200">
          <p className="font-extrabold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
            <span>Mặc Định Lưu File Tháng {selectedMonth} Trên Google Sheet & Cơ Sở Dữ Liệu:</span>
            <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] rounded-full">Tên file: Tháng {selectedMonth} năm 2026</span>
          </p>
          <p className="mt-1 text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Hệ thống tự động đồng bộ đầy đủ các trường: <strong>Họ tên</strong>, <strong>Chức vụ</strong>, <strong>Bộ môn</strong>, <strong>Tổ chuyên môn</strong>, <strong>Điểm GV/NV tự chấm</strong>, <strong>Điểm Tiêu chí chung A</strong>, <strong>Điểm Chuyên môn B</strong>, <strong>Điểm Cộng (+C)</strong>, <strong>Điểm Trừ (-D)</strong>, <strong>Tổng điểm Hiệu trưởng đánh giá</strong> &amp; <strong>Mức Xếp loại thi đua</strong> trực tiếp vào file tháng trên Google Sheet.
          </p>
        </div>
      </div>

      {/* Main Summary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 font-extrabold uppercase border-b-2 border-slate-200 dark:border-slate-700">
                <th className="p-3.5 w-10 text-center">STT</th>
                <th className="p-3.5 w-24 text-center">Mã TĐ</th>
                <th className="p-3.5 min-w-[170px]">Họ và tên cán bộ giáo viên</th>
                <th className="p-3.5 min-w-[120px]">Chức vụ</th>
                <th className="p-3.5 min-w-[90px]">Ngày sinh</th>
                <th className="p-3.5 min-w-[110px]">Bộ môn</th>
                <th className="p-3.5 min-w-[120px]">Tổ chuyên môn</th>
                <th className="p-3.5 text-center bg-cyan-50/90 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-200 border-x border-cyan-200 dark:border-cyan-800">
                  Điểm GV, NV tự chấm
                </th>
                <th className="p-3.5 text-center bg-blue-50/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200">
                  Điểm A (HT)
                </th>
                <th className="p-3.5 text-center bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200">
                  Điểm B (HT)
                </th>
                <th className="p-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200">
                  Điểm Cộng (+C)
                </th>
                <th className="p-3.5 text-center bg-rose-50/80 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200">
                  Điểm Trừ (-D)
                </th>
                <th className="p-3.5 text-center bg-slate-900 text-white font-black text-sm">
                  Tổng điểm HT
                </th>
                <th className="p-3.5 min-w-[160px]">Xếp loại thi đua</th>
                <th className="p-3.5 text-center">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-400 font-semibold">
                    Không tìm thấy cán bộ giáo viên thỏa mãn điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const code = t.emulationCode || getTeacherEmulationCode(t, idx);
                  const ev = getEval(t.id);
                  const tPartA = ev ? Math.min(30, ev.totalPartA_Teacher ?? 30) : 30;
                  const tPartB = ev ? Math.min(70, ev.totalPartB_Teacher ?? 60) : 60;
                  const bonusTeacher = ev ? (ev.totalBonus_Teacher || 0) : 0;
                  const dedTeacher = ev ? (ev.totalDeduction_Teacher || 0) : 0;
                  const teacherGrandTotal = ev ? (ev.grandTotal_Teacher ?? Math.min(100, Math.round((tPartA + tPartB) * 100) / 100)) : Math.min(100, Math.round((tPartA + tPartB) * 100) / 100);

                  const partA = ev ? Math.min(30, ev.totalPartA_Principal) : 30;
                  const partB = ev ? Math.min(70, ev.totalPartB_Principal) : 60;
                  const bonusPrincipal = ev ? (ev.totalBonus_Principal || 0) : 0;
                  const dedPrincipal = ev ? (ev.totalDeduction_Principal || 0) : 0;
                  const grandTotal = ev ? (ev.grandTotal_Principal ?? Math.min(100, Math.round((partA + partB) * 100) / 100)) : Math.min(100, Math.round((partA + partB) * 100) / 100);
                  const clsType = getClassification(grandTotal);
                  const clsRule = CLASSIFICATION_RULES.find(r => r.type === clsType);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition group"
                    >
                      <td className="p-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-mono font-black text-xs px-2 py-1 bg-slate-900 text-white dark:bg-slate-700 rounded-lg shadow-xs">
                          {code}
                        </span>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {t.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">{t.email}</p>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-lg text-[11px] border border-indigo-200 dark:border-indigo-800">
                            {t.position || t.subject}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            isLeaderTeacher(t)
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}>
                            {isLeaderTeacher(t) ? 'Mẫu 02' : 'Mẫu 03'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">
                        {t.dob}
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {t.subject}
                        </span>
                      </td>

                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {t.department}
                      </td>

                      {/* Điểm Giáo viên, Nhân viên tự chấm */}
                      <td className="p-3 text-center bg-cyan-50/40 dark:bg-cyan-950/40 border-x border-cyan-200/60 dark:border-cyan-800/60">
                        <div className="font-black text-cyan-950 dark:text-cyan-200 text-sm">
                          {teacherGrandTotal} đ
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          A: {tPartA} | B: {tPartB}
                        </div>
                      </td>

                      <td className="p-3 text-center font-bold text-blue-800 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/20">
                        {partA}
                      </td>

                      <td className="p-3 text-center font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50/20 dark:bg-indigo-950/20">
                        {partB}
                      </td>

                      <td className="p-3 text-center bg-emerald-50/20 dark:bg-emerald-950/20">
                        <div className="font-extrabold text-emerald-800 dark:text-emerald-300">
                          +{bonusPrincipal}đ
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Tự chấm: +{bonusTeacher}đ
                        </div>
                      </td>

                      <td className="p-3 text-center bg-rose-50/20 dark:bg-rose-950/20">
                        <div className="font-extrabold text-rose-800 dark:text-rose-300">
                          -{dedPrincipal}đ
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Tự chấm: -{dedTeacher}đ
                        </div>
                      </td>

                      <td className="p-3 text-center font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800">
                        {grandTotal}
                      </td>

                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border ${clsRule?.badgeColor}`}>
                          {getClassificationLabel(clsType)}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectTeacherForView(t, 'profile')}
                            title="Xem Mẫu 01 (Hồ sơ cá nhân & Minh chứng)"
                            className="p-1.5 text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectTeacherForView(t, 'evaluation')}
                            title={isLeaderTeacher(t) ? "Chấm điểm Mẫu 02 (Ban Giám Hiệu / TTCM)" : "Chấm điểm Mẫu 03 (Giáo viên / Nhân viên)"}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isLeaderTeacher(t)
                                ? 'text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950'
                                : 'text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-950'
                            }`}
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Hiển thị {filteredTeachers.length} trên tổng số {teachers.length} giáo viên</span>
          <span>Cập nhật mới nhất: Tháng {selectedMonth}/2026 (Tự động lưu file Tháng {selectedMonth} trên Google Sheet)</span>
        </div>
      </div>

    </div>
  );
};
