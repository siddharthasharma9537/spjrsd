import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Flame, Printer, ArrowLeft, CheckCircle } from 'lucide-react';

export default function BookingTicket() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <div className="min-h-screen bg-[#FFFCF5] flex items-center justify-center text-[#8D6E63]">Loading ticket...</div>;
  if (!booking) return <div className="min-h-screen bg-[#FFFCF5] flex items-center justify-center text-red-600">Booking not found</div>;

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <nav className="bg-[#621B00] text-white print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-[#D4AF37]" />
            <span className="font-english-heading text-sm tracking-wide">SPJR Devasthanams</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/my-bookings" className="hover:text-[#D4AF37]">My Bookings</Link>
            <Link to="/sevas" className="hover:text-[#D4AF37]">Book More</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Link to="/my-bookings" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] transition-colors">
            <ArrowLeft className="h-4 w-4" /> My Bookings
          </Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90 transition-all" data-testid="print-ticket-btn">
            <Printer className="h-4 w-4" /> Print Ticket
          </button>
        </div>

        {/* Success banner */}
        <div className="print:hidden bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3" data-testid="booking-success-banner">
          <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
          <div>
            <p className="text-green-800 font-medium">Booking Confirmed! / బుకింగ్ నిర్ధారించబడింది!</p>
            <p className="text-green-600 text-sm">Your seva ticket is ready below</p>
          </div>
        </div>

        {/* Ticket */}
        <div className="ticket-border bg-white rounded-xl overflow-hidden shadow-md" data-testid="seva-ticket">
          {/* Header */}
          <div className="bg-[#621B00] text-white p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <h1 className="font-english-heading text-sm tracking-widest uppercase mb-1">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</h1>
            <p className="font-telugu-heading text-base text-[#D4AF37]">శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం</p>
            <p className="text-xs text-[#FFE0B2]/70 mt-1">Cheruvugattu, Nalgonda, Telangana</p>
          </div>

          {/* Booking ID */}
          <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-[#8D6E63] uppercase tracking-wide">Booking ID</span>
            <span className="font-mono text-sm font-bold text-[#621B00]" data-testid="ticket-booking-number">{booking.booking_number}</span>
          </div>

          <div className="p-6 space-y-4">
            {/* Seva info */}
            <div className="bg-[#FDFBF7] rounded-lg p-4 border border-[#E6DCCA]">
              <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Seva / సేవ</p>
              <p className="font-english-heading text-base text-[#2D1B0E]" data-testid="ticket-seva-english">{booking.seva_name_english}</p>
              <p className="font-telugu-heading text-lg text-[#621B00]" data-testid="ticket-seva-telugu">{booking.seva_name_telugu}</p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Devotee / భక్తుడు</p>
                <p className="text-sm font-medium text-[#2D1B0E]" data-testid="ticket-devotee-name">{booking.devotee_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Mobile / మొబైల్</p>
                <p className="text-sm font-medium text-[#2D1B0E]" data-testid="ticket-mobile">{booking.devotee_mobile}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">గోత్రం / Gotram</p>
                <p className="text-sm font-medium text-[#2D1B0E]" data-testid="ticket-gotram">{booking.gotram}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Persons / వ్యక్తులు</p>
                <p className="text-sm font-medium text-[#2D1B0E]" data-testid="ticket-persons">{booking.number_of_persons}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Seva Date / సేవ తేదీ</p>
                <p className="text-sm font-medium text-[#2D1B0E]" data-testid="ticket-date">{booking.for_date}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Reporting Time</p>
                <p className="text-sm font-medium text-[#2D1B0E]">30 min before start</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Seva Time / సమయం</p>
                <p className="text-sm font-medium text-[#2D1B0E]" data-testid="ticket-time">{booking.slot_start_time} - {booking.slot_end_time}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Booked On</p>
                <p className="text-sm font-medium text-[#2D1B0E]">{new Date(booking.booking_date_time).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center justify-between bg-[#D4AF37]/10 rounded-lg p-4 border border-[#D4AF37]/20">
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide">Amount / మొత్తం</p>
                <p className="text-xl font-bold text-[#621B00]" data-testid="ticket-amount">Rs. {booking.amount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide">Payment / చెల్లింపు</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  booking.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`} data-testid="ticket-payment-status">{booking.payment_status}</span>
              </div>
            </div>

            {/* Note */}
            <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4 text-xs leading-relaxed">
              <p className="font-telugu-body text-[#621B00] mb-1">
                ప్రతి టికెట్ గరిష్టంగా 4 మందికి మాత్రమే (2 పెద్దలు + 18 సంవత్సరాల లోపు 2 పిల్లలు) చెల్లుతుంది.
              </p>
              <p className="text-[#5D4037]">
                Each ticket is valid for a maximum of 4 persons (2 adults and 2 children below 18 years). Children below 18 years included in this ticket do not require a separate ticket.
              </p>
            </div>

            {/* Status */}
            <div className="text-center">
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                booking.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`} data-testid="ticket-status">Status: {booking.status}</span>
            </div>
          </div>

          {/* Torn paper bottom */}
          <div className="h-4 bg-white torn-paper" />
        </div>
      </div>
    </div>
  );
}
