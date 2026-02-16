'use client';

import { useState, ReactNode } from "react";
import { PipelineFunnel, DEFAULT_STAGES } from '@/components/listing/PipelineFunnel';

// ─── Types ───
interface Brand {
  name: string; logo: string; primary: string; accent: string; slug: string;
}

interface Project {
  nama: string; bandar: string; negeri: string; harga: string; unit: string;
  kes: number; aktif: number; slug: string; score: number; dijual: number;
  conversion: string; source: string; listerKey: string; totalCopies: number; isNew: boolean;
}

// ─── Lister brand registry (developers + REAs) ───
const BRANDS: Record<string, Brand> = {
  ecoworld: { name: "EcoWorld Development Bhd", logo: "🏢", primary: "#0D9488", accent: "#F59E0B", slug: "ecoworld" },
  meridian: { name: "Meridian Corp Bhd", logo: "🏗️", primary: "#1D4ED8", accent: "#7C3AED", slug: "meridian" },
};

// ─── Shared Components ───
const Badge = ({ children, color = "teal" }: { children: ReactNode; color?: string }) => {
  const s = {
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s[color as keyof typeof s] || s.teal}`}>{children}</span>;
};

const MetricCard = ({ icon, value, label, accent, sub, small }: { icon: string; value: string | number; label: string; accent?: boolean; sub?: string; small?: boolean }) => (
  <div className={`bg-white rounded-xl border border-slate-200 ${small ? "p-3" : "p-4"} flex flex-col`}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-slate-400 text-sm">{icon}</span>
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
    <span className={`${small ? "text-xl" : "text-2xl"} font-bold ${accent ? "text-teal-600" : "text-slate-800"}`}>{value}</span>
    {sub && <span className="text-xs text-slate-400 mt-0.5">{sub}</span>}
  </div>
);

const ProgressBar = ({ value, max, color = "bg-teal-500", height = "h-2" }: { value: number; max: number; color?: string; height?: string }) => (
  <div className={`w-full bg-slate-100 rounded-full ${height} overflow-hidden`}>
    <div className={`${color} ${height} rounded-full transition-all duration-700`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
);

const TabBar = ({ tabs, active, onChange }: { tabs: { id: string; icon?: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void }) => (
  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${active === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
        {t.icon && <span className="mr-1.5">{t.icon}</span>}{t.label}
        {t.count !== undefined && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${active === t.id ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}>{t.count}</span>}
      </button>
    ))}
  </div>
);

const CopyBtn = ({ label = "Copy" }: { label?: string }) => {
  const [ok, setOk] = useState(false);
  return <button onClick={() => { setOk(true); setTimeout(() => setOk(false), 2000); }}
    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${ok ? "bg-emerald-500 text-white" : "bg-teal-600 text-white hover:bg-teal-700"}`}>
    {ok ? "✓ Copied!" : `📋 ${label}`}
  </button>;
};

const EmptyState = ({ icon, title, description, action, onAction }: { icon: string; title: string; description: string; action?: string; onAction?: () => void }) => (
  <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">{description}</p>
    {action && <button onClick={onAction} className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">{action}</button>}
  </div>
);

// ─── Lister Context Bar (developer or REA) ───
const ListerContextBar = ({ lister, projectCount, onBack }: { lister: Brand; projectCount: number; onBack: () => void }) => (
  <div className="flex items-center gap-3 mb-1">
    <button onClick={onBack} className="text-slate-400 hover:text-teal-600 transition text-sm">← Dashboard</button>
    <span className="text-slate-300">|</span>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center text-sm">{lister.logo}</div>
      <span className="text-sm text-slate-700 font-medium">{lister.name}</span>
      <span className="text-xs text-slate-400">· {projectCount} projects</span>
    </div>
  </div>
);

// ─── Project Row (Level 1) ───
const ProjectRow = ({ project: p, onSelect, onKit }: { project: Project; onSelect: (p: Project) => void; onKit: (p: Project) => void }) => (
  <div className="group flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-teal-50/40 transition-all cursor-pointer border border-transparent hover:border-teal-100"
    onClick={() => onSelect(p)}>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-slate-800 truncate">{p.nama}</h3>
        {p.score < 80 && <Badge color="orange">{p.score}% complete</Badge>}
        {p.score >= 80 && <Badge color="green">✓ Complete</Badge>}
        {p.source === "url" && <Badge color="blue">🔗 URL Assist</Badge>}
        {p.source === "pdf" && <Badge color="purple">📄 PDF Assist</Badge>}
        {p.isNew && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span>}
      </div>
      <p className="text-sm text-slate-500">{p.bandar}, {p.negeri} · From RM {Number(p.harga).toLocaleString()}</p>
    </div>
    <div className="flex items-center gap-4 text-right">
      <div className="min-w-16">
        <span className="text-lg font-bold text-slate-800">{p.kes}</span>
        <span className="text-xs text-slate-400 ml-1">cases</span>
        {p.aktif > 0 && <span className="text-xs text-teal-600 font-medium ml-2">{p.aktif} active</span>}
      </div>
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => p.score >= 40 && onKit(p)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition opacity-0 group-hover:opacity-100 ${
            p.score < 40
              ? "border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
              : "border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100"
          }`}>
          {p.score < 40 ? "🔒 Kit" : "📦 Kit"}
        </button>
        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">
          🔗 Generate Link
        </button>
      </div>
    </div>
  </div>
);

// ─── Level 2: Project Hero (brand teal gradient) ───
const ProjectHero = ({ project: p, lister, onBack, onSwitchTab }: { project: Project; lister: Brand; onBack: () => void; onSwitchTab: (tab: string) => void }) => (
  <div>
    <ListerContextBar lister={lister} projectCount={2} onBack={onBack} />
    <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 rounded-2xl p-6 text-white relative overflow-hidden mt-2">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(20,184,166,0.4), transparent 50%), radial-gradient(circle at 20% 80%, rgba(245,158,11,0.15), transparent 50%)" }} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-teal-300 text-xs font-medium uppercase tracking-widest">PROJECT</p>
              {p.source === "url" && <span className="text-xs bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-500/30">via URL Assist</span>}
              {p.source === "pdf" && <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/30">via PDF Assist</span>}
            </div>
            <h1 className="text-2xl font-bold mb-1">{p.nama}</h1>
            <p className="text-teal-300/70 text-sm">{p.bandar}, {p.negeri}</p>
          </div>
          <div className="text-right">
            <p className="text-teal-300 text-xs font-medium uppercase tracking-widest mb-1">TOTAL UNITS</p>
            <p className="text-4xl font-bold">{p.unit || "—"}</p>
          </div>
        </div>
        <div className="flex gap-8 mt-5 pt-4 border-t border-teal-700/50 items-end">
          <div>
            <p className="text-xs text-teal-400/60">Units Sold</p>
            <p className="text-xl font-bold text-amber-400">{p.dijual || 0}</p>
          </div>
          <div>
            <p className="text-xs text-teal-400/60">In Progress</p>
            <p className="text-xl font-bold text-teal-300">{p.kes}</p>
          </div>
          <div>
            <p className="text-xs text-teal-400/60">Conversion</p>
            <p className="text-xl font-bold text-emerald-300">{p.conversion || "—"}</p>
          </div>
          {p.score < 80 && (
            <div className="ml-4 flex-1">
              <p className="text-xs text-amber-300 mb-1">Project profile: {p.score}% complete</p>
              <div className="bg-teal-700/50 rounded-full h-1.5 w-full max-w-48">
                <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${p.score}%` }} />
              </div>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={() => onSwitchTab("marketing")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                p.score < 40
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : p.score < 80
                    ? "bg-amber-500 hover:bg-amber-400 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-white"
              }`}
              disabled={p.score < 40}>
              {p.score < 40 ? "🔒 Marketing Kit" : "📦 Marketing Kit"}
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-500 border border-teal-500/50 transition">🔗 Generate Link</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Tab: Pipeline ───
const PipelineTab = ({ project: p }: { project: Project }) => {
  if (p.kes === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard icon="👥" label="Applications" value="0" />
          <MetricCard icon="✅" label="Completed" value="0" />
          <MetricCard icon="⏳" label="In Progress" value="0" />
          <MetricCard icon="📊" label="Conversion" value="—" />
        </div>
        <EmptyState icon="📋" title="No applications yet"
          description="This project hasn't received any LPPSA applications. Use the Marketing Kit to generate and share tracked links with buyers."
          action="📦 Open Marketing Kit" />
      </div>
    );
  }

  // Map actual case counts onto brand-aligned default stages
  const stageCounts = [0, 1, 1, 2, 1, 0];
  const pipelineStages = DEFAULT_STAGES.map((s, i) => ({
    ...s,
    count: stageCounts[i],
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard icon="👥" label="Active Applications" value={p.kes} accent />
        <MetricCard icon="✅" label="Completed" value="0" />
        <MetricCard icon="⏳" label="In Progress" value={p.aktif} accent />
        <MetricCard icon="📊" label="Conversion" value={p.conversion || "0%"} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Pipeline Status</h3>
          <PipelineFunnel stages={pipelineStages} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Performance Metrics</h3>
          <div className="space-y-3">
            {[
              { label: "Avg. Processing Time", val: "45 days", pct: 50, color: "bg-teal-500" },
              { label: "TAC Success Rate", val: "92%", pct: 92, color: "bg-emerald-500" },
              { label: "Document Completion", val: "78%", pct: 78, color: "bg-red-400" },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">{m.label}</span><span className="font-semibold text-slate-800">{m.val}</span></div>
                <ProgressBar value={m.pct} max={100} color={m.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Pipeline Value</p>
          <p className="text-2xl font-bold text-slate-800">RM {((p.kes || 0) * Number(p.harga || 0)).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Avg. Case Value</p>
          <p className="text-lg font-semibold text-slate-600">RM {Number(p.harga || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Marketing ───
const MarketingTab = ({ project: p, lister }: { project: Project; lister: Brand }) => {
  const [subTab, setSubTab] = useState("content");
  const shortBase = `snang.my/r/${p.slug.split("-")[0]}`;
  const hasCopies = p.totalCopies > 0;

  // ─── Score gating tiers (PRD Section 5.2) ───
  const scoreTier = p.score < 40 ? "locked" : p.score < 80 ? "limited" : "full";

  // Score field checklist for locked/limited states
  const scoreFields = [
    { label: "Project name", filled: !!p.nama, points: 10 },
    { label: "City / area", filled: !!p.bandar, points: 10 },
    { label: "State", filled: !!p.negeri, points: 5 },
    { label: "Starting price", filled: Number(p.harga) > 0, points: 15 },
    { label: "Property type", filled: true, points: 5 },
    { label: "Total units", filled: Number(p.unit) > 0, points: 10 },
    { label: "Description", filled: p.score >= 60, points: 10 },
    { label: "Project images (up to 3)", filled: p.score >= 70, points: 15 },
    { label: "Company logo", filled: !!lister.logo, points: 10 },
    { label: "Website", filled: false, points: 5 },
    { label: "Floor plan", filled: false, points: 5 },
  ];
  const missingFields = scoreFields.filter(f => !f.filled);

  if (scoreTier === "locked") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard icon="📦" label="Templates" value="0" />
          <MetricCard icon="📝" label="Flyers" value="0" />
          <MetricCard icon="💬" label="Messages" value="0" />
          <MetricCard icon="📊" label="Analytics" value="—" />
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="font-bold text-red-700 text-lg mb-2">Marketing Kit Locked</h3>
          <p className="text-sm text-red-600 mb-4">
            Complete your project details to unlock the Marketing Kit. Minimum required: project name, location, and price.
          </p>

          {/* Score progress */}
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Profile completeness</span>
              <span className="text-sm font-bold text-red-500">{p.score}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3">
              <div className="bg-red-400 h-2.5 rounded-full transition-all" style={{ width: `${p.score}%` }} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Missing fields</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
            <div className="space-y-1.5">
              {missingFields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center">
                    <span className="text-xs text-slate-300">—</span>
                  </div>
                  <span className="text-sm text-slate-600 flex-1">{f.label}</span>
                  <span className="text-xs text-slate-400">+{f.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-red-300" />
            <span>Below 40%</span>
            <span className="mx-1">→</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>40% unlocks limited kit</span>
            <span className="mx-1">→</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>80% unlocks full kit</span>
          </div>
        </div>
      </div>
    );
  }

  const caseLabel = p.kes === 0
    ? `Penjawat awam? Semak kelayakan LPPSA anda dalam 5 minit.`
    : p.kes < 5
      ? `Beberapa pembeli telah mula proses LPPSA untuk projek ini.`
      : `${p.kes} pembeli sedang proses LPPSA untuk projek ini.`;

  const waTemplates = [
    { label: "For Buyers", tag: "wa_buyer", short: `${shortBase}-wa1`,
      body: `${p.nama}, ${p.bandar} — dari RM ${Number(p.harga).toLocaleString()}.\n\n${caseLabel}\n\n👉 ${shortBase}-wa1\n\nAnggaran sahaja. Tertakluk kepada LPPSA.` },
    { label: "For Agents", tag: "wa_agent", short: `${shortBase}-wa2`,
      body: `Penjawat awam area ${p.bandar} — ${p.nama} buka unit baru.\n\nHantar link ni kepada pembeli:\n👉 ${shortBase}-wa2\n\nAnggaran sahaja. Tertakluk kepada LPPSA.` },
    { label: "For Sales Team", tag: "wa_sales", short: `${shortBase}-wa3`,
      body: `${p.kes > 0 ? `Update: ${p.kes} pembeli sedang proses LPPSA untuk ${p.nama}.` : `${p.nama} — mula kumpul pembeli LPPSA.`}\n\n👉 ${shortBase}-wa3\n\nAnggaran sahaja. Tertakluk kepada LPPSA.` },
  ];

  const sources = hasCopies ? [
    { label: "WhatsApp (Buyer)", tag: "wa_buyer", copies: 7, opens: 18, unique: 12, prescan: 8, consent: 3, color: "bg-teal-500" },
    { label: "WhatsApp (Agent)", tag: "wa_agent", copies: 4, opens: 9, unique: 6, prescan: 4, consent: 2, color: "bg-emerald-500" },
    { label: "Social Media", tag: "social_*", copies: 3, opens: 6, unique: 4, prescan: 1, consent: 0, color: "bg-blue-500" },
    { label: "QR Flyer", tag: "qr_flyer", copies: 1, opens: 3, unique: 2, prescan: 1, consent: 1, color: "bg-purple-500" },
    { label: "Direct Link", tag: "direct", copies: 0, opens: 3, unique: 3, prescan: 2, consent: 1, color: "bg-slate-400" },
  ] : [];

  const totalOpens = sources.reduce((s, x) => s + x.opens, 0);
  const totalUnique = sources.reduce((s, x) => s + x.unique, 0);

  return (
    <div className="space-y-4">
      {/* ─── Amber warning banner: score 40-79% (limited tier) ─── */}
      {scoreTier === "limited" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Limited Marketing Kit — project profile {p.score}% complete</p>
            <p className="text-xs text-amber-600 mt-0.5">Some content may appear generic. Complete your project profile for better templates with social proof and branded visuals.</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-32 bg-amber-200 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${((p.score - 40) / 40) * 100}%` }} />
              </div>
              <span className="text-xs text-amber-500 font-medium">{80 - p.score} pts to full access</span>
            </div>
            {missingFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {missingFields.slice(0, 4).map((f, i) => (
                  <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    + {f.label} ({f.points}pts)
                  </span>
                ))}
                {missingFields.length > 4 && (
                  <span className="text-xs text-amber-500">+{missingFields.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { id: "content", label: "📦 Content", desc: scoreTier === "limited" ? "Limited templates" : "Templates & flyers" },
          { id: "analytics", label: "📊 Analytics", desc: "Source performance" },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex-1 rounded-xl border-2 p-3 text-left transition-all ${subTab === t.id ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <span className="text-sm font-semibold text-slate-800">{t.label}</span>
            <p className="text-xs text-slate-500">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* ─── CONTENT ─── */}
      {subTab === "content" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "💬", title: "WhatsApp", desc: scoreTier === "limited" ? "Price & location templates" : "3 message templates", available: true },
              { emoji: "📱", title: "Social Media", desc: scoreTier === "limited" ? "Unlock at 80%" : "5 ready captions", available: scoreTier === "full" },
              { emoji: "🖨️", title: "QR Flyer", desc: scoreTier === "limited" ? "Basic (no logo)" : "A4 print-ready", available: true },
            ].map((c, i) => (
              <div key={i} className={`rounded-xl border p-4 transition ${
                c.available
                  ? "bg-white border-slate-200 hover:border-teal-200 cursor-pointer group"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{c.emoji}</span>
                  {!c.available && <span className="text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">🔒 80%</span>}
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">{c.title}</h4>
                <p className="text-xs text-slate-500">{c.desc}</p>
                {c.available && <p className="text-xs text-teal-600 font-medium mt-1 opacity-0 group-hover:opacity-100 transition">Open →</p>}
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">{scoreTier === "limited" ? "⚠️" : "📊"}</span>
            <p className="text-xs text-slate-500">
              {scoreTier === "limited" && <span className="text-amber-600 font-medium">Limited mode · </span>}
              Templates auto-adapt: <span className="font-medium text-slate-700">{p.kes} active cases</span>
              {p.kes === 0 && " → using price + location templates"}
              {p.kes > 0 && p.kes <= 5 && " → using light social proof templates"}
              {p.kes > 5 && " → using full social proof templates"}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700 text-sm">WhatsApp Templates</span>
                {p.kes === 0 && <span className="text-xs text-slate-400">Awaiting LPPSA cases</span>}
              </div>
              <div className="space-y-2">
                {waTemplates.map((t, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{t.label}</span>
                      <span className="text-xs text-slate-400 font-mono">{t.short}</span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{t.body}</p>
                    <div className="flex gap-2">
                      <CopyBtn label="Copy" />
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">👁 Preview</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {scoreTier === "full" && (
              <div>
                <span className="font-semibold text-slate-700 text-sm">Social Media Captions</span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { emoji: "📸", title: "Instagram", captions: 5 },
                    { emoji: "𝕏", title: "X / Twitter", captions: 3 },
                    { emoji: "f", title: "Facebook", captions: 4 },
                    { emoji: "📌", title: "TikTok", captions: 2 },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <h4 className="font-semibold text-slate-800 text-sm">{s.title}</h4>
                      <p className="text-xs text-slate-500">{s.captions} captions</p>
                      <p className="text-xs text-teal-600 font-medium mt-1">Open →</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="font-semibold text-slate-700 text-sm block mb-2">QR Flyer (A4)</span>
              <div className="flex gap-4 justify-between mb-3">
                <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700">🖨️ Print</button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">📄 PDF</button>
              </div>
              <div className="rounded-xl overflow-hidden max-w-xs mx-auto" style={{ border: `2px solid ${lister.primary}20` }}>
                <div className="p-6 text-center" style={{ background: scoreTier === "full" && lister.logo ? `linear-gradient(135deg, ${lister.primary}, ${lister.primary}dd)` : `linear-gradient(135deg, #0D9488, #0D9488dd)` }}>
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Penjawat Awam?</p>
                  <p className="text-white font-bold text-lg mb-1">Semak Kelayakan LPPSA</p>
                  <p className="text-white/70 text-xs mb-4">dalam 5 minit · tanpa borang</p>
                  <div className="bg-white rounded-lg p-3 mx-auto w-20 h-20 flex items-center justify-center mb-2"><span className="text-2xl">📱</span></div>
                  <p className="text-white/50 text-xs">Imbas kod QR</p>
                </div>
                <div className="bg-white p-4 text-center">
                  {scoreTier === "full" && lister.logo ? (
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">{lister.logo}</span>
                      <span className="text-xs text-slate-400">{lister.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold">S</div>
                      <span className="text-xs text-slate-300">Upload logo for branded flyer</span>
                    </div>
                  )}
                  <h4 className="font-bold text-slate-800">{p.nama}</h4>
                  <p className="text-slate-500 text-sm">{p.bandar}, {p.negeri}</p>
                  <p className="font-bold text-lg mt-1" style={{ color: lister.primary }}>Dari RM {Number(p.harga).toLocaleString()}</p>
                  <p className="text-xs text-teal-500 font-mono mt-1">{shortBase}-qr1</p>
                </div>
                <div className="bg-slate-50 px-3 py-2 text-center">
                  <p className="text-xs text-slate-400">Anggaran sahaja. Tertakluk kepada LPPSA.</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: lister.primary }}>snang.my</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ANALYTICS (empty) ─── */}
      {subTab === "analytics" && !hasCopies && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            <MetricCard icon="📋" label="Copied" value="0" small />
            <MetricCard icon="🔗" label="Opened" value="0" small />
            <MetricCard icon="👤" label="Unique" value="0" small />
            <MetricCard icon="📝" label="PreScan" value="0" small />
            <MetricCard icon="✅" label="Consent" value="0" small />
          </div>
          <EmptyState icon="📊" title="No analytics data yet"
            description="Copy your first template from the Content tab to start tracking performance. Every copy, click, and PreScan will appear here."
            action="← Open Content" onAction={() => setSubTab("content")} />
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 opacity-50">
            <h3 className="font-semibold text-slate-700 text-sm mb-2">Preview: What you'll see</h3>
            <div className="space-y-2">
              {["Content conversion funnel → copied → opened → unique visitors → PreScan → consent",
                "Source breakdown → performance per content type (WhatsApp vs Social vs QR)",
                "Device split → mobile vs desktop visitor breakdown",
                "Top content → ranking of best-performing templates"
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ANALYTICS (with data) ─── */}
      {subTab === "analytics" && hasCopies && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            <MetricCard icon="📋" label="Copied" value={sources.reduce((s, x) => s + x.copies, 0)} small />
            <MetricCard icon="🔗" label="Opened" value={totalOpens} small />
            <MetricCard icon="👤" label="Unique" value={totalUnique} small />
            <MetricCard icon="📝" label="PreScan" value={sources.reduce((s, x) => s + x.prescan, 0)} small />
            <MetricCard icon="✅" label="Consent" value={sources.reduce((s, x) => s + x.consent, 0)} small />
          </div>

          <div className="space-y-3">
            {sources.map((src, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${src.color}`} />
                  <span className="text-sm font-medium text-slate-800 flex-1">{src.label}</span>
                  <span className="text-xs text-slate-500">{src.tag}</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: "Copied", val: src.copies },
                    { label: "Opened", val: src.opens },
                    { label: "Unique", val: src.unique },
                    { label: "PreScan", val: src.prescan },
                    { label: "Consent", val: src.consent },
                  ].map((d, j) => (
                    <div key={j}>
                      <p className="text-lg font-bold text-slate-800">{d.val}</p>
                      <p className="text-xs text-slate-500">{d.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Activity ───
const ActivityTab = ({ project: p }: { project: Project }) => (
  <div className="space-y-3">
    {[
      { id: "QTK-2026-00005", status: "Document Submitted", date: "14 Feb 2026, 14:32", src: "wa_buyer" },
      { id: "QTK-2026-00004", status: "TAC Cleared", date: "13 Feb 2026, 09:15", src: "wa_agent" },
      { id: "QTK-2026-00003", status: "Document Review Started", date: "12 Feb 2026, 16:45", src: "social" },
      { id: "QTK-2026-00002", status: "Application Received", date: "11 Feb 2026, 11:20", src: "qr_flyer" },
      { id: "QTK-2026-00001", status: "Initial Screening", date: "10 Feb 2026, 08:00", src: "wa_buyer" },
    ].map(e => (
      <div key={e.id} className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="font-semibold text-slate-800">{e.id}</span>
          <Badge color="teal">{e.src}</Badge>
        </div>
        <p className="text-sm text-slate-600 mb-1">{e.status}</p>
        <p className="text-xs text-slate-400">{e.date}</p>
      </div>
    ))}
  </div>
);

export default function ListingPage() {
  const [level, setLevel] = useState("overview");
  const [selected, setSelected] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");

  const projects = [
    { nama: "Residensi Harmoni", bandar: "Shah Alam", negeri: "Selangor", harga: "350000", unit: "250", kes: 5, aktif: 5, slug: "residensi-harmoni", score: 82, dijual: 180, conversion: "0%", source: "url", listerKey: "ecoworld", totalCopies: 15, isNew: false },
    { nama: "Meridian Heights", bandar: "Shah Alam", negeri: "Selangor", harga: "380000", unit: "180", kes: 0, aktif: 0, slug: "meridian-heights", score: 42, dijual: 0, conversion: "—", source: "pdf", listerKey: "meridian", totalCopies: 0, isNew: true },
  ];

  const totals = { kes: projects.reduce((s, p) => s + p.kes, 0), aktif: projects.reduce((s, p) => s + p.aktif, 0), pipeline: projects.reduce((s, p) => s + p.kes * Number(p.harga), 0) };

  const open = (p: Project) => { setSelected(p); setLevel("detail"); setActiveTab("pipeline"); };
  const back = () => { setLevel("overview"); setSelected(null); };
  const lister: Brand = selected ? (BRANDS[selected.listerKey] || BRANDS.ecoworld) : BRANDS.ecoworld;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — portal switcher stays BM */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-teal-600 font-bold text-lg tracking-tight">Snang.my</span>
            <Badge color="teal">LPPSA</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Portal roles stay in BM per Section 7.4 */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-teal-600 text-white">Listing</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500">Pembeli</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500">Ejen</button>
            </div>
            <Badge color="orange">DEMO BUILD</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* ═══ LEVEL 1 ═══ */}
        {level === "overview" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Property Listing</h1>
              <p className="text-sm text-slate-500">Project summary and LPPSA application overview</p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-teal-600 text-sm">👁</span>
              <p className="text-sm text-teal-700">This portal shows aggregate data only. Individual buyer details are not disclosed.</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard icon="📄" label="Total Cases" value={totals.kes} />
              <MetricCard icon="⏳" label="Active Cases" value={totals.aktif} accent />
              <MetricCard icon="💰" label="Pipeline Value" value={`RM ${totals.pipeline.toLocaleString()}`} />
              <MetricCard icon="📊" label="Conversion Rate" value="0%" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800">Property Projects</h2>
                  <span className="text-sm text-slate-400">{projects.length} projects</span>
                </div>
                <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">+ Add Project</button>
              </div>
              <div className="divide-y divide-slate-50">
                {projects.map((p, i) => (
                  <ProjectRow key={i} project={p} onSelect={open} onKit={(p) => { open(p); setTimeout(() => setActiveTab("marketing"), 50); }} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Recent Activity</h3>
              </div>
              {[
                { id: "QTK-2026-00005", p: "Residensi Harmoni", d: "14 Feb", s: "New", src: "wa_buyer" },
                { id: "QTK-2026-00004", p: "Residensi Harmoni", d: "14 Feb", s: "New", src: "wa_agent" },
                { id: "QTK-2026-00003", p: "Residensi Harmoni", d: "13 Feb", s: "New", src: "social" },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-xs text-slate-400">📄</div>
                  <div className="flex-1"><span className="text-sm text-slate-700">{e.id}</span><span className="text-xs text-slate-400 ml-2">{e.p} · {e.d}</span></div>
                  {e.src !== "direct" && <Badge color="teal">{e.src}</Badge>}
                  <Badge color="amber">{e.s}</Badge>
                </div>
              ))}
            </div>
            {/* Disclaimer stays BM — regulatory */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-sm text-orange-700">⚠ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.</p>
            </div>
          </div>
        )}

        {/* ═══ LEVEL 2 ═══ */}
        {level === "detail" && selected && (
          <div className="space-y-5">
            <ProjectHero project={selected} lister={lister} onBack={back} onSwitchTab={setActiveTab} />
            <TabBar
              tabs={[
                { id: "pipeline", icon: "📊", label: "Pipeline", count: selected.kes },
                { id: "marketing", icon: selected.score < 40 ? "🔒" : "📦", label: selected.score < 40 ? "Marketing (Locked)" : selected.score < 80 ? "Marketing ⚠" : "Marketing" },
                { id: "activity", icon: "📋", label: "Activity", count: selected.kes > 0 ? 5 : 0 },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
            {activeTab === "pipeline" && <PipelineTab project={selected} />}
            {activeTab === "marketing" && <MarketingTab project={selected} lister={lister} />}
            {activeTab === "activity" && <ActivityTab project={selected} />}
            {/* Privacy footer stays BM — regulatory */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-amber-600">🔒</span>
              <p className="text-sm text-amber-700">Portal ini hanya memaparkan data agregat projek. Butiran kes individu diuruskan oleh ejen bertauliah.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
