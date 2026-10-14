import { statusBadge, ticketRemark } from './ticketBadge';

const TODAY = '2026-10-14';
const remark = (b) => ticketRemark({ prasadam_eligible: true, ...b }, TODAY)?.label ?? null;

test.each([
  [{ status: 'Confirmed', for_date: TODAY }, null],
  [{ status: 'Confirmed', for_date: '2026-10-13' }, 'No-show'],
  [{ status: 'Confirmed', for_date: TODAY, prasadam_redeemed: true }, 'Prasadam collected · Pooja pending'],
  [{ status: 'Confirmed', for_date: '2026-10-13', prasadam_redeemed: true }, 'No-show · Prasadam collected'],
  [{ status: 'Completed', for_date: TODAY }, 'Prasadam pending'],
  [{ status: 'Completed', for_date: '2026-10-13' }, 'Prasadam not collected'],
  [{ status: 'Completed', for_date: '2026-10-13', prasadam_redeemed: true }, 'Prasadam collected'],
  [{ status: 'Cancelled', for_date: TODAY }, null],
  [{ status: 'Cancelled', for_date: TODAY, prasadam_redeemed: true }, 'Prasadam collected'],
  [{ status: 'NoShow', for_date: '2026-10-13' }, null],
])('%o → %s', (b, expected) => {
  expect(remark(b)).toBe(expected);
});

test('a Completed ticket with no prasadam has no remark, even after its date', () => {
  expect(ticketRemark({ status: 'Completed', for_date: '2026-10-01', prasadam_eligible: false }, TODAY)).toBeNull();
});

test('the status badge is always the stored status', () => {
  for (const status of ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'NoShow']) {
    expect(statusBadge({ status, for_date: '2026-10-01', prasadam_redeemed: true }).label).toBe(status);
  }
});
