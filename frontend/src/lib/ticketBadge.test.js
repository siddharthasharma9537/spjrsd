import { ticketBadge } from './ticketBadge';

const TODAY = '2026-10-14';
const label = (b) => ticketBadge({ prasadam_eligible: true, ...b }, TODAY).label;

test.each([
  [{ status: 'Confirmed', for_date: TODAY }, 'Confirmed'],
  [{ status: 'Confirmed', for_date: '2026-10-13' }, 'No-show'],
  [{ status: 'Confirmed', for_date: TODAY, prasadam_redeemed: true }, 'Prasadam collected · Pooja pending'],
  [{ status: 'Confirmed', for_date: '2026-10-13', prasadam_redeemed: true }, 'No-show · Prasadam collected'],
  [{ status: 'Completed', for_date: TODAY }, 'Completed · Prasadam pending'],
  [{ status: 'Completed', for_date: '2026-10-13' }, 'Completed · Prasadam not collected'],
  [{ status: 'Completed', for_date: '2026-10-13', prasadam_redeemed: true }, 'Completed · Prasadam collected'],
  [{ status: 'Cancelled', for_date: TODAY }, 'Cancelled'],
  [{ status: 'Cancelled', for_date: TODAY, prasadam_redeemed: true }, 'Cancelled · Prasadam collected'],
  [{ status: 'NoShow', for_date: '2026-10-13' }, 'No-show'],
])('%o → %s', (b, expected) => {
  expect(label(b)).toBe(expected);
});

test('a Completed ticket with no prasadam is just Completed, even after its date', () => {
  expect(ticketBadge({ status: 'Completed', for_date: '2026-10-01', prasadam_eligible: false }, TODAY).label).toBe('Completed');
});
