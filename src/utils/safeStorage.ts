/**
 * Utility for safe LocalStorage operations to prevent QuotaExceededError
 * and uncaught exceptions when browser storage limit is reached.
 */

import { Form03Evaluation, Form01Data } from '../types';

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`[SafeStorage] Warning: Failed to write to localStorage for key "${key}":`, error?.message || error);
    
    // Attempt emergency cleanup if quota exceeded
    try {
      if (error?.name === 'QuotaExceededError' || error?.code === 22 || String(error).includes('quota')) {
        // Remove heavy cached items if possible
        if (key !== 'nuocoa_evaluations') localStorage.removeItem('nuocoa_evaluations');
        if (key !== 'nuocoa_form01') localStorage.removeItem('nuocoa_form01');
        // Retry once
        localStorage.setItem(key, value);
        return true;
      }
    } catch {
      // Ignore fallback failure
    }
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Cannot read from localStorage for key "${key}":`, error);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Cannot remove item "${key}":`, error);
  }
}

/**
 * Strip heavy base64 data URLs from evaluations before saving to localStorage
 * to ensure we never hit the 5MB browser quota.
 * Full images remain safely stored in memory and in Firebase Firestore!
 */
export function sanitizeEvaluationsForCache(
  evaluations: Record<string, Form03Evaluation>
): Record<string, Form03Evaluation> {
  const result: Record<string, Form03Evaluation> = {};

  for (const [key, ev] of Object.entries(evaluations)) {
    if (!ev) continue;

    // Check if signatures are large base64 strings
    const hasLargeTeacherSig = ev.teacherSignatureImg && ev.teacherSignatureImg.length > 200;
    const hasLargePrincipalSig = ev.principalSignatureImg && ev.principalSignatureImg.length > 200;

    if (hasLargeTeacherSig || hasLargePrincipalSig) {
      result[key] = {
        ...ev,
        teacherSignatureImg: hasLargeTeacherSig ? undefined : ev.teacherSignatureImg,
        principalSignatureImg: hasLargePrincipalSig ? undefined : ev.principalSignatureImg
      };
    } else {
      result[key] = ev;
    }
  }

  return result;
}

/**
 * Strip heavy base64 data URLs from Form 01 before caching to localStorage.
 */
export function sanitizeForm01ForCache(
  form01Data: Record<string, Form01Data>
): Record<string, Form01Data> {
  const result: Record<string, Form01Data> = {};

  for (const [key, f01] of Object.entries(form01Data)) {
    if (!f01) continue;

    const hasLargeEvalSig = f01.evaluatorSignature && f01.evaluatorSignature.length > 200;
    const hasLargeLeaderSig = f01.leaderSignature && f01.leaderSignature.length > 200;
    const hasLargePrincipalSig = f01.principalSignature && f01.principalSignature.length > 200;

    if (hasLargeEvalSig || hasLargeLeaderSig || hasLargePrincipalSig) {
      result[key] = {
        ...f01,
        evaluatorSignature: hasLargeEvalSig ? undefined : f01.evaluatorSignature,
        leaderSignature: hasLargeLeaderSig ? undefined : f01.leaderSignature,
        principalSignature: hasLargePrincipalSig ? undefined : f01.principalSignature
      };
    } else {
      result[key] = f01;
    }
  }

  return result;
}
