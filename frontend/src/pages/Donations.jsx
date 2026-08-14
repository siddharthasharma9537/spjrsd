import { useState, useEffect, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { HandCoins, Heart, IndianRupee, CheckCircle, FileCheck, Landmark, Copy, Check, QrCode, PauseCircle } from 'lucide-react';
import { DONATION_FORM_PAUSED } from '@/lib/bookingStatus';

const TEMPLE_UPI_VPA = 'assis94910001@barodampay';
const TEMPLE_UPI_PAYEE = 'Assistant Commissioner and EO SPJRSD';
const TEMPLE_BANK = {
  accountName: 'Assistant Commissioner & Executive Officer, SPJRSD',
  bankName: 'Bank of Baroda',
  branch: 'Narketpally Branch, Narketpalle - 508254',
  accountNumber: '55010100000001',
  ifsc: 'BARB0NARKET',
  accountType: 'Savings Account',
};

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="flex items-center justify-between gap-2 text-xs border-b border-[#E6DCCA] pb-1.5 last:border-b-0 last:pb-0">
      <div>
        <p className="text-[#8D6E63]">{label}</p>
        <p className="font-medium text-[#2D1B0E] font-mono">{value}</p>
      </div>
      <button type="button" onClick={handleCopy} className="shrink-0 p-1.5 rounded hover:bg-[#D4AF37]/10 text-[#621B00]" aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function Donations() {
  const { t, heading } = useT();
  const uid = useId();
  const { type } = useParams();
  const donationType = type === 'annaprasadam' ? 'AnnaPrasadam' : 'e-Hundi';
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ donor_name: '', donor_mobile: '', donor_email: '', donor_gotram: '', amount: '', message: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [myDonations, setMyDonations] = useState([]);

  useEffect(() => {
    if (user && userType === 'devotee') {
      setForm(f => ({ ...f, donor_name: user.name || '', donor_mobile: user.mobile || '' }));
      api.get('/donations/my').then(r => setMyDonations(r.data)).catch(() => {});
    }
  }, [user, userType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/donations', { ...form, donation_type: donationType, amount: parseFloat(form.amount) });
      setSuccess(res.data);
      setForm(f => ({ ...f, amount: '', message: '' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Donation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = donationType === 'AnnaPrasadam' ? [500, 1000, 2000, 5000, 10000] : [101, 501, 1001, 5001, 10001];
  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: donationType === 'AnnaPrasadam' ? '#C43E00' + '15' : '#D4AF37' + '20'}}>
            {donationType === 'AnnaPrasadam' ? <Heart className="h-8 w-8 text-[#C43E00]" /> : <HandCoins className="h-8 w-8 text-[#D4AF37]" />}
          </div>
          <h1 className={`${heading} text-2xl md:text-3xl text-[#621B00] mb-1`} data-testid="donation-title">
            {donationType === 'AnnaPrasadam' ? t('AnnaPrasadam Donation', 'అన్నప్రసాదం దానం') : t('e-Hundi Online Donation', 'ఈ-హుండి ఆన్‌లైన్ దానం')}
          </h1>
          <p className="text-sm text-[#5D4037] mt-2 max-w-lg mx-auto">
            {donationType === 'AnnaPrasadam'
              ? 'Sponsor sacred food offering (Annadanam) at the temple. Your contribution feeds pilgrims and earns divine blessings.'
              : 'e-Hundi allows devotees from across the globe to make donations for the welfare of the sacred temple.'}
          </p>
        </div>

        {success ? (
          <div className="bg-white border border-green-200 rounded-xl p-8 text-center max-w-md mx-auto" data-testid="donation-success">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className={`${heading} text-xl text-[#621B00] mb-3`}>{t('Donation Received!', 'మీ దానం స్వీకరించబడింది!')}</h2>
            <p className="text-sm text-[#5D4037] mb-1">Donation #: <span className="font-mono font-bold">{success.donation_number}</span></p>
            <p className="text-lg font-bold text-[#C43E00] mb-4">Rs. {success.amount}</p>
            <p className="text-xs text-[#8D6E63] mb-4">Payment Status: Paid (MOCKED)</p>
            <div className="flex flex-col gap-3 items-center">
              <Link to={`/donation-receipt/${success.id}`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#621B00] text-white rounded-full text-sm hover:bg-[#621B00]/90 transition-all shadow-md" data-testid="view-80g-receipt-btn">
                <FileCheck className="h-4 w-4" /> Download 80G Receipt
              </Link>
              <div className="flex gap-3">
                <button onClick={() => setSuccess(null)} className="px-6 py-2 bg-[#C43E00] text-white rounded-full text-sm" data-testid="donate-again-btn">Donate Again</button>
                <Link to="/" className="px-6 py-2 border border-[#E6DCCA] rounded-full text-sm text-[#5D4037]">Home</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {DONATION_FORM_PAUSED ? (
                <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 shadow-sm" data-testid="donation-form-paused">
                  <div className="flex items-start gap-3">
                    <PauseCircle className="h-6 w-6 text-[#C43E00] shrink-0 mt-0.5" />
                    <div>
                      <h2 className={`${heading} text-lg text-[#621B00] mb-2`}>
                        {t('Online Donation Form Temporarily Paused', 'ఆన్‌లైన్ దానం ఫారం తాత్కాలికంగా నిలిపివేయబడింది')}
                      </h2>
                      <p className="text-sm text-[#5D4037] leading-relaxed mb-2">
                        {t(
                          "This in-app donation form is temporarily unavailable. Please use the temple's official QR code, UPI ID, or bank transfer details alongside — those remain fully open — or contact the temple office for a receipt.",
                          'ఈ ఇన్-యాప్ దానం ఫారం తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి పక్కన గల దేవస్థానం అధికారిక క్యూఆర్ కోడ్, UPI ఐడీ లేదా బ్యాంకు వివరాలను ఉపయోగించండి — అవి పూర్తిగా అందుబాటులో ఉన్నాయి — లేదా రసీదు కొరకు దేవస్థాన కార్యాలయాన్ని సంప్రదించండి.'
                        )}
                      </p>
                      <p className="text-xs text-[#8D6E63]">
                        {t('Temple office:', 'దేవస్థాన కార్యాలయం:')}{' '}
                        <a href="tel:+919491000701" className="text-[#C43E00] underline">+91 94910 00701</a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 shadow-sm" data-testid="donation-form">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Preset amounts */}
                  <div>
                    <label htmlFor={`${uid}-amount`} className="block text-sm font-medium text-[#5D4037] mb-2">{t('Amount (Rs.)', 'మొత్తం')} <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Preset donation amounts">
                      {presetAmounts.map(a => (
                        <button key={a} type="button" onClick={() => setForm({...form, amount: String(a)})}
                          aria-pressed={String(form.amount) === String(a)}
                          className={`px-4 py-2 rounded-full text-sm border transition-all ${String(form.amount) === String(a) ? 'bg-[#C43E00] text-white border-[#C43E00]' : 'border-[#E6DCCA] text-[#5D4037] hover:border-[#D4AF37]'}`}
                          data-testid={`amount-${a}`}>
                          Rs. {a.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <input id={`${uid}-amount`} name="amount" type="number" inputMode="numeric" className={inputCls} placeholder="Or enter custom amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required min="1" data-testid="input-amount" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`${uid}-name`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} <span className="text-red-500">*</span></label>
                      <input id={`${uid}-name`} name="donor_name" autoComplete="name" className={inputCls} value={form.donor_name} onChange={e => setForm({...form, donor_name: e.target.value})} required data-testid="input-donor-name" />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-mobile`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile', 'మొబైల్')} <span className="text-red-500">*</span></label>
                      <input id={`${uid}-mobile`} name="donor_mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.donor_mobile} onChange={e => setForm({...form, donor_mobile: e.target.value})} required data-testid="input-donor-mobile" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`${uid}-email`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Email', 'ఇమెయిల్')}</label>
                      <input id={`${uid}-email`} name="donor_email" type="email" autoComplete="email" className={inputCls} value={form.donor_email} onChange={e => setForm({...form, donor_email: e.target.value})} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-gotram`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Gotram', 'గోత్రం')}</label>
                      <input id={`${uid}-gotram`} name="donor_gotram" className={inputCls} value={form.donor_gotram} onChange={e => setForm({...form, donor_gotram: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`${uid}-message`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Message', 'సందేశం')}</label>
                    <textarea id={`${uid}-message`} name="message" className={`${inputCls} h-20 py-3`} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Optional message or prayer" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input id={`${uid}-anon`} name="is_anonymous" type="checkbox" checked={form.is_anonymous} onChange={e => setForm({...form, is_anonymous: e.target.checked})} className="rounded w-6 h-6 shrink-0 accent-[#C43E00]" />
                    <label htmlFor={`${uid}-anon`} className="text-sm text-[#5D4037] cursor-pointer">{t('Anonymous Donation', 'అనామక దానం')}</label>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="donate-submit-btn">
                    {submitting ? 'Processing...' : `Donate Rs. ${form.amount || '...'}`}
                  </button>
                </form>
              </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-5">
                <h3 className="font-english-heading text-sm text-[#621B00] mb-2">{donationType === 'AnnaPrasadam' ? 'About AnnaPrasadam' : 'About e-Hundi'}</h3>
                <p className="text-xs text-[#5D4037] leading-relaxed">
                  {donationType === 'AnnaPrasadam'
                    ? 'Offering Annadhanam is one of the greatest acts of charity. Your donation helps feed thousands of devotees visiting the temple daily.'
                    : 'The e-Hundi facility enables devotees worldwide to contribute to the temple\'s upkeep, festivals, and charitable activities.'}
                </p>
              </div>
              <div className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid="bank-upi-details">
                <h3 className="font-english-heading text-sm text-[#621B00] mb-1 flex items-center gap-1.5"><Landmark className="h-4 w-4" /> Direct Bank Transfer / UPI</h3>
                <p className="text-xs text-[#5D4037] mb-3">You may also donate directly to the temple's official account via NEFT/RTGS or any UPI app.</p>

                {/* The Devasthanam's own BHIM Baroda Pay QR poster, as issued by
                    the bank - preferred over a generated code so devotees see the
                    same image displayed at the temple counter. */}
                <div className="flex flex-col items-center bg-white border border-[#E6DCCA] rounded-xl p-3 mb-3">
                  <img
                    src="/Assets/bank-of-baroda-upi-qr.webp"
                    alt={`Official Bank of Baroda UPI QR code for ${TEMPLE_UPI_PAYEE}`}
                    className="w-full max-w-[240px] h-auto rounded-lg"
                    loading="lazy"
                    data-testid="upi-qr-code"
                  />
                  <p className="text-[10px] text-[#8D6E63] mt-2 text-center px-2">Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)</p>
                  {/* This site is an independent, unofficial project (see footer) - but
                      the QR code and bank details themselves are the temple's genuine,
                      official payment details, issued by the bank. Worth saying explicitly
                      right here so devotees don't mistake one disclaimer for the other. */}
                  <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-[#E6DCCA] w-full">
                    <CheckCircle className="h-3.5 w-3.5 text-green-700 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-[#5D4037] leading-relaxed">
                      <p>This QR code and the bank/UPI details below are the temple&apos;s genuine, official payment details.</p>
                      <p className="font-telugu-body mt-0.5">ఈ క్యూఆర్ కోడ్ మరియు క్రింద గల బ్యాంకు/UPI వివరాలు దేవస్థానం యొక్క నిజమైన, అధికారిక చెల్లింపు వివరాలు.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <CopyField label="Account Name" value={TEMPLE_BANK.accountName} />
                  <CopyField label="Bank & Branch" value={`${TEMPLE_BANK.bankName}, ${TEMPLE_BANK.branch}`} />
                  <CopyField label="Account Number" value={TEMPLE_BANK.accountNumber} />
                  <CopyField label="IFSC Code" value={TEMPLE_BANK.ifsc} />
                  <CopyField label="UPI ID (VPA)" value={TEMPLE_UPI_VPA} />
                </div>
                <a
                  href={`upi://pay?pa=${encodeURIComponent(TEMPLE_UPI_VPA)}&pn=${encodeURIComponent(TEMPLE_UPI_PAYEE)}&cu=INR${form.amount ? `&am=${encodeURIComponent(form.amount)}` : ''}`}
                  className="inline-flex items-center justify-center gap-2 w-full h-10 bg-[#621B00] text-white rounded-full text-xs font-english-heading tracking-wide uppercase hover:bg-[#621B00]/90 transition-all"
                  data-testid="upi-pay-link"
                >
                  <QrCode className="h-4 w-4" /> Pay via UPI App
                </a>
                <p className="text-[10px] text-[#8D6E63] mt-2">On mobile, the button above opens GPay / PhonePe / Paytm etc. with the temple's UPI ID pre-filled.</p>
              </div>
              {donationType === 'AnnaPrasadam' && (
                <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
                  <h3 className={`${heading} text-sm text-[#621B00] mb-3`}>{t('Permanent Annadanam Scheme', 'శాశ్వత నిత్యఅన్నదాన పథకం')}</h3>
                  <p className="text-xs text-[#5D4037] mb-3">Devotees may become partners in Annadanam with a donation of Rs. 1,116 or more. Annadanam will be performed on the date requested by the donor.</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-[#E6DCCA] pb-1.5"><span className="text-[#5D4037]">Rs. 1,00,000 & above</span><span className="font-medium text-[#621B00]">Mahonnata Maharaja Poshakulu</span></div>
                    <div className="flex justify-between border-b border-[#E6DCCA] pb-1.5"><span className="text-[#5D4037]">Rs. 50,000 & above</span><span className="font-medium text-[#621B00]">Mahonnata Raja Poshakulu</span></div>
                    <div className="flex justify-between border-b border-[#E6DCCA] pb-1.5"><span className="text-[#5D4037]">Rs. 25,000 & above</span><span className="font-medium text-[#621B00]">Raja Poshakulu</span></div>
                    <div className="flex justify-between"><span className="text-[#5D4037]">Rs. 10,000 & above</span><span className="font-medium text-[#621B00]">Poshakulu</span></div>
                  </div>
                </div>
              )}
              {donationType === 'e-Hundi' && (
                <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
                  <h3 className={`${heading} text-sm text-[#621B00] mb-3`}>{t('New Accommodation Rooms', 'నూతన వసతి గదుల నిర్మాణము')}</h3>
                  <p className="text-xs text-[#5D4037] mb-3">Donors may contribute towards the construction of new pilgrim accommodation rooms:</p>
                  <div className="space-y-2 text-xs">
                    <div className="border-b border-[#E6DCCA] pb-1.5"><p className="font-medium text-[#621B00]">Rs. 4,50,000</p><p className="text-[#5D4037]">Name on the room + 12 free stay-days/year</p></div>
                    <div className="border-b border-[#E6DCCA] pb-1.5"><p className="font-medium text-[#621B00]">Rs. 3,00,000 - 4,00,000</p><p className="text-[#5D4037]">Name on stone plaque + 8 free stay-days/year</p></div>
                    <div className="border-b border-[#E6DCCA] pb-1.5"><p className="font-medium text-[#621B00]">Rs. 1,00,000 - 3,00,000</p><p className="text-[#5D4037]">Name on stone plaque + 5 free stay-days/year</p></div>
                    <div><p className="font-medium text-[#621B00]">Rs. 50,000 - 1,00,000</p><p className="text-[#5D4037]">Name on stone plaque + 2 free stay-days/year</p></div>
                  </div>
                </div>
              )}
              {myDonations.length > 0 && (
                <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
                  <h3 className="text-sm font-medium text-[#2D1B0E] mb-3">My Recent Donations</h3>
                  <div className="space-y-2">
                    {myDonations.slice(0, 5).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[#5D4037]">{d.donation_type}</p>
                          <p className="text-[#8D6E63]">{new Date(d.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#C43E00]">Rs. {d.amount}</span>
                          <Link to={`/donation-receipt/${d.id}`} className="block text-[#621B00] hover:underline mt-0.5">80G Receipt</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
