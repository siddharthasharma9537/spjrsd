import { useState, useEffect } from 'react';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";
import { ScrollText } from 'lucide-react';

export default function Stotrams() {
  const { t, heading } = useT();
  const [stotrams, setStotrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/stotrams').then(r => setStotrams(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="stotrams-title">{t("Stotrams", "స్తోత్రాలు")}</h1>
          <p className="text-sm text-[#8D6E63]">{t('Chanted during sevas at the temple', 'ఆలయంలో సేవల సమయంలో పఠించేవి')}</p>
        </div>
        {loading ? <p className="text-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p> : stotrams.length === 0 ? (
          <LoadState error={loadError} emptyText={t('Stotrams will be added here soon.', 'స్తోత్రాలు త్వరలో ఇక్కడ చేర్చబడతాయి.')} />
        ) : (
          <div className="space-y-4">
            {stotrams.map(s => (
              <details key={s.id} className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden group" data-testid={`stotram-${s.id}`}>
                <summary className="flex items-center gap-3 p-6 cursor-pointer list-none">
                  <ScrollText className="h-5 w-5 text-[#8D6E63] shrink-0" />
                  <div className="flex-1">
                    <h2 className="font-medium text-[#2D1B0E]">{t(s.title, s.title_telugu)}</h2>
                    {s.deity && <p className="text-xs text-[#8D6E63] mt-0.5">{s.deity}</p>}
                  </div>
                  <span className="text-xs text-[#8D6E63] group-open:hidden">{t('Read', 'చదవండి')}</span>
                  <span className="text-xs text-[#8D6E63] hidden group-open:inline">{t('Close', 'మూసివేయండి')}</span>
                </summary>
                <div className="px-6 pb-6 pt-0 border-t border-[#E6DCCA]/60">
                  {s.text_telugu ? (
                    /* Stotram lines are metrical - preserve the breaks exactly as entered. */
                    <p className="whitespace-pre-line text-[#2D1B0E] leading-loose text-[17px] mt-4">{s.text_telugu}</p>
                  ) : (
                    <p className="text-sm text-[#8D6E63] mt-4">{t('Text is being added.', 'పాఠ్యం చేర్చబడుతోంది.')}</p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
