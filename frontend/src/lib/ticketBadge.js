// A ticket shows two things, shared by the admin Bookings list and the
// devotee's ticket page:
//   - statusBadge: the booking status exactly as stored (Confirmed, Completed...)
//   - ticketRemark: what happened with the pooja and the free prasadam.
// "No-show" and "not collected" aren't stored anywhere - they follow from
// the ticket's date having passed (IST), so nothing has to run overnight.

export const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

const GREEN = 'bg-green-100 text-green-800';
const BLUE = 'bg-blue-100 text-blue-800';
const AMBER = 'bg-amber-100 text-amber-800';
const ORANGE = 'bg-orange-100 text-orange-800';
const GRAY = 'bg-gray-100 text-gray-800';
const RED = 'bg-red-100 text-red-800';
const YELLOW = 'bg-yellow-100 text-yellow-800';

export function statusBadge(b) {
  const cls = { Confirmed: GREEN, Completed: BLUE, Cancelled: RED, Pending: YELLOW, NoShow: GRAY }[b.status] || GRAY;
  return { label: b.status, cls };
}

// null when there's nothing to add to the status.
export function ticketRemark(b, today = todayIst()) {
  const past = !!b.for_date && b.for_date < today;
  const collected = !!b.prasadam_redeemed;
  if (b.status === 'Confirmed') {
    if (past) return { label: collected ? 'No-show · Prasadam collected' : 'No-show', cls: GRAY };
    return collected ? { label: 'Prasadam collected · Pooja pending', cls: AMBER } : null;
  }
  if (b.status === 'Completed' && (b.prasadam_eligible || collected)) {
    if (collected) return { label: 'Prasadam collected', cls: GREEN };
    return past ? { label: 'Prasadam not collected', cls: ORANGE } : { label: 'Prasadam pending', cls: AMBER };
  }
  return collected ? { label: 'Prasadam collected', cls: GREEN } : null;
}
