// One label for a ticket's pooja + free-prasadam state, shared by the admin
// Bookings list and the devotee's ticket page. "No-show" and "not collected"
// aren't stored anywhere - they follow from the ticket's date having passed
// (IST), so nothing has to run overnight to mark them.

export const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

const GREEN = 'bg-green-100 text-green-800';
const BLUE = 'bg-blue-100 text-blue-800';
const AMBER = 'bg-amber-100 text-amber-800';
const ORANGE = 'bg-orange-100 text-orange-800';
const GRAY = 'bg-gray-100 text-gray-800';
const RED = 'bg-red-100 text-red-800';
const YELLOW = 'bg-yellow-100 text-yellow-800';

export function ticketBadge(b, today = todayIst()) {
  const past = !!b.for_date && b.for_date < today;
  const collected = !!b.prasadam_redeemed;
  if (b.status === 'Confirmed') {
    if (collected) return past ? { label: 'No-show · Prasadam collected', cls: GRAY } : { label: 'Prasadam collected · Pooja pending', cls: AMBER };
    return past ? { label: 'No-show', cls: GRAY } : { label: 'Confirmed', cls: GREEN };
  }
  if (b.status === 'Completed') {
    if (collected) return { label: 'Completed · Prasadam collected', cls: GREEN };
    if (b.prasadam_eligible) return past ? { label: 'Completed · Prasadam not collected', cls: ORANGE } : { label: 'Completed · Prasadam pending', cls: AMBER };
    return { label: 'Completed', cls: BLUE };
  }
  const label = b.status === 'NoShow' ? 'No-show' : b.status;
  const cls = { Cancelled: RED, NoShow: GRAY, Pending: YELLOW }[b.status] || GRAY;
  return { label: collected ? `${label} · Prasadam collected` : label, cls };
}
