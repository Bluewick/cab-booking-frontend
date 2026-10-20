import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Car,
  Compass,
  Gauge,
  Wallet,
  ShieldCheck,
  Play,
  Pause,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import { StatusPill } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/feedback/Skeleton';
import MapEngine from '../../components/map/MapEngine';
import IncomingRideModal from '../../components/driver/IncomingRideModal';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import useToast from '../../hooks/useToast';
import useDriverLocationStream from '../../hooks/useDriverLocationStream';
import driverService from '../../services/driver.service';
import rideService from '../../services/ride.service';

/**
 * Obsidian Geist Driver Operations Console
 * Controls online availability, live GPS telemetry streaming,
 * incoming ride dispatch alerts, and earnings telemetry.
 */
export default function DriverDashboardPage() {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const toast = useToast();

  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState(null);

  // Incoming Dispatch Modal State
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [incomingModalOpen, setIncomingModalOpen] = useState(false);

  // Driver GPS Telemetry Streamer (Stationary when parked on dashboard)
  const {
    isStreaming,
    currentLocation,
    startStreaming,
    stopStreaming,
    teleportTo,
    toggleSimulation,
    isSimulating,
  } = useDriverLocationStream({
    autoStart: false,
    intervalMs: 2500,
    simulateMovement: false, // Vehicle remains parked; no random movement while waiting
  });

  // Fetch driver profile & check active assigned trips on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchDriverData() {
      try {
        setLoading(true);
        const data = await driverService.getDriverProfile();
        if (isMounted) {
          setDriverProfile(data);
          const online = Boolean(data?.is_online);
          setIsOnline(online);
          if (online) {
            startStreaming();
          }
        }

        // Check if this driver currently has an active trip in progress
        try {
          const active = await rideService.getActiveRide();
          if (
            isMounted &&
            active &&
            ['driver_assigned', 'assigned', 'accepted', 'arrived', 'in_progress'].includes(
              active.status
            )
          ) {
            setActiveTrip(active);
          }
        } catch {
          // silent
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Driver profile note:', err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDriverData();

    return () => {
      isMounted = false;
    };
  }, [startStreaming]);

  // Listen for real-time ride opportunities (`ride:new_request`)
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (payload) => {
      // payload: { ride_id, pickup, dropoff, estimated_fare, distance_km, duration_minutes }
      setIncomingRequest(payload);
      setIncomingModalOpen(true);
    };

    socket.on('ride:new_request', handleNewRequest);

    return () => {
      socket.off('ride:new_request', handleNewRequest);
    };
  }, [socket]);

  // Handle Online / Offline Switch
  const handleToggleOnline = async () => {
    try {
      setToggling(true);
      const newStatus = !isOnline;

      const coords = currentLocation || {
        latitude: driverProfile?.current_latitude || 12.9716,
        longitude: driverProfile?.current_longitude || 77.5946,
      };

      await driverService.updateStatus({
        is_online: newStatus,
        current_latitude: coords.latitude,
        current_longitude: coords.longitude,
      });

      setIsOnline(newStatus);

      if (newStatus) {
        startStreaming();
        toast.success(
          'You are now ONLINE. You will receive ride opportunities in your category.',
          'Driver Status: Online'
        );
      } else {
        stopStreaming();
        toast.info('You are now OFFLINE. No trips will be dispatched.', 'Driver Status: Offline');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update online status.');
    } finally {
      setToggling(false);
    }
  };

  const activePosition = currentLocation || {
    latitude: parseFloat(driverProfile?.current_latitude || 12.9716),
    longitude: parseFloat(driverProfile?.current_longitude || 77.5946),
    bearing: parseFloat(driverProfile?.bearing || 90),
    speed: parseFloat(driverProfile?.speed || 0),
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={isConnected} />

      <main className="flex-1 py-8">
        <PageContainer maxWidth="7xl">
          <div className="flex flex-col gap-6">
            {/* Top Operations Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                    Driver Partner Console
                  </h1>
                  <StatusPill status={isOnline ? 'online' : 'offline'} />
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Manage availability, stream GPS telemetry, and accept incoming dispatch requests
                </p>
              </div>

              {/* Status Switcher & Quick Navigation */}
              <div className="flex items-center gap-3">
                <Button
                  variant={isOnline ? 'destructive' : 'brand'}
                  size="md"
                  loading={toggling}
                  onClick={handleToggleOnline}
                  icon={Radio}
                  className="font-semibold"
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </Button>

                <Link to="/driver/earnings">
                  <Button variant="outline" size="md" icon={Wallet}>
                    Earnings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Active Trip in Progress Recovery Banner */}
            {activeTrip && (
              <Card
                level={2}
                className="p-4 sm:p-5 border-2 border-[#10B981] bg-[rgba(16,185,129,0.08)] shadow-[0_0_24px_rgba(16,185,129,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] shadow-[0_0_14px_rgba(16,185,129,0.5)] shrink-0">
                    <Car className="size-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-[#34D399] tracking-wider font-semibold">
                        Active Assigned Trip
                      </span>
                      <StatusPill status={activeTrip.status} />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-[#FAFAFA] mt-0.5">
                      Trip #{activeTrip.id.slice(0, 8)} • {activeTrip.pickup_address} → {activeTrip.dropoff_address}
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      You are assigned to this ride. Click to open live trip navigation and execute the trip.
                    </p>
                  </div>
                </div>

                <Link to={`/driver/trips/${activeTrip.id}`}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="bg-[#10B981] hover:bg-[#34D399] text-[#09090B] font-bold shadow-[0_0_16px_rgba(16,185,129,0.4)] shrink-0"
                  >
                    Open Active Trip Cockpit
                  </Button>
                </Link>
              </Card>
            )}

            {/* Availability Banner */}
            <Card
              level={2}
              className={`p-4 border transition-all ${
                isOnline
                  ? 'border-[#10B981] bg-[rgba(16,185,129,0.08)]'
                  : 'border-[#27272A] bg-[#141418]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center shrink-0 border ${
                      isOnline
                        ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                        : 'bg-[#27272A] border-[#3F3F46] text-[#71717A]'
                    }`}
                  >
                    <Radio className={`size-5 ${isOnline ? 'animate-pulse' : ''}`} />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-mono tracking-wider font-semibold">
                      {isOnline ? 'Ready For Trip Dispatches' : 'Shift Inactive (Offline)'}
                    </span>
                    <span className="text-xs text-[#A1A1AA] mt-0.5">
                      {isOnline
                        ? 'Registered in drivers:available room. Waiting for nearby rider booking requests.'
                        : 'Toggle status to Online to begin receiving ride opportunities in your area.'}
                    </span>
                  </div>
                </div>

                {isOnline && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={toggleSimulation}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-[6px] bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Toggle simulated GPS route vs device hardware"
                    >
                      {isSimulating ? <Pause className="size-3 text-[#F59E0B]" /> : <Play className="size-3 text-[#10B981]" />}
                      <span>{isSimulating ? 'Simulated GPS Active' : 'Device GPS Active'}</span>
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Metrics Row */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Skeleton variant="rect" width="100%" height="90px" />
                <Skeleton variant="rect" width="100%" height="90px" />
                <Skeleton variant="rect" width="100%" height="90px" />
                <Skeleton variant="rect" width="100%" height="90px" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card level={1} className="flex flex-col gap-1 p-4">
                  <span className="text-xs font-mono uppercase text-[#A1A1AA]">Rating Score</span>
                  <span className="text-2xl font-bold text-[#FAFAFA] font-mono tabular-nums">
                    {driverProfile?.rating_average ? Number(driverProfile.rating_average).toFixed(1) : '5.0'} ★
                  </span>
                  <p className="text-[11px] text-[#71717A]">Passenger satisfaction rating</p>
                </Card>

                <Card level={1} className="flex flex-col gap-1 p-4">
                  <span className="text-xs font-mono uppercase text-[#A1A1AA]">Total Trips</span>
                  <span className="text-2xl font-bold text-[#FAFAFA] font-mono tabular-nums">
                    {driverProfile?.total_rides || 0}
                  </span>
                  <p className="text-[11px] text-[#71717A]">Completed journey count</p>
                </Card>

                <Card level={1} className="flex flex-col gap-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#A1A1AA]">Verification</span>
                    {driverProfile?.is_verified ? (
                      <span className="text-[10px] text-[#34D399] font-mono flex items-center gap-1">
                        <ShieldCheck className="size-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#FBBF24] font-mono">Pending</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#FAFAFA] truncate">
                    Lic: {driverProfile?.license_number || 'Under Review'}
                  </span>
                  <p className="text-[11px] text-[#71717A]">Commercial Driver ID</p>
                </Card>

                <Card level={1} className="flex flex-col gap-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#A1A1AA]">Vehicle Fleet</span>
                    <Link to="/driver/register-vehicle" className="text-[10px] text-[#60A5FA] hover:underline font-mono">
                      Edit
                    </Link>
                  </div>
                  <span className="text-sm font-semibold text-[#FAFAFA] truncate">
                    {driverProfile?.vehicle?.make
                      ? `${driverProfile.vehicle.make} ${driverProfile.vehicle.model}`
                      : driverProfile?.make
                      ? `${driverProfile.make} ${driverProfile.model}`
                      : 'No Vehicle'}
                  </span>
                  <p className="text-[11px] text-[#34D399] font-mono">
                    {driverProfile?.vehicle?.plate_number || driverProfile?.plate_number || 'Setup Vehicle'}
                  </p>
                </Card>
              </div>
            )}

            {/* Split Operations: Live Fleet Map & Telemetry HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Map View (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="relative isolate z-0 w-full h-[460px] rounded-[16px] overflow-hidden border border-[#27272A] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                  <MapEngine
                    center={[activePosition.latitude, activePosition.longitude]}
                    zoom={14}
                    driverLocation={activePosition}
                    className="w-full h-full"
                    onMapClick={(coords) => {
                      teleportTo({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        bearing: activePosition.bearing,
                        speed: 0,
                      });
                      toast.success(
                        `Parked at ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
                        'Vehicle Relocated'
                      );
                    }}
                  />

                  {/* Telemetry Indicator Overlay */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 p-1.5 rounded-[10px] bg-[#09090B]/90 backdrop-blur-[12px] border border-[#27272A] text-xs font-mono shadow-xl">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18181B] text-[#FAFAFA]">
                      <Gauge className="size-3 text-[#34D399]" />
                      <span className="font-bold tabular-nums">
                        {Math.round(activePosition.speed || 0)} km/h
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18181B] text-[#FAFAFA]">
                      <Compass className="size-3 text-[#3B82F6]" />
                      <span className="font-bold tabular-nums">
                        {Math.round(activePosition.bearing || 0)}°
                      </span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#18181B] text-[11px]">
                      <span className={`size-2 rounded-full ${isStreaming ? 'bg-[#10B981] animate-pulse' : 'bg-[#71717A]'}`} />
                      <span className="text-[#A1A1AA]">{isStreaming ? 'ONLINE & PARKED' : 'OFFLINE'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Park Location Bar (Dev Testing) */}
                <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
                  <span className="text-[11px] font-mono text-[#71717A]">Quick Park:</span>
                  <button
                    type="button"
                    onClick={() => {
                      teleportTo({ latitude: 12.9716, longitude: 77.5946, bearing: 90, speed: 0 });
                      toast.success('Vehicle parked at MG Road Central');
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-[11px] font-mono text-[#D4D4D8] cursor-pointer transition-colors"
                  >
                    📍 MG Road (Central)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      teleportTo({ latitude: 12.9352, longitude: 77.6245, bearing: 90, speed: 0 });
                      toast.success('Vehicle parked at Koramangala');
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-[11px] font-mono text-[#D4D4D8] cursor-pointer transition-colors"
                  >
                    📍 Koramangala
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      teleportTo({ latitude: 12.9783, longitude: 77.6408, bearing: 90, speed: 0 });
                      toast.success('Vehicle parked at Indiranagar');
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-[11px] font-mono text-[#D4D4D8] cursor-pointer transition-colors"
                  >
                    📍 Indiranagar
                  </button>
                  <span className="text-[11px] text-[#71717A] italic ml-auto hidden sm:inline">
                    Click anywhere on map to reposition
                  </span>
                </div>
              </div>

              {/* Side Operations Console (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card level={1} className="p-4 flex flex-col gap-3">
                  <span className="text-xs font-mono uppercase text-[#A1A1AA] pb-2 border-b border-[#27272A]">
                    Live Spatial Telemetry
                  </span>

                  <div className="flex justify-between text-xs text-[#A1A1AA]">
                    <span>Latitude:</span>
                    <span className="text-[#FAFAFA] font-mono tabular-nums">
                      {activePosition.latitude?.toFixed(4)}° N
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-[#A1A1AA]">
                    <span>Longitude:</span>
                    <span className="text-[#FAFAFA] font-mono tabular-nums">
                      {activePosition.longitude?.toFixed(4)}° E
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-[#A1A1AA]">
                    <span>WebSocket:</span>
                    <span className="text-[#34D399] font-mono">
                      {isConnected ? 'Socket.IO v4 Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-[#A1A1AA]">
                    <span>Channel:</span>
                    <span className="text-[#60A5FA] font-mono">drivers:available</span>
                  </div>
                </Card>

                {/* Quick Fleet Actions */}
                <Card level={1} className="p-4 flex flex-col gap-2.5">
                  <span className="text-xs font-mono uppercase text-[#A1A1AA] pb-1 border-b border-[#27272A]">
                    Quick Shortcuts
                  </span>

                  <Link to="/driver/register-vehicle">
                    <Button variant="secondary" size="md" fullWidth icon={Car} className="justify-start">
                      Register / Update Vehicle
                    </Button>
                  </Link>

                  <Link to="/driver/earnings">
                    <Button variant="secondary" size="md" fullWidth icon={Wallet} className="justify-start">
                      Weekly Earnings & Payouts
                    </Button>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Incoming Ride Dispatch Modal */}
      <IncomingRideModal
        isOpen={incomingModalOpen}
        onClose={() => setIncomingModalOpen(false)}
        request={incomingRequest}
        onAcceptSuccess={() => {
          setIncomingRequest(null);
        }}
      />

      <Footer />
    </div>
  );
}
