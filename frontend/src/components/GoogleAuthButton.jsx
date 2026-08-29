import { useEffect, useRef, useId } from 'react';
import { useT } from "@/contexts/LanguageContext";

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

// Renders nothing until REACT_APP_GOOGLE_CLIENT_ID is configured.
export default function GoogleAuthButton({ onCredential, text = 'continue_with' }) {
  const containerId = useId().replace(/:/g, '');
  const ref = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
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
  }, [onCredential, text]);

  if (!GOOGLE_CLIENT_ID) return null;
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
