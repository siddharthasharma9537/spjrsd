import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Printer, Clock } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';

/* Condensed, single-line version of the "note to devotees" disclaimer in
   Footer.jsx - the full paragraph would take too long to read as a scroll.
   Keep the two in sync on meaning if either changes. */
function UnofficialTicker() {
  const { t } = useT();
  const line = t(
    'A note to devotees: this is an independent, informational website — not an official channel of the temple or the Telangana Endowments Department. For official bookings, donations or confirmations, call the temple office on +91 94910 00701.',
    'భక్తులకు మనవి: ఇది స్వతంత్ర, సమాచార వెబ్‌సైట్ — దేవస్థానం లేదా తెలంగాణ దేవాదాయ ధర్మాదాయ శాఖ యొక్క అధికారిక మాధ్యమం కాదు. అధికారిక బుకింగ్‌లు, విరాళాలు లేదా ధృవీకరణల కొరకు దేవస్థాన కార్యాలయం +91 94910 00701 నందు సంప్రదించండి.'
  );
  return (
    <div className="bg-[#D4AF37]/15 border-b border-[#D4AF37]/25 overflow-hidden" data-testid="unofficial-ticker">
      <div className="whitespace-nowrap py-1">
        <span className="inline-block animate-marquee">
          <span className="text-[11px] text-[#621B00] mx-8">{line}</span>
          <span className="text-[11px] text-[#621B00] mx-8">{line}</span>
        </span>
      </div>
    </div>
  );
}

export default function TopStrip() {
  const { t } = useT();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <UnofficialTicker />
      <div className="bg-[#2D1B0E] text-[#FFE0B2]/80 text-xs" data-testid="top-strip">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {' '}
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/media/live-tv" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors" data-testid="live-tv-link">
            <Tv className="h-3 w-3" />
            <span className="hidden sm:inline">{t('Live TV', 'లైవ్ టీవీ')}</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </Link>
          <Link to="/print-ticket" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors" data-testid="top-print-ticket">
            <Printer className="h-3 w-3" />
            <span className="hidden sm:inline">{t('Print Ticket', 'టికెట్ ప్రింట్')}</span>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
