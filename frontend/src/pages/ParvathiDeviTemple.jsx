import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';

/* Parivara devatas sharing the Parvathi Devi Temple complex at the foot of
   the hill - kept in sync with Temples.jsx (the Ikshwadri hilltop group) and
   VirtualYatra.jsx's PARVATHI_TEMPLE_ROUTE if any changes. */
const PARIVARA_FOOTHILL = [
  { img: '/Assets/Ganapati_Swamy_Down_Hill.webp', en: 'Sri Ganapati', te: 'శ్రీ గణపతి' },
  { img: '/Assets/Subrahmanya_Swamy_Down_Hill.webp', en: 'Sri Subrahmanya Swamy', te: 'శ్రీ సుబ్రహ్మణ్య స్వామి' },
  { img: '/Assets/Veerabhadra_Swamy_Down_Hill.webp', en: 'Sri Veerabhadra Swamy', te: 'శ్రీ వీరభద్ర స్వామి' },
  { img: '/Assets/Bhadrakali_Ammavaru_Down_Hill.webp', en: 'Sri Bhadrakali Devi', te: 'శ్రీ భద్రకాళీ దేవి' },
];

export default function ParvathiDeviTemple() {
  const { t, heading } = useT();

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      <div className="temple-gradient text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`${heading} wordmark-outline text-2xl md:text-4xl mb-2`} data-testid="parvathi-devi-temple-title">
            {t('Sri Parvathi Devi Temple', 'శ్రీ పార్వతీ దేవి ఆలయం')}
          </h1>
          <p className="text-[#FFE0B2]/70 text-sm">
            {t('At the foot of the hill', 'గట్టు క్రింద')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-[#FDFBF7] border border-[#E6DCCA]">
            <img src="/Assets/Parvati_Devi_Temple_Panoramic_View_Down_Hill.webp" alt="Sri Parvathi Devi Temple at the foot of the hill" className="w-full h-full object-cover" loading="lazy" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { img: '/Assets/Sri_Parvati_Devi_Temple_Arial_View.webp', en: 'Aerial view of the complex', te: 'ఆలయ ప్రాంగణ వైమానిక దృశ్యం' },
              { img: '/Assets/Sri_Parvati_Devi_Temple_Inside_View.webp', en: 'Inside the complex', te: 'ఆలయ లోపలి దృశ్యం' },
              { img: '/Assets/Parvati_Devi_1.webp', en: 'Sri Bhramarambha Devi', te: 'శ్రీ భ్రమరాంబ దేవి' },
              { img: '/Assets/Mallikharjuna_Swamy_Down_Hill_1.webp', en: 'Sri Mallikarjuna Swamy', te: 'శ్రీ మల్లిఖార్జున స్వామి' },
            ].map((s, i) => (
              <figure key={i}>
                <div className="aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                  <img src={s.img} alt={s.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <figcaption className="mt-1.5 text-center text-xs text-[#8D6E63]">{t(s.en, s.te)}</figcaption>
              </figure>
            ))}
          </div>

          <p className="text-sm text-[#5D4037] leading-relaxed mb-6">
            {t(
              'The Main Entrance faces east, near the Dhwaja Sthambam. Inside, an internal entrance leads to a cluster of interconnected shrine chambers — Sri Bhramarambha Devi (Sri Parvathi Devi) and, connected to her by internal doorways through the Antharaalayam, Sri Mallikarjuna Swamy (a manifestation of the Swamy\'s own Shivalingam) and Sri Veerabhadra Swamy sametha Bhadrakali Devi. Sri Ganapati and Sri Subrahmanya Swamy are worshipped within the Antharaalayam itself. A circumambulation path (Pradakshina) runs around the whole cluster within the compound, ending at the exit on the south side.',
              'ప్రధాన ప్రవేశద్వారము తూర్పు ముఖముగా, ధ్వజస్తంభమునకు సమీపమున కలదు. లోపల అంతర ప్రవేశద్వారము గుండా పరస్పరము తలుపులతో అనుసంధానించబడిన ఆలయ మందిరముల సముదాయమునకు చేరుకొందురు — శ్రీ భ్రమరాంబ దేవి (శ్రీ పార్వతీ అమ్మవారు), అంతరాళయము గుండా ఆమెతో అనుసంధానించబడిన శ్రీ మల్లిఖార్జున స్వామి (శ్రీ స్వామివారి శివలింగ స్వరూపమే), మరియు శ్రీ వీరభద్ర స్వామి సమేత భద్రకాళీ దేవి. అంతరాళయమునందే శ్రీ గణపతి, శ్రీ సుబ్రహ్మణ్య స్వామి కొలువైయున్నారు. ఈ సముదాయము చుట్టూ ప్రాంగణమునందు ప్రదక్షిణ మార్గము కలదు, ఇది దక్షిణదిశన నిష్క్రమణ ద్వారము వద్ద ముగియును.'
            )}
          </p>

          {/* Parivara devatas of the complex, individually */}
          <div className="pt-6 border-t border-[#E6DCCA]">
            <p className="text-sm font-medium text-[#2D1B0E] mb-3">
              {t('Parivara Devatas — At the Foot of the Hill', 'పరివార దేవతలు — గట్టు క్రింద')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PARIVARA_FOOTHILL.map((p, i) => (
                <figure key={i}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                    <img src={p.img} alt={p.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <figcaption className="mt-1.5 text-center text-xs text-[#8D6E63]">{t(p.en, p.te)}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
