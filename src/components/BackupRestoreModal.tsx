import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Database, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  FileText,
  Lock,
  Layers,
  Archive
} from 'lucide-react';
import { Teacher, Form03Evaluation, Form01Data, EntryStatusData, SystemBackup } from '../types';
import { saveSystemBackupToFirestore } from '../lib/firebaseService';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Teacher | null;
  teachers: Teacher[];
  evaluations: Record<string, Form03Evaluation>;
  form01Data: Record<string, Form01Data>;
  entryStatuses: Record<string, EntryStatusData>;
  onRestoreData: (restored: {
    teachers?: Teacher[];
    evaluations?: Record<string, Form03Evaluation>;
    form01Data?: Record<string, Form01Data>;
    entryStatuses?: Record<string, EntryStatusData>;
    mode: 'merge' | 'overwrite';
  }) => Promise<void> | void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teachers,
  evaluations,
  form01Data,
  entryStatuses,
  onRestoreData
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [backupNote, setBackupNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  // Restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [parseError, setParseError] = useState('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');

  if (!isOpen) return null;

  // 1. Tạo tệp sao lưu JSON & lưu metadata vào Firestore
  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportSuccessMsg('');
    try {
      const backupId = `backup_${Date.now()}`;
      const now = new Date();
      const backupPayload = {
        app: 'THI_DUA_NUOC_OA',
        school: 'Trường PTDTNT THCS và THPT Nước Oa',
        createdAt: now.toISOString(),
        createdBy: currentUser?.fullName || currentUser?.email || 'Quản trị viên',
        backupId,
        note: backupNote.trim() || 'Sao lưu định kỳ hệ thống thi đua',
        dataSummary: {
          totalTeachers: teachers.length,
          totalEvaluations: Object.keys(evaluations).length,
          totalForm01Entries: Object.keys(form01Data).length,
          totalEntryStatuses: Object.keys(entryStatuses).length
        },
        teachers,
        evaluations,
        form01Data,
        entryStatuses
      };

      // Tải tệp xuống máy người dùng
      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sao_Luu_Thi_Dua_Nuoc_Oa_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Lưu nhật ký sao lưu lên Firestore
      await saveSystemBackupToFirestore({
        id: backupId,
        backupId,
        createdAt: now.toISOString(),
        createdBy: currentUser?.fullName || currentUser?.email || 'Quản trị viên',
        backupType: 'full',
        dataSummary: backupPayload.dataSummary,
        note: backupPayload.note
      });

      setExportSuccessMsg('✅ Đã xuất và lưu tệp sao lưu an toàn thành công!');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Lỗi khi xuất sao lưu:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Đọc và kiểm tra tính hợp lệ của tệp sao lưu
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setParsedBackup(null);
    setRestoreSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (!json || typeof json !== 'object') {
          throw new Error('Định dạng tệp không phải đối tượng JSON hợp lệ.');
        }

        if (json.app !== 'THI_DUA_NUOC_OA' && !json.teachers && !json.evaluations) {
          throw new Error('Tệp tải lên không chứa cấu trúc sao lưu của Phần mềm Thi Đua Nước Oa.');
        }

        setParsedBackup(json);
      } catch (err: any) {
        setParseError(`❌ Lỗi kiểm tra tệp sao lưu: ${err.message || 'Không thể đọc tệp'}`);
      }
    };
    reader.readAsText(file);
  };

  // 3. Thực hiện phục hồi dữ liệu
  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;
    if (confirmText.trim().toUpperCase() !== 'XÁC NHẬN') {
      setParseError('⚠️ Vui lòng nhập đúng chữ "XÁC NHẬN" vào ô bên dưới để đảm bảo an toàn dữ liệu.');
      return;
    }

    setIsRestoring(true);
    setParseError('');
    try {
      await onRestoreData({
        teachers: Array.isArray(parsedBackup.teachers) ? parsedBackup.teachers : undefined,
        evaluations: parsedBackup.evaluations && typeof parsedBackup.evaluations === 'object' ? parsedBackup.evaluations : undefined,
        form01Data: parsedBackup.form01Data && typeof parsedBackup.form01Data === 'object' ? parsedBackup.form01Data : undefined,
        entryStatuses: parsedBackup.entryStatuses && typeof parsedBackup.entryStatuses === 'object' ? parsedBackup.entryStatuses : undefined,
        mode: restoreMode
      });

      setRestoreSuccessMsg('🎉 Phục hồi dữ liệu thành công! Hệ thống đã tự động cập nhật và đồng bộ an toàn.');
      setParsedBackup(null);
      setSelectedFile(null);
      setConfirmText('');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setParseError(`❌ Lỗi phục hồi dữ liệu: ${err.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Sao Lưu &amp; Phục Hồi Dữ Liệu Toàn Trường
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Quản lý an toàn dữ liệu Firebase Firestore — Trường Nước Oa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Xuất Sao Lưu (Backup JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Phục Hồi Dữ Liệu (Restore)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
                <p className="font-extrabold flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
                  <Database className="w-4 h-4" />
                  <span>Dữ liệu sẽ được đóng gói toàn vẹn bao gồm:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 font-medium pl-1">
                  <li>Toàn bộ danh sách {teachers.length} cán bộ giáo viên (hồ sơ, chức vụ, bộ môn, tổ).</li>
                  <li>Tất cả điểm số Mẫu 02, Mẫu 03 chi tiết từng tiêu chí và tổng hợp ({Object.keys(evaluations).length} bản ghi).</li>
                  <li>Toàn bộ nhiệm vụ kê khai Mẫu 01 ({Object.keys(form01Data).length} bản ghi).</li>
                  <li>Trạng thái kỳ đánh giá ({Object.keys(entryStatuses).length} kỳ).</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú sao lưu (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={backupNote}
                  onChange={(e) => setBackupNote(e.target.value)}
                  placeholder="Ví dụ: Sao lưu cuối học kỳ 2 năm 2026 trước khi tổng kết"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {exportSuccessMsg && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-black rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang đóng gói và xuất sao lưu...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải Về Tệp Sao Lưu An Toàn (JSON)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: RESTORE */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900 dark:text-amber-300">
                    Cảnh báo an toàn dữ liệu:
                  </p>
                  <p className="font-medium mt-0.5">
                    Chức năng phục hồi chỉ dành cho Quản trị viên. Bạn nên chọn chế độ <strong>Hợp nhất (Merge)</strong> để bổ sung bản ghi mới mà không làm mất các bản ghi hiện tại.
                  </p>
                </div>
              </div>

              {/* Upload input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn tệp sao lưu (.json):
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-rose-100 dark:bg-rose-950/70 border border-rose-300 text-rose-900 dark:text-rose-200 text-xs font-black rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* File Preview */}
              {parsedBackup && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Bản xem trước tệp sao lưu:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Thời gian sao lưu:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {parsedBackup.createdAt ? new Date(parsedBackup.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Người tạo:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {parsedBackup.createdBy || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Số giáo viên:</span>
                      <p className="font-black text-blue-600 dark:text-blue-400">
                        {parsedBackup.teachers ? parsedBackup.teachers.length : 0} cán bộ
                      </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Số bản đánh giá:</span>
                      <p className="font-black text-emerald-600 dark:text-emerald-400">
                        {parsedBackup.evaluations ? Object.keys(parsedBackup.evaluations).length : 0} bản
                      </p>
                    </div>
                  </div>

                  {/* Mode select */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phương thức phục hồi:
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span>Hợp nhất an toàn (Khuyên dùng - Giữ lại dữ liệu hiện tại, chỉ thêm bản ghi mới)</span>
                      </label>
                    </div>
                  </div>

                  {/* Security Confirmation */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nhập chữ <strong className="text-rose-600">XÁC NHẬN</strong> để thực hiện:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="XÁC NHẬN"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring || confirmText.trim().toUpperCase() !== 'XÁC NHẬN'}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang khôi phục dữ liệu lên Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Tiến Hành Phục Hồi Dữ Liệu Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {restoreSuccessMsg && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-black rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{restoreSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
