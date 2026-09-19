import { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Gift, Flame, Camera, CameraOff } from 'lucide-react';

const MODES = {
  complete: { label: 'Seva Completion', endpoint: '/admin/bookings/scan-complete' },
  prasadam: { label: 'Prasadam Redemption', endpoint: '/admin/bookings/scan-redeem-prasadam' },
};

const QR_READER_ID = 'scan-ticket-qr-reader';

export default function AdminScanTicket() {
  const [mode, setMode] = useState('complete');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null); // { ok: bool, booking?, message? }
  const [submitting, setSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const inputRef = useRef(null);
  // A stale closure would otherwise freeze the html5-qrcode success callback
  // on whichever mode was active when the camera was started.
  const modeRef = useRef(mode);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  const processScan = async (scannedCode) => {
    if (processingRef.current || !scannedCode.trim()) return;
    processingRef.current = true;
    setSubmitting(true);
    try {
      const r = await api.post(MODES[modeRef.current].endpoint, { booking_number: scannedCode.trim() });
      setResult({ ok: true, booking: r.data });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.detail || 'Could not process this scan.' });
    }
    setCode('');
    setSubmitting(false);
    processingRef.current = false;
    inputRef.current?.focus();
  };

  const submitScan = (e) => {
    e.preventDefault();
    processScan(code);
  };

  // Camera-based scanning - point a phone/tablet at the printed QR instead of
  // needing a handheld barcode-scanner device. The text input above stays as
  // a fallback (camera permission denied, damaged code, etc.).
  useEffect(() => {
    if (!cameraOn) return;
    setCameraError('');
    const scanner = new Html5Qrcode(QR_READER_ID);
    scannerRef.current = scanner;
    let cancelled = false;
    // stop() throws synchronously (not a rejected promise) if the camera
    // never actually started - e.g. permission denied - so cleanup must
    // check this before calling it, not just .catch() the call.
    let started = false;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        // Pause immediately so the same frame's repeated decode calls don't
        // fire this ticket through processScan more than once.
        scanner.pause(true);
        processScan(decodedText).finally(() => { if (!cancelled) setCameraOn(false); });
      },
      () => {} // per-frame "no QR found" - not an error, ignore
    ).then(() => { started = true; }).catch(() => {
      if (!cancelled) {
        setCameraError('Could not access the camera. Check browser camera permissions, or use the field below.');
        setCameraOn(false);
      }
    });
    return () => {
      cancelled = true;
      if (started) {
        try { scanner.stop().then(() => scanner.clear()).catch(() => {}); } catch { /* already stopped */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

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

        <button
          onClick={() => setCameraOn(on => !on)}
          className={`w-full h-12 rounded-full text-sm font-medium mb-3 inline-flex items-center justify-center gap-2 ${cameraOn ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-[#621B00] text-white hover:bg-[#621B00]/90'}`}
          data-testid="scan-camera-toggle"
        >
          {cameraOn ? <><CameraOff className="h-4 w-4" /> Stop Camera</> : <><Camera className="h-4 w-4" /> Scan with Camera</>}
        </button>

        {cameraOn && <div id={QR_READER_ID} className="mb-4 rounded-lg overflow-hidden border border-[#E6DCCA]" data-testid="scan-camera-view" />}
        {cameraError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="scan-camera-error">{cameraError}</p>}

        <form onSubmit={submitScan} className="mb-6">
          <label className="block text-sm font-medium text-[#5D4037] mb-1">Or enter ticket number manually</label>
          <input
            ref={inputRef}
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
