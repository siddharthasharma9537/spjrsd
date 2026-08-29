import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, Eye, Calendar, IndianRupee } from 'lucide-react';

export default function MyBookings() {
  const { t, heading } = useT();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    api.get('/bookings/my').then(r => setBookings(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const statusColors = {
    Confirmed: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    NoShow: 'bg-gray-100 text-gray-800',
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
            <Link to="/sevas" className="hover:text-[#D4AF37]">{t('Book Seva', 'సేవ బుక్ చేయండి')}</Link>
            <Link to="/my-family" className="hover:text-[#D4AF37]">{t('My Family', 'నా కుటుంబం')}</Link>
            <button onClick={logout} className="text-[#FFE0B2] hover:text-white">{t('Logout', 'లాగ్ అవుట్')}</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/sevas" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to Sevas', 'సేవలకు తిరిగి వెళ్ళండి')}
        </Link>
        <h1 className={`${heading} text-2xl text-[#621B00] mb-1`} data-testid="my-bookings-title">{t("My Bookings", "నా బుకింగ్‌లు")}</h1>

        {loading ? (
          <p className="text-center py-12 text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8D6E63] mb-4">{t('No bookings yet', 'ఇంకా బుకింగ్‌లు లేవు')}</p>
            <Link to="/sevas" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C43E00] text-white rounded-full font-english-heading text-sm tracking-wide uppercase hover:bg-[#C43E00]/90 transition-all">{t('Book a Seva', 'ఒక సేవను బుక్ చేయండి')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all" data-testid={`booking-card-${b.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-english-heading text-sm text-[#2D1B0E]">{b.seva_name_english}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#8D6E63]">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.for_date}</span>
                      <span>{b.slot_start_time} - {b.slot_end_time}</span>
                      <span>{t('Gotram', 'గోత్రం')}: {b.gotram}</span>
                      <span>{t(`${b.number_of_persons} person(s)`, `${b.number_of_persons} వ్యక్తి(లు)`)}</span>
                      <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{b.amount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}`}>{b.status}</span>
                    <Link to={`/ticket/${b.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#621B00] text-white text-xs rounded-full hover:bg-[#621B00]/90 transition-all" data-testid={`view-ticket-${b.id}`}>
                      <Eye className="h-3.5 w-3.5" /> {t('View Ticket', 'టికెట్ చూడండి')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
