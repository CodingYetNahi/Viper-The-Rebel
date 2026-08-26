import assert from 'node:assert/strict';
import { getAuthErrorMessage, getFirebaseAuthErrorCode, reduceAuthRequestState } from './authErrors.ts';

const expectedMessages: Record<string, RegExp> = {
  'auth/unauthorized-domain': /authorize this domain/i,
  'auth/operation-not-allowed': /enable the Google provider/i,
  'auth/api-key-not-valid': /configuration is invalid/i,
  'auth/popup-blocked': /allow popups/i,
  'auth/popup-closed-by-user': /closed before sign-in finished/i,
  'auth/cancelled-popup-request': /already in progress/i,
  'auth/network-request-failed': /check your connection/i,
};

for (const [code, text] of Object.entries(expectedMessages)) {
  const error = { code, message: 'sensitive provider detail must not be displayed' };
  assert.match(getAuthErrorMessage(error), text);
  assert.doesNotMatch(getAuthErrorMessage(error), /sensitive provider detail/);
  assert.equal(getFirebaseAuthErrorCode(error), code);
}

assert.match(getAuthErrorMessage(new Error('secret-looking internal detail')), /keep playing as a guest/i);
assert.equal(reduceAuthRequestState('idle', 'start'), 'pending');
assert.equal(reduceAuthRequestState('pending', 'start'), 'pending');
assert.equal(reduceAuthRequestState('pending', 'finish'), 'idle');

console.log('Authentication error mapping and request state tests passed.');
