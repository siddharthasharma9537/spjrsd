import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Printer, ArrowLeft, FileCheck } from 'lucide-react';

export default function DonationReceipt() {
  const { donationId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/donations/${donationId}/receipt`)
      .then(r => setReceipt(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [donationId]);

  if (loading) return <div className="min-h-screen bg-[#FFFCF5]"><Navbar /><p className="text-center py-12 text-[#8D6E63]">Loading receipt...</p></div>;
  if (error) return <div className="min-h-screen bg-[#FFFCF5]"><Navbar /><p className="text-center py-12 text-red-600">{error}</p></div>;
  if (!receipt) return null;

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <div className="print:hidden"><Navbar /></div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Link to="/donations" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90 transition-all" data-testid="print-receipt-btn">
            <Printer className="h-4 w-4" /> Print Receipt
          </button>
        </div>

        {/* 80G Receipt */}
        <div className="bg-white border-2 border-[#621B00] rounded-xl overflow-hidden shadow-lg" data-testid="donation-receipt">
          {/* Header */}
          <div className="bg-[#621B00] text-white p-6 text-center">
            <p className="font-english-heading text-xs tracking-[0.3em] uppercase mb-1">Donation Receipt</p>
            <h1 className="font-english-heading text-sm tracking-widest uppercase mb-1">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</h1>
            <p className="font-telugu-heading text-base text-[#D4AF37]">{receipt.temple_name_telugu}</p>
            <p className="text-xs text-[#FFE0B2]/70 mt-1">{receipt.temple_address}</p>
          </div>

          {/* 80G Badge */}
          <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-6 py-3 flex items-center justify-center gap-3">
            <FileCheck className="h-5 w-5 text-[#621B00]" />
            <div className="text-center">
              <p className="text-xs font-bold text-[#621B00] tracking-wide">80G TAX EXEMPTION RECEIPT</p>
              <p className="text-xs text-[#8D6E63]">{receipt.section}</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Receipt & Donation numbers */}
            <div className="grid grid-cols-2 gap-4 bg-[#FDFBF7] rounded-lg p-4 border border-[#E6DCCA]">
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-0.5">Receipt No.</p>
                <p className="font-mono text-sm font-bold text-[#621B00]" data-testid="receipt-number">{receipt.receipt_number}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-0.5">Donation No.</p>
                <p className="font-mono text-sm font-bold text-[#621B00]">{receipt.donation_number}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-0.5">Date</p>
                <p className="text-sm text-[#2D1B0E]">{receipt.date ? new Date(receipt.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-0.5">Financial Year</p>
                <p className="text-sm text-[#2D1B0E]">{receipt.financial_year}</p>
              </div>
            </div>

            {/* Donor Details */}
            <div>
              <h3 className="text-xs font-bold text-[#621B00] uppercase tracking-wide border-b border-[#E6DCCA] pb-2 mb-3">Donor Details / దాత వివరాలు</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#8D6E63]">Name / పేరు</p>
                  <p className="font-medium text-[#2D1B0E]" data-testid="receipt-donor-name">{receipt.is_anonymous ? 'Anonymous Donor' : receipt.donor_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63]">Mobile / మొబైల్</p>
                  <p className="text-[#2D1B0E]">{receipt.donor_mobile}</p>
                </div>
                {receipt.donor_email && (
                  <div>
                    <p className="text-xs text-[#8D6E63]">Email</p>
                    <p className="text-[#2D1B0E]">{receipt.donor_email}</p>
                  </div>
                )}
                {receipt.donor_gotram && (
                  <div>
                    <p className="text-xs text-[#8D6E63]">గోత్రం / Gotram</p>
                    <p className="text-[#2D1B0E]">{receipt.donor_gotram}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Donation Details */}
            <div>
              <h3 className="text-xs font-bold text-[#621B00] uppercase tracking-wide border-b border-[#E6DCCA] pb-2 mb-3">Donation Details / దానం వివరాలు</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#8D6E63]">Donation Type</p>
                  <p className="font-medium text-[#2D1B0E]" data-testid="receipt-donation-type">{receipt.donation_type}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63]">Payment Status</p>
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">{receipt.payment_status}</span>
                </div>
              </div>
            </div>

            {/* Amount Box */}
            <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 rounded-lg p-5 text-center">
              <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Donation Amount / దానం మొత్తం</p>
              <p className="text-3xl font-bold text-[#621B00] mb-1" data-testid="receipt-amount">Rs. {receipt.amount?.toLocaleString()}</p>
              <p className="text-sm text-[#5D4037] italic">({receipt.amount_words})</p>
            </div>

            {/* Temple Registration */}
            <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8D6E63]">Temple PAN:</span>
                <span className="font-mono text-[#2D1B0E]">{receipt.pan_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8D6E63]">Registration No.:</span>
                <span className="font-mono text-[#2D1B0E]">{receipt.registration_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8D6E63]">Under:</span>
                <span className="text-[#2D1B0E]">{receipt.section}</span>
              </div>
            </div>

            {/* Declaration */}
            <div className="border-t-2 border-dashed border-[#E6DCCA] pt-4">
              <p className="text-xs text-[#5D4037] leading-relaxed mb-2">
                <strong>Declaration:</strong> This is to certify that the donation mentioned above has been received by Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams. This receipt is eligible for tax deduction under Section 80G of the Income Tax Act, 1961, subject to the conditions specified therein.
              </p>
              <p className="font-telugu-body text-xs text-[#8D6E63] leading-relaxed">
                ఈ రసీదు ఆదాయపు పన్ను చట్టం, 1961 లోని సెక్షన్ 80G కింద పన్ను తగ్గింపునకు అర్హమైనది.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="text-center">
                <div className="border-t border-[#2D1B0E] pt-2 mt-8">
                  <p className="text-xs text-[#5D4037]">Authorized Signatory</p>
                  <p className="text-xs text-[#8D6E63]">Temple EO / ఆలయ ఇ.ఓ.</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-[#2D1B0E] pt-2 mt-8">
                  <p className="text-xs text-[#5D4037]">Temple Seal</p>
                  <p className="text-xs text-[#8D6E63]">ఆలయ ముద్ర</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#FDFBF7] border-t border-[#E6DCCA] px-6 py-3 text-center">
            <p className="text-xs text-[#8D6E63]">This is a computer-generated receipt. No signature required for amounts below Rs. 5,000.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
