import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Zap, Check, Circle, ArrowRight, Copy, Download, AlertTriangle,
  Activity, Database, Server, Cloud, Search, FileText, MessageSquare,
  TrendingUp, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "CauseAI — Incident Workspace" },
      { name: "description", content: "Incident workspace with cascade tracing, blast radius, and post-mortems." },
    ],
  }),
  component: AppPage,
});

type Severity = "P0" | "P1" | "P2";

const incidents: { name: string; time: string; severity: Severity; preview: string }[] = [
  { name: "Redis OOM Cascade", time: "2 min ago", severity: "P0", preview: "Cache tier OOM kill triggered downstream timeouts across checkout..." },
  { name: "Stripe Webhook Lag", time: "47 min ago", severity: "P1", preview: "Webhook processing backlog peaked at 14k events with 8s p95..." },
  { name: "Disk Usage Warning", time: "3 hr ago", severity: "P2", preview: "Log volume on node-7 reached 82% — log rotation lag detected..." },
];

const sevStyles: Record<Severity, string> = {
  P0: "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/60",
  P1: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/60",
  P2: "bg-[#D8CFBC]/20 text-[#D8CFBC] border-[#D8CFBC]/60",
};

const agentSteps = [
  "Parse Logs",
  "Correlate Services",
  "Trace Deploys",
  "Compute Blast",
  "Generate Report",
];

function AppPage() {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"trend" | "postmortem" | "ask">("postmortem");

  return (
    <div className="relative min-h-screen bg-[#11120D] text-[#FFFBF4] overflow-hidden">
      {/* GLOBAL BG TEXTURES (match landing) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(86,84,73,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(216,207,188,0.06),transparent_60%)]" />
        <div className="absolute inset-0 grid-lines opacity-50" />
        <div className="absolute inset-0 dot-grid opacity-80" />
        <div className="absolute inset-0 grain mix-blend-soft-light opacity-90" />
        <div className="absolute inset-0 noise mix-blend-overlay opacity-60" />
        <div className="absolute inset-0 scanlines opacity-40" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] teal-orb opacity-70" />
        <div className="absolute top-[80vh] -left-40 w-[600px] h-[600px] teal-orb opacity-40" />
        <div className="absolute top-[140vh] -right-40 w-[700px] h-[700px] teal-orb opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5))]" />
      </div>
      <div className="relative z-10 flex min-h-screen w-full">
      {/* SIDEBAR */}
      <aside className="w-64 shrink-0 bg-[#11120D]/70 backdrop-blur-md border-r border-[#565449]/30 fixed inset-y-0 left-0 flex flex-col z-20">
        <div className="px-5 py-5">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D8CFBC]" fill="currentColor" />
            <span className="font-bold text-[#FFFBF4]">CauseAI</span>
          </Link>
          <p className="mt-1 text-xs text-[#D8CFBC]/40 font-mono">incident workspace</p>
        </div>
        <div className="h-px bg-[#565449]/40 mx-5" />

        <div className="px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#565449] mb-3">Incident History</p>
          <div className="space-y-1 -mx-2">
            {incidents.map((inc, i) => {
              const active = i === selected;
              return (
                <button
                  key={inc.name}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left relative px-3 py-3 rounded-md transition-colors ${
                    active ? "bg-[#1D1E17]" : "hover:bg-[#1D1E17]/50"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#565449] rounded-r" />
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#FFFBF4] truncate">{inc.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${sevStyles[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] text-[#D8CFBC]/40 font-mono">{inc.time}</span>
                  </div>
                  <p className="text-xs text-[#D8CFBC]/40 line-clamp-2 leading-snug">{inc.preview}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-5 border-t border-[#565449]/30">
          <div className="flex items-center gap-2 text-xs text-[#D8CFBC]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="font-mono">agent.online</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          {/* TOP BAR */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#FFFBF4]">{incidents[selected].name}</h1>
              <p className="text-xs text-[#D8CFBC]/40 font-mono mt-1">Analyzed {incidents[selected].time}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-[#D8CFBC]/60">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <span className="font-mono">Agent Ready</span>
              </div>
              <button className="px-3 py-1.5 rounded-md text-sm text-[#D8CFBC]/70 hover:text-[#FFFBF4] hover:bg-[#1D1E17] transition-colors">
                Analyze New Incident
              </button>
            </div>
          </div>

          {/* AGENT STEPS */}
          <div className="rounded-lg bg-[#1D1E17] border border-[#565449]/30 p-4">
            <div className="flex items-center gap-2">
              {agentSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-5 h-5 rounded-full bg-[#10b981]/20 border border-[#10b981] flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#10b981]" />
                    </div>
                    <span className="text-xs font-mono text-[#D8CFBC]/80">{step}</span>
                  </div>
                  {i < agentSteps.length - 1 && (
                    <div className="flex-1 h-px bg-[#565449]/60" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ROOT CAUSE */}
          <div className="relative rounded-lg bg-[#1D1E17] border border-[#565449]/40 border-l-4 border-l-[#ef4444] overflow-hidden shadow-[inset_8px_0_24px_-12px_rgba(239,68,68,0.5)]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <div className="w-[500px] h-[300px] teal-orb" />
            </div>
            <div className="relative p-7 flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded border bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/60">P0</span>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#565449]">Root Cause</span>
                </div>
                <h2 className="text-2xl font-bold text-[#FFFBF4] leading-tight">
                  Redis primary node exhausted memory at 14:32 UTC, triggering OOM kill and a 4-minute failover cascade across the cache tier.
                </h2>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-[#565449]/40 border border-[#565449] text-[#D8CFBC] font-mono text-xs">
                    svc:cache-primary-01
                  </span>
                  <span className="text-xs text-[#D8CFBC]/50">
                    Impact: ~$24k revenue exposure · 4m12s checkout downtime
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <ConfidenceArc value={94} />
              </div>
            </div>
          </div>

          {/* TWO COLS */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-lg bg-[#1D1E17] border border-[#565449]/40 p-6">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#565449] mb-4">Blast Radius</p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-4xl font-bold text-[#FFFBF4] font-mono">12</p>
                  <p className="text-xs text-[#D8CFBC]/50 mt-1">services affected</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#FFFBF4] font-mono">847k</p>
                  <p className="text-xs text-[#D8CFBC]/50 mt-1">requests dropped</p>
                </div>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#565449] mb-2">Endpoints</p>
              <div className="flex flex-wrap gap-2">
                {["POST /checkout", "GET /cart", "POST /session", "GET /products/:id"].map((e) => (
                  <span key={e} className="px-2 py-1 rounded-md bg-[#11120D] border border-[#565449] text-[#D8CFBC] font-mono text-xs">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-[#1D1E17] border border-[#565449]/40 p-6">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#565449] mb-4">Cascade Chain</p>
              <div className="space-y-3">
                {[
                  { name: "cache-primary-01", status: "OOM Killed", errors: "1 fatal", color: "#ef4444", Icon: Database },
                  { name: "session-store", status: "Timeout", errors: "12k errors", color: "#f59e0b", Icon: Server },
                  { name: "checkout-api", status: "Degraded", errors: "847k 503s", color: "#f59e0b", Icon: Cloud },
                  { name: "edge-gateway", status: "Healthy", errors: "0 errors", color: "#10b981", Icon: Activity },
                ].map((s, i, arr) => (
                  <div key={s.name}>
                    <div
                      className="flex items-center gap-3 p-3 rounded-md bg-[#11120D] border-l-2"
                      style={{ borderLeftColor: s.color }}
                    >
                      <s.Icon className="w-4 h-4 text-[#D8CFBC]/60" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-[#FFFBF4] truncate">{s.name}</p>
                        <p className="text-[11px] font-mono text-[#D8CFBC]/40">
                          {s.status} · {s.errors}
                        </p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ChevronRight className="w-4 h-4 text-[#565449] rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="rounded-lg bg-[#1D1E17] border border-[#565449]/40 p-6">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#565449] mb-5">Incident Timeline</p>
            <div className="relative pl-8">
              <div className="absolute left-3 top-1 bottom-1 w-px bg-[#565449]/40" />
              {[
                { t: "14:32:04", svc: "cache-primary-01", event: "Memory usage crossed 95% threshold", Icon: AlertTriangle, color: "#f59e0b" },
                { t: "14:32:17", svc: "cache-primary-01", event: "Kernel OOM killer terminated redis-server", Icon: AlertTriangle, color: "#ef4444" },
                { t: "14:32:19", svc: "session-store", event: "First wave of GET timeouts observed", Icon: Activity, color: "#f59e0b" },
                { t: "14:33:02", svc: "checkout-api", event: "503 responses began propagating to clients", Icon: Activity, color: "#ef4444" },
                { t: "14:35:41", svc: "cache-primary-02", event: "Failover replica promoted to primary", Icon: Server, color: "#D8CFBC" },
                { t: "14:36:16", svc: "edge-gateway", event: "Error rate returned to baseline", Icon: Check, color: "#10b981" },
              ].map((e, i) => (
                <div key={i} className="relative pb-5 last:pb-0 flex items-start gap-4">
                  <div
                    className="absolute -left-[26px] w-5 h-5 rounded-full bg-[#1D1E17] border-2 flex items-center justify-center"
                    style={{ borderColor: e.color }}
                  >
                    <e.Icon className="w-2.5 h-2.5" style={{ color: e.color }} />
                  </div>
                  <span className="text-xs font-mono text-[#D8CFBC]/40 w-20 shrink-0 mt-0.5">{e.t}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#565449]/40 border border-[#565449] text-[#D8CFBC] font-mono text-[11px] shrink-0">
                    {e.svc}
                  </span>
                  <span className="text-sm text-[#FFFBF4]">{e.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FIXES */}
          <div className="grid lg:grid-cols-2 gap-6">
            <FixPanel
              accent="#ef4444"
              title="Immediate Fix"
              steps={[
                "Bump cache-primary-01 memory limit from 8GB to 16GB and restart pod.",
                "Failover traffic to cache-primary-02 until primary stabilizes.",
                "Throttle checkout-api requests to 60% capacity for 30 minutes.",
              ]}
            />
            <FixPanel
              accent="#10b981"
              title="Permanent Fix"
              steps={[
                "Migrate session keys with TTL>24h off Redis onto the persistent tier.",
                "Add automated eviction policy and high-water alerting at 80% memory.",
                "Introduce circuit breaker between checkout-api and cache layer.",
              ]}
            />
          </div>

          {/* TABS */}
          <div className="border-b border-[#565449]/40 flex items-center gap-6">
            {[
              { id: "trend", label: "Trend", Icon: TrendingUp },
              { id: "postmortem", label: "Post-Mortem", Icon: FileText },
              { id: "ask", label: "Ask Agent", Icon: MessageSquare },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`relative flex items-center gap-2 py-3 text-sm transition-colors ${
                    active ? "text-[#FFFBF4]" : "text-[#D8CFBC]/50 hover:text-[#D8CFBC]"
                  }`}
                >
                  <t.Icon className="w-4 h-4" />
                  {t.label}
                  {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#D8CFBC]" />}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}
          {tab === "postmortem" && <PostMortemTab />}
          {tab === "trend" && <TrendTab />}
          {tab === "ask" && <AskTab />}

          <div className="h-8" />
        </div>
      </main>
      </div>
    </div>
  );
}

function ConfidenceArc({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} stroke="#565449" strokeOpacity="0.3" strokeWidth="6" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#D8CFBC"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 6px rgba(212,236,221,0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono text-[#FFFBF4]">{value}</span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#D8CFBC]/50">% confidence</span>
      </div>
    </div>
  );
}

function FixPanel({ accent, title, steps }: { accent: string; title: string; steps: string[] }) {
  return (
    <div
      className="rounded-lg bg-[#1D1E17] border border-[#565449]/40 border-l-4 p-6"
      style={{ borderLeftColor: accent }}
    >
      <p className="text-[11px] font-mono uppercase tracking-widest text-[#565449] mb-4">{title}</p>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-[#D8CFBC]/80">
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold"
              style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}66` }}
            >
              {i + 1}
            </span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PostMortemTab() {
  return (
    <div className="relative rounded-lg bg-[#11120D] border border-[#565449]/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#565449]/30">
        <div className="flex items-center gap-2 text-xs font-mono text-[#D8CFBC]/50">
          <FileText className="w-3.5 h-3.5" />
          post-mortem.md
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#D8CFBC]/70 hover:text-[#FFFBF4] hover:bg-[#1D1E17] transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#D8CFBC]/70 hover:text-[#FFFBF4] hover:bg-[#1D1E17] transition-colors">
            <Download className="w-3.5 h-3.5" /> Download .md
          </button>
        </div>
      </div>
      <pre className="p-6 font-mono text-xs leading-relaxed text-[#D8CFBC] whitespace-pre-wrap">
{`# Incident Report: Redis OOM Cascade

**Severity:** P0
**Duration:** 4m 12s
**Detected:** 14:32:17 UTC
**Resolved:** 14:36:16 UTC

## Summary
The primary Redis node (cache-primary-01) exhausted its 8GB memory ceiling,
triggering an OOM kill of the redis-server process. The failover to the
replica took ~3m, during which checkout requests degraded to 503.

## Root Cause
A long-lived session key pattern accumulated without TTL enforcement after
the v2.14.0 deploy on 2026-05-21, causing steady-state memory growth.

## Timeline
- 14:32:04 — memory crosses 95%
- 14:32:17 — OOM kill
- 14:32:19 — session-store timeouts begin
- 14:33:02 — checkout-api returns 503
- 14:35:41 — failover to cache-primary-02
- 14:36:16 — error rate baseline restored

## Impact
- 847,213 dropped requests
- ~$24,000 estimated revenue exposure
- 12 downstream services affected

## Action Items
- [ ] Migrate long-TTL keys to persistent tier (owner: @platform)
- [ ] Add 80% memory alert + auto-eviction policy
- [ ] Circuit breaker between checkout-api and cache layer
- [ ] Post-deploy memory regression check in CI
`}
      </pre>
    </div>
  );
}

function TrendTab() {
  return (
    <div className="rounded-lg bg-[#1D1E17] border border-[#565449]/40 p-6">
      <p className="text-[11px] font-mono uppercase tracking-widest text-[#565449] mb-4">Related Incidents · Last 90 days</p>
      <div className="flex items-end gap-2 h-40">
        {[8, 14, 6, 22, 12, 18, 9, 26, 17, 11, 30, 19].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#565449] to-[#D8CFBC]/70"
              style={{ height: `${(h / 30) * 100}%` }}
            />
            <span className="text-[10px] font-mono text-[#D8CFBC]/40">w{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#D8CFBC]/50 mt-4 font-mono">
        Cache-tier OOM events trending up <span className="text-[#f59e0b]">+34%</span> month-over-month.
      </p>
    </div>
  );
}

function AskTab() {
  return (
    <div className="rounded-lg bg-[#1D1E17] border border-[#565449]/40 p-6 space-y-4">
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[#565449]/40 border border-[#565449] flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#D8CFBC]" />
        </div>
        <div className="flex-1 text-sm text-[#D8CFBC]/80 leading-relaxed">
          I've finished the analysis. Ask anything about this incident — root cause, affected services, or remediation choices.
        </div>
      </div>
      <div className="relative">
        <Search className="w-4 h-4 text-[#565449] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          placeholder="Ask the agent…"
          className="w-full pl-9 pr-4 py-3 rounded-md bg-[#11120D] border border-[#565449]/60 text-sm text-[#FFFBF4] placeholder:text-[#D8CFBC]/30 font-mono focus:outline-none focus:border-[#565449]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {["Why didn't auto-scaling kick in?", "Has this happened before?", "What's the cost of fix #2?"].map((q) => (
          <button key={q} className="px-3 py-1.5 rounded-md bg-[#11120D] border border-[#565449]/60 text-xs text-[#D8CFBC] hover:border-[#565449] transition-colors">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// suppress unused
void Circle;
void ArrowRight;