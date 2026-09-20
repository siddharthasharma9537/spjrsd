import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';

/* Locations confirmed against the temple's own hand-drawn layout maps
   (hilltop sequence + access routes). Sri Parvathi Devi Temple has its own
   page (ParvathiDeviTemple.jsx) - keep this in sync with that and with
   VirtualYatra.jsx's HILLTOP_ROUTE if any changes; all three describe the
   same walking order. */

export default function Temples() {
  const { t, heading } = useT();

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      <div className="temple-gradient text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`${heading} wordmark-outline text-2xl md:text-4xl mb-2`} data-testid="temples-title">
            {t('Associated Temples', 'అనుబంధ ఆలయములు')}
          </h1>
          <p className="text-[#FFE0B2]/70 text-sm">
            {t('Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu', 'శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం, చెరువుగట్టు')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* On the Hill */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className={`${heading} text-xl text-[#621B00] mb-1`}>{t('On the Hill (Ikshwadri)', 'గట్టుమీద (ఇక్ష్వాద్రి)')}</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">గట్టుమీద</p>

          <p className="text-sm text-[#5D4037] leading-relaxed mb-4">
            {t(
              'The hill has two ways up: a Ghat Road for vehicles, which ends at a parking area and a short walkway straight to the Main Temple entrance, and a separate Steps Path for pedestrians on the other side of the hill.',
              'గట్టుపైకి రెండు మార్గములు కలవు: వాహనముల కొరకు ఘాట్ రోడ్డు, ఇది పార్కింగ్ వద్ద ముగిసి నడక మార్గము ద్వారా నేరుగా ప్రధాన ఆలయ ప్రవేశద్వారమునకు చేరుకొనును. కాలినడకన వచ్చు భక్తుల కొరకు గట్టుకు మరోవైపు మెట్ల మార్గము కలదు.'
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#5D4037] mb-6">
            <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4">
              <p className={`font-medium text-[#2D1B0E] mb-2 ${heading}`}>
                {t('Walking up the Steps Path', 'మెట్ల మార్గములో')}
              </p>
              <p className="leading-relaxed">
                {t(
                  'From the Steps Path entrance (Vimana Gopuram), the path ends at the Koneru and Gogarbhamu, near which stands Sri Kalabhairava Swamy Temple — as Kshetrapalaka, he is the guardian of the hill. From there devotees reach the Main Temple Complex\'s entrance, where Sri Maha Ganapathi is stationed, before the Main Temple entrance itself.',
                  'మెట్ల మార్గ ప్రవేశము (విమాన గోపురం) నుండి, మార్గము కోనేరు మరియు గోగర్భం వద్ద ముగియును. వాటికి సమీపమున శ్రీ కాలభైరవ స్వామి ఆలయము కలదు — క్షేత్రపాలకుడుగా ఆయనే గట్టుకు కాపలా. అటుపిమ్మట భక్తులు ప్రధాన ఆలయ సముదాయ ప్రవేశద్వారమునకు చేరుకొందురు, అక్కడ శ్రీ మహా గణపతి కొలువైయుండగా, తదుపరి ప్రధాన ఆలయ ప్రవేశము కలదు.'
                )}
              </p>
            </div>
            <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4">
              <p className={`font-medium text-[#2D1B0E] mb-2`}>
                {t('After darshan of the Principal Deity', 'ప్రధాన దేవుని దర్శనం తరువాత')}
              </p>
              <p className="leading-relaxed">
                {t(
                  'Exiting the Main Temple, the path passes Sri Anjaneya Swamy and then Sri Renuka Yellamma Devi on the way to Mudu Gundlu. West of the temple stand the Kalyana Mandapam and, beside Mudu Gundlu\'s exit path, Sri Parashurama Lingamu and Sri Aatma Lingamu.',
                  'ప్రధాన ఆలయము నుండి నిష్క్రమించిన తరువాత, మార్గము శ్రీ ఆంజనేయ స్వామి, తదుపరి శ్రీ రేణుకా ఎల్లమ్మ దేవి ఆలయములు దాటి మూడుగుండ్లకు చేరుకొనును. ఆలయమునకు పశ్చిమాన కళ్యాణ మండపము, మూడుగుండ్ల నిష్క్రమణ మార్గము ప్రక్కన శ్రీ పరశురామ లింగము, శ్రీ ఆత్మ లింగము కలవు.'
                )}
              </p>
            </div>
          </div>

          {/* Shrines along the hill, in the order a devotee encounters them -
              confirmed directly against the temple's own route; kept in sync
              with VirtualYatra.jsx's HILLTOP_ROUTE. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {[
              { img: '/Assets/Vimana_Gopuram_Steps_Entrance.webp', en: 'Steps Path entrance (Vimana Gopuram)', te: 'మెట్ల మార్గ ప్రవేశము (విమాన గోపురం)' },
              { img: '/Assets/Sri_Swamy_Vari_Pushkarini_1.webp', en: 'Koneru', te: 'కోనేరు' },
              { img: '/Assets/Sri_Kalabhairava_Swamy.webp', en: 'Sri Kalabhairava Swamy', te: 'శ్రీ కాలభైరవ స్వామి' },
              { img: '/Assets/Main_Temple_Gopuram.webp', en: 'Main Temple Complex entrance', te: 'ప్రధాన ఆలయ సముదాయ ప్రవేశం' },
              { img: '/Assets/Maha_Ganapati_Statue.webp', en: 'Sri Maha Ganapathi', te: 'శ్రీ మహా గణపతి' },
              { img: '/Assets/Main_Temple_Entrance.webp', en: 'Main Temple entrance', te: 'ప్రధాన ఆలయ ప్రవేశము' },
              { img: '/Assets/Sri_Anjaneya_Swamy_Temple.webp', en: 'Sri Anjaneya Swamy Temple', te: 'శ్రీ ఆంజనేయ స్వామి ఆలయం' },
              { img: '/Assets/Sri__Renuka_Yellmma_Temple_Back_View.webp', en: 'Sri Renuka Yellamma Temple', te: 'శ్రీ రేణుకా ఎల్లమ్మ ఆలయం' },
              { img: '/Assets/Sri_Swamy_Vari_Padalu_Area.webp', en: 'Swamy Vari Padalu', te: 'స్వామివారి పాదాలు' },
            ].map((s, i) => (
              <figure key={i}>
                <div className="aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                  <img src={s.img} alt={s.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <figcaption className="mt-1.5 text-center text-xs text-[#8D6E63]">{t(s.en, s.te)}</figcaption>
              </figure>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#5D4037]">
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-[#FDFBF7] border border-[#E6DCCA]">
                <img src="/Assets/Mudu_Gundlu_Shivalingam_6.webp" alt="Mudu Gundlu, at the summit of the hill" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="font-medium text-[#2D1B0E] mb-1">{t('Mudu Gundlu', 'మూడు గుండ్లు')}</p>
              <p className="leading-relaxed">
                {t('At the true summit of the hill, above the Main Temple.', 'గట్టు యొక్క అత్యున్నత శిఖరమున, ప్రధాన ఆలయమునకు పైభాగమున కలదు.')}
              </p>
              <p className="font-medium text-[#2D1B0E] mt-4 mb-1">{t('Sri Parashurama Lingamu & Sri Aatma Lingamu', 'శ్రీ పరశురామ లింగము & శ్రీ ఆత్మ లింగము')}</p>
              <p className="leading-relaxed">
                {t(
                  'Beside the exit path of Mudu Gundlu — Sri Aatma Lingamu stands next to Sri Parashurama Lingamu.',
                  'మూడు గుండ్ల నిష్క్రమణ మార్గము ప్రక్కన శ్రీ పరశురామ లింగము, దాని పక్కనే శ్రీ ఆత్మ లింగము కలవు.'
                )}
              </p>
            </div>
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-[#FDFBF7] border border-[#E6DCCA]">
                <img src="/Assets/Kalyana_Mandapam.webp" alt="The Kalyana Mandapam on the hill" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="font-medium text-[#2D1B0E] mb-1">{t('Kalyana Mandapam', 'కళ్యాణ మండపము')}</p>
              <p className="leading-relaxed">
                {t('South of Mudu Gundlu, near the Main Temple entrance and the walkway from the parking area.', 'మూడుగుండ్లకు దక్షిణాన, ప్రధాన ఆలయ ప్రవేశద్వారము మరియు పార్కింగ్ నుండి వచ్చు నడక మార్గమునకు సమీపమున కలదు.')}
              </p>
              <p className="font-medium text-[#2D1B0E] mt-4 mb-1">{t('Koneru & Gogarbhamu', 'కోనేరు & గోగర్భం')}</p>
              <p className="leading-relaxed">
                {t(
                  'At the top of the Steps Path stands the Koneru, the temple\'s sacred tank, with Gogarbhamu adjoining it.',
                  'మెట్ల మార్గపు పైభాగమున కోనేరు కలదు, దాని ప్రక్కనే గోగర్భం కలదు.'
                )}
              </p>
              <p className="font-medium text-[#2D1B0E] mt-4 mb-1">{t('Swamy Vari Padalu (Hilltop)', 'స్వామివారి పాదాలు (గట్టుపైన)')}</p>
              <p className="leading-relaxed">
                {t(
                  'The Swamy\'s footprints, where devotees perform 11, 21, or 41 pradakshinas. A second, separate Padalu shrine stands at Yellareddigudem village.',
                  'శ్రీ స్వామివారి పాదముల వద్ద భక్తులు 11, 21, 41 ప్రదక్షిణలు చేయుదురు. వేరుగా మరొక పాదాల ఆలయం యెల్లారెడ్డిగూడెంలో కలదు.'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Sri Narasimha Swamy Temple */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className={`${heading} text-xl text-[#621B00] mb-1`}>{t('Sri Narasimha Swamy Temple', 'శ్రీ నరసింహ స్వామి ఆలయం')}</h2>
          <p className="text-xs text-[#8D6E63] mb-4 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t('North-west of Sri Parvathi Devi Temple', 'శ్రీ పార్వతీ దేవి ఆలయమునకు వాయవ్యంగా')}</p>
          <p className="text-sm text-[#5D4037] leading-relaxed">
            {t(
              'A separate temple standing to the north-west of Sri Parvathi Devi Temple, at the foot of the hill.',
              'గట్టు క్రింద, శ్రీ పార్వతీ దేవి ఆలయమునకు వాయవ్య దిశలో ప్రత్యేక ఆలయముగా కలదు.'
            )}
          </p>
        </section>

        {/* Sri Swamy Vari Padalu, Yellareddigudem */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className={`${heading} text-xl text-[#621B00] mb-1`}>{t('Sri Swamy Vari Padalu', 'శ్రీ స్వామివారి పాదాలు')}</h2>
          <p className="text-xs text-[#8D6E63] mb-4 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t('Yellareddigudem village', 'యెల్లారెడ్డిగూడెం గ్రామం')}</p>
          <p className="text-sm text-[#5D4037] leading-relaxed">
            {t(
              'The Swamy\'s sacred footprints at Yellareddigudem village, on the main road before entering Cheruvugattu — a separate shrine from the Swamy Vari Padalu atop the hill.',
              'యెల్లారెడ్డిగూడెం గ్రామంలో, చెరువుగట్టు గ్రామ ప్రవేశమునకు ముందు ప్రధాన రహదారిపై శ్రీ స్వామివారి పవిత్ర పాదములు కలవు — ఇది గట్టుపైన గల స్వామివారి పాదాల ఆలయమునకు వేరైనది.'
            )}
          </p>
        </section>

      </div>

      <Footer />
    </div>
  );
}
