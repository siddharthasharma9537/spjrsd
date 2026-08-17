import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";
import { Zap, Flame, IndianRupee, ChevronRight, Clock } from 'lucide-react';
import { BOOKINGS_PAUSED } from '@/lib/bookingStatus';

export default function QuickBooking() {
  const { t, heading } = useT();
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { user, userType } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sevas').then(r => setSevas(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className={`${heading} text-2xl md:text-3xl text-[#621B00] mb-1`} data-testid="quick-booking-title">{t("Quick Booking", "త్వరిత బుకింగ్")}</h1>
          <p className="text-sm text-[#5D4037] mt-2">{t('Select a seva below to quickly book your slot', 'మీ స్లాట్‌ను త్వరగా బుక్ చేయడానికి క్రింద ఒక సేవను ఎంచుకోండి')}</p>
        </div>
        {!user && (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-[#621B00]">{t('Please', 'దయచేసి')} <Link to="/login" className="text-[#C43E00] font-medium underline">{t('sign in', 'సైన్ ఇన్ చేయండి')}</Link> {t('first to book a seva.', 'ముందుగా చేసి సేవ బుక్ చేయండి.')}</p>
          </div>
        )}
        {loading ? <p className="text-center text-[#8D6E63]">{t('Loading sevas...', 'సేవలు లోడ్ అవుతున్నాయి...')}</p> : sevas.length === 0 ? (
          <LoadState error={loadError} emptyText={t('No sevas are available for booking right now.', 'ప్రస్తుతం బుకింగ్ కోసం సేవలు అందుబాటులో లేవు.')} />
        ) : (
          <div className="space-y-3">
            {sevas.map(seva => (
              <div key={seva.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4AF37]/50 transition-all" data-testid={`quick-seva-${seva.id}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#C43E00]/10 rounded-full flex items-center justify-center shrink-0">
                    <Flame className="h-5 w-5 text-[#C43E00]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2D1B0E] text-sm">{t(seva.name_english, seva.name_telugu)}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#8D6E63] mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {seva.duration_minutes} min</span>
                      <span>{t(`Max ${seva.max_persons_per_ticket} persons`, `గరిష్టంగా ${seva.max_persons_per_ticket} మంది`)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-0.5 text-lg font-bold text-[#C43E00]"><IndianRupee className="h-4 w-4" />{seva.base_price}</span>
                  {BOOKINGS_PAUSED ? (
                    <Link to={`/book/${seva.id}`} className="inline-flex items-center gap-1 px-5 py-2 border-2 border-[#C43E00] text-[#C43E00] text-sm rounded-full hover:bg-[#C43E00]/5 transition-all" data-testid={`quick-info-${seva.id}`}>
                      {t('More Info', 'మరిన్ని వివరాలు')}
                    </Link>
                  ) : user && userType === 'devotee' ? (
                    <Link to={`/book/${seva.id}`} className="inline-flex items-center gap-1 px-5 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid={`quick-book-${seva.id}`}>
                      {t('Book', 'బుక్ చేయండి')} <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/login" className="inline-flex items-center gap-1 px-5 py-2 border-2 border-[#C43E00] text-[#C43E00] text-sm rounded-full">{t('Sign In', 'సైన్ ఇన్')}</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
