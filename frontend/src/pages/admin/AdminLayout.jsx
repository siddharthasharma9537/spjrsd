import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, LayoutDashboard, Flame as FlameIcon, Calendar, Clock, BookOpen, Users, LogOut, HandCoins, BedDouble, Newspaper, Camera, Sun, Radio, Mail, MessageSquare } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/sevas', icon: FlameIcon, label: 'Sevas' },
  { path: '/admin/profiles', icon: Calendar, label: 'Day Profiles' },
  { path: '/admin/slots', icon: Clock, label: 'Slots' },
  { path: '/admin/bookings', icon: BookOpen, label: 'Bookings' },
  { path: '/admin/donations', icon: HandCoins, label: 'Donations' },
  { path: '/admin/accommodations', icon: BedDouble, label: 'Accommodation' },
  { path: '/admin/news', icon: Newspaper, label: 'News' },
  { path: '/admin/panchangam', icon: Sun, label: 'Panchangam' },
  { path: '/admin/live-blog', icon: Radio, label: 'Live Blog' },
  { path: '/admin/gallery', icon: Camera, label: 'Gallery' },
  { path: '/admin/devotees', icon: Users, label: 'Devotees' },
  { path: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
  { path: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages' },
];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2D1B0E] text-[#FFE0B2] hidden md:flex flex-col shrink-0">
        <div className="p-5 border-b border-[#5D4037]/30">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <span className="font-english-heading text-xs tracking-wide">ADMIN PORTAL</span>
          </div>
          <p className="text-xs text-[#8D6E63]">{user?.name} ({user?.role})</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === item.path ? 'bg-[#C43E00] text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80'
            }`} data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#5D4037]/30">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#FFE0B2]/60 hover:text-white transition-colors w-full" data-testid="admin-logout">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-[#2D1B0E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-sm font-english-heading">Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} className={`p-2 rounded ${location.pathname === item.path ? 'bg-[#C43E00]' : ''}`}>
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
            <button onClick={logout} className="p-2"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
          {title && <h1 className="font-english-heading text-2xl text-[#621B00] mb-6" data-testid="admin-page-title">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
