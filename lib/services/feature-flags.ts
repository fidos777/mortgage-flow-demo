// lib/services/feature-flags.ts
// P3-4: Central Feature Flags Service
// Controls demo vs pilot behavior across the app

/**
 * Feature Flag Keys
 * Used to toggle behavior between demo and production modes
 */
export type FeatureFlagKey =
  | 'DEMO_MODE'           // Global demo mode indicator
  | 'OTP_ENFORCED'        // Require OTP verification for buyer access
  | 'DOC_STRICT_MODE'     // Strict document validation (reject incomplete)
  | 'TELEMETRY_ENABLED'   // Send telemetry to backend
  | 'LINK_EXPIRY_ENABLED' // Enforce invite link expiration
  | 'PROOF_STRICT_MODE';  // Strict proof event validation

/**
 * Feature Flag Configuration
 */
export interface FeatureFlag {
  key: FeatureFlagKey;
  enabled: boolean;
  description: string;
  defaultValue: boolean;
}

/**
 * Default flag values
 * Demo mode: relaxed settings for presentation
 * Pilot mode: stricter settings for real users
 */
const DEFAULT_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  DEMO_MODE: {
    key: 'DEMO_MODE',
    enabled: true,
    description: 'Global demo mode - relaxes validations for presentation',
    defaultValue: true,
  },
  OTP_ENFORCED: {
    key: 'OTP_ENFORCED',
    enabled: false,
    description: 'Require OTP verification for buyer secure link access',
    defaultValue: false,
  },
  DOC_STRICT_MODE: {
    key: 'DOC_STRICT_MODE',
    enabled: false,
    description: 'Strict document validation - reject incomplete submissions',
    defaultValue: false,
  },
  TELEMETRY_ENABLED: {
    key: 'TELEMETRY_ENABLED',
    enabled: true,
    description: 'Send telemetry events for funnel tracking',
    defaultValue: true,
  },
  LINK_EXPIRY_ENABLED: {
    key: 'LINK_EXPIRY_ENABLED',
    enabled: false,
    description: 'Enforce 7-day expiry on invitation links',
    defaultValue: false,
  },
  PROOF_STRICT_MODE: {
    key: 'PROOF_STRICT_MODE',
    enabled: false,
    description: 'Strict proof event validation - require all metadata',
    defaultValue: false,
  },
};

/**
 * Feature Flag Presets
 */
export const FLAG_PRESETS = {
  demo: {
    DEMO_MODE: true,
    OTP_ENFORCED: false,
    DOC_STRICT_MODE: false,
    TELEMETRY_ENABLED: true,
    LINK_EXPIRY_ENABLED: false,
    PROOF_STRICT_MODE: false,
  },
  pilot: {
    DEMO_MODE: false,
    OTP_ENFORCED: true,
    DOC_STRICT_MODE: true,
    TELEMETRY_ENABLED: true,
    LINK_EXPIRY_ENABLED: true,
    PROOF_STRICT_MODE: true,
  },
  production: {
    DEMO_MODE: false,
    OTP_ENFORCED: true,
    DOC_STRICT_MODE: true,
    TELEMETRY_ENABLED: true,
    LINK_EXPIRY_ENABLED: true,
    PROOF_STRICT_MODE: true,
  },
} as const;

export type FlagPreset = keyof typeof FLAG_PRESETS;

/**
 * Feature Flags Service Interface
 */
export interface IFeatureFlagsService {
  isEnabled(flag: FeatureFlagKey): boolean;
  setFlag(flag: FeatureFlagKey, enabled: boolean): void;
  applyPreset(preset: FlagPreset): void;
  getAllFlags(): Record<FeatureFlagKey, boolean>;
  getCurrentPreset(): FlagPreset | 'custom';
}

// =============================================================================
// Feature Flags Service Implementation
// =============================================================================

class FeatureFlagsService implements IFeatureFlagsService {
  private flags: Record<FeatureFlagKey, boolean>;
  private storageKey = 'qontrek_feature_flags';

  constructor() {
    // Initialize with default values
    this.flags = {} as Record<FeatureFlagKey, boolean>;
    for (const key of Object.keys(DEFAULT_FLAGS) as FeatureFlagKey[]) {
      this.flags[key] = DEFAULT_FLAGS[key].defaultValue;
    }

    // Try to load from localStorage (client-side only)
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const key of Object.keys(parsed)) {
          if (key in this.flags) {
            this.flags[key as FeatureFlagKey] = Boolean(parsed[key]);
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
    } catch {
      // Ignore storage errors
    }
  }

  isEnabled(flag: FeatureFlagKey): boolean {
    return this.flags[flag] ?? DEFAULT_FLAGS[flag]?.defaultValue ?? false;
  }

  setFlag(flag: FeatureFlagKey, enabled: boolean): void {
    this.flags[flag] = enabled;
    this.saveToStorage();

    // Log flag change for debugging
    console.log(`[FeatureFlags] ${flag} = ${enabled}`);
  }

  applyPreset(preset: FlagPreset): void {
    const presetValues = FLAG_PRESETS[preset];
    for (const [key, value] of Object.entries(presetValues)) {
      this.flags[key as FeatureFlagKey] = value;
    }
    this.saveToStorage();

    console.log(`[FeatureFlags] Applied preset: ${preset}`);
  }

  getAllFlags(): Record<FeatureFlagKey, boolean> {
    return { ...this.flags };
  }

  getCurrentPreset(): FlagPreset | 'custom' {
    for (const [presetName, presetValues] of Object.entries(FLAG_PRESETS)) {
      const matches = Object.entries(presetValues).every(
        ([key, value]) => this.flags[key as FeatureFlagKey] === value
      );
      if (matches) {
        return presetName as FlagPreset;
      }
    }
    return 'custom';
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let featureFlagsService: IFeatureFlagsService | null = null;

/**
 * Get Feature Flags Service instance
 */
export function getFeatureFlagsService(): IFeatureFlagsService {
  if (!featureFlagsService) {
    featureFlagsService = new FeatureFlagsService();
  }
  return featureFlagsService;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Check if a feature flag is enabled
 * Usage: if (isFeatureEnabled('OTP_ENFORCED')) { ... }
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return getFeatureFlagsService().isEnabled(flag);
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  return isFeatureEnabled('DEMO_MODE');
}

/**
 * Check if OTP is required
 */
export function isOtpRequired(): boolean {
  return isFeatureEnabled('OTP_ENFORCED');
}

/**
 * Check if strict document validation is enabled
 */
export function isDocStrictMode(): boolean {
  return isFeatureEnabled('DOC_STRICT_MODE');
}

// =============================================================================
// React Hook
// =============================================================================

/**
 * Hook for feature flags in React components
 * Usage: const { isEnabled, setFlag, applyPreset } = useFeatureFlags();
 */
export function useFeatureFlags() {
  const service = getFeatureFlagsService();

  return {
    isEnabled: service.isEnabled.bind(service),
    setFlag: service.setFlag.bind(service),
    applyPreset: service.applyPreset.bind(service),
    getAllFlags: service.getAllFlags.bind(service),
    getCurrentPreset: service.getCurrentPreset.bind(service),
    isDemoMode: () => service.isEnabled('DEMO_MODE'),
    isOtpRequired: () => service.isEnabled('OTP_ENFORCED'),
  };
}

// =============================================================================
// Environment-based Initialization
// =============================================================================

/**
 * Initialize flags from environment variables
 * Call this in app initialization
 */
export function initializeFromEnv(): void {
  const service = getFeatureFlagsService();

  // Check for preset in environment
  const preset = process.env.NEXT_PUBLIC_FLAG_PRESET as FlagPreset | undefined;
  if (preset && preset in FLAG_PRESETS) {
    service.applyPreset(preset);
    return;
  }

  // Check individual flags from environment
  const envFlags: Partial<Record<FeatureFlagKey, string | undefined>> = {
    DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    OTP_ENFORCED: process.env.NEXT_PUBLIC_OTP_ENFORCED,
    DOC_STRICT_MODE: process.env.NEXT_PUBLIC_DOC_STRICT_MODE,
    TELEMETRY_ENABLED: process.env.NEXT_PUBLIC_TELEMETRY_ENABLED,
  };

  for (const [key, value] of Object.entries(envFlags)) {
    if (value !== undefined) {
      service.setFlag(key as FeatureFlagKey, value === 'true' || value === '1');
    }
  }
}
