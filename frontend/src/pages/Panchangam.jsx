import { useState, useEffect } from 'react';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from '@/contexts/LanguageContext';
import { stripLeadingName } from '@/lib/panchangam';
import { Sun, Sunrise, Sunset, AlertCircle, Calendar } from 'lucide-react';

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export default function Panchangam() {
  const { t, heading } = useT();
  const [date, setDate] = useState(toISODate(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get('/panchangam', { params: { date } })
      .then(r => setData(r.data))
      .catch(() => { setData(null); setNotFound(true); })
      .finally(() => setLoading(false));
  }, [date]);

  const details = data ? [
    { label: t('Vaaram (Day)', 'వారం'), value: t(data.vaaram, data.vaaram_telugu) },
    { label: t('Masam (Month)', 'మాసం'), value: t(data.masa, data.masa_telugu) },
    { label: t('Paksha', 'పక్షం'), value: t(data.paksha, data.paksha_telugu) },
    { label: t('Tithi', 'తిథి'), value: t(data.tithi, data.tithi_telugu), sub: stripLeadingName(data.tithi_timing, [data.tithi, data.tithi_telugu]) },
    { label: t('Nakshatra', 'నక్షత్రం'), value: t(data.nakshatra, data.nakshatra_telugu), sub: stripLeadingName(data.nakshatra_timing, [data.nakshatra, data.nakshatra_telugu]) },
    { label: t('Yoga', 'యోగం'), value: t(data.yoga, data.yoga_telugu) },
    { label: t('Karana', 'కరణం'), value: t(data.karana, data.karana_telugu) },
  ].filter(d => d.value) : [];

  const timings = data ? [
    { label: t('Sunrise', 'సూర్యోదయం'), value: data.sunrise, icon: Sunrise },
    { label: t('Sunset', 'సూర్యాస్తమయం'), value: data.sunset, icon: Sunset },
    { label: t('Rahu Kalam', 'రాహు కాలం'), value: data.rahu_kalam },
    { label: t('Yamagandam', 'యమగండం'), value: data.yamagandam },
    { label: t('Gulika Kalam', 'గుళిక కాలం'), value: data.gulika_kalam },
    { label: t('Abhijit Muhurtam', 'అభిజిత్ ముహూర్తం'), value: data.abhijit_muhurtam },
    { label: t('Varjyam', 'వర్జ్యం'), value: data.varjyam },
    { label: t('Durmuhurtham', 'దుర్ముహూర్తం'), value: data.durmuhurtham },
  ].filter(d => d.value) : [];

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 flex items-center justify-center mx-auto mb-4">
            <Sun className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="panchangam-title">{t('Daily Panchangam', 'దైనిక పంచాంగం')}</h1>
          <p className="text-sm text-[#5D4037] mt-2">{t('Tithi, Nakshatra and auspicious timings for Cheruvugattu', 'చెరువుగట్టు కొరకు తిథి, నక్షత్రం మరియు శుభ సమయాలు')}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Calendar className="h-4 w-4 text-[#8D6E63]" />
          <input
            type="date"
            value={date}
            max={toISODate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))}
            onChange={e => setDate(e.target.value)}
            className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#2D1B0E] focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none"
            data-testid="panchangam-date-input"
          />
        </div>

        {loading ? (
          <p className="text-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
        ) : notFound || !data ? (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-10 text-center" data-testid="panchangam-not-found">
            <AlertCircle className="h-8 w-8 text-[#8D6E63] mx-auto mb-3" />
            <p className="text-[#5D4037]">{t('Panchangam details for this date are not available yet.', 'ఈ తేదీకి పంచాంగం వివరాలు ఇంకా అందుబాటులో లేవు.')}</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="panchangam-details">
            <div className="bg-white border border-[#E6DCCA] rounded-xl p-6">
              <p className="text-xs text-[#8D6E63] mb-4 text-center">{new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                {details.map((d, i) => (
                  <div key={i}>
                    <dt className="text-[10px] uppercase tracking-wide text-[#8D6E63] mb-0.5">{d.label}</dt>
                    <dd className="text-sm text-[#2D1B0E] font-medium">{d.value}</dd>
                    {d.sub && <dd className="text-xs text-[#8D6E63] mt-0.5">{d.sub}</dd>}
                  </div>
                ))}
              </dl>
            </div>

            {timings.length > 0 && (
              <div className="bg-white border border-[#E6DCCA] rounded-xl p-6">
                <h2 className="font-english-heading text-sm text-[#621B00] mb-4 uppercase tracking-wide">{t('Auspicious & Inauspicious Timings', 'శుభ, అశుభ సమయాలు')}</h2>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                  {timings.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {d.icon && <d.icon className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />}
                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-[#8D6E63] mb-0.5">{d.label}</dt>
                        <dd className="text-sm text-[#2D1B0E] font-medium">{d.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {(data.special_note || data.special_note_telugu) && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl p-5">
                <p className="text-sm text-[#621B00]">{t(data.special_note, data.special_note_telugu)}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
