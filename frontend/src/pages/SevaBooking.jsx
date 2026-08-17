import { useState, useEffect , useId } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { ArrowLeft, IndianRupee, AlertCircle, Clock, Users, Printer, Info, Globe, Landmark, QrCode, Copy, Check } from 'lucide-react';
import { BOOKINGS_PAUSED } from '@/lib/bookingStatus';
import BookingPausedNotice from '@/components/BookingPausedNotice';
import { SEVA_SAMAGRI } from '@/lib/sevaSamagri';

// Same official account the Donations page pays into - kept as its own copy
// here rather than imported, so this page doesn't reach into Donations.jsx's
// internals for two constants.
const TEMPLE_UPI_VPA = 'assis94910001@barodampay';
const TEMPLE_UPI_PAYEE = 'Assistant Commissioner and EO SPJRSD';
const TEMPLE_BANK = {
  accountName: 'Assistant Commissioner & Executive Officer, SPJRSD',
  bankName: 'Bank of Baroda',
  branch: 'Narketpally Branch, Narketpalle - 508254',
  accountNumber: '55010100000001',
  ifsc: 'BARB0NARKET',
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

function SamagriLine({ item, t }) {
  return (
    <>
      <span>{t(item.en, item.te)}</span>
      {item.qty && <span className="text-[#8D6E63]"> — {item.qty}</span>}
      {item.optional && <span className="text-[#8D6E63] italic"> ({t('optional', 'ఐచ్ఛికం')})</span>}
      {item.note && <span className="ml-1 text-[10px] uppercase tracking-wide text-[#C43E00] font-medium">{item.note}</span>}
    </>
  );
}

function SamagriItem({ item, t }) {
  return (
    <li className="text-sm text-[#5D4037] leading-relaxed">
      <SamagriLine item={item} t={t} />
      {item.children && (
        <ol className="list-[lower-alpha] list-inside ml-4 mt-1 space-y-0.5">
          {item.children.map((child, i) => (
            <li key={i} className="text-sm text-[#5D4037] leading-relaxed"><SamagriLine item={child} t={t} /></li>
          ))}
        </ol>
      )}
    </li>
  );
}

function SamagriSection({ sevaId, t, heading }) {
  const items = SEVA_SAMAGRI[sevaId];
  if (!items) return null;
  return (
    <div className="border-t border-[#E6DCCA] pt-5 mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className={`${heading} text-sm text-[#621B00]`}>{t('Materials Required (Samagri)', 'కావలసిన సామాగ్రి')}</h2>
        <Link to={`/book/${sevaId}/checklist`} className="inline-flex items-center gap-1.5 text-xs text-[#C43E00] hover:text-[#C43E00]/80 border border-[#C43E00]/30 rounded-full px-3 py-1 transition-colors shrink-0" data-testid="samagri-checklist-link">
          <Printer className="h-3 w-3" /> {t('Printable Checklist', 'ప్రింట్ చెక్‌లిస్ట్')}
        </Link>
      </div>
      <ol className="list-decimal list-inside space-y-1.5">
        {items.map((item, i) => <SamagriItem key={i} item={item} t={t} />)}
      </ol>
    </div>
  );
}

function RegulationsNote({ t }) {
  return (
    <div className="border-t border-[#E6DCCA] pt-4 mt-6 flex gap-2 text-xs text-[#8D6E63] leading-relaxed">
      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p>{t(
        "Note: Pooja slot availability, duration of the pooja, and usage of materials brought by devotees are subject to the temple management's regulations.",
        'గమనిక: పూజ స్లాట్ లభ్యత, పూజ వ్యవధి మరియు భక్తులు తీసుకువచ్చిన సామాగ్రి వినియోగం దేవస్థాన నిర్వహణ నిబంధనలకు లోబడి ఉంటాయి.'
      )}</p>
    </div>
  );
}

function ParokshaSevaNote({ t }) {
  return (
    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4 mb-6 flex gap-2.5">
      <Globe className="h-5 w-5 text-[#621B00] shrink-0 mt-0.5" />
      <p className="text-sm text-[#621B00] leading-relaxed">{t(
        "Paroksha Seva is a remote, online seva - you do not need to be present at the temple. The temple's archakas (priests) perform the pooja on your behalf at the scheduled time, on-site.",
        'పరోక్ష సేవ అనేది ఒక దూరస్థ, ఆన్‌లైన్ సేవ - మీరు దేవాలయంలో స్వయంగా ఉండవలసిన అవసరం లేదు. దేవస్థానం అర్చకులు నిర్ణీత సమయంలో దేవాలయంలోనే మీ తరపున పూజను నిర్వహిస్తారు.'
      )}</p>
    </div>
  );
}

function ParokshaPaymentSection({ seva, t, heading }) {
  const [details, setDetails] = useState({ devoteeName: '', spouseName: '', childrenNames: '', gotram: '', village: '', contact: '' });
  const [copied, setCopied] = useState(false);
  const poojaName = t(seva.name_english, seva.name_telugu);

  const note = [
    `Pooja: ${poojaName}`,
    details.devoteeName && `Devotee: ${details.devoteeName}`,
    details.spouseName && `Spouse: ${details.spouseName}`,
    details.childrenNames && `Children: ${details.childrenNames}`,
    details.gotram && `Gotram: ${details.gotram}`,
    details.village && `Village: ${details.village}`,
    details.contact && `Contact: ${details.contact}`,
  ].filter(Boolean).join(' | ');

  const copyNote = async () => {
    try { await navigator.clipboard.writeText(note); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const upiLink = `upi://pay?pa=${encodeURIComponent(TEMPLE_UPI_VPA)}&pn=${encodeURIComponent(TEMPLE_UPI_PAYEE)}&cu=INR&am=${encodeURIComponent(seva.base_price)}&tn=${encodeURIComponent(note)}`;

  const fields = [
    ['devoteeName', t('Devotee Name', 'భక్తుని పేరు'), 'input-devotee-name'],
    ['spouseName', t('Spouse Name', 'జీవిత భాగస్వామి పేరు'), 'input-spouse-name'],
    ['childrenNames', t("Children's Names", 'పిల్లల పేర్లు'), 'input-children-names'],
    ['gotram', t('Gotram', 'గోత్రం'), 'input-paroksha-gotram'],
    ['village', t('Village Name', 'గ్రామం పేరు'), 'input-village'],
    ['contact', t('Contact Number', 'సంప్రదింపు నంబరు'), 'input-contact'],
  ];

  return (
    <div className="border-t border-[#E6DCCA] pt-5 mt-6">
      <h2 className={`${heading} text-sm text-[#621B00] mb-1`}>{t('Devotee Details for This Seva', 'ఈ సేవ కొరకు భక్తుని వివరాలు')}</h2>
      <p className="text-xs text-[#8D6E63] mb-4 leading-relaxed">{t(
        "Fill these in, then copy the note below and paste it into your UPI app's Message/Note field when you pay - this is how the temple identifies your payment.",
        'వీటిని పూరించి, క్రింద గల నోట్‌ను కాపీ చేసి, చెల్లించేటప్పుడు మీ UPI యాప్ యొక్క మెసేజ్/నోట్ ఫీల్డ్‌లో అతికించండి - దీని ద్వారానే దేవస్థానం మీ చెల్లింపును గుర్తిస్తుంది.'
      )}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {fields.map(([key, label, testid]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">{label}</label>
            <input
              className="w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm outline-none focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 transition-all text-[#2D1B0E]"
              value={details[key]}
              onChange={e => setDetails({ ...details, [key]: e.target.value })}
              data-testid={testid}
            />
          </div>
        ))}
      </div>

      <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-3 mb-4">
        <p className="text-[10px] text-[#8D6E63] uppercase tracking-wide mb-1">{t('Note to paste in UPI app', 'UPI యాప్‌లో అతికించవలసిన నోట్')}</p>
        <p className="text-xs font-mono text-[#2D1B0E] break-words" data-testid="paroksha-note-text">{note}</p>
        <button type="button" onClick={copyNote} className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#621B00] hover:text-[#C43E00] transition-colors" data-testid="copy-paroksha-note-btn">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? t('Copied', 'కాపీ చేయబడింది') : t('Copy Note', 'నోట్ కాపీ చేయండి')}
        </button>
      </div>

      <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
        <h3 className="font-english-heading text-sm text-[#621B00] mb-1 flex items-center gap-1.5"><Landmark className="h-4 w-4" /> {t('Official Payment Details', 'అధికారిక చెల్లింపు వివరాలు')}</h3>
        <div className="flex flex-col items-center bg-white border border-[#E6DCCA] rounded-xl p-3 my-3">
          <img
            src="/Assets/bank-of-baroda-upi-qr.webp"
            alt={`Official Bank of Baroda UPI QR code for ${TEMPLE_UPI_PAYEE}`}
            className="w-full max-w-[220px] h-auto rounded-lg"
            loading="lazy"
            data-testid="paroksha-upi-qr-code"
          />
          <p className="text-[10px] text-[#8D6E63] mt-2 text-center px-2">{t(
            'Scan with any UPI app (GPay, PhonePe, Paytm, BHIM), then paste the note above into Message/Note before paying.',
            'ఏదైనా UPI యాప్‌తో స్కాన్ చేయండి (GPay, PhonePe, Paytm, BHIM), చెల్లించే ముందు పైన గల నోట్‌ను మెసేజ్/నోట్‌లో అతికించండి.'
          )}</p>
        </div>
        <div className="space-y-2 mb-3">
          <CopyField label={t('Account Name', 'ఖాతా పేరు')} value={TEMPLE_BANK.accountName} />
          <CopyField label={t('Bank & Branch', 'బ్యాంక్ & శాఖ')} value={`${TEMPLE_BANK.bankName}, ${TEMPLE_BANK.branch}`} />
          <CopyField label={t('Account Number', 'ఖాతా సంఖ్య')} value={TEMPLE_BANK.accountNumber} />
          <CopyField label={t('IFSC Code', 'IFSC కోడ్')} value={TEMPLE_BANK.ifsc} />
          <CopyField label={t('UPI ID (VPA)', 'UPI ID (VPA)')} value={TEMPLE_UPI_VPA} />
        </div>
        <a
          href={upiLink}
          className="inline-flex items-center justify-center gap-2 w-full h-10 bg-[#621B00] text-white rounded-full text-xs font-english-heading tracking-wide uppercase hover:bg-[#621B00]/90 transition-all"
          data-testid="paroksha-upi-pay-link"
        >
          <QrCode className="h-4 w-4" /> {t('Pay via UPI App', 'UPI యాప్ ద్వారా చెల్లించండి')}
        </a>
        <p className="text-[10px] text-[#8D6E63] mt-2 leading-relaxed">{t(
          'On mobile, this pre-fills the amount and note automatically. If you scan the QR code image above instead, enter the note manually.',
          'మొబైల్‌లో, ఇది మొత్తం మరియు నోట్‌ను స్వయంచాలకంగా నింపుతుంది. పైన గల క్యూఆర్ కోడ్‌ను స్కాన్ చేస్తే, నోట్‌ను మీరే నమోదు చేయాలి.'
        )}</p>
      </div>
    </div>
  );
}

export default function SevaBooking() {
  const { t, heading } = useT();
  const uid = useId();
  const { sevaId } = useParams();
  const [searchParams] = useSearchParams();
  const isParoksha = searchParams.get('paroksha') === 'true';
  const navigate = useNavigate();
  const [seva, setSeva] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ for_date: '', slot_id: '', gotram: '', number_of_persons: 1, nakshatra: '', rashi: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/sevas/${sevaId}`).then(r => setSeva(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [sevaId]);

  useEffect(() => {
    if (form.for_date && sevaId) {
      api.get(`/slots/available?seva_id=${sevaId}&date=${form.for_date}`).then(r => setSlots(r.data));
    } else { setSlots([]); }
  }, [form.for_date, sevaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        seva_id: sevaId, slot_id: form.slot_id, for_date: form.for_date,
        gotram: form.gotram, number_of_persons: parseInt(form.number_of_persons),
        is_paroksha: isParoksha, nakshatra: form.nakshatra, rashi: form.rashi
      });
      navigate(`/ticket/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed.');
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  if (loading) return <div className="min-h-screen bg-[#FFFCF5]"><Navbar /><div className="text-center py-12 text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</div></div>;
  if (!seva) return <div className="min-h-screen bg-[#FFFCF5]"><Navbar /><div className="text-center py-12 text-red-600">{t('Seva not found', 'సేవ కనబడలేదు')}</div></div>;

  if (BOOKINGS_PAUSED) return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={isParoksha ? '/paroksha-seva' : '/sevas'} className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to Sevas', 'సేవలకు తిరిగి వెళ్ళండి')}
        </Link>
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-8 shadow-sm">
          <div className="border-b border-[#E6DCCA] pb-4 mb-6">
            {isParoksha && <span className="inline-block px-3 py-0.5 bg-[#621B00]/10 text-[#621B00] text-xs rounded-full mb-2">Paroksha Seva / పరోక్ష సేవ</span>}
            <h1 className={`${heading} text-xl text-[#621B00]`} data-testid="booking-seva-name">{t(seva.name_english, seva.name_telugu)}</h1>
            <div className="flex items-center gap-1 text-[#C43E00] font-medium mt-2">
              <IndianRupee className="h-4 w-4" /> {t(`${seva.base_price} per ticket`, `${seva.base_price} ఒక్కో టికెట్‌కు`)}
            </div>
          </div>
          {isParoksha && <ParokshaSevaNote t={t} />}
          {seva.description && <p className="text-sm text-[#5D4037] leading-relaxed mb-4">{seva.description}</p>}
          <div className="flex items-center gap-4 text-xs text-[#8D6E63] mb-6">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {seva.duration_minutes} min</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t(`Max ${seva.max_persons_per_ticket} persons/ticket`, `గరిష్టంగా ${seva.max_persons_per_ticket} మంది/టికెట్`)}</span>
          </div>
          <SamagriSection sevaId={sevaId} t={t} heading={heading} />
          <RegulationsNote t={t} />
          {isParoksha && <ParokshaPaymentSection seva={seva} t={t} heading={heading} />}
          <BookingPausedNotice />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={isParoksha ? '/paroksha-seva' : '/sevas'} className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to Sevas', 'సేవలకు తిరిగి వెళ్ళండి')}
        </Link>
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-8 shadow-sm">
          <div className="border-b border-[#E6DCCA] pb-4 mb-6">
            {isParoksha && <span className="inline-block px-3 py-0.5 bg-[#621B00]/10 text-[#621B00] text-xs rounded-full mb-2">Paroksha Seva / పరోక్ష సేవ</span>}
            <h1 className={`${heading} text-xl text-[#621B00]`} data-testid="booking-seva-name">{t(seva.name_english, seva.name_telugu)}</h1>
            <div className="flex items-center gap-1 text-[#C43E00] font-medium mt-2">
              <IndianRupee className="h-4 w-4" /> {t(`${seva.base_price} per ticket`, `${seva.base_price} ఒక్కో టికెట్‌కు`)}
            </div>
          </div>
          {isParoksha && <ParokshaSevaNote t={t} />}
          <SamagriSection sevaId={sevaId} t={t} heading={heading} />
          <RegulationsNote t={t} />
          {isParoksha && <ParokshaPaymentSection seva={seva} t={t} heading={heading} />}
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 mt-6" data-testid="booking-error">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div>
              <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-seva-0`}>{t('Seva Date', 'సేవ తేదీ')} <span className="text-red-500">*</span></label>
              <input id={`${uid}-seva-0`} type="date" className={inputCls} min={today} value={form.for_date} onChange={e => setForm({...form, for_date: e.target.value, slot_id: ''})} required data-testid="input-date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-time-1`}>{t('Time Slot', 'సమయ స్లాట్')} <span className="text-red-500">*</span></label>
              {!form.for_date ? <p className="text-sm text-[#8D6E63] italic">{t('Please select a date first', 'ముందుగా తేదీని ఎంచుకోండి')}</p> : slots.length === 0 ? <p className="text-sm text-red-600">{t('No slots available', 'స్లాట్‌లు అందుబాటులో లేవు')}</p> : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(slot => (
                    <button key={slot.id} type="button" onClick={() => setForm({...form, slot_id: slot.id})}
                      className={`p-3 rounded-lg border text-sm text-left transition-all ${form.slot_id === slot.id ? 'border-[#C43E00] bg-[#C43E00]/5 text-[#C43E00]' : 'border-[#E6DCCA] hover:border-[#D4AF37] text-[#5D4037]'}`} data-testid={`slot-btn-${slot.id}`}>
                      <div className="font-medium">{slot.start_time} - {slot.end_time}</div>
                      <div className="text-xs mt-1 text-[#8D6E63]">{t(`${slot.remaining_slots} slots left`, `${slot.remaining_slots} స్లాట్‌లు మిగిలాయి`)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5D4037] mb-1">{t('Gotram (required for seva)', 'గోత్రం (సేవ కోసం తప్పనిసరి)')} <span className="text-red-500">*</span></label>
              <input id={`${uid}-time-1`} className={inputCls} value={form.gotram} onChange={e => setForm({...form, gotram: e.target.value})} required data-testid="input-gotram" />
            </div>
            {isParoksha && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-nakshatra-2`}>{t('Nakshatra', 'నక్షత్రం')}</label>
                  <input id={`${uid}-nakshatra-2`} className={inputCls} value={form.nakshatra} onChange={e => setForm({...form, nakshatra: e.target.value})} data-testid="input-nakshatra" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-rashi-3`}>{t('Rashi', 'రాశి')}</label>
                  <input id={`${uid}-rashi-3`} className={inputCls} value={form.rashi} onChange={e => setForm({...form, rashi: e.target.value})} data-testid="input-rashi" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-number-of-4`}>{t('Number of persons', 'వ్యక్తుల సంఖ్య')} <span className="text-red-500">*</span></label>
              <select id={`${uid}-number-of-4`} className={inputCls} value={form.number_of_persons} onChange={e => setForm({...form, number_of_persons: e.target.value})} data-testid="input-persons">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-[#8D2800] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-telugu-body text-[#621B00] leading-relaxed mb-2">ప్రతి టికెట్ గరిష్టంగా 4 మందికి మాత్రమే (2 పెద్దలు + 18 సంవత్సరాల లోపు 2 పిల్లలు) చెల్లుతుంది.</p>
                  <p className="text-[#5D4037] leading-relaxed">Each ticket is valid for a maximum of 4 persons (2 adults and 2 children below 18 years). Children below 18 years included in this ticket do not require a separate ticket.</p>
                </div>
              </div>
            </div>
            <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4">
              <div className="flex items-center justify-between text-[#2D1B0E]">
                <span className="font-medium">Total / <span className="font-telugu-body">మొత్తం</span></span>
                <span className="flex items-center gap-1 text-xl font-bold text-[#C43E00]"><IndianRupee className="h-5 w-5" /> {seva.base_price}</span>
              </div>
              <p className="text-xs text-[#8D6E63] mt-1">{t('Payment: Paid (MOCKED)', 'చెల్లింపు: చెల్లించబడింది (మాక్)')}</p>
            </div>
            <button type="submit" disabled={submitting || !form.slot_id} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="confirm-booking-btn">
              {submitting ? t('Booking...', 'బుక్ చేస్తోంది...') : t('Confirm & Pay', 'ధృవీకరించి చెల్లించండి')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
