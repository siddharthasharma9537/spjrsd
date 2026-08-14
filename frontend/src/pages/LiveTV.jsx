import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import { useT } from "@/contexts/LanguageContext";
import { Tv, Clock } from 'lucide-react';

export default function LiveTV() {
  const { t, heading } = useT();

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Tv className="h-8 w-8 text-red-600" />
        </div>
        <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="live-tv-title">{t("Temple Live TV", "ఆలయ లైవ్ టీవీ")}</h1>
        <p className="text-sm text-[#5D4037] mt-2 mb-10">24x7 Live Darshan and Devotional Programs</p>

        <div className="rounded-xl border border-[#E6DCCA] bg-white p-10" data-testid="live-tv-coming-soon">
          <Clock className="h-10 w-10 text-[#D4AF37] mx-auto mb-4" />
          <h2 className="font-english-heading text-xl text-[#621B00] mb-2">{t("Feature Coming Soon", "త్వరలో అందుబాటులోకి వస్తుంది")}</h2>
          <p className="text-sm text-[#8D6E63]">{t("Live darshan streaming will be available here soon. Please check back later.", "లైవ్ దర్శన ప్రసారం త్వరలో ఇక్కడ అందుబాటులో ఉంటుంది. దయచేసి తర్వాత మళ్లీ చూడండి.")}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
