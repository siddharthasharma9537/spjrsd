import { Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import usePageMeta from '@/hooks/usePageMeta';
import { Home, Search, Phone } from 'lucide-react';

export default function NotFound() {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The page you are looking for could not be found on the Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam website.',
    noIndex: true,
  });

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center w-full">
        <p className="font-english-heading text-6xl md:text-7xl text-[#D4AF37] mb-2">404</p>
        <h1 className="font-english-heading text-2xl md:text-3xl text-[#621B00] mb-1">Page Not Found</h1>
        <p className="font-telugu-heading text-lg text-[#8D6E63] mb-4">పేజీ కనబడలేదు</p>
        <p className="text-sm text-[#5D4037] max-w-md mx-auto mb-8">
          The page you are looking for may have been moved, or the link may be incorrect.
          Please use the links below, or contact the temple office for help.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase text-sm rounded-full hover:bg-[#C43E00]/90 transition-all">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link to="/sevas" className="inline-flex items-center gap-2 px-6 py-3 border border-[#E6DCCA] text-[#5D4037] text-sm rounded-full hover:border-[#D4AF37] transition-all">
            Book a Seva
          </Link>
          <Link to="/print-ticket" className="inline-flex items-center gap-2 px-6 py-3 border border-[#E6DCCA] text-[#5D4037] text-sm rounded-full hover:border-[#D4AF37] transition-all">
            <Search className="h-4 w-4" /> Find My Ticket
          </Link>
        </div>

        <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 inline-flex items-center gap-3 text-sm text-[#5D4037]">
          <Phone className="h-4 w-4 text-[#C43E00] shrink-0" />
          <span>Temple office: <a href="tel:+919491000701" className="text-[#621B00] font-medium hover:underline">+91 94910 00701</a></span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
