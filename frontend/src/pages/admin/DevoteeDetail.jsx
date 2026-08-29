import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Phone, Mail, ArrowLeft, Flame, BedDouble, HandCoins, MessageSquare, HeartHandshake, Mail as MailIcon } from 'lucide-react';

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 mb-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-[#2D1B0E] mb-3">
        <Icon className="h-4 w-4 text-[#C43E00]" /> {title} <span className="text-xs text-[#8D6E63] font-normal">({count})</span>
      </h2>
      {count === 0 ? <p className="text-xs text-[#8D6E63]">None</p> : children}
    </div>
  );
}

export default function AdminDevoteeDetail() {
  const { devoteeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get(`/admin/devotees/${devoteeId}/activity`).then(r => setData(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [devoteeId]);

  const fmt = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <AdminLayout title="Devotee Activity">
      <button onClick={() => navigate('/admin/devotees')} className="inline-flex items-center gap-1 text-sm text-[#5D4037] hover:text-[#C43E00] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Devotee List
      </button>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : loadError || !data ? (
        <p className="text-center py-12 text-[#8D6E63]">Failed to load devotee activity</p>
      ) : (
        <>
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 mb-6">
            <h2 className="text-lg font-medium text-[#2D1B0E]">{data.devotee.name}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#5D4037]">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {data.devotee.mobile}</span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {data.devotee.email || '—'}</span>
              <span>Gotram: {data.devotee.gotram || '—'}</span>
              <span className="text-[#8D6E63]">Registered {fmt(data.devotee.created_at)}</span>
              {data.newsletter_subscribed && <span className="flex items-center gap-1 text-[#2E7D32]"><MailIcon className="h-3.5 w-3.5" /> Newsletter subscriber</span>}
            </div>
          </div>

          <Section icon={Flame} title="Seva Bookings" count={data.bookings.length}>
            <div className="space-y-2">
              {data.bookings.map(b => (
                <div key={b.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-booking-${b.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{b.seva_name_english}</span> — {b.for_date}, {b.number_of_persons} person(s), ₹{b.amount} — <span className="text-[#8D6E63]">{b.status} / {b.payment_status}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={BedDouble} title="Accommodation Bookings" count={data.accommodation_bookings.length}>
            <div className="space-y-2">
              {data.accommodation_bookings.map(b => (
                <div key={b.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-accommodation-${b.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{b.accommodation_name}</span> ({b.room_type}) — {b.check_in_date} to {b.check_out_date}, ₹{b.amount} — <span className="text-[#8D6E63]">{b.status} / {b.payment_status}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={HandCoins} title="Donations" count={data.donations.length}>
            <div className="space-y-2">
              {data.donations.map(d => (
                <div key={d.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-donation-${d.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{d.donation_type}</span> — ₹{d.amount} — <span className="text-[#8D6E63]">{d.payment_status}, {fmt(d.created_at)}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={MessageSquare} title="Contact Us Messages" count={data.contact_messages.length}>
            <div className="space-y-2">
              {data.contact_messages.map(m => (
                <div key={m.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-contact-${m.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{m.subject || 'General Inquiry'}</span> — <span className="text-[#8D6E63]">{fmt(m.created_at)}</span>
                  <p className="text-[#5D4037] mt-0.5">{m.message}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={HeartHandshake} title="Volunteer Applications" count={data.volunteer_applications.length}>
            <div className="space-y-2">
              {data.volunteer_applications.map(v => (
                <div key={v.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-volunteer-${v.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{v.availability || 'Volunteer application'}</span> — <span className="text-[#8D6E63]">{v.status}, {fmt(v.created_at)}</span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </AdminLayout>
  );
}
