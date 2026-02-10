'use client';

/**
 * Property Console
 * CR-007: Property Console | PRD v3.6.3
 *
 * Developer dashboard for managing properties, units, and QR-based buyer access.
 * Shows aggregate property data with drill-down to unit-level management.
 *
 * WIRED TO REAL APIs - Sprint S4 Day 2
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Building2,
  QrCode,
  TrendingUp,
  ChevronRight,
  Plus,
  Search,
  Link as LinkIcon,
  BarChart3,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatPrice } from '@/lib/types/property-unit';

// =============================================================================
// TYPES
// =============================================================================

export interface Property {
  id: string;
  name: string;
  location: string;
  developerId: string;
  totalUnits: number;
  status: 'ACTIVE' | 'COMING_SOON' | 'SOLD_OUT' | 'active' | 'coming_soon' | 'sold_out';
  launchDate?: string;
  completionDate?: string;
  thumbnail?: string;
  priceMin?: number;
  priceMax?: number;
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
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchProperties(developerId?: string): Promise<Property[]> {
  try {
    const url = developerId
      ? `/api/properties?developer_id=${developerId}`
      : '/api/properties';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch properties');

    const data = await res.json();

    // Transform API response to component format
    return (data.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      location: p.location || p.city || 'N/A',
      developerId: p.developer_id,
      totalUnits: p.total_units || 0,
      status: p.status?.toUpperCase() || 'ACTIVE',
      launchDate: p.launch_date,
      completionDate: p.completion_date,
      thumbnail: p.thumbnail_url,
      priceMin: p.price_min,
      priceMax: p.price_max,
    }));
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

async function fetchPropertyStats(propertyId: string): Promise<PropertyStats | null> {
  try {
    // Fetch units for this property to calculate stats
    const res = await fetch(`/api/properties/${propertyId}/units`);
    if (!res.ok) return null;

    const data = await res.json();
    const units = data.data || [];

    // Calculate stats from units
    const stats: PropertyStats = {
      available: units.filter((u: any) => u.status === 'available').length,
      reserved: units.filter((u: any) => u.status === 'reserved').length,
      pending: units.filter((u: any) => u.status === 'pending' || u.status === 'mortgage_pending').length,
      sold: units.filter((u: any) => u.status === 'sold').length,
      totalValue: units.reduce((sum: number, u: any) => sum + (u.price || 0), 0),
      activeLinks: 0, // Would need separate API call
      totalScans: 0,  // Would need separate API call
      activeCases: units.filter((u: any) => u.status === 'pending' || u.status === 'mortgage_pending').length,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching property stats:', error);
    return null;
  }
}

async function fetchCases(propertyId?: string): Promise<MortgageCase[]> {
  try {
    const url = propertyId
      ? `/api/cases?property_id=${propertyId}`
      : '/api/cases';

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();

    return (data.data || []).map((c: any) => ({
      id: c.id,
      caseRef: c.case_ref || c.reference_number || `QTK-${c.id.slice(0, 8)}`,
      unitId: c.unit_id || '',
      unitCode: c.unit_code || 'N/A',
      phase: c.phase || c.status || 'PRESCAN',
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching cases:', error);
    return [];
  }
}

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
  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [cases, setCases] = useState<MortgageCase[]>([]);

  // UI state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'cases'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties on mount
  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setError(null);

      const data = await fetchProperties(developerId);
      setProperties(data);

      // Auto-select first property
      if (data.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(data[0].id);
      }

      setLoading(false);
    }

    loadProperties();
  }, [developerId]);

  // Fetch stats and cases when property is selected
  useEffect(() => {
    if (!selectedPropertyId) return;

    // Capture the value to avoid null in async context
    const propertyId = selectedPropertyId;

    async function loadPropertyData() {
      setStatsLoading(true);

      const [statsData, casesData] = await Promise.all([
        fetchPropertyStats(propertyId),
        fetchCases(propertyId),
      ]);

      setStats(statsData);
      setCases(casesData);
      setStatsLoading(false);
    }

    loadPropertyData();
  }, [selectedPropertyId]);

  // Refresh function
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchProperties(developerId);
    setProperties(data);

    if (selectedPropertyId) {
      const [statsData, casesData] = await Promise.all([
        fetchPropertyStats(selectedPropertyId),
        fetchCases(selectedPropertyId),
      ]);
      setStats(statsData);
      setCases(casesData);
    }

    setLoading(false);
  }, [developerId, selectedPropertyId]);

  // Get selected property
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Filter cases by search
  const filteredCases = useMemo(() => {
    if (!searchQuery) return cases;
    const q = searchQuery.toLowerCase();
    return cases.filter(c =>
      c.caseRef.toLowerCase().includes(q) ||
      c.unitCode.toLowerCase().includes(q)
    );
  }, [cases, searchQuery]);

  // Phase display config
  const getPhaseConfig = (phase: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string }> = {
      PRESCAN: { label: 'Imbasan', color: 'text-slate-600', bgColor: 'bg-slate-100' },
      prescan: { label: 'Imbasan', color: 'text-slate-600', bgColor: 'bg-slate-100' },
      DOCS_PENDING: { label: 'Dokumen', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      docs_pending: { label: 'Dokumen', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      DOCS_COMPLETE: { label: 'Dokumen ✓', color: 'text-amber-700', bgColor: 'bg-amber-100' },
      docs_complete: { label: 'Dokumen ✓', color: 'text-amber-700', bgColor: 'bg-amber-100' },
      TAC_SCHEDULED: { label: 'TAC Dijadualkan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      tac_scheduled: { label: 'TAC Dijadualkan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      TAC_CONFIRMED: { label: 'TAC Disahkan', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      tac_confirmed: { label: 'TAC Disahkan', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      SUBMITTED: { label: 'Dihantar', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      submitted: { label: 'Dihantar', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      LO_RECEIVED: { label: 'LO Diterima', color: 'text-teal-600', bgColor: 'bg-teal-100' },
      lo_received: { label: 'LO Diterima', color: 'text-teal-600', bgColor: 'bg-teal-100' },
      COMPLETED: { label: 'Selesai', color: 'text-green-600', bgColor: 'bg-green-100' },
      completed: { label: 'Selesai', color: 'text-green-600', bgColor: 'bg-green-100' },
    };
    return configs[phase] || { label: phase, color: 'text-slate-600', bgColor: 'bg-slate-100' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        <span className="ml-3 text-slate-600">
          {locale === 'bm' ? 'Memuatkan...' : 'Loading...'}
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          {locale === 'bm' ? 'Cuba Lagi' : 'Try Again'}
        </button>
      </div>
    );
  }

  // Empty state
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-4">
          {locale === 'bm' ? 'Tiada projek ditemui' : 'No projects found'}
        </p>
        <button
          onClick={handleRefresh}
          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          {locale === 'bm' ? 'Muat Semula' : 'Refresh'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            {locale === 'bm' ? 'Projek Anda' : 'Your Projects'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="text-slate-400 hover:text-slate-600 p-1"
              title={locale === 'bm' ? 'Muat semula' : 'Refresh'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              {locale === 'bm' ? 'Tambah Projek' : 'Add Project'}
            </button>
          </div>
        </div>

        {/* Property Cards */}
        <div className="grid gap-3">
          {properties.map(property => {
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

                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    {property.totalUnits} {locale === 'bm' ? 'unit' : 'units'}
                  </span>
                  {property.priceMin && (
                    <span className="text-slate-500">
                      {locale === 'bm' ? 'dari' : 'from'} {formatPrice(property.priceMin)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Detail Panel */}
      {selectedProperty && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-700 to-cyan-900 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedProperty.name}</h2>
                <p className="text-cyan-200 text-sm">{selectedProperty.location}</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Jumlah Unit' : 'Total Units'}</p>
                <p className="text-2xl font-bold">{selectedProperty.totalUnits}</p>
              </div>
            </div>

            {/* Quick Stats */}
            {statsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
              </div>
            ) : stats && (
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-cyan-600">
                <div>
                  <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Tersedia' : 'Available'}</p>
                  <p className="text-2xl font-bold">{stats.available}</p>
                </div>
                <div>
                  <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Dalam Proses' : 'Pending'}</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div>
                  <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Terjual' : 'Sold'}</p>
                  <p className="text-2xl font-bold">{stats.sold}</p>
                </div>
                <div>
                  <p className="text-cyan-300 text-xs">{locale === 'bm' ? 'Nilai Jumlah' : 'Total Value'}</p>
                  <p className="text-xl font-bold">{formatPrice(stats.totalValue)}</p>
                </div>
              </div>
            )}
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
            {activeTab === 'overview' && stats && (
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
                    <div className="bg-green-500 h-full" style={{ width: `${(stats.sold / Math.max(selectedProperty.totalUnits, 1)) * 100}%` }} />
                    <div className="bg-blue-500 h-full" style={{ width: `${(stats.pending / Math.max(selectedProperty.totalUnits, 1)) * 100}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${(stats.reserved / Math.max(selectedProperty.totalUnits, 1)) * 100}%` }} />
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

                {/* Unit Grid Preview - Would load from API */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    {locale === 'bm' ? 'Unit dengan QR' : 'Units with QR'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {locale === 'bm'
                      ? 'Gunakan tab "Kes Mortgage" untuk melihat unit dengan kes aktif'
                      : 'Use "Mortgage Cases" tab to view units with active cases'}
                  </p>
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

                {/* Case List */}
                {filteredCases.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {locale === 'bm' ? 'Tiada kes ditemui' : 'No cases found'}
                  </div>
                ) : (
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
                )}

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
