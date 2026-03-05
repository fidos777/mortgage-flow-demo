// components/developer/BookingForm.tsx
// CR-KP-002 Sprint 1 (A3): Booking Form
// Developer creates a booking for a buyer unit

'use client';

import { useState } from 'react';
import type { LoanTypeCode } from '@/lib/config/loan-types';
import type { Booking, BookingSource } from '@/types/cr-kp-002';
import { validateBooking, generateBookingId } from '@/lib/services/cr-kp-002-services';
import { LoanTypeSelector } from '@/components/LoanTypeBadge';

export interface BookingFormProps {
  projectId: string;
  projectName: string;
  onSubmit?: (booking: Booking) => void;
  onCancel?: () => void;
}

export function BookingForm({
  projectId,
  projectName,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const [unitNo, setUnitNo] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [loanTypeCode, setLoanTypeCode] = useState<LoanTypeCode | undefined>();
  const [source, setSource] = useState<BookingSource>('direct');
  const [agentName, setAgentName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceOptions: { value: BookingSource; label: string; icon: string }[] = [
    { value: 'direct', label: 'Terus', icon: '📋' },
    { value: 'wa_buyer', label: 'WhatsApp Pembeli', icon: '💬' },
    { value: 'wa_agent', label: 'WhatsApp Ejen', icon: '🤝' },
    { value: 'social', label: 'Media Sosial', icon: '📱' },
    { value: 'qr_link', label: 'QR / Pautan', icon: '🔗' },
  ];

  const handleSubmit = async () => {
    const validation = validateBooking({
      projectId,
      unitNo,
      buyerName,
      buyerPhone,
      loanTypeCode,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (!loanTypeCode) {
      setErrors(['Sila pilih jenis pinjaman']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    // Simulate creation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const now = new Date().toISOString();
    const booking: Booking = {
      id: generateBookingId(),
      projectId,
      projectName,
      unitNo,
      buyerName,
      buyerPhone,
      loanTypeCode,
      bookingDate: now,
      status: 'BOOKED',
      source,
      agentName: source === 'wa_agent' ? agentName : undefined,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    setIsSubmitting(false);
    onSubmit?.(booking);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-teal-50 border-b border-teal-100 px-5 py-4">
        <h2 className="font-semibold text-slate-800">Tempahan Baru</h2>
        <p className="text-sm text-slate-500 mt-0.5">{projectName}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Unit number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            No. Unit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={unitNo}
            onChange={e => setUnitNo(e.target.value)}
            placeholder="Cth: A-12-03"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Buyer name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nama Pembeli <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={buyerName}
            onChange={e => setBuyerName(e.target.value)}
            placeholder="Cth: Ahmad bin Abdullah"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Buyer phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            No. Telefon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={buyerPhone}
            onChange={e => setBuyerPhone(e.target.value)}
            placeholder="Cth: 012-345 6789"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Loan type selector */}
        <LoanTypeSelector
          value={loanTypeCode}
          onChange={setLoanTypeCode}
          demoOnly={true}
        />

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sumber Tempahan</label>
          <div className="flex flex-wrap gap-2">
            {sourceOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSource(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  source === opt.value
                    ? 'border-teal-300 bg-teal-50 text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Agent name (conditional) */}
        {source === 'wa_agent' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ejen</label>
            <input
              type="text"
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              placeholder="Cth: Razak Ibrahim"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nota (pilihan)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Nota tambahan..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
          />
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((err, i) => (
                <li key={i}>⚠ {err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
              isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {isSubmitting ? '⏳ Menyimpan...' : '✅ Simpan Tempahan'}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
          )}
        </div>

        {/* Privacy note */}
        <p className="text-xs text-slate-400 text-center">
          Data pembeli disimpan mengikut PDPA 2010. Maklumat peribadi tidak dikongsi dengan pemaju.
        </p>
      </div>
    </div>
  );
}

export default BookingForm;
