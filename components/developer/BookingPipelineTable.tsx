// components/developer/BookingPipelineTable.tsx
// CR-KP-002 Sprint 1 (A3): Booking Pipeline Table
// Shows all bookings in pipeline view with status tracking

'use client';

import { useState } from 'react';
import type { Booking, BookingStatus, PipelineEntry } from '@/types/cr-kp-002';
import { bookingToPipelineEntry } from '@/lib/services/cr-kp-002-services';
import { LoanTypeBadge } from '@/components/LoanTypeBadge';

export interface BookingPipelineTableProps {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
  onAction?: (bookingId: string, action: string) => void;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: string }> = {
  BOOKED: { label: 'Ditempah', color: 'bg-slate-100 text-slate-600', icon: '📋' },
  PRESCAN_PENDING: { label: 'PreScan Pending', color: 'bg-amber-50 text-amber-700', icon: '⏳' },
  PRESCAN_DONE: { label: 'PreScan Selesai', color: 'bg-blue-50 text-blue-700', icon: '✅' },
  DOCS_COLLECTING: { label: 'Kumpul Dokumen', color: 'bg-purple-50 text-purple-700', icon: '📄' },
  DOCS_COMPLETE: { label: 'Dokumen Lengkap', color: 'bg-teal-50 text-teal-700', icon: '📦' },
  SUBMITTED: { label: 'Dihantar', color: 'bg-green-50 text-green-700', icon: '🚀' },
  KJ_PENDING: { label: 'Tunggu KJ', color: 'bg-orange-50 text-orange-700', icon: '👤' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700', icon: '🎉' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-50 text-red-600', icon: '❌' },
};

export function BookingPipelineTable({
  bookings,
  onSelectBooking,
  onAction,
}: BookingPipelineTableProps) {
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  const filteredBookings = bookings
    .filter(b => filter === 'ALL' || b.status === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.status.localeCompare(b.status);
    });

  const statusCounts = bookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header with filters */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-800">Pipeline Tempahan</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {bookings.length} tempahan · {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length} aktif
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'status')}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600"
            >
              <option value="date">Tarikh</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 text-xs rounded-full border transition ${
              filter === 'ALL'
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Semua ({bookings.length})
          </button>
          {(Object.keys(STATUS_CONFIG) as BookingStatus[])
            .filter(s => statusCounts[s])
            .map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-2.5 py-1 text-xs rounded-full border transition ${
                  filter === status
                    ? `${STATUS_CONFIG[status].color} border-current`
                    : 'text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label} ({statusCounts[status]})
              </button>
            ))}
        </div>
      </div>

      {/* Table */}
      {filteredBookings.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-slate-500">Tiada tempahan ditemui</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {filteredBookings.map(booking => {
            const statusConfig = STATUS_CONFIG[booking.status];
            const pipeline = bookingToPipelineEntry(booking);

            return (
              <div
                key={booking.id}
                onClick={() => onSelectBooking?.(booking)}
                className="px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${statusConfig.color}`}>
                    {statusConfig.icon}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-sm">{booking.id}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      {pipeline.isStale && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600">
                          ⚠ Stale
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{booking.buyerName}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{booking.unitNo}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <LoanTypeBadge loanType={booking.loanTypeCode} size="sm" showIcon={false} />
                    </div>
                  </div>

                  {/* Right side: days + next action */}
                  <div className="text-right">
                    <span className="text-xs text-slate-400">
                      {pipeline.daysSinceBooking}h lalu
                    </span>
                    {pipeline.nextAction && (
                      <p className="text-xs text-teal-600 mt-0.5 max-w-[180px] truncate">
                        → {pipeline.nextAction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Maklumat peribadi pembeli tidak dipaparkan kepada pemaju. Hanya data agregat ditunjukkan.
        </p>
      </div>
    </div>
  );
}

export default BookingPipelineTable;
