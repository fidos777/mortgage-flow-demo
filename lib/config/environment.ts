/**
 * Environment Configuration
 * S6.2: Environment Configuration | PRD v3.6.3
 *
 * Centralized environment configuration for snang.my pilot.
 * Supports DEV, STAGING, PILOT, and PRODUCTION environments.
 */

// =============================================================================
// ENVIRONMENT TYPE
// =============================================================================

export type Environment = 'development' | 'staging' | 'pilot' | 'production';

// =============================================================================
// CONFIGURATION INTERFACE
// =============================================================================

export interface EnvironmentConfig {
  // Environment identification
  env: Environment;
  name: string;
  isProduction: boolean;

  // API endpoints
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  // Supabase
  supabase: {
    url: string;
    anonKey: string;
  };

  // Feature flags
  features: {
    enableDevTools: boolean;
    enableMockData: boolean;
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
  };

  // Pilot-specific
  pilot: {
    projectId: string;
    developerId: string;
    enabledFeatures: string[];
  };

  // Security
  security: {
    enableCSRF: boolean;
    enableRateLimit: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number; // seconds
  };

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
  };

  // Analytics
  analytics: {
    enabled: boolean;
    trackingId?: string;
    sampleRate: number; // 0-100
  };

  // External services
  services: {
    // Payment gateway
    payment: {
      provider: 'sandbox' | 'production';
      apiKey?: string;
    };
    // SMS/WhatsApp
    messaging: {
      provider: 'mock' | 'twilio' | 'whatsapp_business';
      enabled: boolean;
    };
    // Document processing
    documents: {
      maxSizeMB: number;
      allowedTypes: string[];
    };
  };
}

// =============================================================================
// ENVIRONMENT CONFIGURATIONS
// =============================================================================

const developmentConfig: EnvironmentConfig = {
  env: 'development',
  name: 'Development',
  isProduction: false,

  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key',
  },

  features: {
    enableDevTools: true,
    enableMockData: true,
    enableAnalytics: false,
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
  },

  pilot: {
    projectId: 'snang_pilot_dev',
    developerId: 'snang_developer_dev',
    enabledFeatures: [
      'cr008_doc_first_flow',
      'cr007a_unit_inventory',
      's5_partner_incentives',
      's5_agent_visibility',
      'milestone_resequence',
      'safe_language_guard',
    ],
  },

  security: {
    enableCSRF: false,
    enableRateLimit: false,
    rateLimitRequests: 1000,
    rateLimitWindow: 60,
  },

  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },

  analytics: {
    enabled: false,
    sampleRate: 100,
  },

  services: {
    payment: {
      provider: 'sandbox',
    },
    messaging: {
      provider: 'mock',
      enabled: false,
    },
    documents: {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },
  },
};

const stagingConfig: EnvironmentConfig = {
  env: 'staging',
  name: 'Staging',
  isProduction: false,

  api: {
    baseUrl: 'https://staging.snang.my/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  features: {
    enableDevTools: true,
    enableMockData: false,
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
  },

  pilot: {
    projectId: 'snang_pilot_staging',
    developerId: 'snang_developer_staging',
    enabledFeatures: [
      'cr008_doc_first_flow',
      'cr007a_unit_inventory',
      's5_partner_incentives',
      's5_agent_visibility',
      'milestone_resequence',
      'safe_language_guard',
    ],
  },

  security: {
    enableCSRF: true,
    enableRateLimit: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
  },

  logging: {
    level: 'info',
    enableConsole: true,
    enableRemote: true,
    remoteEndpoint: 'https://logs.snang.my/staging',
  },

  analytics: {
    enabled: true,
    trackingId: process.env.NEXT_PUBLIC_ANALYTICS_ID_STAGING,
    sampleRate: 100,
  },

  services: {
    payment: {
      provider: 'sandbox',
    },
    messaging: {
      provider: 'twilio',
      enabled: true,
    },
    documents: {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },
  },
};

const pilotConfig: EnvironmentConfig = {
  env: 'pilot',
  name: 'Pilot (snang.my)',
  isProduction: true, // Pilot is production-grade

  api: {
    baseUrl: 'https://pilot.snang.my/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  features: {
    enableDevTools: false,
    enableMockData: false,
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
  },

  pilot: {
    projectId: 'snang_pilot',
    developerId: 'snang_developer',
    enabledFeatures: [
      'cr008_doc_first_flow',
      'cr007a_unit_inventory',
      's5_partner_incentives',
      's5_agent_visibility',
      'milestone_resequence',
      'safe_language_guard',
    ],
  },

  security: {
    enableCSRF: true,
    enableRateLimit: true,
    rateLimitRequests: 60,
    rateLimitWindow: 60,
  },

  logging: {
    level: 'info',
    enableConsole: false,
    enableRemote: true,
    remoteEndpoint: 'https://logs.snang.my/pilot',
  },

  analytics: {
    enabled: true,
    trackingId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    sampleRate: 100,
  },

  services: {
    payment: {
      provider: 'production',
      apiKey: process.env.PAYMENT_API_KEY,
    },
    messaging: {
      provider: 'whatsapp_business',
      enabled: true,
    },
    documents: {
      maxSizeMB: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },
  },
};

const productionConfig: EnvironmentConfig = {
  ...pilotConfig,
  env: 'production',
  name: 'Production',

  api: {
    baseUrl: 'https://app.snang.my/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  logging: {
    level: 'warn',
    enableConsole: false,
    enableRemote: true,
    remoteEndpoint: 'https://logs.snang.my/production',
  },
};

// =============================================================================
// CONFIGURATION GETTER
// =============================================================================

function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return 'production';
    case 'pilot':
      return 'pilot';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
}

function getConfig(): EnvironmentConfig {
  const env = getEnvironment();

  switch (env) {
    case 'production':
      return productionConfig;
    case 'pilot':
      return pilotConfig;
    case 'staging':
      return stagingConfig;
    default:
      return developmentConfig;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const config = getConfig();
export const currentEnv = getEnvironment();

// Helper functions
export const isDevelopment = () => config.env === 'development';
export const isStaging = () => config.env === 'staging';
export const isPilot = () => config.env === 'pilot';
export const isProduction = () => config.env === 'production';
export const isProductionGrade = () => config.isProduction;

// Feature flag helper
export const isFeatureEnabled = (featureId: string): boolean => {
  return config.pilot.enabledFeatures.includes(featureId);
};

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables for production
  if (config.isProduction) {
    if (!config.supabase.url) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
    }
    if (!config.supabase.anonKey) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    }
    if (config.analytics.enabled && !config.analytics.trackingId) {
      errors.push('Analytics tracking ID is required when analytics is enabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// DEBUG OUTPUT (development only)
// =============================================================================

if (config.features.enableDevTools) {
  console.log('[Environment]', {
    env: config.env,
    name: config.name,
    apiBaseUrl: config.api.baseUrl,
    enabledFeatures: config.pilot.enabledFeatures,
  });
}
