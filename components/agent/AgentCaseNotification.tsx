'use client';

import { useState } from 'react';

interface CaseNotification {
  case_id: string;
  case_ref: string;
  buyer_name: string;
  property_name: string;
  status: string;
}

interface AgentCaseNotificationProps {
  caseId: string;
  caseRef?: string;
  buyerName?: string;
  propertyName?: string;
  status?: string;
  /** Compact mode for case list, full mode for case detail */
  compact?: boolean;
}

export default function AgentCaseNotification({
  caseId,
  caseRef,
  buyerName,
  propertyName,
  status,
  compact = false
}: AgentCaseNotificationProps) {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    wa_link: string | null;
    agent: { name: string; phone_masked: string | null; has_phone: boolean };
    notification: CaseNotification;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleNotify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications/agent-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menjana notifikasi');
        return;
      }
      setNotification(data);

      // Auto-open WhatsApp if link available
      if (data.wa_link) {
        window.open(data.wa_link, '_blank');
        setSent(true);
        // Log the send action
        fetch('/api/proof-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: caseId,
            event_type: 'AGENT_WHATSAPP_NOTIFICATION_SENT',
            event_category: 'AGENT',
            actor_type: 'agent',
            metadata: {
              notification_type: 'whatsapp_case_alert',
              case_ref: data.notification.case_ref
            }
          })
        }).catch(() => {}); // fire-and-forget
      }
    } catch (err) {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  // Compact mode: just a button
  if (compact) {
    return (
      <button
        onClick={handleNotify}
        disabled={loading || sent}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          sent
            ? 'bg-green-50 text-green-700 border border-green-200'
            : loading
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
        }`}
        title="Hantar notifikasi WhatsApp kepada ejen"
      >
        {sent ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Dihantar
          </>
        ) : loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Menjana...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.336 0-4.512-.696-6.34-1.886l-.455-.296-2.968.995.995-2.968-.296-.455A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
            Maklumkan Ejen
          </>
        )}
      </button>
    );
  }

  // Full mode: card with details
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.336 0-4.512-.696-6.34-1.886l-.455-.296-2.968.995.995-2.968-.296-.455A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
          </svg>
          Notifikasi Ejen
        </h4>
        {sent && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ✓ WhatsApp dihantar
          </span>
        )}
      </div>

      {/* Case summary */}
      <div className="text-sm text-gray-500 mb-3 space-y-1">
        {caseRef && <p>Rujukan: <span className="text-gray-700 font-medium">{caseRef}</span></p>}
        {buyerName && <p>Pembeli: <span className="text-gray-700">{buyerName}</span></p>}
        {propertyName && <p>Hartanah: <span className="text-gray-700">{propertyName}</span></p>}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {notification && !error && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          <p className="font-medium text-gray-700 mb-1">
            Ejen: {notification.agent.name}
            {notification.agent.phone_masked && ` (${notification.agent.phone_masked})`}
          </p>
          {!notification.agent.has_phone && (
            <p className="text-amber-600 text-xs">
              ⚠ Nombor telefon ejen tidak didaftarkan — salin mesej secara manual
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleNotify}
          disabled={loading || sent}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            sent
              ? 'bg-green-50 text-green-700 border border-green-200'
              : loading
              ? 'bg-gray-100 text-gray-400 cursor-wait'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          {sent ? (
            '✓ Notifikasi Dihantar'
          ) : loading ? (
            'Menjana notifikasi...'
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              Hantar via WhatsApp
            </>
          )}
        </button>

        {notification?.wa_link && !sent && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(notification.notification.case_ref + ' notification message');
            }}
            className="px-3 py-2.5 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50"
            title="Salin mesej"
          >
            📋
          </button>
        )}
      </div>

      {/* Authority boundary */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        Notifikasi dijana oleh sistem — ejen bertanggungjawab mengesahkan dan menghubungi pembeli
      </p>
    </div>
  );
}
