'use client';

/**
 * Property Console
 * CR-007: Property Console | PRD v3.6.3
 *
 * Developer dashboard for managing properties, units, and QR-based buyer access.
 * Shows aggregate property data with drill-down to unit-level management.
 */

import { useState, useMemo } from 'react';
import {
  Building2,
  QrCode,
  Users,
  TrendingUp,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Eye,
  Link as LinkIcon,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  PropertyUnit,
  UNIT_STATUS_CONFIG,
  formatPrice,
} from '@/lib/types/property-unit';

// =============================================================================
// TYPES
// =============================================================================

export interface Property {
  id: string;
  name: string;
  location: string;
  developerId: string;
  totalUnits: number;
  status: 'ACTIVE' | 'COMING_SOON' | 'SOLD_OUT';
  launchDate?: string;
  completionDate?: string;
  thumbnail?: string;
}

export interface PropertyStats {
  available: number;
  reserved: number;
  pending: number;
  sold: number;
  totalValue: number;
  activeLinks: number;
  totalScans: number;
  activeCases: number;
}

export interface MortgageCase {
  id: string;
  caseRef: string;
  unitId: string;
  unitCode: string;
  phase: string;
  createdAt: string;
  updatedAt: string;
  // No PII - aggregate view only
}

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'Seven Sky Residences',
    location: 'Seksyen 13, Shah Alam',
    developerId: 'dev-seven-sky',
    totalUnits: 350,
    status: 'ACTIVE',
    launchDate: '2024-01-15',
    completionDate: '2026-06-30',
  },
];

const DEMO_STATS: Record<string, PropertyStats> = {
  'prop-1': {
    available: 180,
    reserved: 45,
    pending: 85,
    sold: 40,
    totalValue: 157500000, // RM 157.5M
    activeLinks: 234,
    totalScans: 1847,
    activeCases: 130,
  },
};

const DEMO_CASES: MortgageCase[] = [
  { id: 'c1', caseRef: 'QTK-2025-00142', unitId: 'u1', unitCode: 'A-12-03', phase: 'DOCS_PENDING', createdAt: '2025-02-01', updatedAt: '2025-02-08' },
  { id: 'c2', caseRef: 'QTK-2025-00143', unitId: 'u2', unitCode: 'A-12-05', phase: 'TAC_SCHEDULED', createdAt: '2025-02-02', updatedAt: '2025-02-09' },
  { id: 'c3', caseRef: 'QTK-2025-00144', unitId: 'u3', unitCode: 'B-08-01', phase: 'SUBMITTED', createdAt: '2025-02-03', updatedAt: '2025-02-10' },
  { id: 'c4', caseRef: 'QTK-2025-00145', unitId: 'u4', unitCode: 'B-15-02', phase: 'LO_RECEIVED', createdAt: '2025-01-28', updatedAt: '2025-02-07' },
  { id: 'c5', caseRef: 'QTK-2025-00146', unitId: 'u5', unitCode: 'A-20-01', phase: 'COMPLETED', createdAt: '2025-01-15', updatedAt: '2025-02-05' },
];

// =============================================================================
// PROPS
// =============================================================================

interface PropertyConsoleProps {
  developerId: string;
  locale?: 'bm' | 'en';
  onSelectProperty?: (property: Property) => void;
  onGenerateQR?: (unitId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PropertyConsole({
  developerId,
  locale = 'bm',
  onSelectProperty,
  onGenerateQR,
}: PropertyConsoleProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>('prop-1');
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'cases'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected property data
  const selectedProperty = DEMO_PROPERTIES.find(p => p.id === selectedPropertyId);
  const stats = selectedPropertyId ? DEMO_STATS[selectedPropertyId] : null;

  // Filter cases by search
  const filteredCases = useMemo(() => {
    if (!searchQuery) return DEMO_CASES;
    const q = searchQuery.toLowerCase();
    return DEMO_CASES.filter(c =>
      c.caseRef.toLowerCase().includes(q) ||
      c.unitCode.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Phase display config
  const getPhaseConfig = (phase: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string }> = {
      PRESCAN: { label: 'Imbasan', color: 'text-slate-600', bgColor: 'bg-slate-100' },
      DOCS_PENDING: { label: 'Dokumen', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      DOCS_COMPLETE: { label: 'Dokumen ✓', color: 'text-amber-700', bgColor: 'bg-amber-100' },
      TAC_SCHEDULED: { label: 'TAC Dijadualkan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      TAC_CONFIRMED: { label: 'TAC Disahkan', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      SUBMITTED: { label: 'Dihantar', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      LO_RECEIVED: { label: 'LO Diterima', color: 'text-teal-600', bgColor: 'bg-teal-100' },
      COMPLETED: { label: 'Selesai', color: 'text-green-600', bgColor: 'bg-green-100' },
    };
    return configs[phase] || { label: phase, color: 'text-slate-600', bgColor: 'bg-slate-100' };
  };

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            {locale === 'bm' ? 'Projek Anda' : 'Your Projects'}
          </h3>
          <button className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
            <Plus className="w-4 h-4" />
            {locale === 'bm' ? 'Tambah Projek' : 'Add Project'}
          </button>
        </div>

        {/* Property Cards */}
        <div className="grid gap-3">
          {DEMO_PROPERTIES.map(property => {
            const propStats = DEMO_STATS[property.id];
            const isSelected = selectedPropertyId === property.id;

            return (
              <button
                key={property.id}
                onClick={() => {
                  setSelectedPropertyId(property.id);
                  onSelectProperty?.(property);
                }}
                className={`
                  w-full p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">{property.name}</h4>
                    <p className="text-sm text-slate-500">{property.location}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90 text-cyan-600' : 'text-slate-400'}`} />
                </div>

                {propStats && (
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {propStats.available} {locale === 'bm' ? 'tersedia' : 'available'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {propStats.reserved} {locale === 'bm' ? 'ditempah' : 'reserved'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {propStats.pending} {locale === 'bm' ? 'dalam proses' : 'pending'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Detail Panel */}
      {selectedProperty && stats && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-700 to-cyan-900 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedProperty.name}</h2>
                <p className="text-cyan-200 text-sm">{selectedProperty.location}</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Nilai Jualan' : 'Sales Value'}</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalValue)}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-cyan-600">
              <div>
                <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Pautan Aktif' : 'Active Links'}</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  {stats.activeLinks}
                </p>
              </div>
              <div>
                <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Jumlah Imbasan' : 'Total Scans'}</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  {stats.totalScans}
                </p>
              </div>
              <div>
                <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Kes Aktif' : 'Active Cases'}</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {stats.activeCases}
                </p>
              </div>
              <div>
                <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Kadar Penukaran' : 'Conversion'}</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {Math.round((stats.sold / selectedProperty.totalUnits) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 px-4">
            <div className="flex gap-1">
              {[
                { id: 'overview', label: locale === 'bm' ? 'Ringkasan' : 'Overview', icon: BarChart3 },
                { id: 'units', label: locale === 'bm' ? 'Unit & QR' : 'Units & QR', icon: QrCode },
                { id: 'cases', label: locale === 'bm' ? 'Kes Mortgage' : 'Mortgage Cases', icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-cyan-600 text-cyan-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Unit Status Distribution */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-3">
                    {locale === 'bm' ? 'Taburan Status Unit' : 'Unit Status Distribution'}
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-2xl font-bold text-green-700">{stats.available}</p>
                      <p className="text-sm text-green-600">{locale === 'bm' ? 'Tersedia' : 'Available'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="text-2xl font-bold text-amber-700">{stats.reserved}</p>
                      <p className="text-sm text-amber-600">{locale === 'bm' ? 'Ditempah' : 'Reserved'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
                      <p className="text-sm text-blue-600">{locale === 'bm' ? 'Dalam Proses' : 'Pending'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-2xl font-bold text-slate-700">{stats.sold}</p>
                      <p className="text-sm text-slate-600">{locale === 'bm' ? 'Terjual' : 'Sold'}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>{locale === 'bm' ? 'Kemajuan Jualan' : 'Sales Progress'}</span>
                    <span>{stats.sold + stats.pending + stats.reserved} / {selectedProperty.totalUnits} unit</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full" style={{ width: `${(stats.sold / selectedProperty.totalUnits) * 100}%` }} />
                    <div className="bg-blue-500 h-full" style={{ width: `${(stats.pending / selectedProperty.totalUnits) * 100}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${(stats.reserved / selectedProperty.totalUnits) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'units' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {locale === 'bm'
                      ? 'Cipta pautan QR untuk setiap unit bagi pembeli akses portal'
                      : 'Generate QR links for each unit for buyer portal access'
                    }
                  </p>
                  <button
                    onClick={() => onGenerateQR?.('bulk')}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-cyan-700"
                  >
                    <QrCode className="w-4 h-4" />
                    {locale === 'bm' ? 'Jana QR Pukal' : 'Bulk Generate QR'}
                  </button>
                </div>

                {/* Unit Grid Preview */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    {locale === 'bm' ? 'Contoh Unit dengan QR' : 'Sample Units with QR'}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {['A-12-03', 'A-12-05', 'B-08-01', 'B-15-02'].map((unitCode, idx) => (
                      <div key={unitCode} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-slate-800">{unitCode}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${idx === 0 ? 'bg-green-100 text-green-600' : idx === 1 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {idx === 0 ? 'Tersedia' : idx === 1 ? 'Ditempah' : 'Proses'}
                          </span>
                        </div>
                        <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-2">
                          <QrCode className="w-12 h-12 text-slate-400" />
                        </div>
                        <button
                          onClick={() => onGenerateQR?.(unitCode)}
                          className="w-full text-xs text-cyan-600 hover:text-cyan-700 py-1"
                        >
                          {locale === 'bm' ? 'Lihat QR' : 'View QR'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'bm' ? 'Cari kes atau unit...' : 'Search cases or units...'}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                  />
                </div>

                {/* Case List - Aggregate View Only */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="text-left px-4 py-3 font-medium">{locale === 'bm' ? 'No. Kes' : 'Case Ref'}</th>
                        <th className="text-left px-4 py-3 font-medium">{locale === 'bm' ? 'Unit' : 'Unit'}</th>
                        <th className="text-left px-4 py-3 font-medium">{locale === 'bm' ? 'Fasa' : 'Phase'}</th>
                        <th className="text-left px-4 py-3 font-medium">{locale === 'bm' ? 'Kemaskini' : 'Updated'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.map(caseItem => {
                        const phaseConfig = getPhaseConfig(caseItem.phase);
                        return (
                          <tr key={caseItem.id} className="border-t border-slate-200 hover:bg-white">
                            <td className="px-4 py-3 font-mono text-slate-800">{caseItem.caseRef}</td>
                            <td className="px-4 py-3 text-slate-600">{caseItem.unitCode}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded ${phaseConfig.bgColor} ${phaseConfig.color}`}>
                                {phaseConfig.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(caseItem.updatedAt).toLocaleDateString('ms-MY')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-slate-400 text-center">
                  {locale === 'bm'
                    ? 'Paparan agregat sahaja. Maklumat peribadi pembeli tidak ditunjukkan.'
                    : 'Aggregate view only. Buyer PII not displayed.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyConsole;
