import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useT } from '@/contexts/LanguageContext';
import { Flame } from 'lucide-react';

/* Days since a known new moon (Jan 6 2000, ~18:14 UTC) divided by the
   synodic month length. Accurate to well within a day - plenty for an
   illustrative icon, not an ephemeris. */
function getMoonPhase(date = new Date()) {
  const synodicMonth = 29.53058867;
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  let daysSinceNew = (julianDate - 2451550.1) % synodicMonth;
  if (daysSinceNew < 0) daysSinceNew += synodicMonth;
  const phase = daysSinceNew / synodicMonth; // 0 = new, 0.5 = full
  const illuminated = (1 - Math.cos(2 * Math.PI * phase)) / 2; // 0..1
  return { illuminated, waxing: phase < 0.5 };
}

/* Two same-size discs, one shifted over the other - the classic CSS moon-icon
   trick. Not a true terminator ellipse, but a convincing crescent/gibbous at
   icon size, and cheap: no canvas/SVG math needed. */
function MoonIcon({ size = 52 }) {
  const { illuminated, waxing } = getMoonPhase();
  const shift = (waxing ? -1 : 1) * illuminated * size;
  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0"
      style={{ width: size, height: size, background: '#E8E3D8' }}
      aria-hidden="true"
    >
      <div
        className="absolute top-0 rounded-full"
        style={{ width: size, height: size, background: '#161022', transform: `translateX(${shift}px)` }}
      />
    </div>
  );
}

export default function PanchangamAppWidget() {
  const { t } = useT();
  const [data, setData] = useState(null);
  const [festivals, setFestivals] = useState([]);

  useEffect(() => {
    api.get('/panchangam/today').then(r => setData(r.data)).catch(() => {});
    api.get('/panchangam/upcoming-festivals').then(r => setFestivals(r.data || [])).catch(() => {});
  }, []);

  if (!data) return null;

  const today = new Date(data.date);
  const isToday = (d) => d === data.date;

  const line1 = [data.masa, data.paksha, data.tithi].filter(Boolean).join(' ')
    + (data.tithi_timing ? `: ${data.tithi_timing}` : '');
  const line2 = [data.vaaram, data.nakshatra].filter(Boolean).join(', ')
    + (data.nakshatra_timing ? `: ${data.nakshatra_timing}` : '');

  return (
    <div
      className="relative rounded-3xl bg-[#161022] text-white p-5 shadow-xl max-w-sm w-full mx-auto"
      data-testid="panchangam-app-widget"
    >
      <span className="absolute top-4 right-4 flex items-center justify-center h-7 w-7 rounded-full bg-[#C43E00]" aria-hidden="true">
        <Flame className="h-3.5 w-3.5 text-[#FFE0B2]" />
      </span>

      <div className="flex items-start gap-4">
        <div className="text-center shrink-0 leading-none">
          <p className="text-[#F5D061] text-3xl font-bold">{today.getDate()}</p>
          <p className="text-[#F5D061] text-sm font-medium uppercase">{today.toLocaleDateString('en-IN', { month: 'short' })}</p>
          <p className="text-white/50 text-[10px] uppercase tracking-wide mt-1">{today.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5 pt-0.5 pr-8">
          {festivals.length > 0 ? festivals.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-white/90">{t(f.special_note, f.special_note_telugu)}</span>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${isToday(f.date) ? 'bg-[#F5D061] text-[#2A1800]' : 'bg-white/10 text-white/70'}`}>
                {isToday(f.date) ? t('Today', 'నేడు') : new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )) : (
            <p className="text-xs text-white/50">{t('No upcoming festivals listed', 'రాబోయే పండుగలు లేవు')}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
        <MoonIcon />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-telugu-heading text-sm text-[#F5D061]">{t('Panchangam', 'పంచాంగం')}</span>
          </div>
          <p className="text-[11px] text-white/70 truncate">{line1}</p>
          <p className="text-[11px] text-white/70 truncate">{line2}</p>
        </div>
      </div>

      <Link to="/panchangam" className="block text-center text-[10px] text-white/40 hover:text-white/70 mt-4 pt-3 border-t border-white/10 uppercase tracking-wide" data-testid="panchangam-app-widget-link">
        {t('SPJR Devasthanams', 'శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం')}
      </Link>
    </div>
  );
}
