// components/LoanTypeBadge.tsx
// L-1: Loan Type Badge Component
// Displays loan type with consistent styling

'use client';

import {
  LoanTypeCode,
  getLoanType,
  getLoanTypeColor,
  parseLoanTypeCode,
  isDemoSupported,
} from '@/lib/config/loan-types';

interface LoanTypeBadgeProps {
  loanType: string | LoanTypeCode;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDemoStatus?: boolean;
}

export function LoanTypeBadge({
  loanType,
  size = 'md',
  showIcon = true,
  showDemoStatus = false,
}: LoanTypeBadgeProps) {
  // Parse loan type code
  const code = typeof loanType === 'number'
    ? loanType
    : parseLoanTypeCode(loanType);

  if (!code) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
        {loanType}
      </span>
    );
  }

  const typeConfig = getLoanType(code);
  const colors = getLoanTypeColor(code);
  const isDemo = isDemoSupported(code);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <span>{typeConfig.icon}</span>}
      <span>Jenis {code}</span>
      {size !== 'sm' && (
        <span className="hidden sm:inline">- {typeConfig.shortName}</span>
      )}
      {showDemoStatus && !isDemo && (
        <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
          Coming Soon
        </span>
      )}
    </span>
  );
}

/**
 * Loan Type Selector Component
 */
interface LoanTypeSelectorProps {
  value?: LoanTypeCode;
  onChange: (code: LoanTypeCode) => void;
  demoOnly?: boolean;
}

export function LoanTypeSelector({
  value,
  onChange,
  demoOnly = true,
}: LoanTypeSelectorProps) {
  const allTypes: LoanTypeCode[] = [1, 2, 3, 4, 5, 6, 7];
  const types = demoOnly
    ? allTypes.filter(code => isDemoSupported(code))
    : allTypes;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Jenis Pinjaman LPPSA
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {types.map(code => {
          const config = getLoanType(code);
          const colors = getLoanTypeColor(code);
          const isSelected = value === code;

          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? `${colors.border} ${colors.bg} ring-2 ring-offset-1 ring-blue-500`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  Jenis {code}: {config.shortName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {config.description}
                </div>
              </div>
              {isSelected && (
                <span className="text-blue-600">✓</span>
              )}
            </button>
          );
        })}
      </div>
      {demoOnly && (
        <p className="text-xs text-gray-500 mt-2">
          * Demo menyokong Jenis 1 (Subsale) dan Jenis 3 (Tanah + Bina) sahaja
        </p>
      )}
    </div>
  );
}

/**
 * Loan Type Info Card
 */
interface LoanTypeInfoCardProps {
  code: LoanTypeCode;
  compact?: boolean;
}

export function LoanTypeInfoCard({ code, compact = false }: LoanTypeInfoCardProps) {
  const config = getLoanType(code);
  const colors = getLoanTypeColor(code);
  const isDemo = isDemoSupported(code);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
        <span className="text-xl">{config.icon}</span>
        <div>
          <span className="font-medium">Jenis {code}:</span>{' '}
          <span>{config.shortName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white/50">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              Jenis {code}: {config.nameMy}
            </h3>
            <p className="text-sm text-gray-600">{config.nameEn}</p>
          </div>
          {isDemo && (
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Demo Ready
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-700">{config.description}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Dokumen Diperlukan
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {config.requiredDocs.slice(0, 5).map((doc, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                {doc.replace(/_/g, ' ')}
              </li>
            ))}
            {config.requiredDocs.length > 5 && (
              <li className="text-gray-500 text-xs">
                +{config.requiredDocs.length - 5} lagi...
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tempoh maksimum:</span>
          <span className="font-medium">{config.maxTenure} tahun</span>
        </div>
      </div>
    </div>
  );
}

export default LoanTypeBadge;
