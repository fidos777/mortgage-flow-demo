'use client';

/**
 * Agent Campaign Visibility Panel
 * S5.4: Agent Visibility Panel | PRD v3.6.3 CR-012
 *
 * Read-only view of active campaigns for agents.
 * Shows campaigns available for their assigned projects.
 *
 * Layer 3 (Partner Incentive) — agents do NOT receive incentives (they use Layer 2 credits).
 * This panel helps agents explain available buyer rewards during consultations.
 */

import { useState, useEffect } from 'react';
import {
  Gift,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
} from 'lucide-react';
import {
  IncentiveCampaign,
  IncentiveRule,
  CampaignStatus,
  RecipientType,
  RewardType,
  CAMPAIGN_STATUS_CONFIG,
  RECIPIENT_CONFIG,
  REWARD_TYPE_CONFIG,
  TRIGGER_CONFIG,
  AllowedTrigger,
  INCENTIVE_DISCLAIMER,
} from '@/lib/types/incentive';
import { getIncentiveService } from '@/lib/services/incentive-service';

// =============================================================================
// PROPS
// =============================================================================

interface AgentCampaignPanelProps {
  projectId?: string;
  developerId?: string;
  locale?: 'bm' | 'en';
  compact?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AgentCampaignPanel({
  projectId,
  developerId,
  locale = 'bm',
  compact = false,
}: AgentCampaignPanelProps) {
  const [campaigns, setCampaigns] = useState<IncentiveCampaign[]>([]);
  const [rules, setRules] = useState<Map<string, IncentiveRule[]>>(new Map());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load campaigns and rules
  useEffect(() => {
    const incentiveService = getIncentiveService();

    // Get active campaigns for project
    const activeCampaigns = projectId
      ? incentiveService.getActiveCampaigns(projectId)
      : incentiveService.getActiveCampaigns();

    // Get rules for each campaign
    const campaignRules = new Map<string, IncentiveRule[]>();
    activeCampaigns.forEach(campaign => {
      const campaignRuleList = incentiveService.getRulesByCampaign(campaign.id, true);
      campaignRules.set(campaign.id, campaignRuleList);
    });

    setCampaigns(activeCampaigns);
    setRules(campaignRules);
    setLoading(false);
  }, [projectId, developerId]);

  // Toggle campaign expansion
  const toggleExpanded = (campaignId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get recipient label
  const getRecipientLabel = (type: RecipientType) => {
    const config = RECIPIENT_CONFIG[type];
    return locale === 'bm' ? config.labelBm : config.labelEn;
  };

  // Get reward type label
  const getRewardLabel = (type: RewardType) => {
    const config = REWARD_TYPE_CONFIG[type];
    return locale === 'bm' ? config.labelBm : config.labelEn;
  };

  // Get trigger label
  const getTriggerLabel = (trigger: AllowedTrigger) => {
    const config = TRIGGER_CONFIG[trigger];
    return locale === 'bm' ? config.labelBm : config.labelEn;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Render empty state
  if (campaigns.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
        <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          {locale === 'bm'
            ? 'Tiada kempen aktif untuk projek ini'
            : 'No active campaigns for this project'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-teal-600" />
          {locale === 'bm' ? 'Ganjaran Kempen' : 'Campaign Rewards'}
        </h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {campaigns.length} {locale === 'bm' ? 'aktif' : 'active'}
        </span>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            {locale === 'bm' ? INCENTIVE_DISCLAIMER.bm : INCENTIVE_DISCLAIMER.en}
          </p>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="space-y-3">
        {campaigns.map(campaign => {
          const campaignRules = rules.get(campaign.id) || [];
          const isExpanded = expanded.has(campaign.id);
          const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
          const budgetPercent = Math.round(
            ((campaign.budgetTotal - campaign.budgetRemaining) / campaign.budgetTotal) * 100
          );

          return (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              {/* Campaign Header */}
              <button
                onClick={() => toggleExpanded(campaign.id)}
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {locale === 'bm' ? campaign.nameBm : campaign.name}
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {locale === 'bm' ? statusConfig.labelBm : statusConfig.labelEn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {locale === 'bm' ? campaign.descriptionBm : campaign.description}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>

                {/* Budget Progress */}
                {!compact && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{locale === 'bm' ? 'Bajet Digunakan' : 'Budget Used'}</span>
                      <span>{budgetPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>

              {/* Expanded Rules */}
              {isExpanded && campaignRules.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-3">
                    {locale === 'bm' ? 'Ganjaran Tersedia' : 'Available Rewards'}
                  </h5>
                  <div className="space-y-2">
                    {campaignRules.map(rule => (
                      <div
                        key={rule.id}
                        className="bg-white rounded-lg p-3 border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-teal-700">
                            {formatCurrency(rule.rewardAmount)}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {getRewardLabel(rule.rewardType)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {getRecipientLabel(rule.recipientType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {getTriggerLabel(rule.trigger)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Campaign Info */}
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">
                        {locale === 'bm' ? 'Bermula' : 'Start'}
                      </span>
                      <span className="text-slate-700">
                        {new Date(campaign.startDate).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {locale === 'bm' ? 'Tamat' : 'End'}
                      </span>
                      <span className="text-slate-700">
                        {campaign.endDate
                          ? new Date(campaign.endDate).toLocaleDateString('ms-MY')
                          : locale === 'bm'
                          ? 'Tiada tarikh tamat'
                          : 'No end date'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {locale === 'bm' ? 'Baki Bajet' : 'Budget Remaining'}
                      </span>
                      <span className="text-slate-700 font-medium">
                        {formatCurrency(campaign.budgetRemaining)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {locale === 'bm' ? 'Had Setiap Kes' : 'Cap Per Case'}
                      </span>
                      <span className="text-slate-700">
                        {campaign.maxAwardsPerCase}x
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Info className="w-3 h-3" />
        <span>
          {locale === 'bm'
            ? 'Gunakan maklumat ini untuk menerangkan ganjaran kepada pembeli.'
            : 'Use this information to explain rewards to buyers.'}
        </span>
      </div>
    </div>
  );
}

export default AgentCampaignPanel;
