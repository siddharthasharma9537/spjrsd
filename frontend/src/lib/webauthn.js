import { startRegistration, startAuthentication, browserSupportsWebAuthn, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser';
import api from '@/lib/api';

export { browserSupportsWebAuthn, platformAuthenticatorIsAvailable };

// Registers a new passkey for the signed-in devotee, backed by the device's
// biometric/screen-lock authenticator (Face ID/Touch ID on iOS, fingerprint
// or screen lock via Android's platform authenticator).
export async function registerPasskey(deviceName) {
  const { data: optionsJSON } = await api.post('/auth/webauthn/register/options');
  const registrationResponse = await startRegistration({ optionsJSON });
  await api.post('/auth/webauthn/register/verify', {
    credential: registrationResponse,
    device_name: deviceName || guessDeviceName(),
  });
}

export async function listPasskeys() {
  const { data } = await api.get('/auth/webauthn/credentials');
  return data;
}

export async function deletePasskey(credentialId) {
  await api.delete(`/auth/webauthn/credentials/${encodeURIComponent(credentialId)}`);
}

// Signs in with a passkey. If `identifier` is given, only that devotee's
// passkeys are offered; otherwise this is a fully usernameless/discoverable
// sign-in and the OS shows whichever passkeys it has for this site.
export async function loginWithPasskey(identifier) {
  const { data } = await api.post('/auth/webauthn/login/options', { identifier: identifier || null });
  const authenticationResponse = await startAuthentication({ optionsJSON: data.options });
  const res = await api.post('/auth/webauthn/login/verify', {
    challenge_id: data.challenge_id,
    credential: authenticationResponse,
  });
  return res.data; // { token, devotee }
}

function guessDeviceName() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad/.test(ua)) return 'iPhone/iPad';
  if (/Android/.test(ua)) return 'Android device';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  return 'This device';
}
