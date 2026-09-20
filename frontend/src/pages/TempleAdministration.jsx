import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const CONTENT = {
  admin: {
    en: [
      'Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam is located in Cheruvugattu village, Narketpally Mandal, Nalgonda District, on the Narketpally-Addanki road, about 4 km from Narketpally (on the Hyderabad-Vijayawada National Highway) and 15 km from Nalgonda town. Believed to date back to the Treta Yuga, it is one of Telangana\'s most prominent Shaiva pilgrimage centres.',
      'The temple was published under Section 6(a) and registered under Section 43 of the Telangana Charitable and Hindu Religious Institutions and Endowments Act 30/87. It ranks among the state\'s prominent temples with Assistant Commissioner status, and is administered by an Executive Officer appointed by the Government of Telangana.',
    ],
    te: [
      'శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామివారి దేవస్థానము నల్లగొండ జిల్లా నార్కట్‌పల్లి మండలములోని చెరువుగట్టు గ్రామంలో వుంది. ఈ క్షేత్రము హైదరాబాదు - విజయవాడ జాతీయ రహదారిపై గల నార్కట్‌పల్లికి 4 కి.మీ. దూరంలో నార్కట్‌పల్లి - అద్దంకి రహదారిపై ఉండి, నల్లగొండ పట్టణానికి 15 కి.మీ. దూరంలో వుంది. త్రేతాయుగం నాటిదని భావిస్తున్న ఈ పుణ్యక్షేత్రము తెలంగాణ రాష్ట్రములోని ప్రముఖ శైవ పుణ్యక్షేత్రంగా విరాజిల్లుతూ, భక్తుల పాలిట కొంగుబంగారంగా మారింది.',
      'రాష్ట్ర దేవాదాయ ధర్మాదాయ శాఖ చట్టం 30/87 నందలి సెక్షన్ 6(ఎ) ప్రకారం పబ్లికేషన్ కాబడి, సెక్షన్ 43 ప్రకారం దేవాదాయ ధర్మాదాయ శాఖ నందు రిజిష్టర్ కాబడి, రాష్ట్రంలోని అనేక ప్రముఖ దేవస్థానములతో పాటు అసిస్టెంటు కమీషనరు హోదా కలిగిన దేవాలయంగా ఉండి, తెలంగాణ ప్రభుత్వం చేత నియామకం చేయబడిన సహాయ కమీషనరుచే కార్యనిర్వహణాధికారిగా ఈ దేవస్థాన పరిపాలన నిర్వహింపబడుతోంది.',
    ],
  },
};

/* The Executive Officer is a government appointee who oversees the temple
   administration, not a member of the Dharmakartha Mandali - shown as its
   own entry, separate from the trustee board below. */
const EXECUTIVE_OFFICER = { nameEn: 'Sri S. Mohan Babu', nameTe: 'శ్రీ ఎస్. మోహన్ బాబు గారు', roleEn: 'Assistant Commissioner & Executive Officer', roleTe: 'అసిస్టెంట్ కమీషనర్ & కార్యనిర్వహణాధికారి' };

/* Transcribed from the Dharmakartha Mandali board at the temple office. */
const TRUST_BOARD = [
  { nameEn: 'Sri Varala Ramesh', nameTe: 'శ్రీ వారాల రమేష్ గారు', roleEn: 'Chairman', roleTe: 'చైర్మన్' },
  { nameEn: 'Sri Kommu Sreenu', nameTe: 'శ్రీ కొమ్ము శ్రీను గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Mandula Narsimha', nameTe: 'శ్రీ మందుల నర్సింహ్మా గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Ranga Sravan Kumar', nameTe: 'శ్రీ రంగా శ్రవణ్ కుమార్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Smt. Nalla Anitha', nameTe: 'శ్రీమతి నల్ల అనిత గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Pala Mahesh', nameTe: 'శ్రీ పాల మహేష్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Veeravelli Raghunadh', nameTe: 'శ్రీ వీరవెల్లి రఘునాధ్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Marri Lingaswamy', nameTe: 'శ్రీ మర్రి లింగస్వామి గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Gaddaguti Yadayya', nameTe: 'శ్రీ గద్దగూటి యాదయ్య గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Regatte Srinivas Reddy', nameTe: 'శ్రీ రేగట్టె శ్రీనివాస్ రెడ్డి గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Prajnapuram Satyanarayana', nameTe: 'శ్రీ ప్రజ్ఞాపురం సత్యనారాయణ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Idukulla Sampath', nameTe: 'శ్రీ ఇడుకుళ్ళ సంపత్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Kammalapalli Mallesh', nameTe: 'శ్రీ కమ్మలపల్లి మల్లేష్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Gouridevi Lakshmayya', nameTe: 'శ్రీ గౌరిదేవి లక్ష్మయ్య గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Dr. P. Ramalingeshwara Sharma', nameTe: 'డా. పి. రామలింగేశ్వర శర్మ గారు', roleEn: 'Ex-Officio Member & Pradhana Archaka', roleTe: 'ఎక్స్ అఫీషియో సభ్యులు & ప్రధాన అర్చకులు' },
];

export default function TempleAdministration() {
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
          <h1 className={`${headingFont} wordmark-outline text-2xl md:text-4xl mb-2`} data-testid="temple-administration-title">
            {te ? 'దేవస్థానం - పరిపాలన' : 'Temple Administration'}
          </h1>
          <p className="text-[#FFE0B2]/70 text-sm">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <div className={`text-sm text-[#5D4037] leading-relaxed space-y-3 ${bodyFont}`}>
            {(te ? CONTENT.admin.te : CONTENT.admin.en).map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {/* Executive Officer - a government appointee overseeing the temple's
              administration, kept apart from the Dharmakartha Mandali below. */}
          <div className="mt-6 pt-6 border-t border-[#E6DCCA]">
            <p className={`text-sm font-medium text-[#2D1B0E] mb-3 ${te ? 'font-telugu-heading' : ''}`}>
              {te ? 'పరిపాలన' : 'Administration'}
            </p>
            <div className="flex flex-col gap-1 text-sm text-[#5D4037]">
              <span className={te ? 'font-telugu-body' : ''}>{te ? EXECUTIVE_OFFICER.nameTe : EXECUTIVE_OFFICER.nameEn}</span>
              <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full w-fit text-[#8D6E63] ${te ? 'font-telugu-body' : ''}`}>
                {te ? EXECUTIVE_OFFICER.roleTe : EXECUTIVE_OFFICER.roleEn}
              </span>
            </div>
          </div>

          {/* Dharmakartha Mandali - transcribed from the board at the temple office */}
          <div className="mt-6 pt-6 border-t border-[#E6DCCA]">
            <p className={`text-sm font-medium text-[#2D1B0E] mb-3 ${te ? 'font-telugu-heading' : ''}`}>
              {te ? 'ధర్మకర్తల మండలి' : 'Dharmakartha Mandali (Board of Trustees)'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#5D4037]">
              {TRUST_BOARD.map((m, i) => {
                const isLast = i === TRUST_BOARD.length - 1;
                return (
                  <div key={i} className={`flex ${isLast ? 'flex-col sm:col-span-2' : 'items-baseline justify-between'} gap-1 sm:gap-3 py-1 border-b border-[#E6DCCA]/60`}>
                    <span className={te ? 'font-telugu-body' : ''}>{i + 1}. {te ? m.nameTe : m.nameEn}</span>
                    <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full w-fit text-[#8D6E63] ${te ? 'font-telugu-body' : ''}`}>
                      {te ? m.roleTe : m.roleEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
