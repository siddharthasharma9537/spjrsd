import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Download, ChevronDown } from 'lucide-react';
import { SEVA_SAMAGRI } from '@/lib/sevaSamagri';

/* Same open/close pattern as the Navbar dropdown: click to toggle, closes on
   an outside click. */
function DownloadMenu({ onPick }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (lang) => { setOpen(false); onPick(lang); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90 transition-all"
        data-testid="download-checklist-btn"
      >
        <Download className="h-4 w-4" /> {t('Download List', 'జాబితా డౌన్‌లోడ్')} <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`absolute right-0 top-full mt-1.5 bg-white border border-[#E6DCCA] rounded-lg shadow-xl py-1 min-w-[160px] z-50 origin-top-right transition-all duration-200 ease-out ${
          open ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-1.5 invisible'
        }`}
      >
        <button onClick={() => pick('en')} className="block w-full text-left px-4 py-2 text-sm text-[#5D4037] hover:bg-[#C43E00]/5 hover:text-[#C43E00] transition-colors" data-testid="download-checklist-en-btn">
          English
        </button>
        <button onClick={() => pick('te')} className="block w-full text-left px-4 py-2 text-sm text-[#5D4037] hover:bg-[#C43E00]/5 hover:text-[#C43E00] transition-colors font-telugu-body" data-testid="download-checklist-te-btn">
          తెలుగు
        </button>
      </div>
    </div>
  );
}

function ChecklistRow({ id, item, t, checked, onToggle, sub }) {
  return (
    <div className={`flex items-start gap-2.5 py-1.5 ${sub ? 'ml-6' : ''}`}>
      <input
        type="checkbox"
        checked={!!checked[id]}
        onChange={() => onToggle(id)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-green-600 print:accent-green-600"
        data-testid={`checklist-item-${id}`}
      />
      <span className={`text-sm leading-snug ${checked[id] ? 'text-green-700' : 'text-[#2D1B0E]'}`}>
        {t(item.en, item.te)}
        {item.qty && <span className="text-[#8D6E63]"> — {item.qty}</span>}
        {item.optional && <span className="text-[#8D6E63] italic"> ({t('optional', 'ఐచ్ఛికం')})</span>}
        {item.note && <span className="ml-1 text-[10px] uppercase tracking-wide text-[#C43E00] font-medium">{item.note}</span>}
      </span>
    </div>
  );
}

export default function SevaSamagriChecklist() {
  const { t } = useT();
  const { lang } = useLanguage();
  const { sevaId } = useParams();
  const [seva, setSeva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  // Document language: what the printable card itself is shown in. Starts out
  // matching the site-wide toggle, but each Download button can force it to
  // English or Telugu regardless of that toggle, so a devotee can grab either
  // version without switching the whole site's language first.
  const [docLang, setDocLang] = useState(lang);
  const pendingPrint = useRef(false);

  useEffect(() => {
    api.get(`/sevas/${sevaId}`).then(r => setSeva(r.data)).finally(() => setLoading(false));
  }, [sevaId]);

  useEffect(() => {
    if (pendingPrint.current) {
      pendingPrint.current = false;
      window.print();
    }
  }, [docLang]);

  const items = SEVA_SAMAGRI[sevaId];
  const toggle = (id) => setChecked(c => ({ ...c, [id]: !c[id] }));
  const d = (en, te) => (docLang === 'te' ? (te || en) : en);
  const dHeading = docLang === 'te' ? 'font-telugu-heading' : 'font-english-heading';
  const downloadAs = (targetLang) => {
    if (docLang === targetLang) { window.print(); return; }
    pendingPrint.current = true;
    setDocLang(targetLang);
  };

  if (loading) return <div className="min-h-screen bg-[#FFFCF5] flex items-center justify-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</div>;
  if (!seva || !items) return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col items-center justify-center gap-3 text-center px-4">
      <p className="text-red-600">{t('No printable checklist is available for this seva.', 'ఈ సేవకు ప్రింట్ చెక్‌లిస్ట్ అందుబాటులో లేదు.')}</p>
      <Link to={`/book/${sevaId}`} className="text-sm text-[#C43E00] hover:underline">{t('Back to Seva', 'సేవకు తిరిగి వెళ్ళండి')}</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="print:hidden flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link to={`/book/${sevaId}`} className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t('Back to Seva', 'సేవకు తిరిగి వెళ్ళండి')}
          </Link>
          <DownloadMenu onPick={downloadAs} />
        </div>
        <p className="print:hidden text-xs text-[#8D6E63] text-center -mt-4 mb-6">
          {t("Opens the print dialog — choose \"Save as PDF\" to download.", 'ప్రింట్ డైలాగ్ తెరుచుకుంటుంది — డౌన్‌లోడ్ చేయడానికి "PDFగా సేవ్ చేయి" ఎంచుకోండి.')}
        </p>

        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-[#621B00] text-white p-6 text-center">
            <div className="flex items-center justify-center mb-1">
              <img
                src="/Assets/Temple_Logo_Transparent.webp"
                alt="Sri Jadala Ramalingeshwara Swamy"
                width="600"
                height="496"
                className="h-14 w-14 object-contain"
              />
            </div>
            <h1 className="font-english-heading text-sm tracking-widest uppercase mb-1">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</h1>
            <p className="font-telugu-heading text-base text-[#D4AF37]">శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం</p>
            <p className="text-xs text-[#FFE0B2]/70 mt-1">Cheruvugattu, Nalgonda, Telangana</p>
          </div>

          <div className="p-6">
            <div className="text-center border-b border-[#E6DCCA] pb-4 mb-5">
              <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">{d('Pooja Samagri Checklist', 'పూజ సామాగ్రి చెక్‌లిస్ట్')}</p>
              <h2 className={`${dHeading} text-xl text-[#621B00]`} data-testid="checklist-seva-name">{d(seva.name_english, seva.name_telugu)}</h2>
            </div>

            <div className="divide-y divide-[#F3ECDD]">
              {items.map((item, i) => (
                <div key={i} className="py-0.5">
                  <ChecklistRow id={`${i}`} item={item} t={d} checked={checked} onToggle={toggle} />
                  {item.children && (
                    <div className="mb-1">
                      {item.children.map((child, j) => (
                        <ChecklistRow key={j} id={`${i}-${j}`} item={child} t={d} checked={checked} onToggle={toggle} sub />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[#E6DCCA] mt-5 pt-4 text-xs text-[#8D6E63] leading-relaxed">
              <p>{d(
                "Note: Pooja slot availability, duration of the pooja, and usage of materials brought by devotees are subject to the temple management's regulations.",
                'గమనిక: పూజ స్లాట్ లభ్యత, పూజ వ్యవధి మరియు భక్తులు తీసుకువచ్చిన సామాగ్రి వినియోగం దేవస్థాన నిర్వహణ నిబంధనలకు లోబడి ఉంటాయి.'
              )}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
