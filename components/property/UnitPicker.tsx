'use client';

/**
 * Unit Picker Modal
 * CR-007A: Property Unit Inventory | PRD v3.6.3
 *
 * Modal for selecting a unit in "Cipta Pautan Jemputan" flow.
 * Shows available units with filtering and search.
 */

import { useState, useMemo } from 'react';
import {
  X,
  Search,
  Building,
  Filter,
  ChevronDown,
  Check,
  Home,
  Maximize,
  DollarSign,
} from 'lucide-react';
import {
  PropertyUnit,
  UnitStatus,
  UnitType,
  UNIT_STATUS_CONFIG,
  UNIT_TYPE_CONFIG,
  formatPrice,
} from '@/lib/types/property-unit';

// =============================================================================
// PROPS
// =============================================================================

interface UnitPickerProps {
  units: PropertyUnit[];
  onSelect: (unit: PropertyUnit) => void;
  onClose: () => void;
  selectedUnitId?: string;
  locale?: 'bm' | 'en';
  showOnlyAvailable?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UnitPicker({
  units,
  onSelect,
  onClose,
  selectedUnitId,
  locale = 'bm',
  showOnlyAvailable = true,
}: UnitPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<UnitType | 'ALL'>('ALL');
  const [filterBlock, setFilterBlock] = useState<string | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'floor' | 'type'>('floor');

  // Get unique blocks
  const blocks = useMemo(() => {
    const blockSet = new Set(units.map(u => u.block || 'MAIN'));
    return Array.from(blockSet).sort();
  }, [units]);

  // Filter and search units
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      // Only show available if flag is set
      if (showOnlyAvailable && unit.status !== 'AVAILABLE') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          unit.fullUnitCode.toLowerCase().includes(query) ||
          unit.unitNumber.toLowerCase().includes(query) ||
          unit.floor.toLowerCase().includes(query) ||
          (unit.block && unit.block.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filterType !== 'ALL' && unit.unitType !== filterType) return false;

      // Block filter
      if (filterBlock !== 'ALL' && (unit.block || 'MAIN') !== filterBlock) return false;

      return true;
    });
  }, [units, searchQuery, filterType, filterBlock, showOnlyAvailable]);

  // Sort units
  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.listPrice - b.listPrice;
        case 'floor':
          const aFloor = parseInt(a.floor) || 0;
          const bFloor = parseInt(b.floor) || 0;
          return bFloor - aFloor; // Higher floors first
        case 'type':
          return a.unitType.localeCompare(b.unitType);
        default:
          return 0;
      }
    });
  }, [filteredUnits, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const available = units.filter(u => u.status === 'AVAILABLE').length;
    const minPrice = Math.min(...filteredUnits.map(u => u.listPrice));
    const maxPrice = Math.max(...filteredUnits.map(u => u.listPrice));
    return { available, minPrice, maxPrice, showing: filteredUnits.length };
  }, [units, filteredUnits]);

  // Handle unit selection
  const handleSelect = (unit: PropertyUnit) => {
    if (unit.status !== 'AVAILABLE') return;
    onSelect(unit);
  };

  // Render unit card
  const renderUnitCard = (unit: PropertyUnit) => {
    const statusConfig = UNIT_STATUS_CONFIG[unit.status];
    const typeConfig = UNIT_TYPE_CONFIG[unit.unitType];
    const isSelected = selectedUnitId === unit.id;
    const isAvailable = unit.status === 'AVAILABLE';

    return (
      <button
        key={unit.id}
        onClick={() => handleSelect(unit)}
        disabled={!isAvailable}
        className={`
          w-full p-4 rounded-xl border-2 text-left transition-all
          ${isSelected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : 'border-slate-200'}
          ${isAvailable ? 'hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-bold text-slate-800">{unit.fullUnitCode}</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
              {locale === 'bm' ? statusConfig.labelBm : statusConfig.labelEn}
            </span>
          </div>
          {isSelected && (
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          {/* Unit Type */}
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="w-4 h-4" />
            <span>{locale === 'bm' ? typeConfig.labelBm : typeConfig.labelEn}</span>
            {unit.bedrooms && (
              <span className="text-xs text-slate-400">
                {unit.bedrooms}B/{unit.bathrooms || 1}B
              </span>
            )}
          </div>

          {/* Size */}
          {unit.sqft && (
            <div className="flex items-center gap-2 text-slate-600">
              <Maximize className="w-4 h-4" />
              <span>{unit.sqft.toLocaleString()} sqft</span>
              {unit.sqm && (
                <span className="text-xs text-slate-400">({unit.sqm} sqm)</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 text-teal-700 font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>{formatPrice(unit.listPrice)}</span>
          </div>
        </div>

        {/* Features */}
        {unit.features && unit.features.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {unit.features.slice(0, 3).map((feature, idx) => (
              <span
                key={idx}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
              >
                {feature}
              </span>
            ))}
            {unit.features.length > 3 && (
              <span className="text-xs text-slate-400">
                +{unit.features.length - 3}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-600" />
              {locale === 'bm' ? 'Pilih Unit' : 'Select Unit'}
            </h2>
            <p className="text-sm text-slate-500">
              {locale === 'bm'
                ? `${stats.available} unit tersedia`
                : `${stats.available} units available`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={locale === 'bm' ? 'Cari unit...' : 'Search units...'}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
          >
            <Filter className="w-4 h-4" />
            {locale === 'bm' ? 'Tapis' : 'Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-3 gap-3">
              {/* Block Filter */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  {locale === 'bm' ? 'Blok' : 'Block'}
                </label>
                <select
                  value={filterBlock}
                  onChange={e => setFilterBlock(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="ALL">{locale === 'bm' ? 'Semua' : 'All'}</option>
                  {blocks.map(block => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  {locale === 'bm' ? 'Jenis' : 'Type'}
                </label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as UnitType | 'ALL')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="ALL">{locale === 'bm' ? 'Semua' : 'All'}</option>
                  {Object.entries(UNIT_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {locale === 'bm' ? config.labelBm : config.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  {locale === 'bm' ? 'Susun' : 'Sort'}
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'price' | 'floor' | 'type')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="floor">{locale === 'bm' ? 'Tingkat' : 'Floor'}</option>
                  <option value="price">{locale === 'bm' ? 'Harga' : 'Price'}</option>
                  <option value="type">{locale === 'bm' ? 'Jenis' : 'Type'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="text-xs text-slate-500">
            {locale === 'bm'
              ? `Menunjukkan ${stats.showing} unit`
              : `Showing ${stats.showing} units`}
            {stats.showing > 0 && (
              <span className="ml-2">
                ({formatPrice(stats.minPrice)} - {formatPrice(stats.maxPrice)})
              </span>
            )}
          </div>
        </div>

        {/* Units Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedUnits.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {locale === 'bm'
                  ? 'Tiada unit ditemui'
                  : 'No units found'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {locale === 'bm'
                  ? 'Cuba ubah carian atau tapis'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedUnits.map(renderUnitCard)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {locale === 'bm' ? 'Batal' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnitPicker;
