import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import { useT } from "@/contexts/LanguageContext";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  { q: 'How to book a seva online?', qTe: 'ఆన్‌లైన్‌లో సేవ ఎలా బుక్ చేయాలి?', a: 'Sign in with your mobile number, go to Sevas page, select a seva, choose date and time slot, fill in gotram details and confirm booking. You will receive a ticket immediately.' },
  { q: 'What is Paroksha Seva?', qTe: 'పరోక్ష సేవ అంటే ఏమిటి?', a: 'Paroksha Seva allows devotees to participate in sevas without being physically present at the temple. The priest performs the seva on your behalf. Prasadam can be sent to your address.' },
  { q: 'How to make an e-Hundi donation?', qTe: 'ఈ-హుండి దానం ఎలా చేయాలి?', a: 'Go to the e-Hundi page, enter your details and donation amount, and complete the payment. You will receive an 80G tax exemption receipt.' },
  { q: 'How to book accommodation?', qTe: 'వసతి ఎలా బుక్ చేయాలి?', a: 'Go to Accommodation page, browse available room types (AC, Non-AC, Cottage, Dormitory), select check-in/check-out dates, and confirm booking.' },
  { q: 'What is the temple timing?', qTe: 'ఆలయ సమయాలు ఏమిటి?', a: 'Morning: 6:00 AM - 12:00 PM, Evening: 4:00 PM - 8:00 PM. Special timings during festivals.' },
  { q: 'Can I cancel a seva booking?', qTe: 'సేవ బుకింగ్ రద్దు చేయవచ్చా?', a: 'Currently, cancellation requests need to be made by contacting the temple office. Online cancellation will be available in a future update.' },
  { q: 'How to get the 80G receipt for tax exemption?', qTe: '80G రసీదు ఎలా పొందాలి?', a: 'After completing a donation (e-Hundi or AnnaPrasadam), click the "Download 80G Receipt" button on the success screen. You can also access it from your donation history.' },
  { q: 'How to become a volunteer?', qTe: 'వాలంటీర్ ఎలా అవ్వాలి?', a: 'Go to the Volunteer page and fill in the registration form with your details and availability. Our team will contact you after review.' },
  { q: 'Is there a mobile app?', qTe: 'మొబైల్ యాప్ ఉందా?', a: 'The mobile app is coming soon. Currently, the website is fully mobile-responsive and works great on all devices.' },
  { q: 'How to reprint my ticket?', qTe: 'నా టికెట్ మళ్ళీ ప్రింట్ ఎలా చేయాలి?', a: 'Go to the "Print Ticket" page, search by your booking number or mobile number, and print your ticket.' },
];

export default function FAQ() {
  const { t, heading } = useT();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="faq-title">{t("Frequently Asked Questions", "తరచుగా అడిగే ప్రశ్నలు")}</h1>
        </div>
        <div className="space-y-3" data-testid="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden" data-testid={`faq-item-${i}`}>
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FDFBF7] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#2D1B0E]">{t(f.q, f.qTe)}</p>
                </div>
                {openIdx === i ? <ChevronUp className="h-5 w-5 text-[#8D6E63] shrink-0" /> : <ChevronDown className="h-5 w-5 text-[#8D6E63] shrink-0" />}
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 text-sm text-[#5D4037] leading-relaxed border-t border-[#E6DCCA]">
                  <p className="pt-4">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
