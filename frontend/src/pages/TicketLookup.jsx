import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Search, Printer, Eye, Ticket } from 'lucide-react';

export default function TicketLookup() {
  const { t, heading } = useT();
  const uid = useId();
  const [searchType, setSearchType] = useState('booking_number');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = searchType === 'booking_number' ? `booking_number=${query}` : `mobile=${query}`;
      const res = await api.get(`/bookings/lookup/ticket?${params}`);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = { Confirmed: 'bg-green-100 text-green-800', Completed: 'bg-blue-100 text-blue-800', Cancelled: 'bg-red-100 text-red-800', Pending: 'bg-yellow-100 text-yellow-800' };
  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className={`${heading} text-2xl md:text-3xl text-[#621B00] mb-1`} data-testid="ticket-lookup-title">{t("Print a Ticket", "టికెట్ ప్రింట్ చేయండి")}</h1>
          <p className="text-sm text-[#5D4037] mt-2">{t('Look up and reprint your seva booking ticket', 'మీ సేవ బుకింగ్ టికెట్‌ను వెతికి మళ్ళీ ప్రింట్ చేయండి')}</p>
        </div>

        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 shadow-sm" data-testid="ticket-lookup-form">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setSearchType('booking_number')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${searchType === 'booking_number' ? 'bg-[#C43E00] text-white' : 'bg-[#FDFBF7] text-[#5D4037] border border-[#E6DCCA]'}`} data-testid="search-by-booking">
                {t('By Booking Number', 'బుకింగ్ నంబర్ ద్వారా')}
              </button>
              <button type="button" onClick={() => setSearchType('mobile')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${searchType === 'mobile' ? 'bg-[#C43E00] text-white' : 'bg-[#FDFBF7] text-[#5D4037] border border-[#E6DCCA]'}`} data-testid="search-by-mobile">
                {t('By Mobile Number', 'మొబైల్ నంబర్ ద్వారా')}
              </button>
            </div>
            <div className="flex gap-2">
              <label htmlFor={`${uid}-ticket-search`} className="sr-only">
                {searchType === 'booking_number' ? t('Booking number', 'బుకింగ్ నంబర్') : t('Mobile number', 'మొబైల్ నంబర్')}
              </label>
              <input
                id={`${uid}-ticket-search`}
                name={searchType === 'booking_number' ? 'booking_number' : 'mobile'}
                type={searchType === 'booking_number' ? 'text' : 'tel'}
                inputMode={searchType === 'booking_number' ? 'text' : 'numeric'}
                autoComplete={searchType === 'booking_number' ? 'off' : 'tel'}
                className={inputCls}
                placeholder={searchType === 'booking_number' ? t('Enter booking number (e.g., SPJR-...)', 'బుకింగ్ నంబర్ నమోదు చేయండి (ఉదా., SPJR-...)') : t('Enter mobile number', 'మొబైల్ నంబర్ నమోదు చేయండి')}
                value={query} onChange={e => setQuery(e.target.value)} required data-testid="input-ticket-search" />
              <button type="submit" disabled={loading} aria-label={t('Search for ticket', 'టికెట్ కొరకు వెతకండి')} className="px-6 bg-[#C43E00] text-white rounded-lg hover:bg-[#C43E00]/90 transition-all disabled:opacity-50" data-testid="search-ticket-btn">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>

        {loading && <p className="text-center py-8 text-[#8D6E63]">{t('Searching...', 'వెతుకుతోంది...')}</p>}

        {searched && !loading && results.length === 0 && (
          <p className="text-center py-8 text-[#8D6E63]" data-testid="no-results">{t('No tickets found. Check your booking number or mobile.', 'టికెట్లు కనబడలేదు. మీ బుకింగ్ నంబర్ లేదా మొబైల్‌ను తనిఖీ చేయండి.')}</p>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3" data-testid="ticket-results">
            <p className="text-sm text-[#8D6E63]">{t(`${results.length} ticket(s) found`, `${results.length} టికెట్(లు) దొరికాయి`)}</p>
            {results.map(b => (
              <div key={b.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-[#621B00] font-bold mb-1">{b.booking_number}</p>
                    <p className="text-sm font-medium text-[#2D1B0E]">{b.seva_name_english}</p>
                    <p className="text-xs text-[#8D6E63]">{b.for_date} | {b.slot_start_time}-{b.slot_end_time} | {b.devotee_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[b.status] || 'bg-gray-100'}`}>{b.status}</span>
                    <Link to={`/ticket/${b.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#621B00] text-white text-xs rounded-full hover:bg-[#621B00]/90">
                      <Printer className="h-3 w-3" /> {t('Print', 'ప్రింట్')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
