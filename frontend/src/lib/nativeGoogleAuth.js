import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

// Same OAuth 2.0 Web Client ID used by the browser Google Identity Services
// button (GoogleAuthButton.jsx) and verified server-side as GOOGLE_CLIENT_ID
// in backend/app/main.py. Reused here as `webClientId`/`iOSServerClientId` so
// the ID token this returns has the same `aud` claim either way - the
// backend's /api/auth/devotee/google endpoint needs no native-specific code.
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
// A separate "iOS" (not "Web") OAuth client, required by Google's iOS SDK
// itself to drive the native sign-in sheet. Only needed on iOS - see
// MOBILE_APP_SETUP.md.
const GOOGLE_IOS_CLIENT_ID = process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID;

let initPromise = null;
function ensureInitialized() {
  if (!initPromise) {
    initPromise = SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_CLIENT_ID,
        iOSClientId: GOOGLE_IOS_CLIENT_ID,
        iOSServerClientId: GOOGLE_CLIENT_ID,
        mode: 'online',
      },
    });
  }
  return initPromise;
}

// True only inside the native Android/iOS app, and only once the required
// client ID(s) are configured - mirrors GoogleAuthButton's own "render
// nothing until configured" rule for the web button.
export function nativeGoogleAuthAvailable() {
  if (!Capacitor.isNativePlatform() || !GOOGLE_CLIENT_ID) return false;
  if (Capacitor.getPlatform() === 'ios' && !GOOGLE_IOS_CLIENT_ID) return false;
  return true;
}

// Drives the OS-native Google sign-in sheet (Android Credential Manager /
// iOS GoogleSignIn SDK) and returns a Google ID token - the same shape as
// the credential the web Google Identity Services button hands to
// `onCredential`, so callers don't need to branch on platform.
export async function nativeGoogleSignIn() {
  await ensureInitialized();
  const { result } = await SocialLogin.login({
    provider: 'google',
    options: { scopes: ['email', 'profile'] },
  });
  if (!result?.idToken) {
    throw new Error('Google sign-in did not return an ID token');
  }
  return result.idToken;
}
