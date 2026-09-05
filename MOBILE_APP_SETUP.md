# Android & iOS apps (Capacitor)

This repo's React frontend is wrapped for native app stores with
[Capacitor](https://capacitorjs.com), not rewritten. The web app, backend API,
and devotee accounts (email/password, mobile OTP, Google, and now passkeys)
are shared as-is between the website and both apps.

Everything code-level is already in place:
- `frontend/capacitor.config.json` — configured with `server.hostname:
  "cheruvugattu.online"` so the app's WebView reports its origin as the real
  site domain. This is required for passkeys and Google Sign-In to work
  inside the app; without it they'd silently fail (Google rejects the
  origin, WebAuthn's RP ID wouldn't match).
- `@capacitor/preferences` — auth tokens are stored in Keychain (iOS) /
  EncryptedSharedPreferences (Android) instead of WebView localStorage
  (`frontend/src/lib/storage.js`).
- Passkey/biometric sign-in end to end: backend WebAuthn endpoints
  (`backend/app/main.py`, `/api/auth/webauthn/*`), frontend helper
  (`frontend/src/lib/webauthn.js`), a "Sign in with Face ID / Fingerprint"
  button on `/login`, and a passkey management page at `/my-security`.

What's left is account/credential setup and building the native projects —
things that need your Google/Apple/Play Console accounts and, for iOS, a Mac
with Xcode. I can't do those from here.

## 1. Install dependencies

```bash
cd frontend
yarn install                      # pulls in the new Capacitor + @simplewebauthn/browser deps
```

Both native projects are already scaffolded and committed:
`frontend/android/` and `frontend/ios/`. After pulling this branch you only
need `npx cap sync` (or `yarn cap:android` / `yarn cap:ios`) after changing
web code or Capacitor plugins — not `cap add` again.

The iOS project (`frontend/ios/App/App.xcodeproj`) already has:
- Bundle ID `online.cheruvugattu.app` and display name "SPJRS Devasthanam",
  read from `capacitor.config.json`.
- The **Associated Domains** entitlement pre-wired
  (`frontend/ios/App/App/App.entitlements`, referenced by both Debug and
  Release build configs) for `webcredentials:cheruvugattu.online` and
  `applinks:cheruvugattu.online` — this is what step 5 below needs; you
  don't have to add the capability by hand in Xcode.
- Swift Package Manager dependencies (no CocoaPods/`pod install` needed —
  Capacitor 8 uses SPM by default).

Opening it needs a Mac with Xcode 15+ (`npx cap open ios`, or open
`frontend/ios/App/App.xcodeproj` directly) — I scaffolded and validated the
project structure here, but building/running it needs your Mac.

## 2. Backend: turn on passkeys

Add to `backend/.env` (already documented in `.env.example`):

```
WEBAUTHN_RP_ID=cheruvugattu.online
WEBAUTHN_RP_NAME=Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam
WEBAUTHN_ORIGINS=https://cheruvugattu.online,https://www.cheruvugattu.online
```

Install the new dependency: `pip install -r requirements.txt` (adds
`webauthn==3.0.0`). No other config needed — this works immediately on the
website. It also works in the apps once step 1 and step 4 (Android) /
step 5 (iOS) are done, because passkeys are validated by domain (RP ID), not
by app.

## 3. Google Sign-In in the apps

`GOOGLE_CLIENT_ID` today is a **Web application** OAuth client, which only
authorizes browser origins. Inside the app it'll still work for the same
reason passkeys do (the WebView presents itself as `cheruvugattu.online`), so
**you likely don't need to change anything** — test it first after step 1.

If Google's identity script refuses to load inside the app (some versions of
Google Identity Services block WebViews outright), the fix is to add native
Google Sign-In via `@codetrix-studio/capacitor-google-auth`, which needs:
- An **Android** OAuth client (Google Cloud Console → Credentials → OAuth
  client ID → Android), using the SHA-1 fingerprint from step 4 below.
- An **iOS** OAuth client (type: iOS), using the bundle ID from step 5.

Ask me to wire this in if the web-origin approach doesn't work for you.

## 4. Android: signing key, package ID, and passkey domain link

1. In Android Studio (`npx cap open android`), generate a release signing
   key (Build → Generate Signed Bundle/APK → Create new...). **Back this up
   somewhere safe** — losing it means you can never update the app again
   under the same listing.
2. Get its SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore your-release-key.jks -alias your-alias
   ```
3. Put that fingerprint into
   `frontend/public/.well-known/assetlinks.json` (already scaffolded,
   replace `REPLACE_WITH_YOUR_SIGNING_KEY_SHA256_FINGERPRINT`), and deploy
   the website so it's live at
   `https://cheruvugattu.online/.well-known/assetlinks.json`. This is what
   lets Android trust the app and the website as the same identity for
   passkeys.
4. `appId` in `capacitor.config.json` is `online.cheruvugattu.app` — change
   it now if you want a different package name (must be done before your
   first Play Console upload; it can't change after).

## 5. iOS: the site association file

The Associated Domains capability itself is already wired into the Xcode
project (see step 1) — you just need to point it at your real Apple team:

1. In Xcode, under **Signing & Capabilities**, set your **Team** (this is
   what needs a paid Apple Developer account, $99/year).
2. Replace `TEAMID` in
   `frontend/public/.well-known/apple-app-site-association` with your real
   10-character Apple Developer Team ID, and deploy the site (this file must
   be served with `Content-Type: application/json`, no file extension,
   directly at the domain root — most static hosts do this correctly by
   default for anything under `public/.well-known/`).
3. This is what lets Face ID/Touch ID passkeys registered on the website be
   used inside the iOS app, and vice versa.

## 6. Build, test, and ship

- Android: `npx cap open android` → Run on a device or the Play Console's
  internal testing track first. Play Console → App content → fill required
  sections (privacy policy URL, data safety) before it can go public.
- iOS: `npx cap open ios` → Run on a device (passkeys/Face ID don't work in
  the iOS Simulator without a workaround — test on real hardware), then
  Archive → distribute via App Store Connect (TestFlight first).
- Test the actual golden paths on real devices before submitting: password
  login, OTP login (SMS/WhatsApp/email), Google Sign-In, registering a
  passkey from `/my-security`, then signing out and back in with just the
  passkey.

## What "flawless" realistically means here

The code is complete and internally consistent, but three things are outside
what I can verify from this sandbox and need your involvement:
- I have no Mac/Xcode or Android emulator here, so while both native
  projects are scaffolded, synced, and structurally verified (Android via
  `npx cap sync android`, iOS's entitlements/build settings hand-checked
  for balance and correctness), neither has actually been built or run,
  and the real biometric prompts are untested by me. The backend WebAuthn
  logic itself is verified against the `webauthn` and
  `@simplewebauthn/browser` libraries' real APIs, not guessed.
- Google Sign-In inside a WebView is a known grey area (works for many
  Capacitor apps as-is, sometimes needs the native plugin swap in step 3).
- Store review (Apple in particular) can reject apps for reasons unrelated
  to this code (metadata, screenshots, privacy labels) — budget a review
  cycle or two.
