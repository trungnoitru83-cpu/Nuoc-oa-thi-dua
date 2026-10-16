import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDocs,
  query
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Teacher, Form01Data, Form03Evaluation, EntryStatusData } from '../types';
import { formatTeacherId } from '../utils/formatTeacherId';

// Collection references
const TEACHERS_COL = 'teachers';
const FORM01_COL = 'form01';
const EVALUATIONS_COL = 'evaluations';
const ENTRY_STATUS_COL = 'entry_status';

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
 * Save single Evaluation entry
 */
export async function saveEvaluationToFirestore(docKey: string, data: Form03Evaluation) {
  try {
    const cleanData = sanitizeForFirestore({ ...data, docKey });
    await setDoc(doc(db, EVALUATIONS_COL, docKey), cleanData, { merge: true });
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
