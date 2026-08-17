import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useT } from '@/contexts/LanguageContext';
import { stripLeadingName } from '@/lib/panchangam';
import { Sun, Sunrise, Sunset, ChevronRight, Moon, CircleDot, CalendarClock } from 'lucide-react';

/* "2026-08-21" -> "21 Aug" - short enough to sit next to a time on one line.
   Kept in en-IN regardless of the site language: Gregorian month names have
   no standard Telugu short form, and browsers render te-IN month
   abbreviations inconsistently. */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function PanchangamWidget() {
  const { t, heading } = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitions, setTransitions] = useState(null);

  useEffect(() => {
    api.get('/panchangam/today').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/panchangam/next-purnima-amavasya').then(r => setTransitions(r.data)).catch(() => {});
  }, []);

  if (loading || !data) return null;

  const rows = [
    { label: t('Tithi', 'తిథి'), value: t(data.tithi, data.tithi_telugu), timing: stripLeadingName(data.tithi_timing, [data.tithi, data.tithi_telugu]) },
    { label: t('Nakshatra', 'నక్షత్రం'), value: t(data.nakshatra, data.nakshatra_telugu), timing: stripLeadingName(data.nakshatra_timing, [data.nakshatra, data.nakshatra_telugu]) },
    { label: t('Paksha', 'పక్షం'), value: t(data.paksha, data.paksha_telugu) },
    { label: t('Masam', 'మాసం'), value: t(data.masa, data.masa_telugu) },
    { label: t('Varjyam', 'వర్జ్యం'), value: data.varjyam },
    { label: t('Durmuhurtham', 'దుర్ముహూర్తం'), value: data.durmuhurtham },
  ].filter(r => r.value);

  // Whichever of Pournami/Amavasya falls sooner is listed first.
  const transitionCards = transitions
    ? [
        transitions.purnima && { key: 'purnima', icon: Moon, label: t('Pournami', 'పౌర్ణమి'), ...transitions.purnima },
        transitions.amavasya && { key: 'amavasya', icon: CircleDot, label: t('Amavasya', 'అమావాస్య'), ...transitions.amavasya },
      ].filter(Boolean).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid="panchangam-widget">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`${heading} text-sm text-[#621B00] flex items-center gap-2`}>
            <Sun className="h-4 w-4 text-[#D4AF37]" /> {t("Today's Panchangam", 'నేటి పంచాంగం')}
          </h3>
          <Link to="/panchangam" className="text-xs text-[#C43E00] hover:underline flex items-center gap-0.5" data-testid="panchangam-widget-link">
            {t('More', 'మరిన్ని')} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-[#8D6E63] mb-3">{new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
          {rows.map((r, i) => (
            <div key={i}>
              <dt className="text-[10px] uppercase tracking-wide text-[#8D6E63]">{r.label}</dt>
              <dd className="text-sm text-[#2D1B0E] font-medium">
                {r.value}
                {r.timing && <span className="block text-[11px] font-normal text-[#8D6E63]">{t('until', 'వరకు')} {r.timing}</span>}
              </dd>
            </div>
          ))}
        </dl>
        {(data.sunrise || data.sunset) && (
          <div className="flex items-center gap-4 pt-3 border-t border-[#E6DCCA] text-xs text-[#5D4037]">
            {data.sunrise && <span className="flex items-center gap-1"><Sunrise className="h-3.5 w-3.5 text-[#D4AF37]" /> {data.sunrise}</span>}
            {data.sunset && <span className="flex items-center gap-1"><Sunset className="h-3.5 w-3.5 text-[#C43E00]" /> {data.sunset}</span>}
          </div>
        )}
      </div>

      {transitionCards.length > 0 && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid="upcoming-tithi-card">
          <h3 className={`${heading} text-sm text-[#621B00] flex items-center gap-2 mb-3`}>
            <CalendarClock className="h-4 w-4 text-[#D4AF37]" /> {t('Up Coming', 'రాబోయేవి')}
          </h3>
          <div className="space-y-3">
            {transitionCards.map(c => (
              <div key={c.key} className="flex items-start gap-2">
                <c.icon className="h-3.5 w-3.5 mt-0.5 text-[#D4AF37] shrink-0" />
                <div className="text-xs text-[#5D4037] min-w-0">
                  <span className="font-medium text-[#2D1B0E] text-sm">{c.label}</span>
                  {c.start_date && (
                    <span className="block">{t('Starts', 'ప్రారంభం')}: {formatShortDate(c.start_date)}{c.start_time ? `, ${c.start_time}` : ''}</span>
                  )}
                  <span className="block">{t('Ends', 'ముగింపు')}: {formatShortDate(c.date)}{c.end_time ? `, ${c.end_time}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
