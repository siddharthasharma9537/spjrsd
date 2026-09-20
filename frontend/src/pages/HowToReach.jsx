import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Clock, Phone } from 'lucide-react';

const CONTENT = {
  reach: {
    locationEn: 'Cheruvugattu, Narketpally Mandal, Nalgonda District, Telangana, India',
    locationTe: 'చెరువుగట్టు, నార్కట్‌పల్లి మండలం, నల్లగొండ జిల్లా, తెలంగాణ',
    timingsEn: ['Morning: 5:00 AM - 1:00 PM', 'Evening: 3:00 PM - 7:00 PM'],
    timingsTe: ['ఉదయం: 5:00 - 1:00', 'సాయంత్రం: 3:00 - 7:00'],
    adminEn: ['Telangana Endowments Department', 'Sri S. Mohan Babu, Executive Officer', '+91 94910 00701'],
    adminTe: ['తెలంగాణ దేవాదాయ ధర్మాదాయ శాఖ', 'శ్రీ ఎస్. మోహన్ బాబు, కార్యనిర్వహణాధికారి', '+91 94910 00701'],
    modes: [
      { labelEn: 'By Road', labelTe: 'రోడ్డు మార్గము',
        en: '4 km from Narketpally on the Narketpally-Addanki road (Narketpally lies on the Hyderabad-Vijayawada National Highway), and about 15 km from Nalgonda town.',
        te: 'హైదరాబాదు - విజయవాడ జాతీయ రహదారిపై గల నార్కట్‌పల్లి నుండి నార్కట్‌పల్లి - అద్దంకి రహదారిపై 4 కి.మీ. దూరంలో, నల్లగొండ పట్టణానికి 15 కి.మీ. దూరంలో కలదు.' },
      { labelEn: 'By Rail', labelTe: 'రైలు మార్గము',
        en: 'Nearest railway station is Nalgonda. Auto-rickshaws and buses available from the station.',
        te: 'సమీప రైల్వే స్టేషన్ నల్లగొండ. స్టేషన్ నుండి ఆటోలు, బస్సు సౌకర్యము కలదు.' },
      { labelEn: 'By Air', labelTe: 'విమాన మార్గము',
        en: 'Nearest airport is Rajiv Gandhi International Airport, Hyderabad (approx. 150 km).',
        te: 'సమీప విమానాశ్రయం రాజీవ్ గాంధీ అంతర్జాతీయ విమానాశ్రయం, హైదరాబాదు (సుమారు 150 కి.మీ.).' },
    ],
  },
};

export default function HowToReach() {
  const { lang } = useLanguage();
  const te = lang === 'te';
  const bodyFont = te ? 'font-telugu-body' : '';
  const headingFont = te ? 'font-telugu-heading' : 'font-english-heading';

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      <div className="temple-gradient text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`${headingFont} wordmark-outline text-2xl md:text-4xl mb-2`} data-testid="how-to-reach-title">
            {te ? 'ఎలా చేరుకోవాలి' : 'How to Reach'}
          </h1>
          <p className="text-[#FFE0B2]/70 text-sm">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`space-y-3 text-sm text-[#5D4037] ${bodyFont}`}>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">{te ? 'ప్రదేశము' : 'Location'}</p>
                  <p>{te ? CONTENT.reach.locationTe : CONTENT.reach.locationEn}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">{te ? 'ఆలయ సమయములు' : 'Temple Timings'}</p>
                  {(te ? CONTENT.reach.timingsTe : CONTENT.reach.timingsEn).map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">{te ? 'పరిపాలన' : 'Administration'}</p>
                  {(te ? CONTENT.reach.adminTe : CONTENT.reach.adminEn).map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
            </div>
            <div className={`text-sm text-[#5D4037] space-y-2 ${bodyFont}`}>
              {CONTENT.reach.modes.map((m, i) => (
                <p key={i}><strong>{te ? m.labelTe : m.labelEn}:</strong> {te ? m.te : m.en}</p>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
