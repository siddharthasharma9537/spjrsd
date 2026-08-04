import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Printer, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TopStrip() {
  const [time, setTime] = useState(new Date());
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
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
          {/* Compact segmented toggle - the full-word <select> was far too wide
              for a 32px utility strip. */}
          <div
            role="group"
            aria-label="Site language"
            className="flex items-center rounded-full bg-black/25 p-0.5"
            data-testid="language-selector"
          >
            {[
              { code: 'en', label: 'En', full: 'English' },
              { code: 'te', label: 'తె', full: 'తెలుగు' },
            ].map(({ code, label, full }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                aria-label={full}
                title={full}
                className={`px-2 py-0.5 rounded-full text-xs leading-5 transition-colors ${
                  lang === code
                    ? 'bg-[#D4AF37] text-[#2A1800] font-medium'
                    : 'text-[#FFE0B2]/70 hover:text-[#FFE0B2]'
                }`}
                data-testid={`lang-${code}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link to="/media/live-tv" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors" data-testid="live-tv-link">
            <Tv className="h-3 w-3" />
            <span className="hidden sm:inline">Live TV</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </Link>
          <Link to="/print-ticket" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors" data-testid="top-print-ticket">
            <Printer className="h-3 w-3" />
            <span className="hidden sm:inline">Print Ticket</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
