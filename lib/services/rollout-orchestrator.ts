/**
 * Rollout Orchestrator
 * S6.1: Rollout Orchestrator | PRD v3.6.3
 *
 * Manages feature rollout and pilot coordination for snang.my.
 * Controls feature flags, A/B tests, and staged deployments.
 */

// =============================================================================
// TYPES
// =============================================================================

export type RolloutStage = 'DEV' | 'STAGING' | 'PILOT' | 'SOFT_LAUNCH' | 'GA';
export type FeatureStatus = 'DISABLED' | 'DEV_ONLY' | 'INTERNAL' | 'PILOT' | 'ENABLED';
export type RolloutStrategy = 'INSTANT' | 'PERCENTAGE' | 'WHITELIST' | 'GRADUAL';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  descriptionBm?: string;
  status: FeatureStatus;
  strategy: RolloutStrategy;

  // Percentage rollout (0-100)
  percentage?: number;

  // Whitelist rollout
  whitelistedDevelopers?: string[];
  whitelistedProjects?: string[];
  whitelistedUsers?: string[];

  // Gradual rollout
  gradualConfig?: {
    startPercentage: number;
    endPercentage: number;
    incrementPercentage: number;
    incrementIntervalHours: number;
    currentPercentage: number;
    startedAt?: string;
    nextIncrementAt?: string;
  };

  // Metadata
  owner: string;
  createdAt: string;
  updatedAt: string;
  enabledAt?: string;
  disabledAt?: string;

  // Dependencies
  dependsOn?: string[]; // Other feature flags that must be enabled

  // Kill switch
  killSwitchTriggered: boolean;
  killSwitchReason?: string;
  killSwitchAt?: string;
}

export interface RolloutPhase {
  id: string;
  name: string;
  stage: RolloutStage;
  startDate: string;
  endDate?: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ABORTED';
  features: string[]; // Feature flag IDs
  targetAudience: {
    developers?: string[];
    projects?: string[];
    userPercentage?: number;
  };
  successCriteria: {
    metric: string;
    target: number;
    current?: number;
  }[];
  issues: RolloutIssue[];
}

export interface RolloutIssue {
  id: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  title: string;
  description: string;
  featureId?: string;
  reportedAt: string;
  reportedBy: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX';
  resolvedAt?: string;
}

// =============================================================================
// SNANG.MY PILOT FEATURE FLAGS
// =============================================================================

export const SNANG_PILOT_FEATURES: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>[] = [
  // CR-008: Doc-First Buyer Flow
  {
    id: 'cr008_doc_first_flow',
    name: 'CR-008: Doc-First Buyer Flow',
    description: 'New 4-step buyer journey (PDPA → Upload → Confirm → Temujanji)',
    descriptionBm: 'Perjalanan pembeli 4 langkah baharu (PDPA → Muat Naik → Sahkan → Temujanji)',
    status: 'PILOT',
    strategy: 'WHITELIST',
    whitelistedProjects: ['snang_pilot'],
    owner: 'product',
    killSwitchTriggered: false,
  },

  // CR-007A: Unit Inventory
  {
    id: 'cr007a_unit_inventory',
    name: 'CR-007A: Unit Inventory',
    description: 'Property unit selection and status tracking',
    descriptionBm: 'Pemilihan unit hartanah dan penjejakan status',
    status: 'PILOT',
    strategy: 'WHITELIST',
    whitelistedProjects: ['snang_pilot'],
    owner: 'product',
    killSwitchTriggered: false,
    dependsOn: ['cr008_doc_first_flow'],
  },

  // S5: Partner Incentive Engine
  {
    id: 's5_partner_incentives',
    name: 'S5: Partner Incentive Engine',
    description: 'Campaign rewards for buyers, referrers, and lawyers',
    descriptionBm: 'Ganjaran kempen untuk pembeli, perujuk, dan peguam',
    status: 'PILOT',
    strategy: 'WHITELIST',
    whitelistedDevelopers: ['snang_developer'],
    owner: 'product',
    killSwitchTriggered: false,
  },

  // S5.4: Agent Campaign Visibility
  {
    id: 's5_agent_visibility',
    name: 'S5.4: Agent Campaign Visibility',
    description: 'Read-only campaign view for agents',
    descriptionBm: 'Paparan kempen baca-sahaja untuk ejen',
    status: 'PILOT',
    strategy: 'WHITELIST',
    whitelistedProjects: ['snang_pilot'],
    owner: 'product',
    killSwitchTriggered: false,
    dependsOn: ['s5_partner_incentives'],
  },

  // Milestone Resequence
  {
    id: 'milestone_resequence',
    name: 'Milestone Resequence',
    description: 'KJ moved to #3, Serahan to #4',
    descriptionBm: 'KJ dialih ke #3, Serahan ke #4',
    status: 'ENABLED',
    strategy: 'INSTANT',
    owner: 'product',
    killSwitchTriggered: false,
  },

  // Safe Language Guard
  {
    id: 'safe_language_guard',
    name: 'Safe Language Guard',
    description: 'Blocks forbidden commission terminology',
    descriptionBm: 'Menyekat istilah komisen terlarang',
    status: 'ENABLED',
    strategy: 'INSTANT',
    owner: 'compliance',
    killSwitchTriggered: false,
  },
];

// =============================================================================
// ROLLOUT ORCHESTRATOR CLASS
// =============================================================================

export class RolloutOrchestrator {
  private features: Map<string, FeatureFlag> = new Map();
  private phases: Map<string, RolloutPhase> = new Map();

  constructor() {
    this.initializeFeatures();
  }

  private initializeFeatures(): void {
    const now = new Date().toISOString();
    for (const feature of SNANG_PILOT_FEATURES) {
      this.features.set(feature.id, {
        ...feature,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // FEATURE FLAG OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Check if a feature is enabled for a given context
   */
  isFeatureEnabled(
    featureId: string,
    context: {
      developerId?: string;
      projectId?: string;
      userId?: string;
    }
  ): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    // Kill switch check
    if (feature.killSwitchTriggered) return false;

    // Check dependencies
    if (feature.dependsOn) {
      for (const depId of feature.dependsOn) {
        if (!this.isFeatureEnabled(depId, context)) {
          return false;
        }
      }
    }

    // Status-based check
    switch (feature.status) {
      case 'DISABLED':
        return false;

      case 'DEV_ONLY':
        return process.env.NODE_ENV === 'development';

      case 'INTERNAL':
        // Internal users only (would check user role)
        return false;

      case 'ENABLED':
        return true;

      case 'PILOT':
        return this.checkPilotAccess(feature, context);

      default:
        return false;
    }
  }

  private checkPilotAccess(
    feature: FeatureFlag,
    context: {
      developerId?: string;
      projectId?: string;
      userId?: string;
    }
  ): boolean {
    switch (feature.strategy) {
      case 'INSTANT':
        return true;

      case 'WHITELIST':
        if (context.developerId && feature.whitelistedDevelopers?.includes(context.developerId)) {
          return true;
        }
        if (context.projectId && feature.whitelistedProjects?.includes(context.projectId)) {
          return true;
        }
        if (context.userId && feature.whitelistedUsers?.includes(context.userId)) {
          return true;
        }
        return false;

      case 'PERCENTAGE':
        if (!context.userId || feature.percentage === undefined) return false;
        // Deterministic hash-based percentage check
        const hash = this.hashString(context.userId + feature.id);
        return (hash % 100) < feature.percentage;

      case 'GRADUAL':
        if (!feature.gradualConfig || !context.userId) return false;
        const gradualHash = this.hashString(context.userId + feature.id);
        return (gradualHash % 100) < feature.gradualConfig.currentPercentage;

      default:
        return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get all features for a context
   */
  getEnabledFeatures(context: {
    developerId?: string;
    projectId?: string;
    userId?: string;
  }): string[] {
    const enabled: string[] = [];
    Array.from(this.features.keys()).forEach(featureId => {
      if (this.isFeatureEnabled(featureId, context)) {
        enabled.push(featureId);
      }
    });
    return enabled;
  }

  /**
   * Get feature flag details
   */
  getFeature(featureId: string): FeatureFlag | undefined {
    return this.features.get(featureId);
  }

  /**
   * List all features
   */
  listFeatures(): FeatureFlag[] {
    return Array.from(this.features.values());
  }

  // ---------------------------------------------------------------------------
  // FEATURE FLAG MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Enable a feature
   */
  enableFeature(featureId: string, updatedBy: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    feature.status = 'ENABLED';
    feature.enabledAt = new Date().toISOString();
    feature.updatedAt = new Date().toISOString();

    console.log(`[RolloutOrchestrator] Feature ${featureId} enabled by ${updatedBy}`);
    return true;
  }

  /**
   * Disable a feature
   */
  disableFeature(featureId: string, updatedBy: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    feature.status = 'DISABLED';
    feature.disabledAt = new Date().toISOString();
    feature.updatedAt = new Date().toISOString();

    console.log(`[RolloutOrchestrator] Feature ${featureId} disabled by ${updatedBy}`);
    return true;
  }

  /**
   * Trigger kill switch for a feature
   */
  triggerKillSwitch(featureId: string, reason: string, triggeredBy: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    feature.killSwitchTriggered = true;
    feature.killSwitchReason = reason;
    feature.killSwitchAt = new Date().toISOString();
    feature.updatedAt = new Date().toISOString();

    console.log(`[RolloutOrchestrator] KILL SWITCH triggered for ${featureId} by ${triggeredBy}: ${reason}`);

    // Would also: send alerts, log to monitoring, notify stakeholders
    return true;
  }

  /**
   * Reset kill switch
   */
  resetKillSwitch(featureId: string, resetBy: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    feature.killSwitchTriggered = false;
    feature.killSwitchReason = undefined;
    feature.killSwitchAt = undefined;
    feature.updatedAt = new Date().toISOString();

    console.log(`[RolloutOrchestrator] Kill switch reset for ${featureId} by ${resetBy}`);
    return true;
  }

  /**
   * Update percentage rollout
   */
  setRolloutPercentage(featureId: string, percentage: number, updatedBy: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    if (percentage < 0 || percentage > 100) {
      console.error(`[RolloutOrchestrator] Invalid percentage: ${percentage}`);
      return false;
    }

    feature.percentage = percentage;
    feature.strategy = 'PERCENTAGE';
    feature.status = 'PILOT';
    feature.updatedAt = new Date().toISOString();

    console.log(`[RolloutOrchestrator] Feature ${featureId} set to ${percentage}% by ${updatedBy}`);
    return true;
  }

  /**
   * Add to whitelist
   */
  addToWhitelist(
    featureId: string,
    type: 'developer' | 'project' | 'user',
    id: string,
    updatedBy: string
  ): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    switch (type) {
      case 'developer':
        feature.whitelistedDevelopers = feature.whitelistedDevelopers || [];
        if (!feature.whitelistedDevelopers.includes(id)) {
          feature.whitelistedDevelopers.push(id);
        }
        break;
      case 'project':
        feature.whitelistedProjects = feature.whitelistedProjects || [];
        if (!feature.whitelistedProjects.includes(id)) {
          feature.whitelistedProjects.push(id);
        }
        break;
      case 'user':
        feature.whitelistedUsers = feature.whitelistedUsers || [];
        if (!feature.whitelistedUsers.includes(id)) {
          feature.whitelistedUsers.push(id);
        }
        break;
    }

    feature.strategy = 'WHITELIST';
    feature.status = 'PILOT';
    feature.updatedAt = new Date().toISOString();

    console.log(`[RolloutOrchestrator] Added ${type} ${id} to whitelist for ${featureId} by ${updatedBy}`);
    return true;
  }

  // ---------------------------------------------------------------------------
  // ROLLOUT PHASE MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Create a rollout phase
   */
  createPhase(phase: Omit<RolloutPhase, 'issues'>): RolloutPhase {
    const fullPhase: RolloutPhase = {
      ...phase,
      issues: [],
    };
    this.phases.set(phase.id, fullPhase);
    return fullPhase;
  }

  /**
   * Get current active phase
   */
  getCurrentPhase(): RolloutPhase | undefined {
    const phases = Array.from(this.phases.values());
    return phases.find(phase => phase.status === 'ACTIVE');
  }

  /**
   * Report an issue in rollout
   */
  reportIssue(phaseId: string, issue: Omit<RolloutIssue, 'id'>): RolloutIssue | null {
    const phase = this.phases.get(phaseId);
    if (!phase) return null;

    const fullIssue: RolloutIssue = {
      ...issue,
      id: `issue_${Date.now()}`,
    };

    phase.issues.push(fullIssue);

    // Auto-trigger kill switch for P0 issues
    if (issue.severity === 'P0' && issue.featureId) {
      this.triggerKillSwitch(issue.featureId, `P0 issue: ${issue.title}`, 'SYSTEM');
    }

    console.log(`[RolloutOrchestrator] Issue reported: ${issue.severity} - ${issue.title}`);
    return fullIssue;
  }

  // ---------------------------------------------------------------------------
  // SNANG PILOT SPECIFIC
  // ---------------------------------------------------------------------------

  /**
   * Get snang pilot status
   */
  getSnangPilotStatus(): {
    phase: string;
    enabledFeatures: string[];
    blockedFeatures: string[];
    issues: RolloutIssue[];
  } {
    const context = { projectId: 'snang_pilot', developerId: 'snang_developer' };
    const enabledFeatures = this.getEnabledFeatures(context);
    const blockedFeatures = SNANG_PILOT_FEATURES
      .map(f => f.id)
      .filter(id => !enabledFeatures.includes(id));

    const currentPhase = this.getCurrentPhase();
    const issues = currentPhase?.issues.filter(i => i.status === 'OPEN') || [];

    return {
      phase: currentPhase?.stage || 'PILOT',
      enabledFeatures,
      blockedFeatures,
      issues,
    };
  }

  /**
   * Check if snang pilot is healthy
   */
  isSnangPilotHealthy(): boolean {
    const status = this.getSnangPilotStatus();
    const hasP0Issues = status.issues.some(i => i.severity === 'P0');
    const hasCriticalFeatures = status.enabledFeatures.includes('cr008_doc_first_flow');
    return !hasP0Issues && hasCriticalFeatures;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const rolloutOrchestrator = new RolloutOrchestrator();

// =============================================================================
// REACT HOOK (for client components)
// =============================================================================

/**
 * Hook to check feature flags in React components
 * Usage: const isEnabled = useFeatureFlag('cr008_doc_first_flow', { projectId: 'snang' });
 */
export function useFeatureFlag(
  featureId: string,
  context: { developerId?: string; projectId?: string; userId?: string }
): boolean {
  // In real implementation, this would use React state and context
  return rolloutOrchestrator.isFeatureEnabled(featureId, context);
}
