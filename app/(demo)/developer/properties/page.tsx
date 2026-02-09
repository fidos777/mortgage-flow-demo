'use client';

/**
 * Developer Properties Page
 * CR-007: Property Console
 *
 * Full property management with unit-level QR generation.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  QrCode,
  Download,
  Filter,
  Plus,
  Search,
} from 'lucide-react';
import { PropertyConsole, Property } from '@/components/developer';
import { UnitQRGenerator } from '@/components/developer/UnitQRGenerator';
import { UnitStatusBoard } from '@/components/property/UnitStatusBoard';
import { useTranslation } from '@/lib/i18n';

// Demo unit data for the board
const DEMO_UNITS = [
  // Block A - Floors 10-15
  ...Array.from({ length: 6 }, (_, floorIdx) =>
    Array.from({ length: 8 }, (_, unitIdx) => ({
      id: `a-${10 + floorIdx}-${String(unitIdx + 1).padStart(2, '0')}`,
      propertyId: 'prop-1',
      developerId: 'dev-seven-sky',
      block: 'A',
      floor: String(10 + floorIdx),
      unitNumber: String(unitIdx + 1).padStart(2, '0'),
      fullUnitCode: `A-${10 + floorIdx}-${String(unitIdx + 1).padStart(2, '0')}`,
      unitType: unitIdx < 2 ? 'STUDIO' : unitIdx < 5 ? 'TWO_BEDROOM' : 'THREE_BEDROOM',
      bedrooms: unitIdx < 2 ? 0 : unitIdx < 5 ? 2 : 3,
      bathrooms: unitIdx < 2 ? 1 : 2,
      sqft: unitIdx < 2 ? 550 : unitIdx < 5 ? 900 : 1200,
      listPrice: unitIdx < 2 ? 350000 : unitIdx < 5 ? 520000 : 680000,
      status: Math.random() > 0.6 ? 'AVAILABLE' : Math.random() > 0.5 ? 'RESERVED' : Math.random() > 0.5 ? 'PENDING' : 'SOLD',
      invitationLinkCount: Math.floor(Math.random() * 5),
      scanCount: Math.floor(Math.random() * 20),
      features: ['Pemandangan Taman', 'Corner Unit'],
      createdAt: '2024-01-15',
      updatedAt: '2025-02-01',
    }))
  ).flat(),
  // Block B - Floors 8-12
  ...Array.from({ length: 5 }, (_, floorIdx) =>
    Array.from({ length: 6 }, (_, unitIdx) => ({
      id: `b-${8 + floorIdx}-${String(unitIdx + 1).padStart(2, '0')}`,
      propertyId: 'prop-1',
      developerId: 'dev-seven-sky',
      block: 'B',
      floor: String(8 + floorIdx),
      unitNumber: String(unitIdx + 1).padStart(2, '0'),
      fullUnitCode: `B-${8 + floorIdx}-${String(unitIdx + 1).padStart(2, '0')}`,
      unitType: unitIdx < 3 ? 'ONE_BEDROOM' : 'TWO_BEDROOM',
      bedrooms: unitIdx < 3 ? 1 : 2,
      bathrooms: unitIdx < 3 ? 1 : 2,
      sqft: unitIdx < 3 ? 700 : 950,
      listPrice: unitIdx < 3 ? 420000 : 550000,
      status: Math.random() > 0.5 ? 'AVAILABLE' : Math.random() > 0.5 ? 'RESERVED' : 'PENDING',
      invitationLinkCount: Math.floor(Math.random() * 3),
      scanCount: Math.floor(Math.random() * 15),
      features: ['Pool View'],
      createdAt: '2024-01-15',
      updatedAt: '2025-02-01',
    }))
  ).flat(),
] as const;

export default function DeveloperPropertiesPage() {
  const { lang } = useTranslation();
  const locale = lang as 'bm' | 'en';

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<typeof DEMO_UNITS[0] | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [viewMode, setViewMode] = useState<'console' | 'board'>('console');

  const handleGenerateQR = (unitIdOrCode: string) => {
    // Find unit by id or code
    const unit = DEMO_UNITS.find(
      u => u.id === unitIdOrCode || u.fullUnitCode === unitIdOrCode
    );
    if (unit) {
      setSelectedUnit(unit);
      setShowQRModal(true);
    } else if (unitIdOrCode === 'bulk') {
      // Handle bulk QR generation
      alert(locale === 'bm'
        ? 'Jana QR pukal untuk semua unit tersedia...'
        : 'Generating bulk QR for all available units...'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/developer"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-cyan-600" />
                {locale === 'bm' ? 'Konsol Hartanah' : 'Property Console'}
              </h1>
              <p className="text-sm text-slate-500">
                {locale === 'bm'
                  ? 'Urus hartanah, unit, dan pautan QR pembeli'
                  : 'Manage properties, units, and buyer QR links'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('console')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'console'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {locale === 'bm' ? 'Konsol' : 'Console'}
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {locale === 'bm' ? 'Papan Unit' : 'Unit Board'}
              </button>
            </div>

            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-200 transition-colors">
              <Download className="w-4 h-4" />
              {locale === 'bm' ? 'Eksport' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {viewMode === 'console' ? (
          <PropertyConsole
            developerId="dev-seven-sky"
            locale={locale}
            onSelectProperty={setSelectedProperty}
            onGenerateQR={handleGenerateQR}
          />
        ) : (
          <div className="space-y-4">
            {/* Board Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  Seven Sky Residences
                </h3>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-slate-600 hover:text-cyan-600 flex items-center gap-1">
                    <Filter className="w-4 h-4" />
                    {locale === 'bm' ? 'Tapis' : 'Filter'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                {locale === 'bm'
                  ? 'Klik pada unit tersedia untuk menjana QR akses pembeli'
                  : 'Click on available units to generate buyer access QR'
                }
              </p>
            </div>

            {/* Unit Status Board */}
            <UnitStatusBoard
              units={DEMO_UNITS as any}
              locale={locale}
              onUnitClick={(unit) => {
                if (unit.status === 'AVAILABLE') {
                  setSelectedUnit(unit as any);
                  setShowQRModal(true);
                }
              }}
              selectedUnitId={selectedUnit?.id}
            />
          </div>
        )}
      </div>

      {/* QR Generator Modal */}
      {selectedUnit && (
        <UnitQRGenerator
          unit={{
            id: selectedUnit.id,
            unitCode: selectedUnit.fullUnitCode,
            block: selectedUnit.block,
            floor: selectedUnit.floor,
            unitNumber: selectedUnit.unitNumber,
            propertyName: 'Seven Sky Residences',
            listPrice: selectedUnit.listPrice,
          }}
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedUnit(null);
          }}
          locale={locale}
        />
      )}
    </div>
  );
}
