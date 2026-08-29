import { useState, useEffect , useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { useT } from "@/contexts/LanguageContext";
import { ArrowLeft, IndianRupee, CheckCircle, Users, BedDouble } from 'lucide-react';
import { BOOKINGS_PAUSED } from '@/lib/bookingStatus';
import BookingPausedNotice from '@/components/BookingPausedNotice';

export default function AccommodationBooking() {
  const { t, heading } = useT();
  const uid = useId();
  const { accId } = useParams();
  const navigate = useNavigate();
  const [acc, setAcc] = useState(null);
  const [form, setForm] = useState({ check_in_date: '', check_out_date: '', num_rooms: 1, num_guests: 1, special_requests: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get(`/accommodations/${accId}`).then(r => setAcc(r.data));
  }, [accId]);

  const today = new Date().toISOString().split('T')[0];
  const numDays = form.check_in_date && form.check_out_date ? Math.max(1, Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000)) : 0;
  const totalAmount = acc ? acc.price_per_day * form.num_rooms * numDays : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/accommodation-bookings', { accommodation_id: accId, ...form, num_rooms: parseInt(form.num_rooms), num_guests: parseInt(form.num_guests) });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || t('Booking failed', 'బుకింగ్ విఫలమైంది'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  if (!acc) return <div className="min-h-screen bg-[#FFFCF5]"><Navbar /><p className="text-center py-12 text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p></div>;

  if (BOOKINGS_PAUSED) return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/accommodation" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to Accommodation', 'వసతికి తిరిగి వెళ్ళండి')}
        </Link>
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-8 shadow-sm">
          <div className="border-b border-[#E6DCCA] pb-4 mb-6">
            <h1 className="font-english-heading text-xl text-[#621B00]" data-testid="acc-booking-name">{acc.name}</h1>
            <div className="flex items-center gap-1 text-[#C43E00] font-medium mt-2">
              <IndianRupee className="h-4 w-4" /> {t(`${acc.price_per_day} / day`, `${acc.price_per_day} / రోజుకు`)}
            </div>
          </div>
          {acc.description && <p className="text-sm text-[#5D4037] leading-relaxed mb-4">{acc.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#8D6E63] mb-4">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t('Capacity', 'సామర్థ్యం')}: {acc.capacity}</span>
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {t(`${acc.total_rooms} rooms`, `${acc.total_rooms} గదులు`)}</span>
            <span>{acc.room_type}</span>
          </div>
          {acc.amenities && (
            <div className="flex flex-wrap gap-2 mb-6">
              {acc.amenities.split(',').map((a, j) => (
                <span key={j} className="px-2 py-0.5 bg-[#FDFBF7] border border-[#E6DCCA] rounded text-xs text-[#5D4037]">{a.trim()}</span>
              ))}
            </div>
          )}
          <BookingPausedNotice />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/accommodation" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to Accommodation', 'వసతికి తిరిగి వెళ్ళండి')}
        </Link>

        {success ? (
          <div className="bg-white border border-green-200 rounded-xl p-8 text-center" data-testid="acc-booking-success">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="font-english-heading text-xl text-[#621B00] mb-2">{t('Accommodation Booked!', 'వసతి బుక్ చేయబడింది!')}</h2>
            <p className="text-sm text-[#5D4037] mb-1">{t('Booking #', 'బుకింగ్ #')}: <span className="font-mono font-bold">{success.booking_number}</span></p>
            <p className="text-sm text-[#5D4037]">{success.accommodation_name} ({success.room_type})</p>
            <p className="text-sm text-[#5D4037]">{t(`${success.check_in_date} to ${success.check_out_date} (${success.num_days} days)`, `${success.check_in_date} నుండి ${success.check_out_date} వరకు (${success.num_days} రోజులు)`)}</p>
            <p className="text-lg font-bold text-[#C43E00] mt-2">Rs. {success.amount}</p>
            <p className="text-xs text-[#8D6E63] mt-1 mb-4">{t('Payment: Paid (MOCKED)', 'చెల్లింపు: చెల్లించబడింది (మాక్)')}</p>
            <Link to="/my-bookings" className="inline-block px-6 py-2 bg-[#C43E00] text-white rounded-full text-sm">{t('My Bookings', 'నా బుకింగ్‌లు')}</Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-8 shadow-sm" data-testid="acc-booking-form">
            <div className="border-b border-[#E6DCCA] pb-4 mb-6">
              <h1 className="font-english-heading text-xl text-[#621B00]" data-testid="acc-booking-name">{acc.name}</h1>

              <p className="text-sm text-[#5D4037] mt-1">{acc.room_type} | {t('Capacity', 'సామర్థ్యం')}: {acc.capacity} | Rs. {acc.price_per_day}{t('/day', '/రోజుకు')}</p>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-check-0`}>{t('Check-in', 'చెక్-ఇన్')} <span className="text-red-500">*</span></label>
                  <DateInput id={`${uid}-check-0`} className={inputCls} min={today} value={form.check_in_date} onChange={v => setForm({...form, check_in_date: v})} required data-testid="input-checkin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-check-1`}>{t('Check-out', 'చెక్-అవుట్')} <span className="text-red-500">*</span></label>
                  <DateInput id={`${uid}-check-1`} className={inputCls} min={form.check_in_date || today} value={form.check_out_date} onChange={v => setForm({...form, check_out_date: v})} required data-testid="input-checkout" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-no-of-2`}>{t('No. of Rooms', 'గదుల సంఖ్య')}</label>
                  <select id={`${uid}-no-of-2`} className={inputCls} value={form.num_rooms} onChange={e => setForm({...form, num_rooms: e.target.value})} data-testid="input-rooms">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-no-of-3`}>{t('No. of Guests', 'అతిథుల సంఖ్య')}</label>
                  <select id={`${uid}-no-of-3`} className={inputCls} value={form.num_guests} onChange={e => setForm({...form, num_guests: e.target.value})} data-testid="input-guests">
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-special-4`}>{t('Special Requests', 'ప్రత్యేక అభ్యర్థనలు')}</label>
                <textarea id={`${uid}-special-4`} className={`${inputCls} h-20 py-3`} value={form.special_requests} onChange={e => setForm({...form, special_requests: e.target.value})} />
              </div>
              {numDays > 0 && (
                <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5D4037]">{t(`Rs. ${acc.price_per_day} x ${form.num_rooms} room(s) x ${numDays} day(s)`, `Rs. ${acc.price_per_day} x ${form.num_rooms} గది(లు) x ${numDays} రోజు(లు)`)}</span>
                    <span className="flex items-center gap-1 text-xl font-bold text-[#C43E00]"><IndianRupee className="h-5 w-5" /> {totalAmount}</span>
                  </div>
                </div>
              )}
              <button type="submit" disabled={submitting || numDays < 1} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="confirm-acc-booking-btn">
                {submitting ? t('Booking...', 'బుక్ చేస్తోంది...') : t('Confirm Booking', 'బుకింగ్ ధృవీకరించండి')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
