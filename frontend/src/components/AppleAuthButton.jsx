import { useState } from 'react';
import { useT } from "@/contexts/LanguageContext";
import { nativeAppleAuthAvailable, nativeAppleSignIn } from '@/lib/nativeAppleAuth';

// Apple Sign-In only exists here for the native Android/iOS apps - there's no
// web integration (the site has no Apple JS SDK), so this renders nothing at
// all in a browser. onIdentity receives { identityToken, fullName }.
function AppleAuthButton({ onIdentity, text = 'signin_with' }) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      const identity = await nativeAppleSignIn();
      onIdentity(identity);
    } catch (err) {
      if (!/cancel/i.test(err?.message || '')) {
        setError(t('Apple sign-in failed', 'యాపిల్ సైన్ ఇన్ విఫలమైంది'));
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
        className="w-full max-w-[336px] h-11 flex items-center justify-center gap-3 bg-black rounded-full text-sm font-medium text-white hover:bg-black/85 transition-all disabled:opacity-50"
        data-testid="apple-auth-button-native"
      >
        <svg width="16" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
        </svg>
        {loading
          ? t('Please wait...', 'దయచేసి వేచి ఉండండి...')
          : text === 'signup_with'
            ? t('Sign up with Apple', 'యాపిల్‌తో నమోదు చేయండి')
            : t('Sign in with Apple', 'యాపిల్‌తో సైన్ ఇన్ చేయండి')}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Divider + button, for dropping next to GoogleAuthSection. Renders nothing
// on web or until the native platform's required config is present.
export function AppleAuthSection({ onIdentity, text = 'signin_with' }) {
  if (!nativeAppleAuthAvailable()) return null;
  return (
    <div className="mt-3">
      <AppleAuthButton onIdentity={onIdentity} text={text} />
    </div>
  );
}

export default AppleAuthButton;
