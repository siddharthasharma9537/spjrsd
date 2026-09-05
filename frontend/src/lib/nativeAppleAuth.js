import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

// Must match capacitor.config.json's appId - iOS doesn't use this as a real
// OAuth client (native Sign in with Apple is tied to the app's own Bundle ID
// and the "Sign in with Apple" entitlement instead), the plugin just wants a
// non-empty string here to know which provider to initialize.
const APPLE_BUNDLE_ID = 'online.cheruvugattu.app';
// Android has no native Apple SDK, so it drives Apple's own web sign-in page.
// This Services ID must be registered in Apple Developer and grouped under
// the app's primary Bundle ID, and must equal backend's APPLE_SERVICES_ID.
const APPLE_SERVICES_ID = process.env.REACT_APP_APPLE_SERVICES_ID;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
// Apple redirects its authorization code here; must equal the backend's own
// APPLE_REDIRECT_URI and be registered as a Return URL on the Services ID.
const APPLE_REDIRECT_URI = `${BACKEND_URL}/api/auth/apple/callback`;

let initPromise = null;
function ensureInitialized() {
  if (!initPromise) {
    const isIOS = Capacitor.getPlatform() === 'ios';
    initPromise = SocialLogin.initialize({
      apple: isIOS
        ? { clientId: APPLE_BUNDLE_ID }
        : {
            clientId: APPLE_SERVICES_ID,
            redirectUrl: APPLE_REDIRECT_URI,
            // Keeps Apple's client secret on the backend - the device never
            // sees it, only the already-verified tokens our callback mints.
            useProperTokenExchange: true,
          },
    });
  }
  return initPromise;
}

export function nativeAppleAuthAvailable() {
  if (!Capacitor.isNativePlatform()) return false;
  if (Capacitor.getPlatform() === 'android' && !APPLE_SERVICES_ID) return false;
  return true;
}

// Drives Apple's native sign-in sheet on iOS or its web OAuth page on
// Android, and returns { identityToken, fullName } - fullName is Apple's
// one-time-only user info, non-null only on this device's very first
// authorization of the app (Apple never sends it again after that).
export async function nativeAppleSignIn() {
  await ensureInitialized();
  const { result } = await SocialLogin.login({
    provider: 'apple',
    options: { scopes: ['email', 'name'] },
  });
  if (!result?.idToken) {
    throw new Error('Apple sign-in did not return an identity token');
  }
  const fullName = [result.profile?.givenName, result.profile?.familyName].filter(Boolean).join(' ') || null;
  return { identityToken: result.idToken, fullName };
}
