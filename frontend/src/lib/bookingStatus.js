// Single switch to pause online booking sitewide (seva and accommodation).
// Flip back to false to resume - no other changes needed.
export const BOOKINGS_PAUSED = true;

// The in-app donation form has no real payment gateway behind it - submitting
// it creates a fake "Paid (MOCKED)" record and a downloadable 80G receipt for
// a donation that never actually happened. Pausing it until a real gateway is
// wired in; the genuine QR code / bank transfer / UPI details on the same
// page are unaffected and stay available.
export const DONATION_FORM_PAUSED = true;
