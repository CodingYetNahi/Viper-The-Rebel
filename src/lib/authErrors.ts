export type AuthRequestState = 'idle' | 'pending';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/unauthorized-domain': 'Google Sign-In is not available on this website. The site administrator must authorize this domain in Firebase.',
  'auth/operation-not-allowed': 'Google Sign-In is not enabled. The site administrator must enable the Google provider in Firebase.',
  'auth/api-key-not-valid': 'Google Sign-In is temporarily unavailable because the app configuration is invalid.',
  'auth/popup-blocked': 'Your browser blocked the Google Sign-In window. Allow popups for this site and try again.',
  'auth/popup-closed-by-user': 'The Google Sign-In window was closed before sign-in finished. You can try again whenever you are ready.',
  'auth/cancelled-popup-request': 'A Google Sign-In request is already in progress. Please finish it or try again.',
  'auth/network-request-failed': 'Google Sign-In could not reach the network. Check your connection and try again.',
};

export function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);
  return (code && AUTH_ERROR_MESSAGES[code])
    || 'Google Sign-In failed. You can keep playing as a guest and try again later.';
}

export function reduceAuthRequestState(state: AuthRequestState, action: 'start' | 'finish'): AuthRequestState {
  if (action === 'start') return state === 'idle' ? 'pending' : state;
  return 'idle';
}
