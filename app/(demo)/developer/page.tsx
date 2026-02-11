'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building, BarChart3, FileText, TrendingUp, RefreshCw,
  AlertTriangle, Clock, CheckCircle, Eye, DollarSign, ChevronRight
} from 'lucide-react';

interface ApiCase {
  id: string;
  case_ref: string;
  status: string;
  property_price: number | null;
  created_at: string;
  updated_at: string;
  property?: { id: string; name: string } | null;
}

interface ApiProperty {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  price_min: number | null;
  price_max: number | null;
  status: string;
}

const STATUS_GROUPS: Record<string, { label: string; statuses: string[]; color: string }> = {
  active: { label: 'Aktif', statuses: ['new', 'prescan', 'dsr_check', 'docs_pending', 'tac_scheduled', 'tac_confirmed'], color: 'text-blue-600' },
  submitted: { label: 'Dihantar', statuses: ['submitted', 'kj_pending', 'lo_issued'], color: 'text-teal-600' },
  completed: { label: 'Selesai', statuses: ['completed'], color: 'text-green-600' },
  closed: { label: 'Ditutup', statuses: ['rejected', 'expired'], color: 'text-gray-500' },
};

function formatPrice(price: number | null): string {
  if (!price) return '—';
  return `RM ${price.toLocaleString('en-MY')}`;
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DeveloperDashboard() {
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, propsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/properties'),
      ]);
      const casesJson = await casesRes.json();
      const propsJson = await propsRes.json();
      if (casesJson.success) setCases(Array.isArray(casesJson.data) ? casesJson.data : []);
      if (propsJson.success) setProperties(Array.isArray(propsJson.data) ? propsJson.data : []);
    } catch (err) {
      console.error('[developer] Fetch error:', err);
      setError('Gagal mendapatkan data. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = {
    totalCases: cases.length,
    activeCases: cases.filter(c => STATUS_GROUPS.active.statuses.includes(c.status?.toLowerCase())).length,
    submittedCases: cases.filter(c => STATUS_GROUPS.submitted.statuses.includes(c.status?.toLowerCase())).length,
    completedCases: cases.filter(c => STATUS_GROUPS.completed.statuses.includes(c.status?.toLowerCase())).length,
    totalProperties: properties.length,
    totalPipelineValue: cases.reduce((sum, c) => sum + (c.property_price || 0), 0),
    conversionRate: cases.length > 0 ? Math.round((cases.filter(c => c.status?.toLowerCase() === 'completed').length / cases.length) * 100) : 0,
  };

  const statusBreakdown = Object.entries(STATUS_GROUPS).map(([key, group]) => ({
    key, label: group.label, color: group.color,
    count: cases.filter(c => group.statuses.includes(c.status?.toLowerCase())).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard Pemaju</h1>
            <p className="text-sm text-gray-500">Ringkasan projek dan permohonan LPPSA</p>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Muat semula">
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">Pemaju melihat data agregat sahaja. Butiran individu pembeli tidak didedahkan.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <button onClick={fetchData} className="mt-2 text-sm text-red-600 underline">Cuba lagi</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500 text-sm">Memuat data pemaju...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Jumlah Kes', value: stats.totalCases, icon: FileText, color: 'text-gray-900' },
                { label: 'Kes Aktif', value: stats.activeCases, icon: Clock, color: 'text-blue-600' },
                { label: 'Dihantar/KJ', value: stats.submittedCases, icon: TrendingUp, color: 'text-teal-600' },
                { label: 'Selesai', value: stats.completedCases, icon: CheckCircle, color: 'text-green-600' },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${kpi.color}`} /></div>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-sm text-gray-500">{kpi.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 border">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm text-gray-500">Nilai Pipeline</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatPrice(stats.totalPipelineValue)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-gray-500">Kadar Penukaran</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Pecahan Status</h2>
              <div className="space-y-3">
                {statusBreakdown.map((group) => (
                  <div key={group.key} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${group.color}`}>{group.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${cases.length > 0 ? (group.count / cases.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-6 text-right">{group.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Projek Hartanah</h2>
                <span className="text-sm text-gray-500">{properties.length} projek</span>
              </div>
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Tiada projek dijumpai</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {properties.map((prop) => {
                    const propCases = cases.filter(c => c.property?.id === prop.id);
                    return (
                      <div key={prop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{prop.name}</p>
                          <p className="text-sm text-gray-500">{prop.city}, {prop.state} · {propCases.length} kes</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Aktiviti Terkini</h2>
              {cases.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Tiada aktiviti terkini</p>
              ) : (
                <div className="space-y-3">
                  {cases.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.case_ref}</p>
                          <p className="text-xs text-gray-500">{c.property?.name || '—'} · {formatDate(c.updated_at)}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{c.status?.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
          <p className="text-sm text-amber-800">⚠ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.</p>
        </div>
      </div>
    </div>
  );
}
