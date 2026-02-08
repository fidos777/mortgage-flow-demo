// app/admin/page.tsx
// P3-1: Telemetry Metrics Dashboard (MVP)
// P3-4: Feature Flags Admin Panel
'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Users, FileText,
  Link2, CheckCircle, AlertTriangle, RefreshCw, Settings
} from 'lucide-react';
import { getTelemetryService, TelemetryEvent, TelemetryEventType } from '@/lib/services/telemetry-service';
import { FeatureFlagsPanel } from '@/components/FeatureFlagsPanel';

export default function AdminMetricsPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [counts, setCounts] = useState<Partial<Record<TelemetryEventType, number>>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const service = getTelemetryService();
    const allEvents = await service.getEvents({ limit: 100 });
    const eventCounts = await service.getEventCounts();
    setEvents(allEvents);
    setCounts(eventCounts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Funnel metrics
  const funnelSteps = [
    { key: 'LINK_CREATED', label: 'Link Created', icon: Link2, color: 'bg-snang-teal-600' },
    { key: 'CONSENT_GIVEN', label: 'Consent Given', icon: CheckCircle, color: 'bg-green-500' },
    { key: 'DOC_UPLOADED', label: 'Doc Uploaded', icon: FileText, color: 'bg-purple-500' },
    { key: 'READINESS_CALCULATED', label: 'Readiness Calculated', icon: TrendingUp, color: 'bg-snang-teal-600' },
    { key: 'SUBMISSION_ATTESTED', label: 'Submission Attested', icon: Users, color: 'bg-emerald-500' },
  ] as const;

  const totalEvents = Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-snang-teal-500" />
            <div>
              <h1 className="text-xl font-bold">Telemetry Dashboard</h1>
              <p className="text-sm text-slate-400">MVP Metrics | Pilot Data</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Events</p>
            <p className="text-3xl font-bold text-slate-800">{totalEvents}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Unique Cases</p>
            <p className="text-3xl font-bold text-slate-800">
              {new Set(events.filter(e => e.caseId).map(e => e.caseId)).size}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Submissions</p>
            <p className="text-3xl font-bold text-emerald-600">
              {counts.SUBMISSION_ATTESTED || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Query Signals</p>
            <p className="text-3xl font-bold text-amber-600">
              {counts.QUERY_SIGNALS_DETECTED || 0}
            </p>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-snang-teal-600" />
            Conversion Funnel
          </h2>

          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const count = counts[step.key] || 0;
              const maxCount = Math.max(...funnelSteps.map(s => counts[s.key] || 0), 1);
              const percentage = (count / maxCount) * 100;
              const Icon = step.icon;

              return (
                <div key={step.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{step.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{count}</span>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${step.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {index < funnelSteps.length - 1 && (
                    <div className="text-center py-1">
                      <span className="text-xs text-slate-400">↓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* By Event Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Events by Type</h2>
            <div className="space-y-2">
              {Object.entries(counts)
                .sort(([, a], [, b]) => (b || 0) - (a || 0))
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">{type}</span>
                    <span className="text-sm font-medium text-slate-800">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Recent Events</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.slice(0, 20).map(event => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{event.eventType}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString('ms-MY')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">
                    {event.role}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No events recorded yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Feature Flags Section */}
        <div className="mb-8">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-snang-teal-600" />
            System Configuration
          </h2>
          <FeatureFlagsPanel />
        </div>

        {/* Data Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 inline mr-2" />
          <span className="text-sm text-amber-700">
            Demo Mode: Data stored in browser localStorage. Connect Supabase for persistent storage.
          </span>
        </div>
      </div>
    </div>
  );
}
