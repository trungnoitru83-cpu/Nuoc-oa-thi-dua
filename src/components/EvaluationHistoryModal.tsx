import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Clock, 
  User, 
  ShieldCheck, 
  Award, 
  Search, 
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { EvaluationAuditLog, Role } from '../types';
import { listenToEvaluationHistory } from '../lib/firebaseService';

interface EvaluationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
}

export const EvaluationHistoryModal: React.FC<EvaluationHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear
}) => {
  const [logs, setLogs] = useState<EvaluationAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const unsub = listenToEvaluationHistory((data) => {
      setLogs(data);
    });

    return () => {
      unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.teacherName && log.teacherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.actorName && log.actorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.evaluationId && log.evaluationId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = filterAction === 'ALL' || log.actionType === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'approve':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Duyệt điểm</span>;
      case 'reject':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Trả hồ sơ</span>;
      case 'leader_review':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Tổ trưởng đề xuất</span>;
      case 'self_score':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">GV tự chấm</span>;
      case 'lock':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Khóa kỳ</span>;
      case 'unlock':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">Mở khóa kỳ</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">{actionType}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Nhật Ký &amp; Lịch Sử Chỉnh Sửa Điểm Thi Đua
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Theo dõi minh bạch mọi thay đổi điểm số, người thực hiện và thời gian
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

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên giáo viên, người sửa..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">Hành động:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="approve">Hiệu trưởng duyệt điểm</option>
              <option value="leader_review">Tổ trưởng đề xuất</option>
              <option value="self_score">Giáo viên tự chấm</option>
              <option value="reject">Trả hồ sơ</option>
              <option value="lock">Khóa kỳ</option>
              <option value="unlock">Mở khóa kỳ</option>
            </select>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 animate-pulse" />
              <p className="text-xs font-bold">Chưa có bản ghi nhật ký nào phù hợp với bộ lọc.</p>
              <p className="text-[11px]">Hệ thống sẽ tự động ghi lại lịch sử mỗi khi có thao tác chấm hoặc duyệt điểm.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xs transition space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(item.actionType)}
                      <span className="font-black text-slate-900 dark:text-white">
                        {item.teacherName || item.teacherId}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({item.evaluationId})
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : 'Vừa xong'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Người thực hiện: <strong className="text-slate-900 dark:text-slate-100">{item.actorName || item.actorEmail || 'Hệ thống'}</strong>
                    </span>

                    {typeof item.newScore === 'number' && (
                      <span className="flex items-center gap-1 font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Điểm số: {typeof item.oldScore === 'number' ? `${item.oldScore}đ ➔ ` : ''}
                        <strong className="text-blue-600 dark:text-blue-400">{item.newScore}đ</strong>
                      </span>
                    )}

                    {item.newStatus && (
                      <span className="text-[11px]">
                        Trạng thái: <strong>{item.newStatus}</strong>
                      </span>
                    )}
                  </div>

                  {item.reason && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      Ghi chú / Lý do: {item.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Tổng cộng: {filteredLogs.length} bản ghi nhật ký
          </span>
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
