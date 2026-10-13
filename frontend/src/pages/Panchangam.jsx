import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MoonPhase from '@/components/MoonPhase';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { useT } from '@/contexts/LanguageContext';
import { stripLeadingName, formatTiming, tithiNumber, karanaEnd } from '@/lib/panchangam';
import { Sun, AlertCircle, Calendar, Info, ChevronDown, ChevronUp } from 'lucide-react';

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

/* "2026-10-19" -> "19 Oct", kept in en-IN in both languages as the homepage widget does. */
function shortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* One of the six cards: a title, an (i) button that opens a short explanation, and its rows. */
function Card({ title, info, testid, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={testid}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-english-heading text-sm text-[#621B00] uppercase tracking-wide">{title}</h2>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="About"
                className="text-[#8D6E63] hover:text-[#C43E00] p-1 rounded-full">
          <Info className="h-4 w-4" />
        </button>
      </div>
      {open && <p className="text-xs text-[#5D4037] bg-[#FFFCF5] border border-[#E6DCCA] rounded-lg px-3 py-2 mb-3">{info}</p>}
      {children}
    </section>
  );
}

/* label / value rows; a row without a value is left out, so older entries without the newer fields still show what they have. */
function Rows({ rows }) {
  return (
    <dl className="space-y-2.5">
      {rows.filter(r => r.value).map((r, i) => (
        <div key={i} className="grid grid-cols-[8.5rem_1fr] gap-3 items-baseline">
          <dt className="text-xs text-[#C43E00] font-medium">{r.label}</dt>
          <dd className="text-sm text-[#2D1B0E] break-words">
            {r.value}
            {r.sub && <span className="block text-xs text-[#8D6E63] mt-0.5">{r.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function Panchangam() {
  const { t, te, heading } = useT();
  // ?date=YYYY-MM-DD opens a given day (used by the homepage ticker's "Tomorrow: ..." reminders).
  const [params] = useSearchParams();
  const [date, setDate] = useState(() => /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date') : toISODate(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [sankalpamOpen, setSankalpamOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get('/panchangam', { params: { date } })
      .then(r => setData(r.data))
      .catch(() => { setData(null); setNotFound(true); })
      .finally(() => setLoading(false));
    api.get('/panchangam/upcoming', { params: { date, limit: 6 } })
      .then(r => setUpcoming(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUpcoming([]));
  }, [date]);

  const en = !te;
  // The newer fields come in both languages; an older entry may have only one, so either falls back to the other.
  const name = (english, telugu) => t(english || telugu, telugu || english);
  const timing = (text, names) => formatTiming(names ? stripLeadingName(text, names) : text, en);
  const until = text => text && t(`until ${text}`, `${text} వరకు`);
  const join = (...parts) => parts.filter(Boolean).join(', ');

  let page = null;
  if (data) {
    const d = data;
    const number = tithiNumber(d.tithi);
    const masaShort = (d.masa_telugu || '').replace(/ము$/, '');
    const vasaraShort = (d.vasara_telugu || '').replace(/\s*వాసరః$/, '');
    const karanas = Array.isArray(d.karanas) && d.karanas.length
      ? d.karanas.map(k => `${name(k.name, k.name_telugu)} ${until(karanaEnd(k, d.date, en))}`).join('; ')
      : name(d.karana, d.karana_telugu);
    const tithiEnd = timing(d.tithi_timing, [d.tithi, d.tithi_telugu]);
    const nakshatraEnd = timing(d.nakshatra_timing, [d.nakshatra, d.nakshatra_telugu]);
    const moonEnd = timing(d.moon_rashi_timing, [d.moon_rashi, d.moon_rashi_telugu]);
    const yogaEnd = timing(d.yoga_timing, [d.yoga, d.yoga_telugu]);

    const panchanga = [
      { label: t('Samvatsara', 'సం.'), value: join(name(d.samvatsara && `${d.samvatsara} Samvatsara`, d.samvatsara_telugu && `${d.samvatsara_telugu}నామ సంవత్సరః`), name(d.ayana, d.ayana_telugu)) },
      { label: t('Masa', 'మాసః'), value: join(name(d.ritu && `${d.ritu} Ritu`, d.ritu_telugu && `${d.ritu_telugu} ఋతువు`), name(d.masa, d.masa_telugu)) },
      { label: t('Tithi', 'తిథిః'), value: name(d.tithi, d.tithi_telugu), sub: join(name(d.paksha, d.paksha_telugu), until(tithiEnd)) },
      { label: t('Vasara', 'వాసరః'), value: name(d.vasara || d.vaaram, d.vasara_telugu || d.vaaram_telugu) },
      { label: t('Nakshatra', 'నక్షత్రః'), value: name(d.nakshatra, d.nakshatra_telugu), sub: until(nakshatraEnd) },
      { label: t('Solar month', 'సౌర మాసః'), value: name(d.sauramana_masa, d.sauramana_masa_telugu) },
      { label: t('Day', 'దివసః'), value: d.sunrise && d.sunset ? `${d.sunrise} – ${d.sunset}` : '', sub: t('Sunrise – Sunset', 'సూర్యోదయం – సూర్యాస్తమయం') },
    ];
    const muhurtas = [
      { label: t('Amrita Kalam', 'అమృత కాలం'), value: timing(d.amrita_kalam) },
      { label: t('Abhijit Muhurtam', 'అభిజిత్ ముహూర్తం'), value: timing(d.abhijit_muhurtam) },
      { label: t('Varjyam', 'వర్జ్యం'), value: timing(d.varjyam) },
      { label: t('Durmuhurtham', 'దుర్ముహూర్తం'), value: timing(d.durmuhurtham) },
      { label: t('Rahu Kalam', 'రాహు కాలం'), value: timing(d.rahu_kalam) },
      { label: t('Yamagandam', 'యమగండం'), value: timing(d.yamagandam) },
      { label: t('Gulika Kalam', 'గుళిక కాలం'), value: timing(d.gulika_kalam) },
    ];
    const times = [
      { label: t('Moon sign', 'రాశి'), value: name(d.moon_rashi, d.moon_rashi_telugu), sub: until(moonEnd) },
      // Brahma Muhurtam is the end of the night before this day's sunrise, so its "రా తె" is this morning, not the next.
      { label: t('Brahma Muhurtam', 'బ్రహ్మ ముహూర్తం'), value: timing(d.brahma_muhurtam).replace(' (next day)', '') },
      { label: t('Pratah Sandhya', 'ప్రాతః సంధ్య'), value: timing(d.pratah_sandhya) },
      { label: t('Madhyahna Sandhya', 'మాధ్యాహ్న సంధ్య'), value: timing(d.madhyahna_sandhya) },
      { label: t('Sayam Sandhya', 'సాయం సంధ్య'), value: timing(d.sayam_sandhya) },
      { label: t('Pradosha Kalam', 'ప్రదోష కాలం'), value: timing(d.pradosha_kalam) },
    ];
    const more = [
      { label: t('Purnimanta month', 'పూర్ణిమాంత మాసః'), value: name(d.purnimanta_masa, d.purnimanta_masa_telugu) },
      { label: t('Amanta month', 'అమాంత మాసః'), value: name(d.masa, d.masa_telugu) },
      { label: t('Solar month', 'సౌరమాన మాసః'), value: name(d.sauramana_masa, d.sauramana_masa_telugu) },
      { label: t('Samvatsara', 'సంవత్సరః'), value: name(d.samvatsara, d.samvatsara_telugu) },
      { label: t('Yoga', 'యోగ'), value: name(d.yoga, d.yoga_telugu), sub: until(yogaEnd) },
      { label: t('Karana', 'కరణ'), value: karanas },
    ];
    const day = new Date(d.date);

    page = (
      <div className="space-y-5" data-testid="panchangam-details">
        {/* The day at a glance, like the printed calendar's date block. */}
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 flex items-center gap-5" data-testid="panchangam-day">
          {typeof d.moon_phase_deg === 'number' && <MoonPhase degrees={d.moon_phase_deg} size={72} className="shrink-0" />}
          <div className="min-w-0">
            <p className={`${heading} text-3xl text-[#C43E00] leading-none`}>
              {day.getDate()} <span className="text-xl">{day.toLocaleDateString('en-IN', { month: 'short' })}</span>
            </p>
            <p className="text-xs font-semibold tracking-wide text-[#2D1B0E] mt-1 uppercase">
              {day.getFullYear()} {t(day.toLocaleDateString('en-IN', { weekday: 'long' }), d.vaaram_telugu)}
            </p>
            <p className="text-sm text-[#621B00] mt-1">
              {number && <span className="font-semibold text-[#C43E00]">{number} </span>}
              {t(d.masa, masaShort || d.masa_telugu)}
              {vasaraShort && <span className="text-[#5D4037]"> · {t(d.vasara || d.vaaram, vasaraShort)}</span>}
            </p>
          </div>
        </div>

        {(d.special_note || d.special_note_telugu) && (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl p-4" data-testid="panchangam-note">
            <p className="text-sm text-[#621B00]">{t(d.special_note, d.special_note_telugu)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <Card testid="panchangam-card-panchanga" title={t('Panchanga', 'పంచాంగం')}
                info={t('The five limbs of the day (tithi, vara, nakshatra, yoga, karana) with the year, season and month, for Cheruvugattu, calculated by the Surya Siddhanta.',
                        'చెరువుగట్టు కొరకు సూర్య సిద్ధాంత గణితం ప్రకారం - తిథి, వారం, నక్షత్రం, యోగం, కరణం అనే ఐదు అంగాలు, సంవత్సరం, ఋతువు, మాసం.')}>
            <Rows rows={panchanga} />
          </Card>

          {d.sankalpam_telugu && (
            <Card testid="panchangam-card-sankalpam" title={t('Sankalpam', 'సంకల్పం')}
                  info={t("The day's sankalpam, recited before a puja: the place, year, season, month, paksha, tithi, vasara and nakshatra.",
                          'పూజకు ముందు చెప్పుకొనే ఈరోజు సంకల్పం: దేశం, సంవత్సరం, ఋతువు, మాసం, పక్షం, తిథి, వారం, నక్షత్రం.')}>
              <p className={`text-sm text-[#2D1B0E] leading-relaxed ${sankalpamOpen ? '' : 'line-clamp-4'}`} lang="te">{d.sankalpam_telugu}</p>
              <button type="button" onClick={() => setSankalpamOpen(o => !o)}
                      className="mt-2 text-xs text-[#C43E00] hover:underline inline-flex items-center gap-0.5">
                {sankalpamOpen ? <>{t('Less', 'తక్కువ')} <ChevronUp className="h-3 w-3" /></> : <>{t('More', 'మరింత')} <ChevronDown className="h-3 w-3" /></>}
              </button>
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card testid="panchangam-card-upcoming" title={t('Upcoming Festivals', 'రాబోయే పండుగలు')}
                  info={t("The next festivals after this date. Recurring days such as Ekadashi and Pradosham are left out here; they are in each day's note.",
                          'ఈ తేదీ తరువాత వచ్చే పండుగలు. ఏకాదశి, ప్రదోషం వంటి ప్రతి నెలా వచ్చే రోజులు ఇక్కడ చూపబడవు; అవి ఆ రోజు వివరాలలో ఉంటాయి.')}>
              <ul className="space-y-2">
                {upcoming.map((f, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => setDate(f.date)} className="w-full flex items-center justify-between gap-3 text-left group">
                      <span className="text-sm text-[#2D1B0E] group-hover:text-[#C43E00]">{name(f.name, f.name_telugu)}</span>
                      <span className="shrink-0 text-xs font-medium text-[#621B00] bg-[#D4AF37]/20 rounded-md px-2 py-0.5">{shortDate(f.date)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card testid="panchangam-card-muhurtas" title={t('Auspicious & Inauspicious Timings', 'శుభ, అశుభ సమయాలు')}
                info={t('Amrita Kalam and Abhijit are auspicious; Varjyam, Durmuhurtham, Rahu Kalam, Yamagandam and Gulika Kalam are avoided for new work.',
                        'అమృత కాలం, అభిజిత్ శుభ సమయాలు; వర్జ్యం, దుర్ముహూర్తం, రాహు కాలం, యమగండం, గుళిక కాలంలో శుభ కార్యాలు ప్రారంభించరు.')}>
            <Rows rows={muhurtas} />
          </Card>

          <Card testid="panchangam-card-times" title={t('Important Times', 'ముఖ్య సమయాలు')}
                info={t("The Moon's sign, Brahma Muhurtam before dawn, the three sandhyas (dawn, midday, dusk) and Pradosha Kalam after sunset.",
                        'చంద్రుని రాశి, తెల్లవారుజామున బ్రహ్మ ముహూర్తం, మూడు సంధ్యలు (ప్రాతః, మాధ్యాహ్న, సాయం), సూర్యాస్తమయం తరువాత ప్రదోష కాలం.')}>
            <Rows rows={times} />
          </Card>

          <Card testid="panchangam-card-more" title={t('Additional Details', 'అదనపు వివరాలు')}
                info={t("The month counted three ways (ending at full moon, ending at new moon, and by the Sun's sign), the year, and the yoga and karanas of the day with their end times.",
                        'మూడు విధాల మాసం (పూర్ణిమాంత, అమాంత, సౌరమాన), సంవత్సరం, ఈరోజు యోగం మరియు కరణాలు, అవి ముగిసే సమయాలతో.')}>
            <Rows rows={more} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 flex items-center justify-center mx-auto mb-4">
            <Sun className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="panchangam-title">{t('Daily Panchangam', 'దైనిక పంచాంగం')}</h1>
          <p className="text-sm text-[#5D4037] mt-2">{t('Cheruvugattu, Nalgonda, Telangana', 'చెరువుగట్టు, నల్గొండ, తెలంగాణ')}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Calendar className="h-4 w-4 text-[#8D6E63]" />
          <DateInput
            value={date}
            max={toISODate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))}
            onChange={v => setDate(v)}
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
        ) : page}
      </div>
      <Footer />
    </div>
  );
}
