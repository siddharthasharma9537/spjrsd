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
- Native Google Sign-In on both platforms via `@capgo/capacitor-social-login`
  (`frontend/src/lib/nativeGoogleAuth.js`, wired into
  `GoogleAuthButton.jsx`) — drives Android's Credential Manager / iOS's
  GoogleSignIn SDK instead of the web Google Identity Services script, but
  still hands the backend the same kind of ID token, so no backend changes
  were needed.
- Native "Sign in with Apple" on both platforms, same plugin
  (`frontend/src/lib/nativeAppleAuth.js`, `AppleAuthButton.jsx`). iOS is
  fully native (`AuthenticationServices`, no backend involved); Android
  round-trips through a new backend endpoint
  (`POST /api/auth/apple/callback`) that exchanges Apple's code for tokens
  server-side, then redirects into the app via a custom URL scheme that
  `MainActivity.java`'s `onNewIntent` picks up. `POST /api/auth/devotee/apple`
  verifies the resulting identity token against Apple's public keys.

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

## 3. Native Google Sign-In in the apps

Done — wired with `@capgo/capacitor-social-login` (the actively maintained
fork of the old `@codetrix-studio/capacitor-google-auth`; that one is
unmaintained and doesn't support Capacitor 8). Inside the app,
`GoogleAuthButton.jsx` now detects it's running natively and swaps the
web Google Identity Services button for one that drives the OS-native
sign-in sheet (Android Credential Manager / iOS's GoogleSignIn SDK) via
`frontend/src/lib/nativeGoogleAuth.js`. It still hands your existing backend
the same shape of Google ID token, so `/api/auth/devotee/google` needed
**no changes**.

What's already in place:
- `capacitor.config.json` → `plugins.SocialLogin.providers` enables only
  Google (Facebook/Apple/Twitter disabled, so they add zero app size).
- Android: the plugin registered itself into
  `android/capacitor.settings.gradle` / `android/app/capacitor.build.gradle`
  automatically via `npx cap sync` — nothing else needed there. Per the
  plugin's own docs, Android uses Credential Manager, which needs **no**
  `google-services.json`, no Firebase project, and no Digital Asset Links.
- iOS: `AppDelegate.swift` now imports `GoogleSignIn` and handles the
  redirect-back URL in `application(_:open:options:)`; `Package.swift` picked
  up the plugin's Swift package automatically.

What you still need to provide (Google Cloud Console → Credentials):

1. **Android**: create an **Android**-type OAuth client — package name
   `online.cheruvugattu.app` and the SHA-1 from step 4 below. You do **not**
   put this ID into any config file; Google matches it by package name + SHA-1
   automatically. Reuses the existing `GOOGLE_CLIENT_ID` (Web client) as
   `webClientId` — set that in `frontend/.env` as `REACT_APP_GOOGLE_CLIENT_ID`
   if you haven't already.
2. **iOS**: create an **iOS**-type OAuth client with bundle ID
   `online.cheruvugattu.app`. Put its value in `frontend/.env` as
   `REACT_APP_GOOGLE_IOS_CLIENT_ID`. Then take the **"iOS URL scheme"** value
   Google Cloud Console shows for that same client (looks like
   `com.googleusercontent.apps.1234567890-abcdefg`) and replace
   `REPLACE_WITH_YOUR_IOS_CLIENT_ID_REVERSED` in
   `frontend/ios/App/App/Info.plist` with it — this is what lets Safari hand
   control back to the app after sign-in.
3. Rebuild the web assets and re-sync after setting the env vars:
   `yarn build && npx cap sync`.

Until `REACT_APP_GOOGLE_IOS_CLIENT_ID` is set, iOS silently falls back to the
web-embedded Google button (which may or may not work in a WKWebView) —
Android only needs the Web client ID you already have.

## 4. Native "Sign in with Apple" in the apps

Done — same plugin as Google (`@capgo/capacitor-social-login`). iOS uses
Apple's native `AuthenticationServices` directly (no backend involved,
already entitled in `App.entitlements`). Android has no native Apple SDK, so
it opens Apple's own web sign-in page and needs a backend round trip:

- `backend/app/main.py` → `POST /api/auth/apple/callback` receives Apple's
  authorization code, exchanges it for tokens **server-side** (so the Apple
  client secret never touches a device), then redirects back into the
  Android app via its own custom URL scheme.
- `frontend/android/.../MainActivity.java` catches that redirect
  (`onNewIntent`) and hands it to the plugin — this only exists because
  Capacitor's own intent forwarding doesn't cover this case; already wired.
- `frontend/android/app/src/main/AndroidManifest.xml` already has the
  matching intent-filter (`online.cheruvugattu.app://apple-callback`).
- `POST /api/auth/devotee/apple` verifies the identity token (against
  Apple's public keys, checking issuer/audience/expiry — not just trusting
  the client) and creates/logs in the devotee, same pattern as Google.

What you still need from Apple Developer (**requires a paid $99/year
account**, same one used for iOS distribution):

1. **A Key**: Certificates, Identifiers & Profiles → Keys → new key with
   "Sign in with Apple" enabled. Download the `.p8` file **immediately** —
   Apple only lets you download it once. Note its 10-character Key ID.
2. **A Services ID**: Identifiers → "+" → Services IDs → enable "Sign in
   with Apple" → configure it to be grouped under the app's primary Bundle
   ID (`online.cheruvugattu.app`) → add
   `https://<your-backend-domain>/api/auth/apple/callback` as a Return URL
   (must match exactly, including the domain your FastAPI backend is
   actually deployed at — not the frontend's domain).
3. Fill in `backend/.env`: `APPLE_TEAM_ID` (top-right of the developer
   portal), `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (the `.p8` contents, with
   `\n` for line breaks), `APPLE_SERVICES_ID`, `APPLE_REDIRECT_URI`
   (the same Return URL from step 2). `APPLE_BUNDLE_ID` and
   `APPLE_ANDROID_REDIRECT_SCHEME` already default correctly.
4. Fill in `frontend/.env`: `REACT_APP_APPLE_SERVICES_ID` (same value as
   `APPLE_SERVICES_ID` above).
5. In Xcode, under **Signing & Capabilities**, "Sign in with Apple" should
   already show as a capability (from `App.entitlements`) once your Team is
   set — no separate toggle needed there.
6. Rebuild and re-sync: `yarn build && npx cap sync`.

Until the env vars above are set, the Apple button is hidden on Android
(`nativeAppleAuthAvailable()` returns `false`); iOS needs no env var at all
since it's tied to the Bundle ID and entitlement, not a client ID.

Apple Sign-In is also an **App Store requirement**, not just a nice-to-have:
guideline 4.8 requires offering it whenever you offer another third-party
login (which this app now does, via Google) — so this isn't optional if you
want the iOS app approved.

## 5. Android: signing key, package ID, and passkey domain link

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

## 6. iOS: the site association file

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

## 7. Build, test, and ship

- Android: `npx cap open android` → Run on a device or the Play Console's
  internal testing track first. Play Console → App content → fill required
  sections (privacy policy URL, data safety) before it can go public.
- iOS: `npx cap open ios` → Run on a device (passkeys/Face ID don't work in
  the iOS Simulator without a workaround — test on real hardware), then
  Archive → distribute via App Store Connect (TestFlight first).
- Test the actual golden paths on real devices before submitting: password
  login, OTP login (SMS/WhatsApp/email), Google Sign-In, Apple Sign-In
  (iOS native sheet and Android's web flow round-trip through the backend),
  registering a passkey from `/my-security`, then signing out and back in
  with just the passkey.

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
- Native Google and Apple Sign-In (steps 3-4) are wired against each
  plugin's documented API, and their generated native project files
  (Android Gradle registration, iOS `Package.swift`/`AppDelegate`/
  entitlements, the Android manifest intent-filter and `MainActivity`
  changes for Apple's redirect) were verified to update correctly on
  `npx cap sync` — the Apple backend callback logic (ES256 client-secret
  JWT generation, Apple's token-exchange response shape, identity-token
  verification via `PyJWKClient`) was checked against real library APIs and
  a self-signed test key, not guessed. What's untested by me: the actual
  on-device sign-in sheets, and both depend on Google Cloud Console /
  Apple Developer credentials I can't create from here.
- Store review (Apple in particular) can reject apps for reasons unrelated
  to this code (metadata, screenshots, privacy labels) — budget a review
  cycle or two.
