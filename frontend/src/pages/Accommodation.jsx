import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";
import { BedDouble, Users, IndianRupee, ChevronRight, Wifi, Droplets, Wind, Tv } from 'lucide-react';
import { BOOKINGS_PAUSED } from '@/lib/bookingStatus';

export default function Accommodation() {
  const { t, heading } = useT();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { user, userType } = useAuth();

  useEffect(() => {
    api.get('/accommodations').then(r => setAccommodations(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const typeColors = { 'AC': 'bg-blue-100 text-blue-800', 'Non-AC': 'bg-green-100 text-green-800', 'Cottage': 'bg-[#D4AF37]/20 text-[#8D2800]', 'Dormitory': 'bg-gray-100 text-gray-800', 'Guest House': 'bg-purple-100 text-purple-800' };

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="accommodation-title">{t("Accommodation", "వసతి సౌకర్యాలు")}</h1>
          <p className="text-sm text-[#5D4037] mt-2 max-w-lg mx-auto">Comfortable and hygienic rooms, cottages and dormitories with all amenities to accommodate pilgrims at Cheruvugattu.</p>
        </div>

        {loading ? <p className="text-center text-[#8D6E63]">Loading...</p> : accommodations.length === 0 ? (
          <LoadState error={loadError} emptyText="No accommodation is listed at the moment. Please contact the temple office." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accommodations.map((acc, i) => (
              <div key={acc.id} className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 hover:shadow-lg transition-all" data-testid={`acc-card-${acc.id}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-english-heading text-base text-[#2D1B0E]">{acc.name}</h3>
                      
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[acc.room_type] || 'bg-gray-100 text-gray-800'}`}>{acc.room_type}</span>
                  </div>
                  <p className="text-sm text-[#5D4037] mb-4">{acc.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8D6E63] mb-4">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Capacity: {acc.capacity}</span>
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {acc.total_rooms} rooms</span>
                  </div>
                  {acc.amenities && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {acc.amenities.split(',').map((a, j) => (
                        <span key={j} className="px-2 py-0.5 bg-[#FDFBF7] border border-[#E6DCCA] rounded text-xs text-[#5D4037]">{a.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-[#E6DCCA]">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4 text-[#C43E00]" />
                      <span className="text-xl font-bold text-[#C43E00]">{acc.price_per_day}</span>
                      <span className="text-sm text-[#8D6E63]">/ day</span>
                    </div>
                    {BOOKINGS_PAUSED ? (
                      <Link to={`/accommodation/book/${acc.id}`} className="inline-flex items-center gap-1 px-5 py-2 border-2 border-[#C43E00] text-[#C43E00] text-sm rounded-full hover:bg-[#C43E00]/5 transition-all" data-testid={`info-acc-${acc.id}`}>
                        More Info
                      </Link>
                    ) : user && userType === 'devotee' ? (
                      <Link to={`/accommodation/book/${acc.id}`} className="inline-flex items-center gap-1 px-5 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid={`book-acc-${acc.id}`}>
                        Book Now <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link to="/login" className="inline-flex items-center gap-1 px-5 py-2 border-2 border-[#C43E00] text-[#C43E00] text-sm rounded-full hover:bg-[#C43E00]/5 transition-all">
                        Login to Book
                      </Link>
                    )}
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
