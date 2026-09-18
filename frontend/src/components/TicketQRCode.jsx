import { QRCodeSVG } from 'qrcode.react';

// Encodes the booking_number - the same reference a devotee can already look
// up a ticket by (see TicketLookup.jsx) - so a handheld scanner at the seva
// location or the Prasadam Counter reads back a plain string that the scan
// endpoints (POST /admin/bookings/scan-complete, /scan-redeem-prasadam) can
// look up directly. No booking id or other internal field is encoded.
export default function TicketQRCode({ bookingNumber, size = 96 }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <QRCodeSVG value={bookingNumber} size={size} />
      <p className="text-[10px] text-[#8D6E63] uppercase tracking-wide">Scan at Seva / Prasadam Counter</p>
    </div>
  );
}
