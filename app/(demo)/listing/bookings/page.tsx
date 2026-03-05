// app/(demo)/listing/bookings/page.tsx
// CR-KP-002 Sprint 1 (A3): Bookings Page
// Developer view for managing bookings and pipeline

'use client';

import { useState } from 'react';
import { BookingForm } from '@/components/developer/BookingForm';
import { BookingPipelineTable } from '@/components/developer/BookingPipelineTable';
import type { Booking } from '@/types/cr-kp-002';

// Demo bookings data
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'QTK-2026-00001',
    projectId: 'proj-001',
    projectName: 'Residensi Harmoni',
    unitNo: 'A-12-03',
    buyerName: 'Ahmad bin Ali',
    buyerPhone: '012-3456789',
    loanTypeCode: 1,
    bookingDate: '2026-01-15T08:00:00Z',
    status: 'DOCS_COLLECTING',
    source: 'wa_buyer',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'QTK-2026-00002',
    projectId: 'proj-001',
    projectName: 'Residensi Harmoni',
    unitNo: 'A-15-07',
    buyerName: 'Faizal Rahman',
    buyerPhone: '011-2223344',
    loanTypeCode: 1,
    bookingDate: '2026-01-18T09:00:00Z',
    status: 'PRESCAN_DONE',
    source: 'social',
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-02-12T14:00:00Z',
  },
  {
    id: 'QTK-2026-00003',
    projectId: 'proj-001',
    projectName: 'Residensi Harmoni',
    unitNo: 'B-08-01',
    buyerName: 'Siti Aminah',
    buyerPhone: '013-9876543',
    loanTypeCode: 3,
    bookingDate: '2026-02-01T10:00:00Z',
    status: 'BOOKED',
    source: 'wa_agent',
    agentName: 'Razak Ibrahim',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'QTK-2026-00004',
    projectId: 'proj-001',
    projectName: 'Residensi Harmoni',
    unitNo: 'A-03-12',
    buyerName: 'Mohammad Razak',
    buyerPhone: '019-5551234',
    loanTypeCode: 1,
    bookingDate: '2026-01-10T11:00:00Z',
    status: 'SUBMITTED',
    source: 'qr_link',
    createdAt: '2026-01-10T11:00:00Z',
    updatedAt: '2026-02-14T16:00:00Z',
  },
  {
    id: 'QTK-2026-00005',
    projectId: 'proj-001',
    projectName: 'Residensi Harmoni',
    unitNo: 'C-01-04',
    buyerName: 'Nurul Huda',
    buyerPhone: '016-7778899',
    loanTypeCode: 1,
    bookingDate: '2026-02-10T09:00:00Z',
    status: 'PRESCAN_PENDING',
    source: 'direct',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-10T09:00:00Z',
  },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [showForm, setShowForm] = useState(false);

  const handleNewBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tempahan & Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            Urus tempahan dan pantau status permohonan
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
        >
          {showForm ? '← Kembali' : '+ Tempahan Baru'}
        </button>
      </div>

      {/* Privacy banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-6">
        <span className="text-teal-600 text-sm">🔒</span>
        <p className="text-sm text-teal-700">
          Portal ini memaparkan data agregat sahaja. Butiran peribadi pembeli tidak dikongsi.
        </p>
      </div>

      {/* Content */}
      {showForm ? (
        <BookingForm
          projectId="proj-001"
          projectName="Residensi Harmoni"
          onSubmit={handleNewBooking}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <BookingPipelineTable
          bookings={bookings}
          onSelectBooking={b => {
            // Would navigate to booking detail
          }}
        />
      )}

      {/* Footer disclaimer */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-center mt-6">
        <p className="text-sm text-orange-700">
          ⚠ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.
        </p>
      </div>
    </div>
  );
}
