import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Tv, Play, Clock } from 'lucide-react';

export default function LiveTV() {
  const { t, heading } = useT();
  const [streams, setStreams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live-streams').then(r => { setStreams(r.data); if (r.data.length) setSelected(r.data[0]); }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Tv className="h-8 w-8 text-red-600" />
          </div>
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="live-tv-title">{t("Temple Live TV", "ఆలయ లైవ్ టీవీ")}</h1>
          <p className="text-sm text-[#5D4037] mt-2">24x7 Live Darshan and Devotional Programs</p>
        </div>

        {loading ? <p className="text-center text-[#8D6E63]">Loading...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {selected && (
                <div data-testid="live-player">
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe src={selected.stream_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={selected.name} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-red-600 font-medium uppercase">Live</span>
                    </div>
                    <h2 className="font-english-heading text-lg text-[#621B00]">{selected.name}</h2>
                    <p className="text-sm text-[#5D4037] mt-1">{selected.description}</p>
                    <p className="text-xs text-[#8D6E63] flex items-center gap-1 mt-2"><Clock className="h-3.5 w-3.5" /> {selected.schedule_info}</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-english-heading text-sm text-[#621B00] mb-3 uppercase tracking-wide">Channels</h3>
              <div className="space-y-2">
                {streams.map(s => (
                  <button key={s.id} onClick={() => setSelected(s)} className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === s.id ? 'border-[#C43E00] bg-[#C43E00]/5' : 'border-[#E6DCCA] hover:border-[#D4AF37]'}`} data-testid={`stream-${s.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Play className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2D1B0E]">{s.name}</p>
                        <p className="text-xs text-[#8D6E63]">{s.schedule_info}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
