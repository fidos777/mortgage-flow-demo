/**
 * PTE Dashboard - Proof-Time Execution
 * 
 * Main dashboard for viewing audit trails, verifying integrity,
 * and exporting proof records.
 * 
 * Part of Sprint 4: PTE Module
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePTEStore } from '../../store/pteStore';
import type {
  PTEProofEntry,
  PTEAuditResult,
  PTEFilter,
  PTEProofType,
  PTEActor,
  PTE_PROOF_TYPE_LABELS,
  PTE_ACTOR_LABELS,
  PTE_CLASSIFICATION_COLORS,
} from '../../types/pte';

// ============================================================================
// TAB TYPES
// ============================================================================

type TabType = 'overview' | 'audit-trail' | 'integrity' | 'export';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PTEDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const {
    entries,
    audits,
    metrics,
    isLoading,
    error,
    selectedExecution,
    filter,
    fetchMetrics,
    setFilter,
    clearFilter,
    setSelectedExecution,
    verifyIntegrity,
    exportEntries,
  } = usePTEStore();

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'audit-trail', label: 'Audit Trail', icon: '📜' },
    { id: 'integrity', label: 'Integrity', icon: '🔒' },
    { id: 'export', label: 'Export', icon: '📤' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                PTE Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Proof-Time Execution — Audit Trail & Integrity Verification
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {entries.length} proofs • {audits.length} audits
              </span>
              <button
                onClick={() => fetchMetrics()}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? '⏳' : '🔄'} Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 -mb-px'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">⚠️ {error}</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab metrics={metrics} entries={entries} audits={audits} />
        )}
        {activeTab === 'audit-trail' && (
          <AuditTrailTab
            entries={entries}
            filter={filter}
            setFilter={setFilter}
            clearFilter={clearFilter}
            selectedExecution={selectedExecution}
            setSelectedExecution={setSelectedExecution}
          />
        )}
        {activeTab === 'integrity' && (
          <IntegrityTab
            audits={audits}
            verifyIntegrity={verifyIntegrity}
            entries={entries}
          />
        )}
        {activeTab === 'export' && (
          <ExportTab
            filter={filter}
            setFilter={setFilter}
            exportEntries={exportEntries}
            entries={entries}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

interface OverviewTabProps {
  metrics: any;
  entries: PTEProofEntry[];
  audits: PTEAuditResult[];
}

function OverviewTab({ metrics, entries, audits }: OverviewTabProps) {
  const statCards = [
    {
      label: 'Total Proofs',
      value: metrics?.total_proofs || entries.length,
      icon: '📜',
      color: 'blue',
    },
    {
      label: 'Total Audits',
      value: metrics?.total_executions || audits.length,
      icon: '✅',
      color: 'green',
    },
    {
      label: 'Governance Score',
      value: `${metrics?.avg_governance_score || 0}%`,
      icon: '🏛️',
      color: 'purple',
    },
    {
      label: 'Integrity Rate',
      value: `${metrics?.integrity_rate || 100}%`,
      icon: '🔒',
      color: 'emerald',
    },
    {
      label: 'Breach Count',
      value: metrics?.breach_count || 0,
      icon: '⚠️',
      color: metrics?.breach_count > 0 ? 'red' : 'gray',
    },
    {
      label: 'Human Approval',
      value: `${metrics?.human_approval_rate || 0}%`,
      icon: '👤',
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold text-${stat.color}-600`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Proofs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📜 Recent Proofs
          </h3>
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {getProofTypeIcon(entry.type)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.actor} • {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
                {entry.classification && (
                  <span
                    className="px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: `${PTE_CLASSIFICATION_COLORS[entry.classification.type]}20`,
                      color: PTE_CLASSIFICATION_COLORS[entry.classification.type],
                    }}
                  >
                    Type {entry.classification.type}
                  </span>
                )}
              </div>
            ))}
            {entries.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No proofs recorded yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Audits */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ Recent Audits
          </h3>
          <div className="space-y-3">
            {audits.slice(0, 5).map((audit) => (
              <div
                key={audit.execution_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {audit.execution_id.slice(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {audit.summary.total_entries} entries •{' '}
                    {audit.summary.total_duration_ms}ms
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      audit.governance_score >= 80
                        ? 'text-green-600'
                        : audit.governance_score >= 60
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {audit.governance_score}%
                  </span>
                  <span className="text-lg">
                    {audit.integrity.valid ? '🔒' : '⚠️'}
                  </span>
                </div>
              </div>
            ))}
            {audits.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No audits completed yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Breach Alert */}
      {metrics?.recent_breaches && metrics.recent_breaches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            ⚠️ Recent Breaches
          </h3>
          <div className="space-y-2">
            {metrics.recent_breaches.slice(0, 3).map((breach: PTEProofEntry) => (
              <div
                key={breach.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100"
              >
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {breach.action}
                  </p>
                  <p className="text-xs text-red-600">
                    {formatTime(breach.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AUDIT TRAIL TAB
// ============================================================================

interface AuditTrailTabProps {
  entries: PTEProofEntry[];
  filter: PTEFilter;
  setFilter: (filter: Partial<PTEFilter>) => void;
  clearFilter: () => void;
  selectedExecution: string | null;
  setSelectedExecution: (id: string | null) => void;
}

function AuditTrailTab({
  entries,
  filter,
  setFilter,
  clearFilter,
  selectedExecution,
  setSelectedExecution,
}: AuditTrailTabProps) {
  const [typeFilter, setTypeFilter] = useState<PTEProofType | 'all'>('all');
  const [actorFilter, setActorFilter] = useState<PTEActor | 'all'>('all');

  const filteredEntries = entries.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (actorFilter !== 'all' && e.actor !== actorFilter) return false;
    if (selectedExecution && e.execution_id !== selectedExecution) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PTEProofType | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="decision">Decision</option>
              <option value="classification">Classification</option>
              <option value="escalation">Escalation</option>
              <option value="breach">Breach</option>
              <option value="human_confirm">Human Confirm</option>
              <option value="ai_action">AI Action</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Actor</label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value as PTEActor | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Actors</option>
              <option value="human">Human</option>
              <option value="ai">AI</option>
              <option value="system">System</option>
            </select>
          </div>

          {selectedExecution && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Execution:</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                {selectedExecution.slice(0, 15)}...
              </span>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setTypeFilter('all');
              setActorFilter('all');
              setSelectedExecution(null);
            }}
            className="ml-auto px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Entry List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.slice(0, 50).map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    entry.execution_id && setSelectedExecution(entry.execution_id)
                  }
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span>{getProofTypeIcon(entry.type)}</span>
                      <span className="text-sm text-gray-900">{entry.type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {entry.action}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        entry.actor === 'human'
                          ? 'bg-blue-50 text-blue-600'
                          : entry.actor === 'ai'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {entry.actor}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatTime(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                    {entry.hash?.slice(0, 12) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEntries.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No proof entries match the current filters
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INTEGRITY TAB
// ============================================================================

interface IntegrityTabProps {
  audits: PTEAuditResult[];
  verifyIntegrity: (executionId: string) => Promise<any>;
  entries: PTEProofEntry[];
}

function IntegrityTab({ audits, verifyIntegrity, entries }: IntegrityTabProps) {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const handleVerify = async (executionId: string) => {
    setVerifying(executionId);
    try {
      const result = await verifyIntegrity(executionId);
      setResults((prev) => ({ ...prev, [executionId]: result }));
    } finally {
      setVerifying(null);
    }
  };

  // Get unique execution IDs
  const executionIds = [...new Set(entries.map((e) => e.execution_id).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔒 Chain Integrity Verification
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Verify that proof chains have not been tampered with. Each proof entry is
          linked to the previous via cryptographic hash.
        </p>

        <div className="space-y-3">
          {executionIds.slice(0, 10).map((executionId) => {
            const result = results[executionId];
            return (
              <div
                key={executionId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {executionId}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entries.filter((e) => e.execution_id === executionId).length}{' '}
                    entries
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {result && (
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                        result.valid
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {result.valid ? '✅ Valid' : '⚠️ Invalid'}
                      <span className="text-xs">
                        ({result.entries_verified} verified)
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => handleVerify(executionId)}
                    disabled={verifying === executionId}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    {verifying === executionId ? '⏳ Verifying...' : '🔍 Verify'}
                  </button>
                </div>
              </div>
            );
          })}
          {executionIds.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No executions to verify
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT TAB
// ============================================================================

interface ExportTabProps {
  filter: PTEFilter;
  setFilter: (filter: Partial<PTEFilter>) => void;
  exportEntries: (filter: PTEFilter, options: any) => Promise<string>;
  entries: PTEProofEntry[];
}

function ExportTab({ filter, setFilter, exportEntries, entries }: ExportTabProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeHash, setIncludeHash] = useState(true);
  const [includeContext, setIncludeContext] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportEntries(filter, {
        format,
        include_hash: includeHash,
        include_context: includeContext,
        include_metadata: false,
      });
      setPreview(result);

      // Trigger download
      const blob = new Blob([result], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pte_audit_export_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📤 Export Audit Data
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormat('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    format === 'json'
                      ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    format === 'csv'
                      ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include Fields
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeHash}
                    onChange={(e) => setIncludeHash(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Hash values</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeContext}
                    onChange={(e) => setIncludeContext(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Full context</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                {entries.length} entries will be exported
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting || entries.length === 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? '⏳ Exporting...' : '📥 Download Export'}
            </button>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="h-64 bg-gray-900 rounded-lg p-4 overflow-auto">
              <pre className="text-xs text-green-400 font-mono">
                {preview || '// Export preview will appear here'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getProofTypeIcon(type: PTEProofType): string {
  const icons: Record<PTEProofType, string> = {
    decision: '⚡',
    classification: '🏷️',
    escalation: '📈',
    breach: '⚠️',
    human_confirm: '👤',
    ai_action: '🤖',
    system_event: '⚙️',
  };
  return icons[type] || '📄';
}

function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '—';
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString('en-MY', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Constants re-export for type safety
const PTE_CLASSIFICATION_COLORS_LOCAL: Record<string, string> = {
  A: '#10b981',
  B: '#f59e0b',
  C: '#ef4444',
  Z: '#8b5cf6',
};
