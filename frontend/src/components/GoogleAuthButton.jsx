import { useEffect, useRef, useId, useState } from 'react';
import { useT } from "@/contexts/LanguageContext";
import { nativeGoogleAuthAvailable, nativeGoogleSignIn } from '@/lib/nativeGoogleAuth';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

let scriptLoadPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

// Inside the Android/iOS app, Google's web sign-in script either can't load
// (no matching origin) or is unreliable inside a WebView, so this renders a
// plain button that drives the OS-native Google sign-in sheet instead. It
// still ends up calling `onCredential` with a Google ID token, exactly like
// the web flow below - the backend doesn't need to know which path was used.
function NativeGoogleButton({ onCredential, text }) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      const idToken = await nativeGoogleSignIn();
      onCredential(idToken);
    } catch (err) {
      if (err?.message !== 'popup_closed_by_user' && !/cancel/i.test(err?.message || '')) {
        setError(t('Google sign-in failed', 'గూగుల్ సైన్ ఇన్ విఫలమైంది'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full max-w-[336px] h-11 flex items-center justify-center gap-3 border border-[#DADCE0] bg-white rounded-full text-sm font-medium text-[#3C4043] hover:bg-gray-50 transition-all disabled:opacity-50"
        data-testid="google-auth-button-native"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        {loading
          ? t('Please wait...', 'దయచేసి వేచి ఉండండి...')
          : text === 'signin_with'
            ? t('Sign in with Google', 'గూగుల్‌తో సైన్ ఇన్ చేయండి')
            : t('Continue with Google', 'గూగుల్‌తో కొనసాగించండి')}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Renders nothing until REACT_APP_GOOGLE_CLIENT_ID is configured.
export default function GoogleAuthButton({ onCredential, text = 'continue_with' }) {
  const containerId = useId().replace(/:/g, '');
  const ref = useRef(null);
  const useNative = nativeGoogleAuthAvailable();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || useNative) return;
    let cancelled = false;
    loadGoogleScript().then(() => {
      if (cancelled || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline', size: 'large', width: 336, text, shape: 'pill',
      });
    });
    return () => { cancelled = true; };
  }, [onCredential, text, useNative]);

  if (!GOOGLE_CLIENT_ID) return null;
  if (useNative) return <NativeGoogleButton onCredential={onCredential} text={text} />;
  return <div id={containerId} ref={ref} className="flex justify-center" data-testid="google-auth-button" />;
}

// Divider + button, for dropping into an auth form. Renders nothing (not even
// the divider) until REACT_APP_GOOGLE_CLIENT_ID is configured.
export function GoogleAuthSection({ onCredential, text = 'continue_with' }) {
  const { t } = useT();
  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#E6DCCA]" />
        <span className="text-xs text-[#8D6E63] uppercase tracking-wide">{t('or', 'లేదా')}</span>
        <div className="flex-1 h-px bg-[#E6DCCA]" />
      </div>
      <GoogleAuthButton onCredential={onCredential} text={text} />
    </div>
  );
}
