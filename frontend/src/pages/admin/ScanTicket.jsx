import { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { CheckCircle, XCircle, Gift, Flame } from 'lucide-react';

// No camera or barcode-decoding logic here on purpose - a handheld barcode/
// QR scanner acts as a keyboard (types the scanned booking_number, then
// Enter), so a plain auto-focused text input is all this screen needs. Works
// with the cheap USB/Bluetooth scanners a temple counter would actually use,
// and needs no camera permissions.
const MODES = {
  complete: { label: 'Seva Completion', endpoint: '/admin/bookings/scan-complete' },
  prasadam: { label: 'Prasadam Redemption', endpoint: '/admin/bookings/scan-redeem-prasadam' },
};

export default function AdminScanTicket() {
  const [mode, setMode] = useState('complete');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null); // { ok: bool, booking?, message? }
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  const submitScan = async (e) => {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await api.post(MODES[mode].endpoint, { booking_number: code.trim() });
      setResult({ ok: true, booking: r.data });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.detail || 'Could not process this scan.' });
    }
    setCode('');
    setSubmitting(false);
    inputRef.current?.focus();
  };

  const inputCls = "h-14 px-4 bg-white border-2 border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-lg font-mono w-full";

  return (
    <AdminLayout title="Scan Ticket">
      <div className="max-w-md mx-auto">
        <div className="flex gap-2 mb-6">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              onClick={() => { setMode(key); setResult(null); }}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium ${mode === key ? 'bg-[#621B00] text-white' : 'bg-[#FDFBF7] border border-[#E6DCCA] text-[#621B00]'}`}
              data-testid={`scan-mode-${key}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={submitScan} className="mb-6">
          <label className="block text-sm font-medium text-[#5D4037] mb-1">Scan or enter ticket number</label>
          <input
            ref={inputRef}
            autoFocus
            className={inputCls}
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="SPJRS-..."
            data-testid="scan-input"
          />
          <button type="submit" className="mt-3 w-full h-11 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90 disabled:opacity-50" disabled={submitting || !code.trim()} data-testid="scan-submit">
            {submitting ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {result && (
          result.ok ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5" data-testid="scan-result-success">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-3">
                <CheckCircle className="h-5 w-5" />
                {mode === 'complete' ? 'Marked Completed' : 'Prasadam Redeemed'}
              </div>
              <p className="text-sm text-[#2D1B0E]"><span className="text-[#8D6E63]">Booking #</span> {result.booking.booking_number}</p>
              <p className="text-sm text-[#2D1B0E]"><span className="text-[#8D6E63]">Devotee</span> {result.booking.devotee_name}</p>
              <p className="text-sm text-[#2D1B0E] flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-[#C43E00]" /> {result.booking.seva_name_english}</p>
              {mode === 'prasadam' && result.booking.prasadam_items?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs text-green-700 uppercase tracking-wide mb-1 flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> Hand over</p>
                  <ul className="text-sm text-[#2D1B0E] list-disc list-inside">
                    {result.booking.prasadam_items.map((item, i) => <li key={i}>{item.quantity} × {item.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-2" data-testid="scan-result-error">
              <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{result.message}</p>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}
