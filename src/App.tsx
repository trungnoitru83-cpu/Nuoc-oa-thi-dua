import React, { useState, useEffect } from 'react';
import { Teacher, Form01Data, Form03Evaluation, Role, EntryStatusData } from './types';
import { INITIAL_TEACHERS, createDefaultForm01, createDefaultEvaluation } from './data/mockTeachers';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { TeacherProfilePage } from './components/TeacherProfilePage';
import { Form03Page } from './components/Form03Page';
import { SummaryTablePage } from './components/SummaryTablePage';
import { ManageTeachersModal } from './components/ManageTeachersModal';
import { PrintReportView } from './components/PrintReportView';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { ThemeConfig, getSavedTheme, applyThemeToDocument } from './lib/theme';
import {
  syncInitialDataToFirestore,
  listenToTeachers,
  listenToForm01,
  listenToEvaluations,
  listenToEntryStatuses,
  saveTeacherToFirestore,
  saveForm01ToFirestore,
  saveEvaluationToFirestore,
  saveEntryStatusToFirestore
} from './lib/firebaseService';
import {
  saveEvaluationToGoogleSheet
} from './lib/googleSheetService';
export default function App() {
  // Theme State
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => getSavedTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Application State
  const [activeTab, setActiveTab] = useState<'login' | 'profile' | 'evaluation' | 'summary'>('login');
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // Default Month 6/2026
  const [selectedYear, setSelectedYear] = useState<number>(2026); // Default Year 2026 per sheet
  const [currentRole, setCurrentRole] = useState<Role>('teacher');

  // Apply theme effect on load and change
  useEffect(() => {
    applyThemeToDocument(themeConfig);
  }, [themeConfig]);

  const handleThemeChange = (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    applyThemeToDocument(newTheme);
  };

  const handleToggleDarkMode = () => {
    const nextMode = themeConfig.mode === 'dark' ? 'light' : 'dark';
    handleThemeChange({ ...themeConfig, mode: nextMode });
  };

  // Teachers State (defaults to 36 teachers list)
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('nuocoa_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  // Current Logged-In Teacher (defaults to null for secure login)
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);

  // Selected Teacher for Evaluation
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(() => {
    return teachers[0] || INITIAL_TEACHERS[0];
  });

  // Form01 State (teacherId_yYear_mMonth -> Form01Data)
  const [form01Data, setForm01Data] = useState<Record<string, Form01Data>>(() => {
    const saved = localStorage.getItem('nuocoa_form01');
    if (saved) return JSON.parse(saved);
    
    // Populate default Mẫu 01 for 34 teachers
    const initial: Record<string, Form01Data> = {};
    INITIAL_TEACHERS.forEach(t => {
      [4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(m => {
        initial[`${t.id}_y2026_m${m}`] = createDefaultForm01(t.id, m);
      });
    });
    return initial;
  });

  // Form03 State (teacherId_yYear_mMonth -> Form03Evaluation)
  const [evaluations, setEvaluations] = useState<Record<string, Form03Evaluation>>(() => {
    const saved = localStorage.getItem('nuocoa_evaluations');
    if (saved) return JSON.parse(saved);

    // Populate default Mẫu 03 evaluations for all 34 teachers
    const initial: Record<string, Form03Evaluation> = {};
    INITIAL_TEACHERS.forEach((t, i) => {
      [4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(m => {
        initial[`${t.id}_y2026_m${m}`] = createDefaultEvaluation(t.id, m, 2026, i);
      });
    });
    return initial;
  });

  // Entry Status State (yYear_mMonth -> EntryStatusData)
  const [entryStatuses, setEntryStatuses] = useState<Record<string, EntryStatusData>>(() => {
    const saved = localStorage.getItem('nuocoa_entry_statuses');
    return saved ? JSON.parse(saved) : {};
  });

  // Modals
  const [manageModalConfig, setManageModalConfig] = useState<{
    isOpen: boolean;
    initialAddAdmin: boolean;
  }>({
    isOpen: false,
    initialAddAdmin: false
  });
  const [printModalConfig, setPrintModalConfig] = useState<{
    isOpen: boolean;
    type: 'form01' | 'form03' | 'summary';
    teacherId?: string;
  }>({
    isOpen: false,
    type: 'summary'
  });

  // Firebase Firestore Setup and Listeners
  useEffect(() => {
    // Reconcile INITIAL_TEACHERS with local state
    setTeachers(prev => {
      const map = new Map<string, Teacher>(prev.map(t => [t.emulationCode || t.id, t]));
      let changed = false;
      const list: Teacher[] = [];

      INITIAL_TEACHERS.forEach(initT => {
        const key = initT.emulationCode || initT.id;
        if (!map.has(key)) {
          list.push(initT);
          changed = true;
        } else {
          const current = map.get(key)!;
          // Update official name, email, and position if changed in INITIAL_TEACHERS
          const nameChanged = current.fullName !== initT.fullName && !current.fullName.includes('Mới');
          const emailChanged = current.email !== initT.email;
          const posChanged = current.position !== initT.position;
          if (nameChanged || emailChanged || posChanged) {
            list.push({
              ...current,
              fullName: nameChanged ? initT.fullName : current.fullName,
              email: initT.email,
              position: initT.position
            });
            changed = true;
          } else {
            list.push(current);
          }
          map.delete(key);
        }
      });

      // Keep custom user-created teachers
      map.forEach(customT => list.push(customT));

      if (changed || list.length !== prev.length) {
        localStorage.setItem('nuocoa_teachers', JSON.stringify(list));
        return list;
      }
      return prev;
    });

    // 1. Seed initial data to Firestore
    syncInitialDataToFirestore(INITIAL_TEACHERS, form01Data, evaluations);

    // 2. Real-time subscriber for Teachers
    const unsubTeachers = listenToTeachers((remoteTeachers) => {
      if (remoteTeachers.length >= INITIAL_TEACHERS.length) {
        setTeachers(remoteTeachers);
      }
    });

    // 3. Real-time subscriber for Form 01
    const unsubForm01 = listenToForm01((remoteForm01) => {
      if (Object.keys(remoteForm01).length > 0) {
        setForm01Data(prev => ({ ...prev, ...remoteForm01 }));
      }
    });

    // 4. Real-time subscriber for Evaluations
    const unsubEvals = listenToEvaluations((remoteEvals) => {
      if (Object.keys(remoteEvals).length > 0) {
        setEvaluations(prev => ({ ...prev, ...remoteEvals }));
      }
    });

    // 5. Real-time subscriber for Entry Statuses (Báo đã nhập)
    const unsubEntryStatus = listenToEntryStatuses((remoteStatuses) => {
      if (Object.keys(remoteStatuses).length > 0) {
        setEntryStatuses(prev => ({ ...prev, ...remoteStatuses }));
      }
    });

    return () => {
      unsubTeachers();
      unsubForm01();
      unsubEvals();
      unsubEntryStatus();
    };
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('nuocoa_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('nuocoa_form01', JSON.stringify(form01Data));
  }, [form01Data]);

  useEffect(() => {
    localStorage.setItem('nuocoa_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem('nuocoa_entry_statuses', JSON.stringify(entryStatuses));
  }, [entryStatuses]);

  // Handle Mark Entry Status ("Báo đã nhập")
  const handleMarkEntryStatus = (month: number, year: number, isEntered: boolean) => {
    const key = `y${year}_m${month}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toLocaleTimeString('vi-VN');
    const timestamp = `${dateStr} ${timeStr}`;

    const newStatus: EntryStatusData = {
      month,
      year,
      isEntered,
      enteredAt: timestamp,
      enteredBy: currentUser?.fullName || currentUser?.email || 'Quản trị viên'
    };

    setEntryStatuses(prev => ({
      ...prev,
      [key]: newStatus
    }));

    saveEntryStatusToFirestore(key, newStatus);
  };

  // Login Handlers
  const handleLogin = (teacher: Teacher, role: Role) => {
    setCurrentUser(teacher);
    setSelectedTeacher(teacher);
    setCurrentRole(role);
    setActiveTab('profile');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('login');
  };

  // Teacher Profile Updates
  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    if (currentUser?.id === updatedTeacher.id) {
      setCurrentUser(updatedTeacher);
    }
    if (selectedTeacher?.id === updatedTeacher.id) {
      setSelectedTeacher(updatedTeacher);
    }
    saveTeacherToFirestore(updatedTeacher);
  };

  // Form01 Updates
  const handleUpdateForm01 = (updatedForm01: Form01Data) => {
    const key = `${updatedForm01.teacherId}_y${selectedYear}_m${updatedForm01.month}`;
    setForm01Data(prev => ({
      ...prev,
      [key]: updatedForm01
    }));
    saveForm01ToFirestore(key, updatedForm01);
  };

  // Form03 Evaluation Updates
  const handleSaveEvaluation = async (
    evalData: Form03Evaluation
  ) => {

    const key =
      `${evalData.teacherId}_y${selectedYear}_m${evalData.month}`;

    // 1. Lưu vào Firebase như hiện tại
    setEvaluations(prev => ({
      ...prev,
      [key]: evalData
    }));

    await saveEvaluationToFirestore(
      key,
      evalData
    );

    // 2. Đồng thời lưu vào Google Sheet
    const targetTeacher = teachers.find(t => t.id === evalData.teacherId) || selectedTeacher || currentUser;
    if (targetTeacher || currentUser) {
      const result = await saveEvaluationToGoogleSheet(
        targetTeacher || currentUser!,
        evalData,
        selectedMonth,
        selectedYear,
        currentUser
      );

      if (!result.success) {
        console.error('Không lưu được Google Sheet:', result.message);
      } else {
        console.log('Đã lưu Google Sheet thành công cho teacherId:', result.maChamDiem);
      }
    }
  };

  // Manage Teachers Handlers
  const handleAddTeacher = (newTeacher: Teacher) => {
    setTeachers(prev => [...prev, newTeacher]);
    saveTeacherToFirestore(newTeacher);

    // Create default Mẫu 01 and Mẫu 03/02 for all active months (4..12) in selectedYear
    const activeMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12];
    const newForm01Updates: Record<string, Form01Data> = {};
    const newEvalUpdates: Record<string, Form03Evaluation> = {};

    activeMonths.forEach(m => {
      const key01 = `${newTeacher.id}_y${selectedYear}_m${m}`;
      const key03 = `${newTeacher.id}_y${selectedYear}_m${m}`;
      const defaultF01 = createDefaultForm01(newTeacher.id, m);
      const defaultF03 = createDefaultEvaluation(newTeacher.id, m, selectedYear);

      newForm01Updates[key01] = defaultF01;
      newEvalUpdates[key03] = defaultF03;

      saveForm01ToFirestore(key01, defaultF01);
      saveEvaluationToFirestore(key03, defaultF03);
    });

    setForm01Data(prev => ({ ...prev, ...newForm01Updates }));
    setEvaluations(prev => ({ ...prev, ...newEvalUpdates }));
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
  };

  // Active Form01 and Form03 for currently selected teacher
  const currentKey = `${selectedTeacher.id}_y${selectedYear}_m${selectedMonth}`;
  const currentForm01 = form01Data[currentKey] || form01Data[`${selectedTeacher.id}_m${selectedMonth}`] || createDefaultForm01(selectedTeacher.id, selectedMonth);
  const currentEvaluation = evaluations[currentKey] || evaluations[`${selectedTeacher.id}_m${selectedMonth}`] || createDefaultEvaluation(selectedTeacher.id, selectedMonth, selectedYear);

  // Map of evaluations for summary table
  const summaryEvaluationsMap: Record<string, Form03Evaluation> = {};
  teachers.forEach(t => {
    const k = `${t.id}_y${selectedYear}_m${selectedMonth}`;
    summaryEvaluationsMap[t.id] = evaluations[k] || evaluations[`${t.id}_m${selectedMonth}`] || createDefaultEvaluation(t.id, selectedMonth, selectedYear);
  });

  // Map of Form 01 for summary table
  const summaryForm01Map: Record<string, Form01Data> = {};
  teachers.forEach(t => {
    const k = `${t.id}_y${selectedYear}_m${selectedMonth}`;
    summaryForm01Map[t.id] = form01Data[k] || form01Data[`${t.id}_m${selectedMonth}`] || createDefaultForm01(t.id, selectedMonth);
  });

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        currentRole={currentRole}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onLogout={handleLogout}
        teacherCount={teachers.length}
        themeConfig={themeConfig}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Page View Router */}
      <main className="flex-1">
        {(!currentUser || activeTab === 'login') && (
          <LoginPage
            teachers={teachers}
            onLogin={handleLogin}
            onSelectTeacherForDemo={(teacher, role) => {
              handleLogin(teacher, role);
            }}
          />
        )}

        {currentUser && activeTab === 'profile' && (
          <TeacherProfilePage
            currentUser={currentUser}
            teachers={teachers}
            teacher={selectedTeacher}
            form01={currentForm01}
            evaluation={currentEvaluation}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            currentRole={currentRole}
            onSelectTeacher={(t) => setSelectedTeacher(t)}
            onUpdateTeacher={handleUpdateTeacher}
            onUpdateForm01={handleUpdateForm01}
            onNavigateToForm03={() => setActiveTab('evaluation')}
            onNavigateToSummary={() => setActiveTab('summary')}
          />
        )}

        {currentUser && activeTab === 'evaluation' && (
          <Form03Page
            currentUser={currentUser}
            teachers={teachers}
            currentTeacher={selectedTeacher}
            onSelectTeacher={(t) => setSelectedTeacher(t)}
            evaluation={currentEvaluation}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            currentRole={currentRole}
            onSaveEvaluation={handleSaveEvaluation}
            onOpenPrintModal={(type, teacherId) => {
              setPrintModalConfig({
                isOpen: true,
                type,
                teacherId
              });
            }}
            onNavigateToSummary={() => setActiveTab('summary')}
          />
        )}

        {currentUser && activeTab === 'summary' && (
          <SummaryTablePage
            currentUser={currentUser}
            currentRole={currentRole}
            teachers={teachers}
            evaluations={summaryEvaluationsMap}
            form01DataMap={summaryForm01Map}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            entryStatus={entryStatuses[`y${selectedYear}_m${selectedMonth}`]}
            onMarkEntryStatus={handleMarkEntryStatus}
            onSelectTeacherForView={(t, tab) => {
              setSelectedTeacher(t);
              setActiveTab(tab);
            }}
            onOpenManageTeachersModal={(addAdmin) => setManageModalConfig({ isOpen: true, initialAddAdmin: Boolean(addAdmin) })}
            onOpenPrintModal={(type, teacherId) => {
              setPrintModalConfig({
                isOpen: true,
                type,
                teacherId
              });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Hệ thống Quản lý & Chấm điểm Thi đua Giáo viên hàng tháng — Trường PTDTNT THCS và THPT Nước Oa
          </p>
          <p className="text-[11px] text-slate-400">
            Bản quyền © {selectedYear}. Chuẩn Mẫu 01, Mẫu 03 & Bảng tổng hợp thi đua ngành Giáo dục.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ManageTeachersModal
        isOpen={manageModalConfig.isOpen}
        initialAddAdmin={manageModalConfig.initialAddAdmin}
        onClose={() => setManageModalConfig({ isOpen: false, initialAddAdmin: false })}
        teachers={teachers}
        onAddTeacher={handleAddTeacher}
        onUpdateTeacher={handleUpdateTeacher}
        onDeleteTeacher={handleDeleteTeacher}
      />

      <PrintReportView
        type={printModalConfig.type}
        isOpen={printModalConfig.isOpen}
        onClose={() => setPrintModalConfig({ ...printModalConfig, isOpen: false })}
        teachers={teachers}
        currentTeacher={teachers.find(t => t.id === printModalConfig.teacherId) || selectedTeacher}
        form01={currentForm01}
        evaluation={currentEvaluation}
        evaluations={summaryEvaluationsMap}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={themeConfig}
        onThemeChange={handleThemeChange}
      />

    </div>
  );
}
