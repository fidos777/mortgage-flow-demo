'use client';

/**
 * Unit Status Board
 * CR-007A: Property Unit Inventory | PRD v3.6.3
 *
 * Visual grid display of unit availability.
 * Like a seat map or property board showing all units per floor.
 */

import { useState, useMemo } from 'react';
import {
  Building,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
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

interface UnitStatusBoardProps {
  units: PropertyUnit[];
  onUnitClick?: (unit: PropertyUnit) => void;
  selectedUnitId?: string;
  filterStatus?: UnitStatus | 'ALL';
  filterType?: UnitType | 'ALL';
  locale?: 'bm' | 'en';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UnitStatusBoard({
  units,
  onUnitClick,
  selectedUnitId,
  filterStatus = 'ALL',
  filterType = 'ALL',
  locale = 'bm',
}: UnitStatusBoardProps) {
  const [currentBlock, setCurrentBlock] = useState<string | null>(null);

  // Get unique blocks
  const blocks = useMemo(() => {
    const blockSet = new Set(units.map(u => u.block || 'MAIN'));
    return Array.from(blockSet).sort();
  }, [units]);

  // Set default block
  useMemo(() => {
    if (!currentBlock && blocks.length > 0) {
      setCurrentBlock(blocks[0]);
    }
  }, [blocks, currentBlock]);

  // Filter units
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
      if (filterType !== 'ALL' && u.unitType !== filterType) return false;
      if (currentBlock && (u.block || 'MAIN') !== currentBlock) return false;
      return true;
    });
  }, [units, filterStatus, filterType, currentBlock]);

  // Group units by floor
  const floorGroups = useMemo(() => {
    const groups = new Map<string, PropertyUnit[]>();

    filteredUnits.forEach(unit => {
      const floor = unit.floor;
      if (!groups.has(floor)) {
        groups.set(floor, []);
      }
      groups.get(floor)!.push(unit);
    });

    // Sort by unit number within each floor
    groups.forEach(floorUnits => {
      floorUnits.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
    });

    // Sort floors descending (top floor first)
    const sortedEntries = Array.from(groups.entries()).sort((a, b) => {
      const aNum = parseInt(a[0]) || 0;
      const bNum = parseInt(b[0]) || 0;
      return bNum - aNum;
    });
    return new Map(sortedEntries);
  }, [filteredUnits]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredUnits.length;
    const available = filteredUnits.filter(u => u.status === 'AVAILABLE').length;
    const reserved = filteredUnits.filter(u => u.status === 'RESERVED').length;
    const sold = filteredUnits.filter(u => u.status === 'SOLD').length;
    return { total, available, reserved, sold };
  }, [filteredUnits]);

  // Navigate blocks
  const navigateBlock = (direction: 'prev' | 'next') => {
    if (!currentBlock) return;
    const currentIndex = blocks.indexOf(currentBlock);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentBlock(blocks[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < blocks.length - 1) {
      setCurrentBlock(blocks[currentIndex + 1]);
    }
  };

  // Render unit cell
  const renderUnitCell = (unit: PropertyUnit) => {
    const statusConfig = UNIT_STATUS_CONFIG[unit.status];
    const typeConfig = UNIT_TYPE_CONFIG[unit.unitType];
    const isSelected = selectedUnitId === unit.id;
    const isClickable = onUnitClick && unit.status === 'AVAILABLE';

    return (
      <button
        key={unit.id}
        onClick={() => isClickable && onUnitClick(unit)}
        disabled={!isClickable}
        className={`
          relative w-16 h-16 rounded-lg border-2 transition-all
          flex flex-col items-center justify-center
          ${isSelected ? 'ring-2 ring-teal-500 ring-offset-2' : ''}
          ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
          ${statusConfig.bgColor}
          ${unit.status === 'AVAILABLE' ? 'border-green-300' : 'border-transparent'}
          ${unit.status === 'RESERVED' ? 'border-amber-300' : ''}
          ${unit.status === 'SOLD' ? 'border-slate-300 opacity-60' : ''}
          ${unit.status === 'UNAVAILABLE' ? 'border-red-300 opacity-40' : ''}
        `}
        title={`${unit.fullUnitCode} - ${formatPrice(unit.listPrice)}`}
      >
        {/* Unit Number */}
        <span className={`text-xs font-bold ${statusConfig.color}`}>
          {unit.unitNumber}
        </span>

        {/* Unit Type Badge */}
        <span className="text-[10px] text-slate-500">
          {typeConfig.shortLabel}
        </span>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white">✓</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-teal-600" />
            {locale === 'bm' ? 'Papan Status Unit' : 'Unit Status Board'}
          </h3>

          {/* Block Navigation */}
          {blocks.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateBlock('prev')}
                disabled={blocks.indexOf(currentBlock || '') === 0}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[60px] text-center">
                {locale === 'bm' ? 'Blok' : 'Block'} {currentBlock}
              </span>
              <button
                onClick={() => navigateBlock('next')}
                disabled={blocks.indexOf(currentBlock || '') === blocks.length - 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-600">
            {locale === 'bm' ? 'Jumlah' : 'Total'}: <strong>{stats.total}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {locale === 'bm' ? 'Tersedia' : 'Available'}: {stats.available}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {locale === 'bm' ? 'Ditempah' : 'Reserved'}: {stats.reserved}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {locale === 'bm' ? 'Terjual' : 'Sold'}: {stats.sold}
          </span>
        </div>
      </div>

      {/* Board Grid */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {floorGroups.size === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Building className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {locale === 'bm' ? 'Tiada unit ditemui' : 'No units found'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(floorGroups.entries()).map(([floor, floorUnits]) => (
              <div key={floor} className="flex items-center gap-3">
                {/* Floor Label */}
                <div className="w-12 text-right">
                  <span className="text-xs font-bold text-slate-500">
                    {locale === 'bm' ? 'Tkt' : 'Flr'} {floor}
                  </span>
                </div>

                {/* Units */}
                <div className="flex gap-2 flex-wrap">
                  {floorUnits.map(renderUnitCell)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 border-t border-slate-200 p-3">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
            {locale === 'bm' ? 'Tersedia' : 'Available'}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
            {locale === 'bm' ? 'Ditempah' : 'Reserved'}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
            {locale === 'bm' ? 'Dalam Proses' : 'Pending'}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300 opacity-60" />
            {locale === 'bm' ? 'Terjual' : 'Sold'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default UnitStatusBoard;
