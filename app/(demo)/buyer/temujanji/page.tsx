'use client';

/**
 * Buyer Temujanji (Appointment) Page - CR-008 Doc-First Flow
 * PRD v3.6.3 CR-008 | Step 4 of 4
 * S5 B05: Added LPPSA_SUBMISSION consent gate before booking confirmation
 *
 * Appointment booking with consultant (perunding):
 * - Select available time slot
 * - Or request custom time
 * - LPPSA submission consent checkbox (per S5 refinement)
 * - Confirmation and next steps
 *
 * Flow: /buyer/upload-complete → /buyer/temujanji → /buyer (dashboard)
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  Phone,
  MessageCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building,
  Info,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import { TemujanjiSlot, TemujanjiStatus } from '@/lib/types/buyer-flow';

// =============================================================================
// LOADING COMPONENT
// =============================================================================

function TemujanjiLoading() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Memuatkan slot temujanji...</p>
      </div>
    </div>
  );
}

// =============================================================================
// MOCK DATA
// =============================================================================

const AVAILABLE_SLOTS: TemujanjiSlot[] = [
  {
    id: 'slot-1',
    date: '2026-02-10',
    timeStart: '09:00',
    timeEnd: '09:30',
    available: true,
    agentName: 'Encik Ahmad',
  },
  {
    id: 'slot-2',
    date: '2026-02-10',
    timeStart: '10:00',
    timeEnd: '10:30',
    available: true,
    agentName: 'Encik Ahmad',
  },
  {
    id: 'slot-3',
    date: '2026-02-10',
    timeStart: '14:00',
    timeEnd: '14:30',
    available: false,
    agentName: 'Encik Ahmad',
  },
  {
    id: 'slot-4',
    date: '2026-02-11',
    timeStart: '09:00',
    timeEnd: '09:30',
    available: true,
    agentName: 'Puan Siti',
  },
  {
    id: 'slot-5',
    date: '2026-02-11',
    timeStart: '11:00',
    timeEnd: '11:30',
    available: true,
    agentName: 'Puan Siti',
  },
  {
    id: 'slot-6',
    date: '2026-02-12',
    timeStart: '15:00',
    timeEnd: '15:30',
    available: true,
    agentName: 'Encik Ahmad',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const period = h >= 12 ? 'petang' : 'pagi';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${minute} ${period}`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function TemujanjiFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get context from URL params
  const projectId = searchParams?.get('pid') || '';
  const developerId = searchParams?.get('did') || '';
  const agentId = searchParams?.get('aid') || '';
  const projectName = searchParams?.get('project') || 'Residensi Harmoni';

  // State
  const [mode, setMode] = useState<'select' | 'custom' | 'confirmed'>('select');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'call'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // S5 B05: LPPSA submission consent state
  const [lppConsentGranted, setLppConsentGranted] = useState(false);
  const [lppConsentLoading, setLppConsentLoading] = useState(false);

  // Group slots by date
  const slotsByDate = AVAILABLE_SLOTS.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TemujanjiSlot[]>);

  // Handle slot selection
  const handleSelectSlot = (slotId: string) => {
    const slot = AVAILABLE_SLOTS.find(s => s.id === slotId);
    if (slot?.available) {
      setSelectedSlot(slotId);
      setError(null);
    }
  };

  // S5 B05: Handle LPPSA consent toggle
  const handleLppConsent = async (checked: boolean) => {
    if (!checked) {
      setLppConsentGranted(false);
      return;
    }

    setLppConsentLoading(true);
    const buyerHash = sessionStorage.getItem('buyer_hash');

    if (buyerHash) {
      try {
        // Grant LPPSA_SUBMISSION consent via API (SF.2 purposes path)
        const response = await fetch('/api/consent/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer_hash: buyerHash,
            purposes: ['C5_COMMUNICATION'], // C5 purpose encompasses LPPSA submission consent
            consent_version: '1.0',
          }),
        });

        if (response.ok) {
          setLppConsentGranted(true);
          // Log proof event
          await fetch('/api/proof-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'LPPSA_SUBMISSION_CONSENT_GRANTED',
              buyer_hash: buyerHash,
              case_id: sessionStorage.getItem('case_id') || undefined,
              metadata: { purpose: 'C5', contact_method: contactMethod },
            }),
          }).catch(() => {});
        } else {
          // API error — grant locally as fallback
          console.warn('[Temujanji] Consent API error, granting locally');
          setLppConsentGranted(true);
        }
      } catch {
        // Network error — grant locally
        console.warn('[Temujanji] Consent API unreachable, granting locally');
        setLppConsentGranted(true);
      }
    } else {
      // No buyer_hash — grant locally
      setLppConsentGranted(true);
    }

    setLppConsentLoading(false);
  };

  // Handle booking confirmation
  const handleConfirm = async () => {
    if (mode === 'select' && !selectedSlot) {
      setError('Sila pilih slot temujanji');
      return;
    }
    if (mode === 'custom' && (!customDate || !customTime)) {
      setError('Sila lengkapkan tarikh dan masa cadangan');
      return;
    }
    // S5 B05: LPPSA consent required before booking
    if (!lppConsentGranted) {
      setError('Sila berikan persetujuan untuk permohonan rasmi LPPSA');
      return;
    }

    setLoading(true);
    setError(null);

    // Store booking in sessionStorage
    const booking = {
      mode,
      slotId: selectedSlot,
      customDate,
      customTime,
      contactMethod,
      bookedAt: new Date().toISOString(),
    };
    sessionStorage.setItem('temujanji_booking', JSON.stringify(booking));

    // S5 B06: Log TEMUJANJI_BOOKED + TAC_SESSION_BOOKED proof events
    const buyerHash = sessionStorage.getItem('buyer_hash');
    if (buyerHash) {
      try {
        // Log TEMUJANJI_BOOKED
        await fetch('/api/proof-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'TEMUJANJI_BOOKED',
            buyer_hash: buyerHash,
            case_id: sessionStorage.getItem('case_id') || undefined,
            metadata: {
              slot_id: selectedSlot,
              custom_date: customDate || undefined,
              custom_time: customTime || undefined,
              contact_method: contactMethod,
            },
          }),
        });

        // Log TAC_SESSION_BOOKED (the appointment IS the TAC session)
        await fetch('/api/proof-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'TAC_SESSION_BOOKED',
            buyer_hash: buyerHash,
            case_id: sessionStorage.getItem('case_id') || undefined,
            metadata: {
              slot_id: selectedSlot,
              booking_mode: mode,
              contact_method: contactMethod,
            },
          }),
        });
      } catch {
        // Non-fatal: proof event failure doesn't block booking
        console.warn('[Temujanji] Failed to log proof events');
      }
    }

    setLoading(false);
    setMode('confirmed');
  };

  // Handle go to dashboard
  const handleGoToDashboard = () => {
    router.push('/buyer');
  };

  // Render slot selection
  const renderSlotSelection = () => (
    <>
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('select')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'select'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Slot Tersedia
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'custom'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Cadangkan Masa
        </button>
      </div>

      {mode === 'select' ? (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {Object.entries(slotsByDate).map(([date, slots]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                {formatDate(date)}
              </h3>
              <div className="space-y-2">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => handleSelectSlot(slot.id)}
                    disabled={!slot.available}
                    className={`w-full border-2 rounded-xl p-3 text-left transition-all ${
                      !slot.available
                        ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-50'
                        : selectedSlot === slot.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedSlot === slot.id
                              ? 'bg-teal-600'
                              : 'bg-slate-100'
                          }`}
                        >
                          <Clock
                            className={`w-5 h-5 ${
                              selectedSlot === slot.id
                                ? 'text-white'
                                : 'text-slate-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {formatTime(slot.timeStart)} - {formatTime(slot.timeEnd)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Perunding: {slot.agentName}
                          </p>
                        </div>
                      </div>
                      {!slot.available ? (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          Penuh
                        </span>
                      ) : selectedSlot === slot.id ? (
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tarikh Cadangan
            </label>
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Masa Cadangan
            </label>
            <select
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Pilih masa</option>
              <option value="09:00">9:00 - 9:30 pagi</option>
              <option value="10:00">10:00 - 10:30 pagi</option>
              <option value="11:00">11:00 - 11:30 pagi</option>
              <option value="14:00">2:00 - 2:30 petang</option>
              <option value="15:00">3:00 - 3:30 petang</option>
              <option value="16:00">4:00 - 4:30 petang</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Perunding akan menghubungi untuk mengesahkan masa.
          </p>
        </div>
      )}

      {/* Contact Method */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Kaedah Hubungan
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setContactMethod('whatsapp')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              contactMethod === 'whatsapp'
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setContactMethod('call')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              contactMethod === 'call'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            Panggilan
          </button>
        </div>
      </div>

      {/* S5 B05: LPPSA Submission Consent Gate */}
      <div className="mt-5 border-2 border-slate-200 rounded-xl p-4 bg-slate-50">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-6 mt-0.5">
            <input
              type="checkbox"
              checked={lppConsentGranted}
              onChange={(e) => handleLppConsent(e.target.checked)}
              disabled={lppConsentLoading}
              className="h-5 w-5 rounded border-2 border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-teal-600" />
              <p className="font-semibold text-sm text-slate-800">
                Persetujuan Permohonan Rasmi LPPSA
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Saya membenarkan ejen yang dilantik untuk mengemukakan permohonan pinjaman
              perumahan LPPSA bagi pihak saya menggunakan dokumen yang telah dimuat naik.
              Saya faham bahawa Snang.my hanya menyediakan dokumen dan tidak membuat
              sebarang keputusan kelulusan.
            </p>
            {lppConsentLoading && (
              <div className="flex items-center gap-1 mt-1">
                <Loader2 className="w-3 h-3 animate-spin text-teal-500" />
                <span className="text-xs text-teal-600">Menyimpan persetujuan...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Confirm Button — requires LPPSA consent */}
      <button
        onClick={handleConfirm}
        disabled={loading || !lppConsentGranted || (mode === 'select' && !selectedSlot)}
        className={`w-full mt-5 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          lppConsentGranted && ((mode === 'select' && selectedSlot) || (mode === 'custom' && customDate && customTime))
            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Menempah...
          </>
        ) : (
          <>
            Sahkan Temujanji <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </>
  );

  // Render confirmation
  const renderConfirmation = () => {
    const slot = selectedSlot
      ? AVAILABLE_SLOTS.find(s => s.id === selectedSlot)
      : null;

    return (
      <div className="text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-teal-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Temujanji Ditempah!
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Perunding akan menghubungi anda untuk pengesahan.
        </p>

        {/* Booking Summary */}
        <div className="bg-slate-50 rounded-xl p-4 mb-5 text-left">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">
            Butiran Temujanji
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tarikh</span>
              <span className="font-medium text-slate-800">
                {slot ? formatDate(slot.date) : formatDate(customDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Masa</span>
              <span className="font-medium text-slate-800">
                {slot
                  ? `${formatTime(slot.timeStart)} - ${formatTime(slot.timeEnd)}`
                  : formatTime(customTime)}
              </span>
            </div>
            {slot?.agentName && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Perunding</span>
                <span className="font-medium text-slate-800">{slot.agentName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Kaedah</span>
              <span className="font-medium text-slate-800">
                {contactMethod === 'whatsapp' ? 'WhatsApp' : 'Panggilan'}
              </span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
          <h3 className="font-semibold text-amber-800 text-sm mb-2">
            Apa Seterusnya?
          </h3>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Perunding akan menghubungi untuk pengesahan</li>
            <li>Sediakan dokumen asal untuk semakan</li>
            <li>Proses permohonan LPPSA akan bermula</li>
          </ol>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-100 rounded-xl p-3 mb-5">
          <p className="text-xs text-slate-500">
            Temujanji ini adalah untuk semakan dokumen sahaja. Tiada kelulusan
            atau keputusan dibuat oleh sistem.
          </p>
        </div>

        {/* Go to Dashboard */}
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-xl transition-all"
        >
          Lihat Status Permohonan <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {mode !== 'confirmed' && (
                <button
                  onClick={() => router.back()}
                  className="text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <span className="text-white font-bold text-lg">Snang.my</span>
              <span className="text-teal-400 text-xs font-mono">LPPSA</span>
            </div>
            <span className="text-slate-300 text-sm">
              {mode === 'confirmed' ? 'Selesai' : 'Langkah 4 / 4'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
            <div className="h-1 flex-1 rounded-full bg-teal-500" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {mode === 'confirmed' ? (
            renderConfirmation()
          ) : (
            <>
              {/* Title */}
              <h1 className="text-xl font-bold text-slate-800 mb-1">
                Tempah Temujanji Perunding
              </h1>
              <p className="text-slate-500 text-sm mb-4">
                Pilih slot yang sesuai untuk sesi semakan dokumen
              </p>

              {/* Project Context */}
              {projectName && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-teal-800">
                      Projek: <strong>{projectName}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Temujanji berlangsung ~30 minit. Perunding akan menyemak
                    dokumen dan menerangkan langkah seterusnya.
                  </p>
                </div>
              </div>

              {renderSlotSelection()}
            </>
          )}
        </div>

        {/* Footer */}
        <AuthorityDisclaimer variant="compact" />
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT WITH SUSPENSE
// =============================================================================

export default function TemujanjiPage() {
  return (
    <Suspense fallback={<TemujanjiLoading />}>
      <TemujanjiFlow />
    </Suspense>
  );
}
