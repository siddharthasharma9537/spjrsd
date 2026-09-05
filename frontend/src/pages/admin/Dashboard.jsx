import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Users, BookOpen, Flame, IndianRupee, CalendarCheck, HandCoins, BedDouble, Newspaper, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { icon: Users, label: 'Total Devotees', value: stats.total_devotees, color: 'text-[#C43E00]', bg: 'bg-[#C43E00]/10' },
    { icon: BookOpen, label: 'Total Bookings', value: stats.total_bookings, color: 'text-[#621B00]', bg: 'bg-[#621B00]/10' },
    { icon: CalendarCheck, label: "Today's Bookings", value: stats.today_bookings, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { icon: Flame, label: 'Active Sevas', value: stats.total_sevas, color: 'text-[#C43E00]', bg: 'bg-[#C43E00]/10' },
    { icon: IndianRupee, label: 'Seva Revenue', value: `Rs. ${stats.total_revenue.toLocaleString()}`, color: 'text-[#621B00]', bg: 'bg-[#D4AF37]/10' },
    { icon: HandCoins, label: 'Total Donations', value: stats.total_donations, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { icon: IndianRupee, label: 'Donation Amount', value: `Rs. ${stats.total_donation_amount.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: BedDouble, label: 'Accommodation Bookings', value: stats.total_acc_bookings, color: 'text-[#621B00]', bg: 'bg-[#621B00]/10' },
    { icon: Users, label: 'Total Visitors', value: stats.total_visitors?.toLocaleString(), color: 'text-[#C43E00]', bg: 'bg-[#C43E00]/10' },
    { icon: Eye, label: "Today's Visitors", value: stats.todays_visitors?.toLocaleString(), color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
  ] : [];

  return (
    <AdminLayout title="Dashboard">
      {loading ? <p className="text-[#8D6E63]">Loading stats...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <div key={i} className="bg-white border border-[#E6DCCA] rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all" data-testid={`stat-card-${i}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${c.bg} rounded-full flex items-center justify-center`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63]">{c.label}</p>
                  <p className="text-xl font-bold text-[#2D1B0E]">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
