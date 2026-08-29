import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BOOKINGS_PAUSED } from "@/lib/bookingStatus";
import ErrorBoundary from "@/components/ErrorBoundary";
import usePageMeta from "@/hooks/usePageMeta";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import DevoteeAuth from "@/pages/DevoteeAuth";
import SevaList from "@/pages/SevaList";
import SevaBooking from "@/pages/SevaBooking";
import SevaSamagriChecklist from "@/pages/SevaSamagriChecklist";
import BookingTicket from "@/pages/BookingTicket";
import MyBookings from "@/pages/MyBookings";
import Donations from "@/pages/Donations";
import DonationReceipt from "@/pages/DonationReceipt";
import Accommodation from "@/pages/Accommodation";
import AccommodationBooking from "@/pages/AccommodationBooking";
import AboutTemple from "@/pages/AboutTemple";
import Temples from "@/pages/Temples";
import Gallery from "@/pages/Gallery";
import TicketLookup from "@/pages/TicketLookup";
import NewsPage from "@/pages/NewsPage";
import LiveTV from "@/pages/LiveTV";
import Panchangam from "@/pages/Panchangam";
import LiveBlog from "@/pages/LiveBlog";
import VideoGallery from "@/pages/VideoGallery";
import ContactUs from "@/pages/ContactUs";
import FAQ from "@/pages/FAQ";
import Volunteer from "@/pages/Volunteer";
import QuickBooking from "@/pages/QuickBooking";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminSevas from "@/pages/admin/Sevas";
import AdminProfiles from "@/pages/admin/Profiles";
import AdminSlots from "@/pages/admin/Slots";
import AdminBookings from "@/pages/admin/Bookings";
import AdminDevotees from "@/pages/admin/Devotees";
import AdminNews from "@/pages/admin/News";
import AdminPanchangam from "@/pages/admin/Panchangam";
import AdminLiveBlog from "@/pages/admin/LiveBlog";
import AdminAccommodations from "@/pages/admin/Accommodations";
import AdminGallery from "@/pages/admin/GalleryAdmin";
import AdminDonations from "@/pages/admin/Donations";
import AdminNewsletter from "@/pages/admin/Newsletter";
import AdminContactMessages from "@/pages/admin/ContactMessages";
import "@/App.css";

function ProtectedDevotee({ children }) {
  const { user, userType, loading } = useAuth();
  if (loading) return null;
  if (!user || userType !== 'devotee') return <Navigate to="/login" />;
  return children;
}

function ProtectedAdmin({ children }) {
  const { user, userType, loading } = useAuth();
  if (loading) return null;
  if (!user || userType !== 'admin') return <Navigate to="/admin/login" />;
  return children;
}

/* Per-route title + description. Kept in one place rather than scattered across
   pages; matched longest-prefix-first so nested paths win. */
const ROUTE_META = [
  ['/admin', { title: 'Staff Area', noIndex: true }],
  ['/about', { title: 'Sthala Puranam & Temple History', description: 'The legend of the 108th Parashurama Linga at Cheruvugattu, temple deities, Arogya Kshetram, Amavasya Jatara, festivals and how to reach the temple.' }],
  ['/temples', { title: 'Temples of the Kshetram', description: 'Every temple of Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam - the hilltop shrines, Sri Parvathi Devi Temple, Sri Narasimha Swamy Temple, and Sri Swamy Vari Padalu at Yellareddigudem.' }],
  ['/sevas', { title: 'Seva Booking', description: 'Book Abhishekam, Kalyanam, Archana and other sevas online at Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu.' }],
  ['/paroksha-seva', { title: 'Paroksha Seva', description: 'Book a seva remotely and have it performed in your name at the temple, without travelling to Cheruvugattu.' }],
  ['/donations/annaprasadam', { title: 'AnnaPrasadam Donation', description: 'Sponsor Annadanam for pilgrims at Cheruvugattu temple. Permanent Nitya Annadanam scheme from Rs. 1,116. 80G receipt issued.' }],
  ['/donations', { title: 'e-Hundi Online Donation', description: 'Donate online to Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam. e-Hundi, Annadanam and accommodation-room schemes. 80G receipt issued.' }],
  ['/accommodation', { title: 'Pilgrim Accommodation', description: 'Book AC rooms, cottages and dormitory beds for your stay at Cheruvugattu temple.' }],
  ['/booking/quick', { title: 'Quick Booking', description: 'Book a seva quickly without creating an account.' }],
  ['/print-ticket', { title: 'Print Your Ticket', description: 'Look up and reprint your seva booking ticket by booking number or mobile number.' }],
  ['/my-bookings', { title: 'My Bookings', noIndex: true }],
  ['/news', { title: 'News & Events', description: 'Latest announcements, festival notices and events from Cheruvugattu temple.' }],
  ['/panchangam', { title: 'Daily Panchangam', description: 'Tithi, Nakshatra, sunrise/sunset and auspicious timings for Cheruvugattu temple.' }],
  ['/live-blog', { title: 'Live Blog', description: 'Real-time updates from festivals and events at Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu.' }],
  ['/media/live-tv', { title: 'Live TV', description: 'Watch live darshan and temple broadcasts from Cheruvugattu.' }],
  ['/media/gallery/videos', { title: 'Video Gallery', description: 'Videos of festivals, sevas and Brahmotsavams at Cheruvugattu temple.' }],
  ['/gallery', { title: 'Photo Gallery', description: 'Photographs of the temple, festivals and Brahmotsavams at Cheruvugattu.' }],
  ['/support/contact', { title: 'Contact Us', description: 'Temple address, Executive Officer contact number, office hours and enquiry form.' }],
  ['/support/faq', { title: 'Frequently Asked Questions', description: 'Answers about seva booking, donations, 80G receipts, accommodation and temple timings.' }],
  ['/volunteer', { title: 'Volunteer', description: 'Register to volunteer at Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu.' }],
  ['/login', { title: 'Devotee Login', noIndex: true }],
  ['/register', { title: 'Devotee Registration', noIndex: true }],
  ['/auth', { title: 'Devotee Login', noIndex: true }],
  ['/ticket', { title: 'Booking Ticket', noIndex: true }],
  ['/donation-receipt', { title: '80G Donation Receipt', noIndex: true }],
];

const HOME_META = {
  description: 'Official website of Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu, Nalgonda — the 108th and final Shiva Linga consecrated by Lord Parashurama. Book sevas, donate and plan your visit.',
};

/* React Router does not scroll to #hash targets on its own, so footer links like
   /about#festivals would otherwise land at the top of the page. Also resets to
   the top on ordinary navigations, which the app did not do before either.
   Deliberately a single instant jump, not 'smooth': the target sections sit
   below image grids that reserve their space with aspect-ratio boxes, so
   layout is already stable by the time this fires - an earlier version that
   re-issued a smooth scrollIntoView on every image load event fed itself
   inputs while the browser's own scroll animation was still mid-flight and
   ran away to the bottom of the page. */
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 80);
    return () => clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

function RouteMeta() {
  const { pathname } = useLocation();
  const match = ROUTE_META.find(([p]) => pathname === p || pathname.startsWith(p + '/'));
  usePageMeta(pathname === '/' ? HOME_META : (match ? match[1] : HOME_META));
  return null;
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <LanguageProvider>
      <BrowserRouter>
        <RouteMeta />
        <ScrollToHash />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<DevoteeAuth />} />
          <Route path="/register" element={<DevoteeAuth />} />
          <Route path="/auth/sign-in" element={<DevoteeAuth />} />
          <Route path="/auth/sign-up" element={<DevoteeAuth />} />
          <Route path="/about" element={<AboutTemple />} />
          <Route path="/temples" element={<Temples />} />
          <Route path="/sevas" element={<SevaList />} />
          <Route path="/sevas/pratyaksha" element={<SevaList />} />
          <Route path="/sevas/paroksha" element={<SevaList paroksha />} />
          <Route path="/paroksha-seva" element={<SevaList paroksha />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/donations/:type" element={<Donations />} />
          <Route path="/donations/e-hundi" element={<Donations />} />
          <Route path="/donations/annadanam" element={<Donations />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/media/gallery/photos" element={<Gallery />} />
          <Route path="/media/gallery/videos" element={<VideoGallery />} />
          <Route path="/media/live-tv" element={<LiveTV />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/media/news" element={<NewsPage />} />
          <Route path="/panchangam" element={<Panchangam />} />
          <Route path="/live-blog" element={<LiveBlog />} />
          <Route path="/media/live-blog" element={<LiveBlog />} />
          <Route path="/print-ticket" element={<TicketLookup />} />
          <Route path="/support/contact" element={<ContactUs />} />
          <Route path="/support/faq" element={<FAQ />} />
          <Route path="/support/helpdesk" element={<ContactUs />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/booking/quick" element={<QuickBooking />} />
          <Route path="/booking/seva" element={<SevaList />} />
          <Route path="/booking/darshan" element={<SevaList />} />
          <Route path="/donation-receipt/:donationId" element={<DonationReceipt />} />
          {/* Protected Devotee */}
          {/* While BOOKINGS_PAUSED, these two render info-only (no form, no
              submit) - so they stay open rather than bouncing anonymous
              visitors to login before they can see anything. */}
          <Route path="/book/:sevaId" element={BOOKINGS_PAUSED ? <SevaBooking /> : <ProtectedDevotee><SevaBooking /></ProtectedDevotee>} />
          <Route path="/book/:sevaId/checklist" element={<SevaSamagriChecklist />} />
          <Route path="/ticket/:bookingId" element={<ProtectedDevotee><BookingTicket /></ProtectedDevotee>} />
          <Route path="/my-bookings" element={<ProtectedDevotee><MyBookings /></ProtectedDevotee>} />
          <Route path="/accommodation/book/:accId" element={BOOKINGS_PAUSED ? <AccommodationBooking /> : <ProtectedDevotee><AccommodationBooking /></ProtectedDevotee>} />
          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
          <Route path="/admin/sevas" element={<ProtectedAdmin><AdminSevas /></ProtectedAdmin>} />
          <Route path="/admin/profiles" element={<ProtectedAdmin><AdminProfiles /></ProtectedAdmin>} />
          <Route path="/admin/slots" element={<ProtectedAdmin><AdminSlots /></ProtectedAdmin>} />
          <Route path="/admin/bookings" element={<ProtectedAdmin><AdminBookings /></ProtectedAdmin>} />
          <Route path="/admin/devotees" element={<ProtectedAdmin><AdminDevotees /></ProtectedAdmin>} />
          <Route path="/admin/news" element={<ProtectedAdmin><AdminNews /></ProtectedAdmin>} />
          <Route path="/admin/panchangam" element={<ProtectedAdmin><AdminPanchangam /></ProtectedAdmin>} />
          <Route path="/admin/live-blog" element={<ProtectedAdmin><AdminLiveBlog /></ProtectedAdmin>} />
          <Route path="/admin/accommodations" element={<ProtectedAdmin><AdminAccommodations /></ProtectedAdmin>} />
          <Route path="/admin/gallery" element={<ProtectedAdmin><AdminGallery /></ProtectedAdmin>} />
          <Route path="/admin/donations" element={<ProtectedAdmin><AdminDonations /></ProtectedAdmin>} />
          <Route path="/admin/newsletter" element={<ProtectedAdmin><AdminNewsletter /></ProtectedAdmin>} />
          <Route path="/admin/contact-messages" element={<ProtectedAdmin><AdminContactMessages /></ProtectedAdmin>} />

          {/* Catch-all: anything unmatched gets a real page, not a blank screen */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
