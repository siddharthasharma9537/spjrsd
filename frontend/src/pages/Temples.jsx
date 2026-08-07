import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useT } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';

/* Locations confirmed against the temple's own hand-drawn layout maps
   (hilltop sequence + access routes, and the Parvathi Devi Temple chamber
   plan). Keep this in sync with AboutTemple.jsx's deities/PARIVARA content
   if either changes. */

export default function Temples() {
  const { t, heading } = useT();

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      <div className="temple-gradient text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`${heading} text-2xl md:text-4xl mb-2`} data-testid="temples-title">
            {t('Temples of the Kshetram', 'క్షేత్రంలోని ఆలయములు')}
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
                  'Sri Kalabhairava Swamy Temple stands right at the base of the steps — as Kshetrapalaka, he is the guardian of the hill\'s entrance. From there the path passes Sri Renuka Yellamma, then Sri Anjaneya Swamy, before reaching the Main Temple.',
                  'మెట్ల మార్గపు మొదట్లోనే శ్రీ కాలభైరవ స్వామి ఆలయము కలదు — క్షేత్రపాలకుడుగా ఆయనే గట్టు ప్రవేశద్వారమునకు కాపలా. అటుపిమ్మట శ్రీ రేణుకా ఎల్లమ్మ, తదుపరి శ్రీ ఆంజనేయ స్వామి ఆలయములు దాటి ప్రధాన ఆలయమునకు చేరుకొందురు.'
                )}
              </p>
            </div>
            <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4">
              <p className={`font-medium text-[#2D1B0E] mb-2`}>
                {t('At the Main Temple entrance', 'ప్రధాన ఆలయ ప్రవేశద్వారము వద్ద')}
              </p>
              <p className="leading-relaxed">
                {t(
                  'Sri Ganapati is stationed right at the Main Temple\'s entrance. Nearby, on the west side of the temple, are Mudu Gundlu and the Kalyana Mandapam.',
                  'ప్రధాన ఆలయ ప్రవేశద్వారము వద్దనే శ్రీ గణపతి కొలువైయున్నారు. ఆలయమునకు పశ్చిమాన మూడుగుండ్లు, కళ్యాణ మండపము కలవు.'
                )}
              </p>
            </div>
          </div>

          {/* Shrines along the hill, in the order a devotee encounters them */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {[
              { img: '/Assets/Steps_Way_Entrance.webp', en: 'Steps Path entrance', te: 'మెట్ల మార్గ ప్రవేశము' },
              { img: '/Assets/Sri_Kalabhairava_Swamy.webp', en: 'Sri Kalabhairava Swamy', te: 'శ్రీ కాలభైరవ స్వామి' },
              { img: '/Assets/Sri__Renuka_Yellmma_Temple_Back_View.webp', en: 'Sri Renuka Yellamma Temple', te: 'శ్రీ రేణుకా ఎల్లమ్మ ఆలయం' },
              { img: '/Assets/Sri_Anjaneya_Swamy_Temple.webp', en: 'Sri Anjaneya Swamy Temple', te: 'శ్రీ ఆంజనేయ స్వామి ఆలయం' },
              { img: '/Assets/Main_Temple_Entrance.webp', en: 'Main Temple entrance', te: 'ప్రధాన ఆలయ ప్రవేశము' },
              { img: '/Assets/Main_Temple_Gopuram.webp', en: 'Main Temple Gopuram', te: 'ప్రధాన ఆలయ గోపురం' },
              { img: '/Assets/Sri_Swamy_Vari_Pushkarini_1.webp', en: 'Swamy Vari Pushkarini', te: 'స్వామివారి పుష్కరిణి' },
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
                <img src="/Assets/Mudu_Gundlu_Shivalingam_6.jpg" alt="Mudu Gundlu, at the summit of the hill" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="font-medium text-[#2D1B0E] mb-1">{t('Mudu Gundlu', 'మూడు గుండ్లు')}</p>
              <p className="leading-relaxed">
                {t('At the true summit of the hill, above the Main Temple.', 'గట్టు యొక్క అత్యున్నత శిఖరమున, ప్రధాన ఆలయమునకు పైభాగమున కలదు.')}
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
              <p className="font-medium text-[#2D1B0E] mt-4 mb-1">{t('Swamy Vari Pushkarini & Gowgarbham', 'స్వామివారి పుష్కరిణి & గోగర్భం')}</p>
              <p className="leading-relaxed">
                {t(
                  'Near the top of the Steps Path stands the Pushkarini, the temple\'s sacred tank, with Gowgarbham adjoining it.',
                  'మెట్ల మార్గపు పైభాగమున పుష్కరిణి కలదు, దాని ప్రక్కనే గోగర్భం కలదు.'
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

        {/* Sri Parvathi Devi Temple */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className={`${heading} text-xl text-[#621B00] mb-1`}>{t('Sri Parvathi Devi Temple', 'శ్రీ పార్వతీ దేవి ఆలయం')}</h2>
          <p className="text-xs text-[#8D6E63] mb-4 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t('At the foot of the hill', 'గట్టు క్రింద')}</p>

          <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-[#FDFBF7] border border-[#E6DCCA]">
            <img src="/Assets/Parvati_Devi_Temple_Panoramic_View_Down_Hill.jpg" alt="Sri Parvathi Devi Temple at the foot of the hill" className="w-full h-full object-cover" loading="lazy" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { img: '/Assets/Sri_Parvati_Devi_Temple_Arial_View.webp', en: 'Aerial view of the complex', te: 'ఆలయ ప్రాంగణ వైమానిక దృశ్యం' },
              { img: '/Assets/Sri_Parvati_Devi_Temple_Inside_View.webp', en: 'Inside the complex', te: 'ఆలయ లోపలి దృశ్యం' },
              { img: '/Assets/Parvati_Devi_1.jpg', en: 'Sri Bhramarambha Devi', te: 'శ్రీ భ్రమరాంబ దేవి' },
              { img: '/Assets/Mallikharjuna_Swamy_Down_Hill_1.jpg', en: 'Sri Mallikarjuna Swamy', te: 'శ్రీ మల్లిఖార్జున స్వామి' },
            ].map((s, i) => (
              <figure key={i}>
                <div className="aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                  <img src={s.img} alt={s.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <figcaption className="mt-1.5 text-center text-xs text-[#8D6E63]">{t(s.en, s.te)}</figcaption>
              </figure>
            ))}
          </div>

          <p className="text-sm text-[#5D4037] leading-relaxed mb-4">
            {t(
              'The Main Entrance faces east, near the Dhwaja Sthambam. Inside, an internal entrance leads to a cluster of interconnected shrine chambers — Sri Bhramarambha Devi (Sri Parvathi Devi) and, connected to her by internal doorways through the Antharaalayam, Sri Mallikarjuna Swamy (a manifestation of the Swamy\'s own Shivalingam) and Sri Veerabhadra Swamy sametha Bhadrakali Devi. Sri Ganapati and Sri Subrahmanya Swamy are worshipped within the Antharaalayam itself. A circumambulation path (Pradakshina) runs around the whole cluster within the compound, ending at the exit on the south side.',
              'ప్రధాన ప్రవేశద్వారము తూర్పు ముఖముగా, ధ్వజస్తంభమునకు సమీపమున కలదు. లోపల అంతర ప్రవేశద్వారము గుండా పరస్పరము తలుపులతో అనుసంధానించబడిన ఆలయ మందిరముల సముదాయమునకు చేరుకొందురు — శ్రీ భ్రమరాంబ దేవి (శ్రీ పార్వతీ అమ్మవారు), అంతరాళయము గుండా ఆమెతో అనుసంధానించబడిన శ్రీ మల్లిఖార్జున స్వామి (శ్రీ స్వామివారి శివలింగ స్వరూపమే), మరియు శ్రీ వీరభద్ర స్వామి సమేత భద్రకాళీ దేవి. అంతరాళయమునందే శ్రీ గణపతి, శ్రీ సుబ్రహ్మణ్య స్వామి కొలువైయున్నారు. ఈ సముదాయము చుట్టూ ప్రాంగణమునందు ప్రదక్షిణ మార్గము కలదు, ఇది దక్షిణదిశన నిష్క్రమణ ద్వారము వద్ద ముగియును.'
            )}
          </p>
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
