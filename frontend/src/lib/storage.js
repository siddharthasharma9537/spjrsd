import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// On web, localStorage is synchronous and fine. Inside the Capacitor native
// apps we use @capacitor/preferences (Keychain on iOS, EncryptedSharedPreferences
// on Android) instead, so auth tokens aren't sitting in the WebView's plain
// localStorage file on disk. Both paths are exposed as async here so callers
// don't need to branch on platform.
const isNative = Capacitor.isNativePlatform();

export async function getItem(key) {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setItem(key, value) {
  if (isNative) {
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
}

export async function removeItem(key) {
  if (isNative) {
    await Preferences.remove({ key });
    return;
  }
  localStorage.removeItem(key);
}

// Synchronous best-effort read for call sites (like the axios interceptor)
// that can't await. Native builds hydrate a mirror into localStorage on
// startup (see AuthContext) so this stays correct there too.
export function getItemSync(key) {
  return localStorage.getItem(key);
}
