import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  MapPin,
  User,
  Phone,
  RefreshCw,
  Search,
  Compass,
  PhoneCall,
  Activity,
  Navigation,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/feedback/Skeleton';
import MapEngine from '../../components/map/MapEngine';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import useSocket from '../../hooks/useSocket';
import sosService from '../../services/sos.service';
import soundEffects from '../../utils/soundEffects';

/**
 * Obsidian Geist Central SOS Emergency Incident Desk
 * Strictly adheres to DESIGN.md dark-first aesthetic, real-time Socket.IO broadcasts,
 * geospatial map tracking, and resolution workflows.
 */
export default function AdminSOSPage() {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const toast = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [mapAlert, setMapAlert] = useState(null);

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;
    sosService.getActiveAlerts()
      .then((activeAlerts) => {
        if (!isMounted) return;
        setAlerts(Array.isArray(activeAlerts) ? activeAlerts : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        toast.error(err.message || 'Could not load active SOS alerts.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Manual radar sync action
  const handleSyncRadar = useCallback(async () => {
    try {
      setRefreshing(true);
      const activeAlerts = await sosService.getActiveAlerts();
      setAlerts(Array.isArray(activeAlerts) ? activeAlerts : []);
      toast.success(`Active emergency signals synchronized (${activeAlerts.length})`);
    } catch (err) {
      toast.error(err.message || 'Could not load active SOS alerts.');
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Listen for real-time global admin:emergency_alert socket events
  useEffect(() => {
    if (!socket) return;

    const handleEmergencyAlert = (data) => {
      // Play audio siren warning
      soundEffects.playEmergencySiren();

      toast.error(
        `EMERGENCY ALERT: Ride ${data.ride_id?.slice(0, 8)}... triggered SOS!`,
        'High-Priority Incident Dispatch'
      );

      // Prepend to alerts list
      setAlerts((prev) => {
        // Prevent duplicate IDs
        const existing = prev.find((a) => a.id === data.alert_id);
        if (existing) return prev;

        const newAlert = {
          id: data.alert_id,
          ride_id: data.ride_id,
          user_id: data.user_id,
          latitude: data.coordinates?.latitude,
          longitude: data.coordinates?.longitude,
          status: 'triggered',
          created_at: data.triggered_at || new Date().toISOString(),
          emergency_contacts: data.emergency_contacts || [],
          pickup_address: data.ride_details?.pickup || 'Pickup Location',
          dropoff_address: data.ride_details?.dropoff || 'Dropoff Location',
        };
        return [newAlert, ...prev];
      });
    };

    socket.on('admin:emergency_alert', handleEmergencyAlert);

    return () => {
      socket.off('admin:emergency_alert', handleEmergencyAlert);
    };
  }, [socket, toast]);

  // Filter alerts by search query
  const filteredAlerts = alerts.filter((alert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      alert.id?.toLowerCase().includes(q) ||
      alert.ride_id?.toLowerCase().includes(q) ||
      alert.user_name?.toLowerCase().includes(q) ||
      alert.user_phone?.includes(q) ||
      alert.pickup_address?.toLowerCase().includes(q) ||
      alert.dropoff_address?.toLowerCase().includes(q)
    );
  });

  const handleResolveAlert = async (e) => {
    e.preventDefault();
    if (!selectedAlert || !resolutionNotes.trim()) {
      toast.warning('Please provide detailed dispatch resolution notes.');
      return;
    }

    try {
      setResolving(true);
      await sosService.resolveAlert(selectedAlert.id, resolutionNotes);

      toast.success(
        `Incident ${selectedAlert.id.slice(0, 8)}... successfully marked resolved.`,
        'Distress Alert Concluded'
      );

      setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
      if (mapAlert?.id === selectedAlert.id) {
        setMapAlert(null);
      }
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (err) {
      toast.error(err.message || 'Failed to update alert resolution.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#EF4444]/30">
      <Navbar user={user} onLogout={logout} isConnected={isConnected} />

      <main className="flex-1 py-8 sm:py-12">
        <PageContainer maxWidth="6xl">
          <div className="flex flex-col gap-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[10px] bg-[#450A0A]/40 border border-[#EF4444]/40 shadow-[0_0_16px_rgba(239,68,68,0.2)]">
                    <ShieldAlert className="size-5 text-[#EF4444] animate-pulse" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                    Emergency SOS Incident Desk
                  </h1>
                </div>
                <p className="text-xs text-[#A1A1AA] max-w-xl">
                  Central safety operations console monitoring live distress signals, GPS coordinates, and police/ambulance escalations.
                </p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#141418] border border-[#27272A] text-xs font-mono text-[#A1A1AA]">
                  <span className={`size-2 rounded-full ${alerts.length > 0 ? 'bg-[#EF4444] animate-ping' : 'bg-[#10B981]'}`} />
                  <span>{alerts.length} Active Incidents</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncRadar}
                  loading={refreshing}
                  loadingText="Syncing..."
                  icon={RefreshCw}
                >
                  Sync Radar
                </Button>
              </div>
            </div>

            {/* Quick Responders & Hotlines Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="tel:112"
                className="p-4 rounded-[12px] bg-[#141418] border border-[#27272A] hover:border-[#EF4444] transition-colors flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-[8px] bg-[#EF4444]/10 text-[#F87171] border border-[#EF4444]/20">
                    <ShieldAlert className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#F87171] transition-colors">
                      Police Control Room
                    </h4>
                    <span className="text-[11px] font-mono text-[#71717A]">Emergency Dial: 112</span>
                  </div>
                </div>
                <PhoneCall className="size-4 text-[#A1A1AA] group-hover:text-[#EF4444] transition-colors" />
              </a>

              <a
                href="tel:108"
                className="p-4 rounded-[12px] bg-[#141418] border border-[#27272A] hover:border-[#10B981] transition-colors flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-[8px] bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#34D399] transition-colors">
                      Ambulance / Medical Unit
                    </h4>
                    <span className="text-[11px] font-mono text-[#71717A]">Emergency Dial: 108</span>
                  </div>
                </div>
                <PhoneCall className="size-4 text-[#A1A1AA] group-hover:text-[#10B981] transition-colors" />
              </a>

              <a
                href="tel:1091"
                className="p-4 rounded-[12px] bg-[#141418] border border-[#27272A] hover:border-[#F59E0B] transition-colors flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-[8px] bg-[#F59E0B]/10 text-[#FBBF24] border border-[#F59E0B]/20">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#FBBF24] transition-colors">
                      Women's Helpline
                    </h4>
                    <span className="text-[11px] font-mono text-[#71717A]">Emergency Dial: 1091</span>
                  </div>
                </div>
                <PhoneCall className="size-4 text-[#A1A1AA] group-hover:text-[#F59E0B] transition-colors" />
              </a>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Filter by Incident ID, Ride ID, passenger, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141418] text-[#FAFAFA] text-xs rounded-[8px] pl-9 pr-3 py-2.5 border border-[#27272A] focus:outline-none focus:border-[#FAFAFA] placeholder-[#71717A] transition-colors"
                />
              </div>

              <div className="text-xs font-mono text-[#71717A]">
                Showing {filteredAlerts.length} of {alerts.length} signals
              </div>
            </div>

            {/* Alerts Content Feed */}
            {loading ? (
              <div className="flex flex-col gap-4">
                <Skeleton variant="rect" width="100%" height="120px" />
                <Skeleton variant="rect" width="100%" height="120px" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <Card level={1} className="p-12 text-center flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20">
                  <CheckCircle2 className="size-10" />
                </div>
                <h3 className="text-base font-bold text-[#FAFAFA]">
                  All Safe • No Active Emergency Signals
                </h3>
                <p className="text-xs text-[#71717A] max-w-md">
                  The central dispatch receiver is actively synchronized on port 5213. When any rider or driver triggers an SOS distress call, telemetry will immediately arrive with high-priority audio alert.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredAlerts.map((alert) => {
                  const alertLat = parseFloat(alert.latitude) || 12.9716;
                  const alertLng = parseFloat(alert.longitude) || 77.5946;

                  return (
                    <Card
                      key={alert.id}
                      level={2}
                      className="border-[#EF4444]/40 bg-[#141418] p-5 sm:p-6 flex flex-col gap-4 shadow-[0_0_24px_rgba(239,68,68,0.12)] transition-all hover:border-[#EF4444]/70"
                    >
                      {/* Alert Header Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Badge variant="error" pulse>
                            DISTRESS ACTIVATED
                          </Badge>
                          <span className="text-xs font-mono text-[#F87171] font-semibold">
                            ALERT #{alert.id.slice(0, 8)}...
                          </span>
                          <span className="text-xs font-mono text-[#71717A]">
                            Ride: {alert.ride_id.slice(0, 8)}...
                          </span>
                          <span className="text-xs font-mono text-[#71717A]">
                            {new Date(alert.created_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMapAlert(mapAlert?.id === alert.id ? null : alert)}
                            icon={mapAlert?.id === alert.id ? Navigation : Compass}
                          >
                            {mapAlert?.id === alert.id ? 'Hide GPS Map' : 'View GPS Pin'}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setResolutionNotes('Emergency patrol unit contacted passenger; confirmed safely escorted to destination.');
                            }}
                          >
                            Resolve Alert
                          </Button>
                        </div>
                      </div>

                      {/* Passenger & Location Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        {/* Passenger Card */}
                        <div className="p-3 rounded-[8px] bg-[#09090B] border border-[#27272A] flex flex-col gap-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider">
                            Passenger Details
                          </span>
                          <div className="flex items-center gap-2 text-[#FAFAFA] font-medium">
                            <User className="size-3.5 text-[#A1A1AA]" />
                            <span>{alert.user_name || 'Passenger (App User)'}</span>
                          </div>
                          {alert.user_phone && (
                            <a
                              href={`tel:${alert.user_phone}`}
                              className="font-mono text-[#60A5FA] hover:underline flex items-center gap-1.5 text-[11px]"
                            >
                              <Phone className="size-3" />
                              {alert.user_phone}
                            </a>
                          )}
                        </div>

                        {/* Route Corridor */}
                        <div className="p-3 rounded-[8px] bg-[#09090B] border border-[#27272A] flex flex-col gap-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider">
                            Active Corridor
                          </span>
                          <div className="flex items-center gap-1.5 text-[#FAFAFA] truncate">
                            <span className="text-[#34D399] font-mono">FROM:</span>
                            <span className="truncate">{alert.pickup_address || 'Pickup Point'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#FAFAFA] truncate">
                            <span className="text-[#EF4444] font-mono">TO:</span>
                            <span className="truncate">{alert.dropoff_address || 'Destination Point'}</span>
                          </div>
                        </div>

                        {/* Coordinates Telemetry */}
                        <div className="p-3 rounded-[8px] bg-[#09090B] border border-[#27272A] flex flex-col gap-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider">
                            GPS Coordinate Pin
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[#34D399]">
                            <MapPin className="size-3.5" />
                            <span>{alertLat.toFixed(5)}, {alertLng.toFixed(5)}</span>
                          </div>
                          <span className="text-[11px] font-mono text-[#71717A]">
                            High-Precision Telemetry
                          </span>
                        </div>
                      </div>

                      {/* Notified Emergency Contacts (if present) */}
                      {alert.emergency_contacts && alert.emergency_contacts.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#27272A]/50">
                          <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider">
                            Emergency Contacts Broadcasted:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {alert.emergency_contacts.map((c, i) => (
                              <div
                                key={i}
                                className="px-2.5 py-1 rounded-[6px] bg-[#09090B] border border-[#27272A] text-[11px] font-mono flex items-center gap-2"
                              >
                                <span className="text-[#FAFAFA]">{c.name}</span>
                                <span className="text-[#71717A]">({c.relationship || 'Guardian'})</span>
                                <a href={`tel:${c.phone_number}`} className="text-[#60A5FA] hover:underline">
                                  {c.phone_number}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Mini Map View */}
                      {mapAlert?.id === alert.id && (
                        <div className="mt-2 rounded-[10px] overflow-hidden border border-[#27272A] h-[280px]">
                          <MapEngine
                            pickup={{
                              latitude: alertLat,
                              longitude: alertLng,
                              address: alert.pickup_address || 'SOS Incident Coordinate',
                            }}
                            dropoff={
                              alert.dropoff_address
                                ? {
                                    latitude: alertLat + 0.015,
                                    longitude: alertLng + 0.015,
                                    address: alert.dropoff_address,
                                  }
                                : null
                            }
                            center={[alertLat, alertLng]}
                            zoom={15}
                          />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </PageContainer>
      </main>

      {/* Resolve Incident Modal */}
      <Modal
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title="Resolve Emergency Incident"
        description="Submit official resolution report and conclude active distress signal."
        size="md"
      >
        <form onSubmit={handleResolveAlert} className="flex flex-col gap-4 font-sans">
          <div className="p-3 rounded-[8px] bg-[#141418] border border-[#27272A] flex flex-col gap-1 text-xs">
            <span className="text-[10px] font-mono uppercase text-[#71717A]">Target Incident</span>
            <span className="font-mono text-[#F87171] font-semibold">
              Alert ID: {selectedAlert?.id}
            </span>
            <span className="font-mono text-[#A1A1AA]">
              Ride: {selectedAlert?.ride_id}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A1A1AA]">
              Resolution Dispatch Notes <span className="text-[#F87171]">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Patrol unit contacted passenger; confirmed safely arrived."
              className="w-full bg-[#141418] text-[#FAFAFA] text-xs font-sans rounded-[8px] border border-[#27272A] p-3 focus:outline-none focus:border-[#FAFAFA] placeholder-[#71717A] leading-relaxed transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]/70">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setSelectedAlert(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={resolving}
              loadingText="Submitting..."
            >
              Confirm Incident Resolved
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
