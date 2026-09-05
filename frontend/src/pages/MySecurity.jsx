import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, Fingerprint, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { listPasskeys, registerPasskey, deletePasskey, browserSupportsWebAuthn, platformAuthenticatorIsAvailable } from '@/lib/webauthn';

export default function MySecurity() {
  const { t, heading } = useT();
  const { logout } = useAuth();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(false);
  const [hasPlatformAuthenticator, setHasPlatformAuthenticator] = useState(false);

  const load = () => listPasskeys().then(setPasskeys).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    platformAuthenticatorIsAvailable().then(setHasPlatformAuthenticator).catch(() => setHasPlatformAuthenticator(false));
    load();
  }, []);

  const handleAdd = async () => {
    setError('');
    setAdding(true);
    try {
      await registerPasskey();
      await load();
    } catch (err) {
      if (err?.name !== 'NotAllowedError') {
        setError(err.response?.data?.detail || t('Could not add passkey', 'పాస్‌కీ జోడించడం సాధ్యం కాలేదు'));
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (credentialId) => {
    if (!window.confirm(t('Remove this passkey?', 'ఈ పాస్‌కీని తీసివేయాలా?'))) return;
    await deletePasskey(credentialId);
    load();
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <nav className="bg-[#621B00] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-[#D4AF37]" />
            <span className="font-english-heading text-sm tracking-wide">SPJRS Devasthanams</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/my-bookings" className="hover:text-[#D4AF37]">{t('My Bookings', 'నా బుకింగ్‌లు')}</Link>
            <button onClick={logout} className="text-[#FFE0B2] hover:text-white">{t('Logout', 'లాగ్ అవుట్')}</button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/my-bookings" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to My Bookings', 'నా బుకింగ్‌లకు తిరిగి వెళ్ళండి')}
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-6 w-6 text-[#C43E00]" />
          <h1 className={`${heading} text-2xl text-[#621B00]`} data-testid="my-security-title">{t('Sign-In & Security', 'సైన్ ఇన్ & భద్రత')}</h1>
        </div>
        <p className="text-sm text-[#5D4037] mb-6">{t(
          'Add a passkey to sign in instantly with your Face ID, Touch ID, or fingerprint - no password needed. Passkeys are stored securely on your device and never leave it.',
          'మీ ఫేస్ ఐడి, టచ్ ఐడి లేదా వేలిముద్రతో తక్షణమే సైన్ ఇన్ చేయడానికి పాస్‌కీని జోడించండి - పాస్‌వర్డ్ అవసరం లేదు. పాస్‌కీలు మీ పరికరంలో సురక్షితంగా నిల్వ చేయబడతాయి మరియు ఎప్పటికీ దాన్ని వదిలిపెట్టవు.'
        )}</p>

        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

        {!supported ? (
          <p className="text-center py-8 text-[#8D6E63] bg-white border border-[#E6DCCA] rounded-xl" data-testid="passkey-unsupported">
            {t('Passkeys are not supported in this browser.', 'ఈ బ్రౌజర్‌లో పాస్‌కీలు మద్దతు ఇవ్వబడవు.')}
          </p>
        ) : (
          <>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all disabled:opacity-50"
              data-testid="add-passkey-btn"
            >
              <Plus className="h-4 w-4" />
              {adding
                ? t('Waiting for Face ID / Fingerprint...', 'ఫేస్ ఐడి / వేలిముద్ర కోసం వేచి ఉంది...')
                : hasPlatformAuthenticator
                  ? t('Add This Device as a Passkey', 'ఈ పరికరాన్ని పాస్‌కీగా జోడించండి')
                  : t('Add a Passkey', 'పాస్‌కీని జోడించండి')}
            </button>

            {loading ? (
              <p className="text-center py-12 text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
            ) : passkeys.length === 0 ? (
              <p className="text-center py-12 text-[#8D6E63]" data-testid="no-passkeys">{t('No passkeys added yet', 'ఇంకా పాస్‌కీలు జోడించలేదు')}</p>
            ) : (
              <div className="space-y-3">
                {passkeys.map(p => (
                  <div key={p.credential_id} className="bg-white border border-[#E6DCCA] rounded-xl p-4 flex items-center justify-between" data-testid={`passkey-card-${p.credential_id}`}>
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-5 w-5 text-[#C43E00]" />
                      <div>
                        <p className="text-sm font-medium text-[#2D1B0E]">{p.device_name}</p>
                        <p className="text-xs text-[#8D6E63]">
                          {t('Added', 'జోడించబడింది')} {new Date(p.created_at).toLocaleDateString()}
                          {p.last_used_at && ` • ${t('Last used', 'చివరిసారి ఉపయోగించినది')} ${new Date(p.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(p.credential_id)} className="text-[#8D6E63] hover:text-red-600 p-2" data-testid={`delete-passkey-${p.credential_id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
