'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Clock, TrendingUp, CheckCircle2,
  DollarSign, BarChart3, RefreshCw, Eye,
  LinkIcon, FileText, Plus, ChevronRight
} from 'lucide-react';
import { InvitationModal } from '@/components/InvitationModal';

// Types matching the S6.3 properties whitelist + cases API
interface ApiProperty {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  price_min: number | null;
  price_max: number | null;
  status: string;
  published_at: string | null;
  gallery_urls: string[] | null;
  developer_id: string;
  developer_name: string;
  total_units: number | null;
  units_sold: number | null;
  units_available: number | null;
  property_type: string | null;
  built_up_area: string | null;
  completion_date: string | null;
  description: string | null;
}

interface ApiCase {
  id: string;
  case_ref: string;
  status: string;
  buyer_name: string;
  property_price: number;
  created_at: string;
  property_id: string;
  property?: {
    name: string;
    city: string;
    state: string;
  };
}

export default function DeveloperPage() {
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvitation, setShowInvitation] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, propsRes] = await Promise.all([
        fetch('/api/cases?limit=100'),
        fetch('/api/properties?limit=100'),
      ]);

      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setCases(casesData.data || []);
      }

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        setProperties(propsData.data || []);
      }
    } catch (err) {
      setError('Gagal memuatkan data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived stats
  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'new' || c.status === 'documents_received').length;
  const submittedCases = cases.filter(c => c.status === 'submitted' || c.status === 'kj_pending').length;
  const completedCases = cases.filter(c => c.status === 'completed' || c.status === 'approved').length;
  const pipelineValue = cases.reduce((sum, c) => sum + (c.property_price || 0), 0);
  const conversionRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  // Cases per property
  const getCasesForProperty = (propId: string) => cases.filter(c => c.property_id === propId);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-red-500 underline">Cuba semula</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard Pemaju</h1>
          <p className="text-sm text-slate-500">Ringkasan projek dan permohonan LPPSA</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Muat semula"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Privacy Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Eye className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
        <p className="text-sm text-teal-800">
          Pemaju melihat data agregat sahaja. Butiran individu pembeli tidak didedahkan.
        </p>
      </div>

      {/* ============================================ */}
      {/* SECTION 1: PROJEK HARTANAH (moved to top)   */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h2 className="font-bold text-slate-800">Projek Hartanah</h2>
            <span className="text-xs text-slate-400 ml-1">{properties.length} projek</span>
          </div>
          <button
            onClick={() => alert('Fungsi tambah projek akan datang dalam Sprint S7.')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Akan datang"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {properties.map((prop) => {
            const propCases = getCasesForProperty(prop.id);
            const propActive = propCases.filter(c => c.status === 'active' || c.status === 'new' || c.status === 'documents_received').length;
            const propCompleted = propCases.filter(c => c.status === 'completed' || c.status === 'approved').length;

            return (
              <div key={prop.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                {/* Property Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 truncate">{prop.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {prop.city}, {prop.state}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    {prop.price_min && (
                      <span>Dari RM {(prop.price_min / 1000).toFixed(0)}k</span>
                    )}
                    <span>{propCases.length} kes</span>
                    {propActive > 0 && (
                      <span className="text-teal-600">{propActive} aktif</span>
                    )}
                    {propCompleted > 0 && (
                      <span className="text-green-600">{propCompleted} selesai</span>
                    )}
                  </div>
                </div>

                {/* Per-card Jana Pautan button */}
                <button
                  onClick={() => {
                    setSelectedProperty(prop);
                    setShowInvitation(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shrink-0 ml-4"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Jana Pautan
                </button>
              </div>
            );
          })}

          {properties.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Tiada projek dijumpai.
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 2: KPI GRID                         */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalCases}</p>
          <p className="text-xs text-slate-500">Jumlah Kes</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-teal-600">{activeCases}</p>
          <p className="text-xs text-slate-500">Kes Aktif</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{submittedCases}</p>
          <p className="text-xs text-slate-500">Dihantar/KJ</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-green-600">{completedCases}</p>
          <p className="text-xs text-slate-500">Selesai</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 3: PIPELINE VALUE + CONVERSION       */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-500">Nilai Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            RM {pipelineValue.toLocaleString('ms-MY')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-500">Kadar Penukaran</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{conversionRate}%</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 4: PECAHAN STATUS                    */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-4">Pecahan Status</h3>
        <div className="space-y-3">
          {[
            { label: 'Aktif', count: activeCases, color: 'bg-teal-500' },
            { label: 'Dihantar', count: submittedCases, color: 'bg-amber-500' },
            { label: 'Selesai', count: completedCases, color: 'bg-green-500' },
            { label: 'Ditutup', count: cases.filter(c => c.status === 'closed' || c.status === 'rejected').length, color: 'bg-slate-400' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className={`text-sm ${row.count > 0 ? 'text-teal-600 font-medium' : 'text-slate-500'}`}>
                {row.label}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  {totalCases > 0 && (
                    <div
                      className={`h-full ${row.color} rounded-full transition-all`}
                      style={{ width: `${(row.count / totalCases) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700 w-6 text-right">{row.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 5: AKTIVITI TERKINI                  */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Aktiviti Terkini</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {cases.slice(0, 10).map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{c.case_ref}</p>
                  <p className="text-xs text-slate-400">
                    {c.property?.name || 'N/A'} · {new Date(c.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md capitalize">
                {c.status?.replace(/_/g, ' ') || 'New'}
              </span>
            </div>
          ))}

          {cases.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Tiada aktiviti terkini.
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
        <p className="text-sm text-amber-700">
          ⚠ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.
        </p>
      </div>

      {/* InvitationModal */}
      <InvitationModal
        isOpen={showInvitation}
        onClose={() => { setShowInvitation(false); setSelectedProperty(null); }}
        projectName={selectedProperty?.name || ''}
        projectLocation={selectedProperty ? `${selectedProperty.city}, ${selectedProperty.state}` : ''}
      />
    </div>
  );
}
