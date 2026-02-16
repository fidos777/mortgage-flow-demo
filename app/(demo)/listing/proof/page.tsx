// app/listing/proof/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Shield, Filter, Download, Search, Info } from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import { useCaseStore } from '@/lib/store/case-store';
import { formatProofEvent } from '@/lib/qontrek/proof-events';
import { useState } from 'react';

export default function DeveloperProofLog() {
  const router = useRouter();
  const { proofEvents } = useCaseStore();
  const [filter, setFilter] = useState<'all' | 'FACT' | 'DECLARE' | 'DERIVED'>('all');
  const [search, setSearch] = useState('');

  const filteredEvents = proofEvents
    .filter(e => filter === 'all' || e.category === filter)
    .filter(e => search === '' || e.intent.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/listing')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-snang-teal-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Log Bukti Aktiviti</h1>
                <p className="text-sm text-slate-500">Qontrek Judicial Layer</p>
              </div>
            </div>
            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-200">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-snang-teal-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Tentang Log Bukti</p>
              <p className="text-blue-700">
                Log ini merekod semua aktiviti sistem dengan jaminan <strong>authorityClaimed: false</strong>.
                Tiada kelulusan atau keputusan dibuat oleh sistem. Identiti pembeli tidak didedahkan kepada pemaju.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari aktiviti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-snang-teal-500 focus:outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'FACT', 'DECLARE', 'DERIVED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event Categories Legend */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Kategori Bukti</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-snang-teal-600" />
              <div>
                <p className="text-sm font-medium text-slate-700">FACT</p>
                <p className="text-xs text-slate-500">Bukti dari dokumen/sistem</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">DECLARE</p>
                <p className="text-xs text-slate-500">Diisytihar oleh manusia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">DERIVED</p>
                <p className="text-xs text-slate-500">Dikira oleh sistem</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              {filteredEvents.length} Rekod Bukti
            </h3>
            <span className="text-xs text-slate-400">
              Diurutkan mengikut masa terbaru
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEvents.map(event => {
              const formatted = formatProofEvent(event);
              
              return (
                <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      event.category === 'FACT' ? 'bg-snang-teal-600' :
                      event.category === 'DECLARE' ? 'bg-green-500' : 'bg-purple-500'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-800">{event.intent}</p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            oleh <span className="font-medium">{formatted.actor}</span>
                            {/* PRD: Case ID shown but no buyer identifiers */}
                            <span className="mx-2">•</span>
                            Kes: {event.caseId}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-slate-600">{formatted.date}</p>
                          <p className="text-xs text-slate-400">{formatted.time}</p>
                        </div>
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          event.category === 'FACT' ? 'bg-blue-100 text-blue-700' :
                          event.category === 'DECLARE' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {event.category}
                        </span>
                        
                        {event.humanConfirmationRequired && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            Perlu Pengesahan Manusia
                          </span>
                        )}
                        
                        {/* PRD: ALWAYS show authorityClaimed = false */}
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                          authorityClaimed: false
                        </span>
                      </div>

                      {/* Hash if present */}
                      {event.payloadHash && (
                        <p className="text-xs text-slate-400 mt-2 font-mono">
                          Hash: {event.payloadHash}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                Tiada rekod bukti dijumpai
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <AuthorityDisclaimer variant="prominent" />
      </div>
    </div>
  );
}
