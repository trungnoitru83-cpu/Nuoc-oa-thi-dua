import React, { useState, useEffect, useRef } from 'react';
import { User, Calendar, GraduationCap, Building2, School, Link as LinkIcon, FileText, CheckCircle, Plus, Trash2, ExternalLink, Save, ArrowRight, ChevronLeft, ChevronRight, Users, Send, Award, FileSpreadsheet, ShieldCheck, Copy, Upload, Download, Sparkles, Eye, EyeOff, Table, CheckSquare, Layers, Printer, FileDown, RefreshCw } from 'lucide-react';
import { Teacher, Form01Data, Form01Task, Form03Evaluation, Role } from '../types';
import { isLeaderTeacher, getClassification, getClassificationLabel } from '../data/form03Criteria';
import { getTeacherEmulationCode } from '../data/mockTeachers';
import { exportForm01ToWord, exportForm01ToPdfPrint } from '../utils/exportDecree30';
import { saveForm01ToGoogleSheet, saveEvaluationToGoogleSheet, fetchForm01FromGoogleSheet } from '../lib/googleSheetService';
import { formatTeacherId } from '../utils/formatTeacherId';

interface SignatureBoxPadProps {
  title: string;
  roleBadge: string;
  badgeBg: string;
  subtitle: string;
  nameValue: string;
  onNameChange: (val: string) => void;
  signatureValue: string;
  onSignatureChange: (val: string) => void;
  footerText: string;
  focusColor: string;
}

const SignatureBoxPad: React.FC<SignatureBoxPadProps> = ({
  title,
  roleBadge,
  badgeBg,
  subtitle,
  nameValue,
  onNameChange,
  signatureValue,
  onSignatureChange,
  footerText,
  focusColor
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSignatureChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
      <div>
        <div className="text-center mb-2">
          <span className={`px-3 py-1 ${badgeBg} font-black text-[11px] rounded-full uppercase inline-block`}>
            {roleBadge}
          </span>
          <p className="text-[10px] text-slate-500 italic mt-1">{subtitle}</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-1 px-2 rounded-lg transition cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ✍️ Ký bằng chuột
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1 px-2 rounded-lg transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🖼️ Chèn chữ ký ảnh
          </button>
        </div>

        {/* Signature Box */}
        {signatureValue ? (
          <div className="relative border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl p-2 bg-emerald-50/40 dark:bg-emerald-950/30 text-center mb-3">
            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold mb-1">
              ✅ Đã chèn chữ ký:
            </p>
            <div className="h-16 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg p-1 border border-emerald-100 dark:border-slate-800">
              <img src={signatureValue} alt="Chữ ký" className="max-h-full max-w-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => onSignatureChange('')}
              className="mt-1.5 text-[10px] font-extrabold text-rose-600 hover:underline cursor-pointer"
            >
              🗑️ Xóa chữ ký này để ký lại
            </button>
          </div>
        ) : (
          <div className="mb-3">
            {activeTab === 'draw' ? (
              <div className="space-y-1.5">
                <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={260}
                    height={90}
                    className="w-full h-24 touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none italic">
                    (Vẽ chữ ký tại đây)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition cursor-pointer"
                  >
                    🧹 Xóa vẽ lại
                  </button>
                  <button
                    type="button"
                    onClick={saveCanvasSignature}
                    className="px-3 py-1 text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition cursor-pointer"
                  >
                    💾 Xác nhận chữ ký vẽ
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-900 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    id={`file_sig_${roleBadge.replace(/[^a-zA-Z0-9]/g, '_')}`}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor={`file_sig_${roleBadge.replace(/[^a-zA-Z0-9]/g, '_')}`}
                    className="cursor-pointer inline-flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300"
                  >
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span className="text-[11px] font-bold">Chọn ảnh chữ ký (.png, .jpg)</span>
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={signatureValue}
                    onChange={(e) => onSignatureChange(e.target.value)}
                    placeholder="Hoặc dán Link URL ảnh chữ ký..."
                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Box for Full Name (Text box họ tên) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-1">
            📝 Text box ghi rõ họ tên ({title}):
          </label>
          <input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={`Nhập họ và tên ${title}...`}
            className={`w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${focusColor}`}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
        <span className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{footerText}</span>
        </span>
      </div>
    </div>
  );
};

interface TeacherProfilePageProps {
  currentUser?: Teacher | null;
  teachers?: Teacher[];
  teacher: Teacher;
  form01: Form01Data;
  evaluation?: Form03Evaluation;
  selectedMonth: number;
  selectedYear?: number;
  currentRole: Role;
  onSelectTeacher?: (teacher: Teacher) => void;
  onUpdateTeacher: (updated: Teacher) => void;
  onUpdateForm01: (updatedForm01: Form01Data) => void;
  onNavigateToForm03: () => void;
}

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  currentUser,
  teachers = [],
  teacher,
  form01,
  evaluation,
  selectedMonth,
  selectedYear = 2026,
  currentRole,
  onSelectTeacher,
  onUpdateTeacher,
  onUpdateForm01,
  onNavigateToForm03
}) => {
  // Local state for editable profile fields
  const [fullName, setFullName] = useState(teacher.fullName);
  const [dob, setDob] = useState(teacher.dob);
  const [position, setPosition] = useState(teacher.position || teacher.subject || 'Giáo viên');
  const [subject, setSubject] = useState(teacher.subject);
  const [department, setDepartment] = useState(teacher.department);
  const [school, setSchool] = useState(teacher.school);
  const [evaluationDate, setEvaluationDate] = useState(`${selectedYear}-${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}-28`);

  // Local state for Form 01
  const [attachedFileUrl, setAttachedFileUrl] = useState(
    form01.attachedFileUrl || 'https://docs.google.com/spreadsheets/d/1sLOpOWvtufbaFHkcuJAa0BpC2zA4ePFZMSjY-hc-DM8/edit?gid=0#gid=0'
  );
  const [overallSummary, setOverallSummary] = useState(form01.overallSummary || '');
  const [tasks, setTasks] = useState<Form01Task[]>(form01.tasks || []);

  // Signature States for Mẫu 01 (HIỆU TRƯỜNG - PHT/TTCM - CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ)
  const [evaluatorName, setEvaluatorName] = useState(form01.evaluatorName || teacher.fullName);
  const [evaluatorSignature, setEvaluatorSignature] = useState(form01.evaluatorSignature || teacher.teacherSignature || '');
  const [leaderName, setLeaderName] = useState(form01.leaderName || 'Nguyễn Xuân Ảnh');
  const [leaderSignature, setLeaderSignature] = useState(form01.leaderSignature || '');
  const [principalName, setPrincipalName] = useState(form01.principalName || 'Bùi Văn Sáu');
  const [principalSignature, setPrincipalSignature] = useState(form01.principalSignature || teacher.principalSignature || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [pastedCsvText, setPastedCsvText] = useState('');
  const [showVisualSheetPreview, setShowVisualSheetPreview] = useState(true);

  // Export handlers Decree 30/2020/NĐ-CP
  const handleExportWord = () => {
    exportForm01ToWord(
      {
        ...teacher,
        fullName,
        position,
        department,
        school
      },
      tasks,
      selectedMonth,
      selectedYear,
      overallSummary,
      evaluationDate,
      {
        evaluatorName,
        evaluatorSignature,
        leaderName,
        leaderSignature,
        principalName,
        principalSignature
      }
    );
  };

  const handleExportPdf = () => {
    exportForm01ToPdfPrint(
      {
        ...teacher,
        fullName,
        position,
        department,
        school
      },
      tasks,
      selectedMonth,
      selectedYear,
      overallSummary,
      evaluationDate,
      {
        evaluatorName,
        evaluatorSignature,
        leaderName,
        leaderSignature,
        principalName,
        principalSignature
      }
    );
  };

  // Helper to load standard Mẫu 01 sample tasks as in the reference image (Categorized I, II, III, IV)
  const handleImportSampleTasks = () => {
    const sampleTasks: Form01Task[] = [
      {
        id: `task_sample_1_${Date.now()}`,
        category: 'I',
        taskName: 'Thực hiện Kế hoạch giảng dạy năm học 2025-2026 & Đổi mới PPDH',
        taskNature: 'Kế hoạch năm',
        assignedTarget: 'Đảm bảo 100% chỉ tiêu chương trình năm học, ứng dụng CNTT & STEM',
        workDone: 'Đã hoàn thành các chủ đề bài học đúng kế hoạch năm, tổ chức 2 tiết dạy STEM đạt hiệu quả cao',
        executionTime: 'Cả tháng',
        result: 'Hoàn thành 100% kế hoạch năm học',
        progress: 'Đúng tiến độ',
        quality: 'Đạt chất lượng cao / Vượt yêu cầu',
        completionRate: 100,
        status: 'completed',
        noteExplanation: 'Không có',
        evidenceLink: 'https://drive.google.com/file/d/ke-hoach-giang-day-nam'
      },
      {
        id: `task_sample_2_${Date.now()}`,
        category: 'II',
        taskName: 'Giảng dạy theo thời khóa biểu, Hồ sơ sổ sách & Bồi dưỡng HSG',
        taskNature: 'Thường xuyên',
        assignedTarget: 'Đảm bảo 100% tiết dạy theo TKB, soạn giáo án đầy đủ, bồi dưỡng 4 tiết/tuần',
        workDone: 'Dạy đủ tiết theo TKB, hoàn thành 16 tiết bồi dưỡng HSG, dự giờ 2 tiết đồng nghiệp',
        executionTime: 'Cả tháng',
        result: '100% tiết dạy đạt chuẩn, học sinh bồi dưỡng tiến bộ rõ rệt',
        progress: 'Trước tiến độ',
        quality: 'Đạt yêu cầu',
        completionRate: 100,
        status: 'completed',
        noteExplanation: 'Không có',
        evidenceLink: 'https://drive.google.com/file/d/ho-so-so-sach-chuyen-mon'
      },
      {
        id: `task_sample_3_${Date.now()}`,
        category: 'III',
        taskName: 'Tham gia Ban giám khảo Hội thi GVG cấp trường & Hỗ trợ Chuyển đổi số',
        taskNature: 'Đột xuất',
        assignedTarget: 'Chấm 12 tiết dạy hội giảng, chuẩn bị hệ thống phần mềm báo cáo thi đua',
        workDone: 'Đã hoàn thành chấm thi đúng quy chế, vận hành phần mềm đánh giá Mẫu 01-03',
        executionTime: '1 tuần (Tuần 3)',
        result: 'Hoàn thành nhiệm vụ đột xuất đúng chất lượng',
        progress: 'Đúng tiến độ',
        quality: 'Đạt chất lượng cao / Vượt yêu cầu',
        completionRate: 100,
        status: 'completed',
        noteExplanation: 'Giải trình do lượng công việc phát sinh đột xuất',
        evidenceLink: 'https://drive.google.com/file/d/dot-xuat-gvg'
      },
      {
        id: `task_sample_4_${Date.now()}`,
        category: 'IV',
        taskName: 'Công tác Chủ nhiệm lớp, Quản lý học sinh nội trú & Hoạt động đoàn thể',
        taskNature: 'Phối hợp',
        assignedTarget: 'Duy trì sĩ số 100%, quản lý nếp sống nội trú, tham gia phong trào thi đua',
        workDone: 'Tổ chức 4 buổi sinh hoạt lớp, quản lý tốt nếp sống nội trú, hoàn thành nhiệm vụ đoàn thể',
        executionTime: 'Thường xuyên',
        result: 'Lớp xếp loại Tốt, sĩ số duy trì 100%',
        progress: 'Đúng tiến độ',
        quality: 'Đạt yêu cầu',
        completionRate: 100,
        status: 'completed',
        noteExplanation: 'Không có',
        evidenceLink: 'https://drive.google.com/file/d/so-chu-nhiem'
      }
    ];
    setTasks(sampleTasks);
    setOverallSummary(`Đã thực hiện hoàn thành 4/4 danh mục nhiệm vụ được giao trong tháng ${selectedMonth}/${selectedYear} (I. Kế hoạch năm, II. Thường xuyên, III. Đột xuất, IV. Nhiệm vụ khác). Tỷ lệ hoàn thành nhiệm vụ đạt 100% đúng tiến độ và đảm bảo chất lượng.`);
  };

  // CSV/TSV Parser function for pasting Google Sheet rows
  const handleParseCsvAndImport = () => {
    if (!pastedCsvText.trim()) return;
    const lines = pastedCsvText.split('\n').filter(l => l.trim().length > 0);
    const newTasks: Form01Task[] = [];

    lines.forEach((line, idx) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 2) {
        if (parts[0].toLowerCase().includes('stt') || parts[1].toLowerCase().includes('nhiệm vụ')) return;

        const taskName = parts[1]?.trim() || parts[0]?.trim() || `Nhiệm vụ ${idx + 1}`;
        const assignedTarget = parts[2]?.trim() || 'Hoàn thành 100% chỉ tiêu giao';
        const result = parts[3]?.trim() || 'Đã hoàn thành';
        const rawRate = parts[4]?.replace('%', '').trim();
        const completionRate = rawRate && !isNaN(Number(rawRate)) ? Number(rawRate) : 100;
        const evidenceLink = parts[5]?.trim() || '';

        newTasks.push({
          id: `csv_task_${Date.now()}_${idx}`,
          taskName,
          assignedTarget,
          result,
          completionRate,
          status: completionRate >= 100 ? 'completed' : 'in_progress',
          evidenceLink
        });
      }
    });

    if (newTasks.length > 0) {
      setTasks(newTasks);
      setOverallSummary(`Đã import thành công ${newTasks.length} nhiệm vụ từ Google Sheet. Tỷ lệ hoàn thành trung bình: ${Math.round(newTasks.reduce((a,b) => a + (b.completionRate || 0), 0) / newTasks.length)}%.`);
      setIsImportModalOpen(false);
      setPastedCsvText('');
    }
  };

  // Sync state when selected teacher or form01 changes
  useEffect(() => {
    let isMounted = true;

    setFullName(teacher.fullName);
    setDob(teacher.dob);
    setPosition(teacher.position || teacher.subject || 'Giáo viên');
    setSubject(teacher.subject);
    setDepartment(teacher.department);
    setSchool(teacher.school);
    setAttachedFileUrl(
      form01.attachedFileUrl || 'https://docs.google.com/spreadsheets/d/1sLOpOWvtufbaFHkcuJAa0BpC2zA4ePFZMSjY-hc-DM8/edit?gid=0#gid=0'
    );
    setOverallSummary(form01.overallSummary || '');
    setTasks(form01.tasks || []);
    setEvaluationDate(`${selectedYear}-${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}-28`);

    // Dynamic GET fetch from Google Sheet for the active teacher (TĐ13, TĐ38, etc.)
    const activeCode = formatTeacherId(teacher.emulationCode || teacher.id);
    if (activeCode && activeCode !== 'UNDEFINED') {
      fetchForm01FromGoogleSheet(activeCode, selectedMonth, selectedYear)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            console.log(`✨ [GoogleSheet GET] Nạp dữ liệu Mẫu 01 cho ${activeCode} từ Google Sheet thành công!`);
            if (res.data.tasks && res.data.tasks.length > 0) {
              setTasks(res.data.tasks);
            }
            if (res.data.overallSummary) {
              setOverallSummary(res.data.overallSummary);
            }
            if (res.data.attachedFileUrl) {
              setAttachedFileUrl(res.data.attachedFileUrl);
            }
          }
        })
        .catch((err) => {
          console.warn(`ℹ️ [GoogleSheet GET Notice] Sử dụng dữ liệu mặc định cho ${activeCode}:`, err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [teacher, form01, selectedMonth, selectedYear]);

  // Indexing for teacher navigation
  const currentIndex = teachers.findIndex(t => t.id === teacher.id);
  const prevTeacher = currentIndex > 0 ? teachers[currentIndex - 1] : null;
  const nextTeacher = currentIndex < teachers.length - 1 ? teachers[currentIndex + 1] : null;

  const isLeader = isLeaderTeacher(teacher);

  // Mẫu 03 Evaluation Summary calculation
  const partA = evaluation ? Math.min(30, evaluation.totalPartA_Principal) : 30;
  const partB = evaluation ? Math.min(70, evaluation.totalPartB_Principal) : 60;
  const bonusVal = evaluation ? (evaluation.totalBonus_Principal || 0) : 0;
  const dedVal = evaluation ? (evaluation.totalDeduction_Principal || 0) : 0;
  const grandTotalVal = evaluation ? (evaluation.grandTotal_Principal ?? Math.min(100, Math.max(0, Math.round((partA + partB + bonusVal - dedVal) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((partA + partB) * 100) / 100));
  const clsType = getClassification(grandTotalVal);
  const clsLabel = getClassificationLabel(clsType);

  const [isSaving, setIsSaving] = useState(false);

  const handleOpenPreviewModal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreviewModalOpen(true);
  };

  const executeSaveProfile = async () => {
    setIsPreviewModalOpen(false);
    setIsSaving(true);
    
    // 1. Update teacher profile locally/in state
    const updatedTeacher: Teacher = {
      ...teacher,
      fullName,
      dob,
      position,
      subject,
      department,
      school
    };
    onUpdateTeacher(updatedTeacher);

    // 2. Update Form 01 locally/in state
    const updatedForm01: Form01Data = {
      ...form01,
      month: selectedMonth,
      attachedFileUrl,
      overallSummary,
      tasks,
      evaluatorName,
      evaluatorSignature,
      leaderName,
      leaderSignature,
      principalName,
      principalSignature,
      updatedAt: new Date().toISOString()
    };
    onUpdateForm01(updatedForm01);

    // Toast notice immediately
    alert('⏳ Đang gửi dữ liệu Mẫu 01 sang Google Sheet...');

    try {
      // 3. Post Mẫu 01 data to Google Sheet Web App API
      const resForm01 = await saveForm01ToGoogleSheet(
        updatedTeacher,
        updatedForm01,
        selectedMonth,
        selectedYear,
        currentUser || teacher
      );

      // 4. Optionally sync evaluation scores if evaluation exists
      if (evaluation) {
        await saveEvaluationToGoogleSheet(
          updatedTeacher,
          evaluation,
          selectedMonth,
          selectedYear,
          currentUser || teacher
        );
      }

      if (resForm01.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 5000);
        alert('Đã gửi dữ liệu Mẫu 01 vào Google Sheet thành công! Vui lòng tải lại trang Google Sheet.');
      } else {
        alert(`❌ [LỖI LƯU MẪU 01 LÊN GOOGLE SHEET]\n\n• Nguyên nhân: ${resForm01.message}`);
      }
    } catch (err: any) {
      console.warn('❌ Exception in handleSaveProfile:', err);
      alert(`❌ [LỖI KẾT NỐI MÁY CHỦ GOOGLE SHEET]\n\n• Chi tiết: ${err?.message || 'Không thể kết nối API Web App'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = () => {
    const newTask: Form01Task = {
      id: `task_${Date.now()}`,
      taskName: 'Nhiệm vụ bổ sung trong tháng',
      assignedTarget: 'Hoàn thành 100% chỉ tiêu',
      result: 'Đã thực hiện xong',
      completionRate: 100,
      status: 'completed',
      evidenceLink: ''
    };
    setTasks([...tasks, newTask]);
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleTaskChange = (id: string, field: keyof Form01Task, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // Calculate overall completion percentage
  const avgCompletion = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + Number(t.completionRate || 0), 0) / tasks.length)
    : 100;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full">
              TRANG 2: HỒ SƠ & MẪU 01
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Tháng {selectedMonth}/{selectedYear}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Thông Tin Giáo Viên & Minh Chứng Mẫu 01
          </h1>
          <p className="text-xs text-slate-500">
            Cập nhật lý lịch chuyên môn và đính kèm đường link / file báo cáo Mẫu 01
          </p>
        </div>

        <button
          onClick={onNavigateToForm03}
          className={`flex items-center gap-2 px-5 py-2.5 text-white font-black text-xs rounded-2xl shadow-md transition shrink-0 cursor-pointer ${
            isLeader ? 'btn-principal' : 'btn-teacher'
          }`}
        >
          <span>{isLeader ? 'Chuyển sang Bảng chấm Mẫu 02 (TTCM, TPCM, HT, HP)' : 'Chuyển sang Bảng chấm Mẫu 03 (GV, NV)'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Teacher Selector Bar for Trang 2 (Chỉ hiển thị cho Quản trị & Hiệu trưởng, ẩn đối với Viên chức đăng nhập cá nhân) */}
      {teachers.length > 0 && onSelectTeacher && (currentRole === 'admin' || currentRole === 'principal') && (
        <div className="mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                Chọn GV ({currentIndex >= 0 ? currentIndex + 1 : 1}/{teachers.length}):
              </span>
              
              {/* Dropdown menu for fast access */}
              <select
                value={teacher.id}
                onChange={(e) => {
                  const found = teachers.find(t => t.id === e.target.value);
                  if (found) onSelectTeacher(found);
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {teachers.map((t, idx) => {
                  const code = t.emulationCode || getTeacherEmulationCode(t, idx);
                  return (
                    <option key={t.id} value={t.id}>
                      {code} - {t.fullName} ({t.subject})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Next / Prev Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!prevTeacher}
                onClick={() => prevTeacher && onSelectTeacher(prevTeacher)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>GV Trước</span>
              </button>

              <button
                type="button"
                disabled={!nextTeacher}
                onClick={() => nextTeacher && onSelectTeacher(nextTeacher)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <span>GV Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontally scrollable list of teacher pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {teachers.map((t, idx) => {
              const code = t.emulationCode || getTeacherEmulationCode(t, idx);
              const isCurrent = t.id === teacher.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeacher(t)}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl whitespace-nowrap transition shrink-0 flex items-center gap-1 border-2 cursor-pointer ${
                    isCurrent
                      ? 'btn-theme border-transparent shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-black px-1 rounded ${isCurrent ? 'bg-white text-slate-950 shadow-xs' : 'bg-slate-900 text-white dark:bg-slate-700'}`}>
                    {code}
                  </span>
                  <span>{t.fullName.split(' ').pop()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100 rounded-2xl border-2 border-emerald-500 flex items-center justify-between gap-3 font-bold text-sm shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-200">
                ✅ ĐÃ LƯU MẪU 01 THÀNH CÔNG!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Dữ liệu hồ sơ & đính kèm minh chứng Mẫu 01 tháng {selectedMonth}/2026 đã được lưu an toàn lên đám mây Firebase.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black uppercase shrink-0">
            ĐÃ LƯU FIREBASE
          </span>
        </div>
      )}

      <form onSubmit={handleOpenPreviewModal} className="space-y-8">
        
        {/* Section 1: Thông tin cá nhân & chuyên môn */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-2xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Thông tin lý lịch viên chức, người lao động
              </h2>
              <p className="text-xs text-slate-500">
                Các thông tin đơn vị công tác, chức vụ và bộ môn chuyên môn của viên chức, người lao động
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Chu kỳ đánh giá / Lịch chọn ngày */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chu kỳ đánh giá (Lịch chọn ngày / Tháng) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 rounded-xl text-sm font-extrabold text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Chu kỳ Tháng {selectedMonth}/2026 đính kèm lịch lưu lâu dài</p>
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên viên chức, người lao động <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Chức vụ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chức vụ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="Hiệu trưởng">Hiệu trưởng</option>
                  <option value="Phó Hiệu trưởng">Phó Hiệu trưởng</option>
                  <option value="Tổ trưởng chuyên môn">Tổ trưởng chuyên môn</option>
                  <option value="Bí thư Đoàn trường">Bí thư Đoàn trường</option>
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Giáo viên - TKHĐ">Giáo viên - TKHĐ</option>
                  <option value="Nhân viên">Nhân viên</option>
                  <option value="Nhân viên QLNT">Nhân viên QLNT</option>
                </select>
              </div>
            </div>

            {/* Ngày tháng năm sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ngày tháng năm sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Bộ môn giảng dạy */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bộ môn giảng dạy / Công tác <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Tổ chuyên môn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tổ chuyên môn <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="Ban Giám Hiệu">Ban Giám Hiệu</option>
                  <option value="Tổ Xã hội">Tổ Xã hội</option>
                  <option value="Tổ Tự nhiên">Tổ Tự nhiên</option>
                  <option value="Tổ KHXH1">Tổ KHXH1</option>
                  <option value="Tổ KHXH2">Tổ KHXH2</option>
                  <option value="Tổ KHTN">Tổ KHTN</option>
                  <option value="Văn phòng">Văn phòng</option>
                  <option value="QLNT">QLNT (Nội trú)</option>
                </select>
              </div>
            </div>

            {/* Trường */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Trường công tác <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 1.5: Thống Kê Tổng Điểm Mẫu 03/02 của Cán Bộ Trong Tháng */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-800/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Tổng Điểm Đánh Giá {isLeader ? 'Mẫu 02 (CBQL)' : 'Mẫu 03 (GV, NV)'} - Tháng {selectedMonth}/2026</span>
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Tự động đồng bộ điểm Tiêu chí chung, Tiêu chí chuyên môn, Điểm cộng, Điểm trừ & Mức xếp loại
                </p>
              </div>
            </div>

            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-emerald-300 font-extrabold text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{clsLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
            <div className="bg-white/10 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-indigo-200 uppercase font-bold">Điểm Tiêu chí chung (A)</p>
              <p className="text-xl font-black text-blue-300 mt-1">{partA} <span className="text-xs text-indigo-300/70 font-normal">/30</span></p>
            </div>

            <div className="bg-white/10 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-indigo-200 uppercase font-bold">Tiêu chí chuyên môn (B)</p>
              <p className="text-xl font-black text-indigo-300 mt-1">{partB} <span className="text-xs text-indigo-300/70 font-normal">/70</span></p>
            </div>

            <div className="bg-white/10 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-indigo-200 uppercase font-bold">Điểm Cộng (+C)</p>
              <p className="text-xl font-black text-emerald-300 mt-1">+{bonusVal}</p>
            </div>

            <div className="bg-white/10 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-indigo-200 uppercase font-bold">Điểm Trừ (-D)</p>
              <p className="text-xl font-black text-rose-300 mt-1">-{dedVal}</p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-amber-400/20 p-3.5 rounded-2xl border border-amber-400/40">
              <p className="text-[10px] text-amber-200 uppercase font-bold">Tổng Điểm Đánh Giá</p>
              <p className="text-2xl font-black text-amber-300 mt-1">{grandTotalVal} <span className="text-xs text-amber-200/70 font-normal">/100</span></p>
            </div>
          </div>
        </div>

        {/* Section 2: Đính kèm link & Quản lý Mẫu 01 Google Sheet */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>2. Liên kết file Mẫu 01 tháng {selectedMonth} năm {selectedYear}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Mỗi tháng hệ thống quản lý một đường link Mẫu 01 riêng biệt
                </p>
              </div>
            </div>

          </div>

          {/* Import & Action Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">


              {/* Export Decree 30 Buttons */}
              <button
                type="button"
                onClick={handleExportWord}
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                title="Xuất file Word (.doc) chuẩn định dạng Nghị định 30/2020/NĐ-CP"
              >
                <FileDown className="w-4 h-4 text-indigo-200" />
                <span>📄 Xuất File Word (Nghị định 30)</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                title="In hoặc Xuất file PDF Mẫu 01 chuẩn định dạng Nghị định 30/2020/NĐ-CP"
              >
                <Printer className="w-4 h-4 text-rose-200" />
                <span>🖨️ Xuất PDF / In (Nghị định 30)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowVisualSheetPreview(!showVisualSheetPreview)}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              {showVisualSheetPreview ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-emerald-600" />}
              <span>{showVisualSheetPreview ? 'Ẩn Bảng Trực Quan' : '👁️ Xem Bảng Mẫu 01 Trực Quan'}</span>
            </button>
          </div>



          {/* Visual Mẫu 01 Spreadsheet View (như Bảng Mẫu Ảnh) */}
          {showVisualSheetPreview && (
            <div className="mb-8 bg-emerald-900/5 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-emerald-500/30 dark:border-slate-700 shadow-inner">
              
              {/* Form Title Header (Mẫu chuẩn ảnh) */}
              <div className="text-center mb-6 pb-4 border-b border-emerald-200 dark:border-slate-700 relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                  <span className="text-[11px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    📜 Định dạng chuẩn Nghị định 30/2020/NĐ-CP
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportWord}
                      className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Tải file Word Mẫu 01</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In / Xuất PDF</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  ĐƠN VỊ: TRƯỜNG PTDTNT THCS VÀ THPT NƯỚC OA
                </p>
                <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-300 uppercase mt-1">
                  BẢNG TỰ ĐÁNH GIÁ, XẾP LOẠI KẾT QUẢ THỰC HIỆN NHIỆM VỤ THÁNG {selectedMonth} NĂM {selectedYear} (MẪU 01)
                </h3>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Họ và tên: <strong className="text-slate-900 dark:text-white font-extrabold">{fullName}</strong></span>
                  <span>•</span>
                  <span>Chức vụ: <strong className="text-slate-900 dark:text-white font-extrabold">{position}</strong></span>
                  <span>•</span>
                  <span>Tổ/Bộ phận: <strong className="text-slate-900 dark:text-white font-extrabold">{department}</strong></span>
                </div>
              </div>

              {/* 4 Stat Cards Dashboard with Dropdown Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-slate-700 text-center shadow-xs">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng Công Việc Giao</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{tasks.length} nhiệm vụ</p>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
                    <span className="text-slate-500">Chỉ tiêu file:</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300">I, II, III, IV</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-slate-700 text-center shadow-xs">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Đã Hoàn Thành</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {tasks.filter(t => (t.completionRate || 0) >= 100).length} / {tasks.length}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Chưa xong: {tasks.filter(t => (t.completionRate || 0) < 100).length}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-slate-700 text-center shadow-xs">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tiến Độ Thực Hiện</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-emerald-600" title="Đúng tiến độ">⚡ {tasks.filter(t => !t.progress || t.progress === 'Đúng tiến độ' || t.progress === 'Trước tiến độ').length} Đạt</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">100% Đúng tiến độ</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-slate-700 text-center shadow-xs">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tỷ Lệ Hoàn Thành Mẫu 01</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-xl font-black text-blue-700 dark:text-blue-400">{avgCompletion}%</span>
                  </div>
                  <p className="text-[10px] text-blue-600 dark:text-blue-300 font-bold mt-1">
                    {avgCompletion >= 90 ? 'Xếp loại: Xuất sắc' : avgCompletion >= 80 ? 'Xếp loại: Tốt' : 'Xếp loại: Hoàn thành'}
                  </p>
                </div>
              </div>

              {/* BẢNG THỐNG KÊ TỔNG HỢP CÔNG VIỆC VÀ TỶ LỆ (13 CỘT THEO ẢNH MẪU 01) */}
              <div className="bg-emerald-50/60 dark:bg-slate-900/90 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                    <span>📊 Bảng Thống Kê Tổng Hợp Sản Phẩm, Công Việc Mẫu 01 (Phần I - Đánh giá chung):</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                    Đã tự động tính theo công thức (1) - (13)
                  </span>
                </div>

                <div className="overflow-x-auto border border-emerald-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
                        <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700">
                          Tổng số lượng sản phẩm, công việc
                          <div className="font-normal text-[10px] text-slate-500 italic">(Ghi tổng số lượng tương ứng)</div>
                        </th>
                        <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700">
                          Tiến độ sản phẩm, công việc
                          <div className="font-normal text-[10px] text-slate-500 italic">(Ghi tổng số lượng tương ứng)</div>
                        </th>
                        <th colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700">
                          Chất lượng sản phẩm, công việc
                          <div className="font-normal text-[10px] text-slate-500 italic">(Ghi tổng số lượng tương ứng)</div>
                        </th>
                        <th rowSpan={2} className="p-2 min-w-[70px] border-l border-slate-300 dark:border-slate-700">
                          Ghi chú
                        </th>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-[11px] text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700">
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Được giao</th>
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Hoàn thành</th>
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Chưa HT</th>
                        <th className="p-1.5 min-w-[100px] border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                          Tỷ lệ % hoàn thành so với giao
                        </th>

                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Sớm hạn</th>
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Đúng hạn</th>
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Trễ hạn</th>
                        <th className="p-1.5 min-w-[105px] border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                          Tỷ lệ % đúng & sớm hạn
                        </th>

                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Đảm bảo</th>
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800 min-w-[80px]">Vượt mức</th>
                        <th className="p-1.5 border-r border-slate-200 dark:border-slate-800">Chưa đảm bảo</th>
                        <th className="p-1.5 min-w-[105px] border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                          Tỷ lệ % chất lượng đạt trở lên
                        </th>
                      </tr>
                      <tr className="bg-slate-200/80 dark:bg-slate-800/80 text-[10px] italic font-mono text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-700">
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(1)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(2)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(3)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700 font-bold">(4)=(2)/(1)x100</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(5)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(6)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(7)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700 font-bold">(8)=(5+6)/(1)x100</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(9)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(10)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700">(11)</td>
                        <td className="p-1 border-r border-slate-300 dark:border-slate-700 font-bold">(12)=(9+10)/(1)x100</td>
                        <td className="p-1">(13)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const c1 = tasks.length;
                        const c2 = tasks.filter(t => (t.completionRate || 0) >= 100 || t.status === 'completed').length;
                        const c3 = c1 - c2;
                        const c4 = c1 > 0 ? Math.round((c2 / c1) * 100) : 100;

                        const c5 = tasks.filter(t => t.progress === 'Trước tiến độ' || t.progress === 'Sớm hạn').length;
                        const c6 = tasks.filter(t => !t.progress || t.progress === 'Đúng tiến độ' || t.progress === 'Đúng hạn').length;
                        const c7 = tasks.filter(t => t.progress?.includes('Chậm') || t.progress?.includes('Trễ')).length;
                        const c8 = c1 > 0 ? Math.round(((c5 + c6) / c1) * 100) : 100;

                        const c9 = tasks.filter(t => !t.quality || t.quality === 'Đạt yêu cầu' || t.quality === 'Đảm bảo').length;
                        const c10 = tasks.filter(t => t.quality?.includes('cao') || t.quality?.includes('Vượt')).length;
                        const c11 = tasks.filter(t => t.quality?.includes('Chưa') || t.quality?.includes('Cần')).length;
                        const c12 = c1 > 0 ? Math.round(((c9 + c10) / c1) * 100) : 100;

                        return (
                          <tr className="font-extrabold text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">{c1}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">{c2}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400">{c3}</td>
                            <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">{c4}%</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800">{c5}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800">{c6}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-amber-600">{c7}</td>
                            <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">{c8}%</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800">{c9}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-amber-600">{c10}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-rose-600">{c11}</td>
                            <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">{c12}%</td>
                            <td className="p-2 text-[11px] font-normal text-slate-500 italic">Đạt chỉ tiêu giao</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Table Preview Categorized I, II, III, IV */}
              <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 rounded-2xl shadow-sm mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-800 text-white font-extrabold text-[11px] uppercase">
                      <th className="p-3 w-10 text-center border-r border-emerald-700">STT</th>
                      <th className="p-3 min-w-[200px] border-r border-emerald-700">Nhiệm vụ được giao (I, II, III, IV)</th>
                      <th className="p-3 w-28 border-r border-emerald-700">Tính chất</th>
                      <th className="p-3 min-w-[160px] border-r border-emerald-700">Sản phẩm / Chỉ tiêu</th>
                      <th className="p-3 min-w-[180px] border-r border-emerald-700">Công việc đã làm & Thời gian</th>
                      <th className="p-3 w-28 text-center border-r border-emerald-700">Mức độ thực hiện</th>
                      <th className="p-3 w-28 text-center border-r border-emerald-700">Chất lượng</th>
                      <th className="p-3 w-20 text-center border-r border-emerald-700">% HT</th>
                      <th className="p-3 min-w-[140px]">Minh chứng / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    {[
                      { key: 'I', title: 'I. Nhiệm vụ theo chương trình, kế hoạch công tác năm' },
                      { key: 'II', title: 'II. Nhiệm vụ chuyên môn thường xuyên' },
                      { key: 'III', title: 'III. Nhiệm vụ đột xuất, phát sinh' },
                      { key: 'IV', title: 'IV. Nhiệm vụ khác và kiêm nhiệm' }
                    ].map(cat => {
                      const catTasks = tasks.filter(t => (t.category || 'II') === cat.key);
                      return (
                        <React.Fragment key={cat.key}>
                          <tr className="bg-emerald-100/80 dark:bg-emerald-950/60 font-black text-emerald-900 dark:text-emerald-200 text-xs uppercase">
                            <td colSpan={9} className="p-2.5 border-y border-emerald-200 dark:border-emerald-800">
                              📌 {cat.title} ({catTasks.length} nhiệm vụ)
                            </td>
                          </tr>
                          {catTasks.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-2 text-center text-slate-400 italic">
                                Chưa có nhiệm vụ trong mục này
                              </td>
                            </tr>
                          ) : (
                            catTasks.map((t, idx) => (
                              <tr key={t.id} className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 transition">
                                <td className="p-2.5 text-center font-bold text-emerald-800 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-slate-950/30">
                                  {idx + 1}
                                </td>
                                <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold">
                                  {t.taskName}
                                </td>
                                <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                                    {t.taskNature || 'Thường xuyên'}
                                  </span>
                                </td>
                                <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                                  {t.assignedTarget}
                                </td>
                                <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-emerald-800 dark:text-emerald-300 font-medium">
                                  <div>{t.workDone || t.result || 'Đã hoàn thành'}</div>
                                  {t.executionTime && <div className="text-[10px] text-slate-500 font-mono">⏱️ {t.executionTime}</div>}
                                </td>
                                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] ${t.progress?.includes('Trước') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {t.progress || 'Đúng tiến độ'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] ${t.quality?.includes('cao') ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {t.quality || 'Đạt yêu cầu'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800">
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-black text-xs inline-block">
                                    {t.completionRate || 100}%
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  {t.evidenceLink ? (
                                    <a
                                      href={t.evidenceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                    >
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                      <span className="truncate max-w-[120px]">{t.evidenceLink}</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic">Đã đạt</span>
                                  )}
                                  {t.noteExplanation && t.noteExplanation !== 'Không có' && (
                                    <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 italic">
                                      💡 {t.noteExplanation}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Tasks Editable Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Chỉnh sửa chi tiết danh mục nhiệm vụ Tháng {selectedMonth}/{selectedYear}:</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportSampleTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs rounded-xl hover:bg-emerald-200 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nạp 4 nhiệm vụ Mẫu 01 chuẩn</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddTask}
                  className="flex items-center gap-1.5 px-3.5 py-2 btn-teacher text-white font-black text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm nhiệm vụ
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5 w-8 text-center">STT</th>
                    <th className="p-2.5 w-32">Danh mục I-IV</th>
                    <th className="p-2.5 min-w-[180px]">Nhiệm vụ được giao</th>
                    <th className="p-2.5 w-28">Tính chất</th>
                    <th className="p-2.5 min-w-[160px]">Sản phẩm / Chỉ tiêu giao</th>
                    <th className="p-2.5 min-w-[180px]">Công việc đã làm & Thời gian</th>
                    <th className="p-2.5 w-32 text-center">Mức độ thực hiện</th>
                    <th className="p-2.5 w-36 text-center">Chất lượng</th>
                    <th className="p-2.5 w-20 text-center">% HT</th>
                    <th className="p-2.5 min-w-[160px]">Kiến nghị / Giải trình</th>
                    <th className="p-2.5 min-w-[140px]">Minh chứng</th>
                    <th className="p-2.5 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tasks.map((task, idx) => (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-2 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        <select
                          value={task.category || 'II'}
                          onChange={(e) => handleTaskChange(task.id, 'category', e.target.value)}
                          className="w-full p-1.5 bg-emerald-50 dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="I">I. Kế hoạch năm</option>
                          <option value="II">II. Chuyên môn TX</option>
                          <option value="III">III. Đột xuất</option>
                          <option value="IV">IV. Nhiệm vụ khác</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={task.taskName}
                          onChange={(e) => handleTaskChange(task.id, 'taskName', e.target.value)}
                          placeholder="Nhập tên nhiệm vụ được giao..."
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={task.taskNature || 'Thường xuyên'}
                          onChange={(e) => handleTaskChange(task.id, 'taskNature', e.target.value)}
                          className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Chủ trì">Chủ trì</option>
                          <option value="Phối hợp">Phối hợp</option>
                          <option value="Thường xuyên">Thường xuyên</option>
                          <option value="Đột xuất">Đột xuất</option>
                          <option value="Kế hoạch năm">Kế hoạch năm</option>
                          <option value="Quan trọng">Quan trọng</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={task.assignedTarget}
                          onChange={(e) => handleTaskChange(task.id, 'assignedTarget', e.target.value)}
                          placeholder="Mô tả sản phẩm/chỉ tiêu giao..."
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 space-y-1">
                        <textarea
                          rows={2}
                          value={task.workDone || task.result || ''}
                          onChange={(e) => {
                            handleTaskChange(task.id, 'workDone', e.target.value);
                            handleTaskChange(task.id, 'result', e.target.value);
                          }}
                          placeholder="Công việc đã làm..."
                          className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Thời gian (VD: Cả tháng / Tuần 2)"
                          value={task.executionTime || ''}
                          onChange={(e) => handleTaskChange(task.id, 'executionTime', e.target.value)}
                          className="w-full p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-mono text-slate-700 dark:text-slate-300"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={task.progress || 'Đúng tiến độ'}
                          onChange={(e) => handleTaskChange(task.id, 'progress', e.target.value)}
                          className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Đúng tiến độ">Đúng tiến độ</option>
                          <option value="Trước tiến độ">Trước tiến độ</option>
                          <option value="Chậm tiến độ (có lý do)">Chậm tiến độ (có lý do)</option>
                          <option value="Chậm tiến độ (không lý do)">Chậm tiến độ (không lý do)</option>
                          <option value="Đang thực hiện">Đang thực hiện</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={task.quality || 'Đạt yêu cầu'}
                          onChange={(e) => handleTaskChange(task.id, 'quality', e.target.value)}
                          className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Đạt chất lượng cao / Vượt yêu cầu">Đạt cao / Vượt YC</option>
                          <option value="Đạt yêu cầu">Đạt yêu cầu</option>
                          <option value="Cần cải thiện">Cần cải thiện</option>
                          <option value="Chưa đạt yêu cầu">Chưa đạt YC</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={task.completionRate}
                          onChange={(e) => handleTaskChange(task.id, 'completionRate', Number(e.target.value))}
                          className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={task.noteExplanation || 'Không có'}
                          onChange={(e) => handleTaskChange(task.id, 'noteExplanation', e.target.value)}
                          className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Không có">Không có</option>
                          <option value="Đề xuất hỗ trợ trang thiết bị, phương tiện">Đề xuất trang thiết bị</option>
                          <option value="Đề xuất tăng cường nhân lực, phối hợp">Đề xuất nhân lực</option>
                          <option value="Giải trình do nguyên nhân khách quan">GT nguyên nhân khách quan</option>
                          <option value="Giải trình do phát sinh đột xuất">GT do phát sinh đột xuất</option>
                          <option value="Giải trình do thời gian gấp">GT do thời gian gấp</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="url"
                          placeholder="Link Drive..."
                          value={task.evidenceLink || ''}
                          onChange={(e) => handleTaskChange(task.id, 'evidenceLink', e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Summary textarea */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Đánh giá chung mức độ hoàn thành nhiệm vụ Mẫu 01
            </label>
            <textarea
              rows={3}
              value={overallSummary}
              onChange={(e) => setOverallSummary(e.target.value)}
              placeholder="Nhập nhận xét chung về việc thực hiện nhiệm vụ trong tháng..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* KHUNG XÁC NHẬN CHỮ KÝ 3 VỊ TRÍ (HIỆU TRƯỜNG - PHT/TTCM - CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ) */}
          <div className="bg-slate-100/90 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase flex items-center gap-2">
                  <span>✒️ Khung Xác Nhận Chữ Ký Cuối Phiếu Mẫu 01 (3 Vị Trí):</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Chọn tab <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded font-bold">Ký bằng chuột</code> để vẽ chữ ký trực tiếp hoặc <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded font-bold">Chèn chữ ký ảnh</code> từ máy tính/điện thoại.
                </p>
              </div>
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-3 py-1 rounded-full shrink-0">
                Xuất file Word / PDF
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Vị trí 1: HIỆU TRƯỜNG */}
              <SignatureBoxPad
                title="Hiệu trưởng"
                roleBadge="1. HIỆU TRƯỜNG"
                badgeBg="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                subtitle="(Ký, đóng dấu và ghi rõ họ tên)"
                nameValue={principalName}
                onNameChange={setPrincipalName}
                signatureValue={principalSignature}
                onSignatureChange={setPrincipalSignature}
                footerText="Phê duyệt của Thủ trưởng đơn vị"
                focusColor="focus:ring-amber-500"
              />

              {/* Vị trí 2: PHÓ HIỆU TRƯỜNG / TTCM */}
              <SignatureBoxPad
                title="PHT / Tổ trưởng"
                roleBadge="2. PHÓ HIỆU TRƯỜNG / TTCM"
                badgeBg="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300"
                subtitle="(Xác nhận & ký rõ họ tên)"
                nameValue={leaderName}
                onNameChange={setLeaderName}
                signatureValue={leaderSignature}
                onSignatureChange={setLeaderSignature}
                footerText="Thẩm định của Tổ trưởng chuyên môn"
                focusColor="focus:ring-blue-500"
              />

              {/* Vị trí 3: CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ */}
              <SignatureBoxPad
                title="Người tự đánh giá"
                roleBadge="3. CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ"
                badgeBg="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                subtitle="(Ký và ghi rõ họ tên)"
                nameValue={evaluatorName}
                onNameChange={setEvaluatorName}
                signatureValue={evaluatorSignature}
                onSignatureChange={setEvaluatorSignature}
                footerText="Cam kết tính trung thực Mẫu 01"
                focusColor="focus:ring-emerald-500"
              />

            </div>
          </div>

        </div>

        {/* Save & Navigation Action Bar at bottom of Trang 2 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-200/90 dark:bg-slate-800 p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-sm">
          <div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-100">
              Hoàn tất cập nhật hồ sơ Mẫu 01 của cán bộ: <span className="text-blue-700 dark:text-blue-300 font-black">{teacher.fullName}</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-0.5">
              Xác nhận nộp Mẫu 01 rồi chuyển tiếp sang Trang 3 để tính điểm thi đua ({isLeader ? 'Mẫu 02 cho CBQL' : 'Mẫu 03 cho Giáo viên/Nhân viên'}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-3 font-black text-xs rounded-xl shadow-lg transition cursor-pointer ${
                savedSuccess
                  ? 'btn-teacher ring-4 ring-blue-300 dark:ring-blue-800 text-white animate-pulse'
                  : 'btn-teacher text-white shadow-blue-700/30'
              } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Đang gửi sang Google Sheet...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>✅ ĐÃ LƯU MẪU 01 THÀNH CÔNG!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Mẫu 01</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNavigateToForm03}
              className={`flex items-center gap-2 px-6 py-3 font-black text-xs rounded-xl shadow-lg transition cursor-pointer text-white ${
                isLeader ? 'btn-principal' : 'btn-teacher'
              }`}
            >
              <span>{isLeader ? 'Chuyển sang tính điểm Mẫu 02 (CBQL)' : 'Chuyển sang tính điểm Mẫu 03 (GV, NV)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </form>

      {/* Modal Import CSV / Google Sheet */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Import dữ liệu Mẫu 01 từ Google Sheet
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sao chép các dòng trong file Google Sheet / Excel rồi dán trực tiếp vào ô bên dưới
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dán dữ liệu Google Sheet (Mỗi dòng một nhiệm vụ - các cột phân cách bởi phím Tab hoặc dấu phẩy):
                </label>
                <textarea
                  rows={8}
                  value={pastedCsvText}
                  onChange={(e) => setPastedCsvText(e.target.value)}
                  placeholder={`Mẫu dán từ Google Sheet:\n1\tGiảng dạy theo TKB\tĐảm bảo 100% tiết dạy\tHoàn thành\t100%\thttps://drive.google.com/...\n2\tBồi dưỡng HSG\t4 tiết/tuần\tĐã xong 16 tiết\t100%\thttps://drive.google.com/...`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200">
                <p className="font-bold mb-1">💡 Hướng dẫn copy từ Google Sheet:</p>
                <p>Mở Google Sheet Mẫu 01 ➔ Quét chọn các ô chứa bảng nhiệm vụ ➔ Bấm <code className="bg-blue-200 dark:bg-blue-900 px-1 rounded font-bold">Ctrl + C</code> ➔ Dán vào đây bằng <code className="bg-blue-200 dark:bg-blue-900 px-1 rounded font-bold">Ctrl + V</code>.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleParseCsvAndImport}
                  disabled={!pastedCsvText.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác Nhận Import Mẫu 01</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Data Before Sending to Google Sheet */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📋 Xem Nhanh Dữ Liệu Sắp Gửi Lên Google Sheet</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vui lòng kiểm tra lại thông tin trước khi phát lệnh ghi đè xuống Google Sheet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Mã Bản Ghi Mẫu</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                    BG01-{selectedYear}{String(selectedMonth).padStart(2, '0')}-{formatTeacherId(teacher.emulationCode || teacher.id)}-[STT]
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Kỳ Đánh Giá</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">
                    Tháng {selectedMonth}/{selectedYear}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Mã Thi Đua (TĐ)</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {formatTeacherId(teacher.emulationCode || teacher.id)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Họ và Tên Cán Bộ</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {fullName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Tổ Chuyên Môn</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {department}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Chức Vụ</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {position}
                  </span>
                </div>
              </div>

              {/* Tasks List Summary Table */}
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                  <span>Danh Sách Nhiệm Vụ / Công Việc ({tasks.length} mục):</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Chế độ: Ghi đè dòng cũ</span>
                </h4>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5 w-44 font-mono">Mã Bản Ghi (Cột A)</th>
                        <th className="p-2.5">Nội dung Công việc / Nhiệm vụ</th>
                        <th className="p-2.5 w-28">Mục tiêu</th>
                        <th className="p-2.5 w-20 text-center">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tasks.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            BG01-{selectedYear}{String(selectedMonth).padStart(2, '0')}-{formatTeacherId(teacher.emulationCode || teacher.id)}-{idx + 1}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">{t.taskName}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{t.assignedTarget || 'Hoàn thành 100%'}</td>
                          <td className="p-2.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                            {t.completionRate || 100}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200">
                <p className="font-bold">⚡ Cơ chế ghi đè Google Sheet:</p>
                <p>Google Apps Script sẽ tự động xóa sạch các dòng cũ của <strong>{formatTeacherId(teacher.emulationCode || teacher.id)}</strong> thuộc kỳ {selectedMonth}/{selectedYear} tại tab <code>Data_Mau01_CongViec_Thang</code> và chèn mới {tasks.length} dòng dữ liệu trên với Mã Bản Ghi chuẩn <code>BG01-[YYYYMM]-[MãTĐ]-[STT]</code>.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={executeSaveProfile}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>XÁC NHẬN GHI VÀO GOOGLE SHEET</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
