import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useT } from '@/contexts/LanguageContext';
import { Sun, Sunrise, Sunset, ChevronRight } from 'lucide-react';

export default function PanchangamWidget() {
  const { t, heading } = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/panchangam/today').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const rows = [
    { label: t('Tithi', 'తిథి'), value: t(data.tithi, data.tithi_telugu) },
    { label: t('Nakshatra', 'నక్షత్రం'), value: t(data.nakshatra, data.nakshatra_telugu) },
    { label: t('Paksha', 'పక్షం'), value: t(data.paksha, data.paksha_telugu) },
    { label: t('Masam', 'మాసం'), value: t(data.masa, data.masa_telugu) },
  ].filter(r => r.value);

  return (
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
            <dd className="text-sm text-[#2D1B0E] font-medium">{r.value}</dd>
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
  );
}
