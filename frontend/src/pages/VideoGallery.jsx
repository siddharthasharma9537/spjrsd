import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";
import { Play } from 'lucide-react';

export default function VideoGallery() {
  const { t, heading } = useT();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    api.get('/gallery?media_type=VIDEO').then(r => setVideos(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="video-gallery-title">{t("Video Gallery", "వీడియో గ్యాలరీ")}</h1>
        </div>
        {loading ? <p className="text-center text-[#8D6E63]">Loading...</p> : videos.length === 0 ? (
          <LoadState error={loadError} emptyText="No videos have been published yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(v => (
              <div key={v.id} className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all" data-testid={`video-card-${v.id}`}>
                {playing === v.id ? (
                  <div className="aspect-video">
                    <iframe src={v.media_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={v.title} />
                  </div>
                ) : (
                  <div className="aspect-video relative cursor-pointer group" onClick={() => setPlaying(v.id)}>
                    <img src={v.image_url} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-all">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-[#C43E00] ml-1" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-sm text-[#2D1B0E]">{v.title}</h3>
                  <p className="text-xs text-[#8D6E63] mt-1">{v.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
