import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDocs,
  query,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  Teacher, 
  Role,
  Form01Data, 
  Form03Evaluation, 
  EntryStatusData,
  EvaluationAuditLog,
  SystemBackup,
  SystemSetting
} from '../types';
import { formatTeacherId, buildEvaluationId } from '../utils/formatTeacherId';

// Collection references matching Section III & VI
const TEACHERS_COL = 'teachers';
const FORM01_COL = 'form01';
const EVALUATIONS_COL = 'evaluations';
const ENTRY_STATUS_COL = 'entry_status';
const EVALUATION_HISTORY_COL = 'evaluation_history';
const SYSTEM_BACKUPS_COL = 'system_backups';
const SYSTEM_SETTINGS_COL = 'system_settings';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

// Helper to clean undefined values before sending to Firestore
function sanitizeForFirestore<T>(data: T): any {
  return JSON.parse(JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  }));
}

/**
 * Seed initial teachers, Mẫu 01, Mẫu 03 into Firestore if collection is empty
 */
export async function syncInitialDataToFirestore(
  initialTeachers: Teacher[],
  initialForm01: Record<string, Form01Data>,
  initialEvaluations: Record<string, Form03Evaluation>
) {
  try {
    const teachersSnap = await getDocs(collection(db, TEACHERS_COL));
    const existingIds = new Set(teachersSnap.docs.map(d => d.id));
    for (const teacher of initialTeachers) {
      if (!existingIds.has(teacher.id)) {
        const cleanTeacher = {
          ...teacher,
          emulationCode: formatTeacherId(teacher.emulationCode || teacher.id)
        };
        await setDoc(doc(db, TEACHERS_COL, teacher.id), sanitizeForFirestore(cleanTeacher), { merge: true });
      }
    }

    const form01Snap = await getDocs(collection(db, FORM01_COL));
    if (form01Snap.empty) {
      console.log('Seeding initial Form 01 data to Firestore...');
      for (const [key, data] of Object.entries(initialForm01)) {
        await setDoc(doc(db, FORM01_COL, key), sanitizeForFirestore({ ...data, docKey: key }));
      }
    }

    const evalSnap = await getDocs(collection(db, EVALUATIONS_COL));
    if (evalSnap.empty) {
      console.log('Seeding initial Evaluations data to Firestore...');
      for (const [key, data] of Object.entries(initialEvaluations)) {
        await setDoc(doc(db, EVALUATIONS_COL, key), sanitizeForFirestore({ ...data, docKey: key }));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, TEACHERS_COL);
    console.warn('Error seeding initial data to Firestore (using local fallback state)');
  }
}

/**
 * Listen to real-time changes for Teachers
 */
export function listenToTeachers(onData: (teachers: Teacher[]) => void) {
  return onSnapshot(
    query(collection(db, TEACHERS_COL)),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Teacher[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data() as Teacher;
          list.push({
            ...raw,
            emulationCode: formatTeacherId(raw.emulationCode || raw.id)
          });
        });
        onData(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, TEACHERS_COL);
    }
  );
}

/**
 * Listen to real-time changes for Form 01
 */
export function listenToForm01(onData: (form01Map: Record<string, Form01Data>) => void) {
  return onSnapshot(
    query(collection(db, FORM01_COL)),
    (snapshot) => {
      if (!snapshot.empty) {
        const map: Record<string, Form01Data> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const key = data.docKey || docSnap.id;
          const { docKey, ...cleanData } = data;
          map[key] = cleanData as Form01Data;
        });
        onData(map);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, FORM01_COL);
    }
  );
}

/**
 * Listen to real-time changes for Form 03 Evaluations
 */
export function listenToEvaluations(onData: (evalMap: Record<string, Form03Evaluation>) => void) {
  return onSnapshot(
    query(collection(db, EVALUATIONS_COL)),
    (snapshot) => {
      if (!snapshot.empty) {
        const map: Record<string, Form03Evaluation> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const key = data.docKey || docSnap.id;
          const { docKey, ...cleanData } = data;
          map[key] = cleanData as Form03Evaluation;
        });
        onData(map);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, EVALUATIONS_COL);
    }
  );
}

/**
 * Save single Teacher
 */
export async function saveTeacherToFirestore(teacher: Teacher) {
  try {
    const cleanTeacher = {
      ...teacher,
      emulationCode: formatTeacherId(teacher.emulationCode || teacher.id)
    };
    const cleanData = sanitizeForFirestore(cleanTeacher);
    await setDoc(doc(db, TEACHERS_COL, teacher.id), cleanData, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TEACHERS_COL}/${teacher.id}`);
    return { success: false, error };
  }
}

/**
 * Save single Form 01 entry
 */
export async function saveForm01ToFirestore(docKey: string, data: Form01Data) {
  try {
    const cleanData = sanitizeForFirestore({ ...data, docKey });
    await setDoc(doc(db, FORM01_COL, docKey), cleanData, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${FORM01_COL}/${docKey}`);
    return { success: false, error };
  }
}

/**
 * Save single Evaluation entry with full criteria breakdown and audit history logging
 */
export async function saveEvaluationToFirestore(
  docKey: string, 
  data: Form03Evaluation,
  auditInfo?: {
    actorName?: string;
    actorRole?: Role;
    actorEmail?: string;
    reason?: string;
    actionType?: 'create' | 'self_score' | 'leader_review' | 'approve' | 'reject' | 'edit_score' | 'lock' | 'unlock';
    teacherName?: string;
    oldScore?: number;
    oldStatus?: string;
  }
) {
  try {
    const evalId = data.evaluationId || docKey;
    const cleanData = sanitizeForFirestore({ 
      ...data, 
      docKey,
      evaluationId: evalId,
      version: (data.version || 1) + 1,
      updatedAt: data.updatedAt || new Date().toISOString()
    });

    // 1. Save main document to evaluations collection
    await setDoc(doc(db, EVALUATIONS_COL, docKey), cleanData, { merge: true });

    // 2. Also save criteriaScores subcollection for granular query capability (Section III)
    if (data.scores && typeof data.scores === 'object') {
      const criteriaEntries = Object.entries(data.scores);
      const subPromises = criteriaEntries.map(([critId, cScore]) => {
        const subDoc = doc(db, EVALUATIONS_COL, docKey, 'criteriaScores', critId);
        return setDoc(subDoc, sanitizeForFirestore({ ...cScore, criteriaId: critId }), { merge: true });
      });
      await Promise.allSettled(subPromises);
    }

    // 3. Log audit record into evaluation_history (Section VI)
    if (auditInfo) {
      const historyId = `hist_${docKey}_${Date.now()}`;
      const logEntry: EvaluationAuditLog = {
        id: historyId,
        evaluationId: evalId,
        teacherId: data.teacherId,
        teacherName: auditInfo.teacherName || data.teacherId,
        month: data.month,
        year: data.year,
        timestamp: new Date().toISOString(),
        actorName: auditInfo.actorName || 'Hệ thống',
        actorRole: (auditInfo.actorRole as any) || 'teacher',
        actorEmail: auditInfo.actorEmail || auth.currentUser?.email || undefined,
        actionType: auditInfo.actionType || (data.status === 'approved' ? 'approve' : 'self_score'),
        oldGrandTotal: auditInfo.oldScore,
        newGrandTotal: data.grandTotal_Principal || data.grandTotal_Teacher,
        oldStatus: auditInfo.oldStatus,
        newStatus: data.status,
        reason: auditInfo.reason || (data.status === 'approved' ? 'Hiệu trưởng phê duyệt điểm' : 'Giáo viên cập nhật tự chấm'),
        snapshotSummary: `Tổng điểm: GV ${data.grandTotal_Teacher}đ | HT ${data.grandTotal_Principal}đ (${data.principalClassification || data.teacherClassification})`
      };
      await setDoc(doc(db, EVALUATION_HISTORY_COL, historyId), sanitizeForFirestore(logEntry));
    }

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${EVALUATIONS_COL}/${docKey}`);
    return { success: false, error };
  }
}

/**
 * Listen to real-time changes for Entry Statuses (Báo đã nhập)
 */
export function listenToEntryStatuses(onData: (statusMap: Record<string, EntryStatusData>) => void) {
  return onSnapshot(
    query(collection(db, ENTRY_STATUS_COL)),
    (snapshot) => {
      if (!snapshot.empty) {
        const map: Record<string, EntryStatusData> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const key = data.docKey || docSnap.id;
          const { docKey, ...cleanData } = data;
          map[key] = cleanData as EntryStatusData;
        });
        onData(map);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, ENTRY_STATUS_COL);
    }
  );
}

/**
 * Save single Entry Status (Báo đã nhập)
 */
export async function saveEntryStatusToFirestore(docKey: string, data: EntryStatusData) {
  try {
    const cleanData = sanitizeForFirestore({ ...data, docKey });
    await setDoc(doc(db, ENTRY_STATUS_COL, docKey), cleanData, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ENTRY_STATUS_COL}/${docKey}`);
    return { success: false, error };
  }
}

/**
 * Listen to Audit History logs (Lịch sử chỉnh sửa điểm - Section VI)
 */
export function listenToEvaluationHistory(
  onData: (logs: EvaluationAuditLog[]) => void,
  filterTeacherId?: string
) {
  return onSnapshot(
    query(collection(db, EVALUATION_HISTORY_COL)),
    (snapshot) => {
      const list: EvaluationAuditLog[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as EvaluationAuditLog;
        if (!filterTeacherId || item.teacherId === filterTeacherId) {
          list.push(item);
        }
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, EVALUATION_HISTORY_COL);
    }
  );
}

/**
 * Save System Backup (Sao lưu hệ thống - Section VII)
 */
export async function saveSystemBackupToFirestore(backup: SystemBackup) {
  try {
    const cleanBackup = sanitizeForFirestore(backup);
    await setDoc(doc(db, SYSTEM_BACKUPS_COL, backup.id), cleanBackup);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SYSTEM_BACKUPS_COL}/${backup.id}`);
    return { success: false, error };
  }
}

/**
 * Listen to System Backups list
 */
export function listenToSystemBackups(onData: (backups: SystemBackup[]) => void) {
  return onSnapshot(
    query(collection(db, SYSTEM_BACKUPS_COL)),
    (snapshot) => {
      const list: SystemBackup[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as SystemBackup);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, SYSTEM_BACKUPS_COL);
    }
  );
}

/**
 * Save system setting (e.g. locked periods)
 */
export async function saveSystemSettingToFirestore(settingKey: string, data: any) {
  try {
    await setDoc(doc(db, SYSTEM_SETTINGS_COL, settingKey), sanitizeForFirestore(data), { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SYSTEM_SETTINGS_COL}/${settingKey}`);
    return { success: false, error };
  }
}

/**
 * Listen to system settings (e.g. period lock status)
 */
export function listenToSystemSettings(onData: (settings: Record<string, any>) => void) {
  return onSnapshot(
    query(collection(db, SYSTEM_SETTINGS_COL)),
    (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      onData(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, SYSTEM_SETTINGS_COL);
    }
  );
}

