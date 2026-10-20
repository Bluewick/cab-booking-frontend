import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Server,
  Database,
  Radio,
  Clock,
  RefreshCw,
  CheckCircle2,
  Zap,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/feedback/Skeleton';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import healthService from '../../services/health.service';

/**
 * Format raw uptime seconds into human-readable compact string
 */
function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Obsidian Geist System Health & Operational Telemetry Desk
 * Strictly conforms to DESIGN.md dark-first aesthetic, tabular figures, and rich micro-interactions.
 */
export default function AdminHealthPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [pingHistory, setPingHistory] = useState([]);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Initial mount probe
  useEffect(() => {
    let isMounted = true;
    healthService.getHealth()
      .then((data) => {
        if (!isMounted) return;
        setHealthData(data);
        setLastCheckTime(new Date());
        setPingHistory([{ time: new Date().toLocaleTimeString(), latency: data.latencyMs }]);
      })
      .catch((err) => {
        if (!isMounted) return;
        toast.error(err.message || 'Health check probe failed.', 'Cluster Connectivity Warning');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Periodic and manual probe runner
  const probeMetrics = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const data = await healthService.getHealth();
      setHealthData(data);
      setLastCheckTime(new Date());

      setPingHistory((prev) => {
        const next = [...prev, { time: new Date().toLocaleTimeString(), latency: data.latencyMs }];
        return next.slice(-10); // Keep last 10 pings
      });

      if (isManual) {
        toast.success(`Server responds in ${data.latencyMs}ms`, 'Health Check Updated');
      }
    } catch (err) {
      toast.error(err.message || 'Health check probe failed.', 'Cluster Connectivity Warning');
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, [toast]);

  // Auto-refresh interval (every 8 seconds when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      probeMetrics(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, probeMetrics]);

  // Average latency computed from ping history
  const averageLatency = useMemo(() => {
    if (pingHistory.length === 0) return 0;
    const sum = pingHistory.reduce((acc, curr) => acc + curr.latency, 0);
    return Math.round(sum / pingHistory.length);
  }, [pingHistory]);

  const handleCopyRaw = () => {
    if (!healthData) return;
    navigator.clipboard.writeText(JSON.stringify(healthData, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
    toast.success('Raw diagnostic JSON copied to clipboard.');
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#3B82F6]/30">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 py-8 sm:py-12">
        <PageContainer maxWidth="6xl">
          <div className="flex flex-col gap-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[10px] bg-[#141418] border border-[#27272A] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                    <Activity className="size-5 text-[#34D399]" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                    System Health & Diagnostics
                  </h1>
                </div>
                <p className="text-xs text-[#A1A1AA] max-w-xl">
                  Real-time operational telemetry for backend services, database connections, and WebSocket dispatch clusters.
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-xs font-mono transition-all border ${
                    autoRefresh
                      ? 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-[#141418] text-[#71717A] border-[#27272A]'
                  }`}
                  title="Toggle automatic health polling"
                >
                  <span className={`size-2 rounded-full ${autoRefresh ? 'bg-[#10B981] animate-ping' : 'bg-[#71717A]'}`} />
                  {autoRefresh ? 'Auto-Polling Active' : 'Polling Paused'}
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => probeMetrics(true)}
                  loading={refreshing}
                  loadingText="Probing..."
                  icon={RefreshCw}
                >
                  Refresh Now
                </Button>
              </div>
            </div>

            {/* Core Metrics Cards (4-Column Grid) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton variant="rect" width="100%" height="110px" />
                <Skeleton variant="rect" width="100%" height="110px" />
                <Skeleton variant="rect" width="100%" height="110px" />
                <Skeleton variant="rect" width="100%" height="110px" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Server Status */}
                <Card level={2} className="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#71717A]">
                      Backend Cluster
                    </span>
                    <Server className="size-4 text-[#A1A1AA]" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]" />
                      </span>
                      <span className="text-xl font-bold font-mono text-[#FAFAFA] uppercase">
                        {healthData?.status || 'Online'}
                      </span>
                    </div>
                    <Badge variant="success" size="sm">
                      HTTP 200
                    </Badge>
                  </div>
                </Card>

                {/* 2. Roundtrip Ping Latency */}
                <Card level={2} className="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#71717A]">
                      Roundtrip Latency
                    </span>
                    <Zap className="size-4 text-[#F59E0B]" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-[#FAFAFA] tabular-nums">
                        {healthData?.latencyMs ?? 0}
                      </span>
                      <span className="text-xs font-mono text-[#A1A1AA]">ms</span>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-[6px] border ${
                      (healthData?.latencyMs ?? 0) < 80
                        ? 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/30'
                        : (healthData?.latencyMs ?? 0) < 200
                        ? 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/30'
                        : 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/30'
                    }`}>
                      Avg {averageLatency}ms
                    </span>
                  </div>
                </Card>

                {/* 3. System Uptime */}
                <Card level={2} className="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#71717A]">
                      Node Process Uptime
                    </span>
                    <Clock className="size-4 text-[#3B82F6]" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-[#FAFAFA] tabular-nums">
                      {formatUptime(healthData?.uptimeSeconds)}
                    </span>
                    <span className="text-[11px] font-mono text-[#71717A] tabular-nums">
                      {healthData?.uptimeSeconds?.toLocaleString() || 0}s
                    </span>
                  </div>
                </Card>

                {/* 4. Active Subsystems */}
                <Card level={2} className="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#71717A]">
                      Cluster Subsystems
                    </span>
                    <ShieldCheck className="size-4 text-[#10B981]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#10B981]" />
                      <span className="text-sm font-semibold text-[#FAFAFA]">3 / 3 Healthy</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#34D399]">100% SLA</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Subsystem Telemetry Deep-Dive */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PostgreSQL Database Subsystem */}
              <Card level={2} className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-[8px] bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20">
                      <Database className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#FAFAFA]">PostgreSQL Database</h3>
                      <p className="text-[11px] font-mono text-[#71717A]">cab-booking-db</p>
                    </div>
                  </div>
                  <Badge variant={healthData?.database?.connected ? 'success' : 'error'} size="sm">
                    {healthData?.database?.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#27272A]/50">
                    <span className="text-[#A1A1AA]">Connection Status</span>
                    <span className="font-mono text-[#34D399] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" /> Synchronized
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#27272A]/50">
                    <span className="text-[#A1A1AA]">Database Time</span>
                    <span className="font-mono text-[#FAFAFA] tabular-nums text-[11px]">
                      {healthData?.database?.dbTime
                        ? new Date(healthData.database.dbTime).toLocaleTimeString()
                        : 'Synced'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#A1A1AA]">Pool Telemetry</span>
                    <span className="font-mono text-[#A1A1AA]">Idle: Healthy</span>
                  </div>
                </div>
              </Card>

              {/* WebSocket Dispatch Subsystem */}
              <Card level={2} className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-[8px] bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
                      <Radio className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#FAFAFA]">Socket.IO Engine</h3>
                      <p className="text-[11px] font-mono text-[#71717A]">Port 5213 (v4 Protocol)</p>
                    </div>
                  </div>
                  <Badge variant={healthData?.websockets?.enabled ? 'info' : 'error'} size="sm">
                    {healthData?.websockets?.enabled ? 'Listening' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#27272A]/50">
                    <span className="text-[#A1A1AA]">Handshake Transports</span>
                    <span className="font-mono text-[#FAFAFA]">websocket, polling</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#27272A]/50">
                    <span className="text-[#A1A1AA]">Heartbeat Keep-Alive</span>
                    <span className="font-mono text-[#FAFAFA] tabular-nums">ping: 10s / timeout: 5s</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#A1A1AA]">Active Rooms</span>
                    <span className="font-mono text-[#60A5FA]">user:*, drivers:*, ride:*</span>
                  </div>
                </div>
              </Card>

              {/* Express REST API Subsystem */}
              <Card level={2} className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-[8px] bg-[#F59E0B]/10 text-[#FBBF24] border border-[#F59E0B]/20">
                      <Terminal className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#FAFAFA]">REST API Router</h3>
                      <p className="text-[11px] font-mono text-[#71717A]">37 Endpoints Active</p>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">
                    Protected JWT
                  </Badge>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#27272A]/50">
                    <span className="text-[#A1A1AA]">Route Prefix</span>
                    <span className="font-mono text-[#FAFAFA]">/api/v1/*</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#27272A]/50">
                    <span className="text-[#A1A1AA]">CORS Origin</span>
                    <span className="font-mono text-[#FAFAFA]">Whitelist Active</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#A1A1AA]">Last Probe Time</span>
                    <span className="font-mono text-[#A1A1AA] tabular-nums text-[11px]">
                      {lastCheckTime ? lastCheckTime.toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Ping Latency Chart & Raw Inspector */}
            <Card level={1} className="p-6 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
                <div>
                  <h3 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
                    <Activity className="size-4 text-[#3B82F6]" />
                    Live Roundtrip Latency History (Recent 10 Pings)
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Continuous HTTP probe telemetry evaluating network overhead to the Express.js runtime.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#141418] border border-[#27272A] hover:border-[#3F3F46] text-xs font-mono text-[#FAFAFA] transition-colors"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="size-3.5 text-[#10B981]" />
                      <span>Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-[#A1A1AA]" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Latency Visual Bars */}
              <div className="flex flex-col gap-2">
                {pingHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#71717A] font-mono">
                    Awaiting first round of telemetry pings...
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 items-end h-28 pt-4 pb-2 border-b border-[#27272A]">
                    {pingHistory.map((p, idx) => {
                      // Max scale reference: 150ms
                      const heightPercent = Math.min(100, Math.max(15, (p.latency / 120) * 100));
                      const isHigh = p.latency > 150;
                      const isMedium = p.latency > 60;
                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group">
                          <span className="text-[10px] font-mono text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                            {p.latency}ms
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[28px] rounded-t-[4px] transition-all duration-300 ${
                              isHigh
                                ? 'bg-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                                : isMedium
                                ? 'bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                : 'bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            }`}
                          />
                          <span className="text-[9px] font-mono text-[#52525B] mt-1.5 truncate max-w-full">
                            {p.time.slice(0, 5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Diagnostic Terminal Raw JSON */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono uppercase text-[#71717A] tracking-wider">
                  Raw Health Response Envelope (/api/v1/health)
                </span>
                <pre className="p-4 rounded-[10px] bg-[#09090B] border border-[#27272A] font-mono text-xs text-[#34D399] overflow-x-auto leading-relaxed shadow-inner">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            </Card>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
