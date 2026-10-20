import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  MapPin,
  Navigation,
  ShieldAlert,
  Phone,
  CheckCircle2,
  Compass,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  Check,
  Gauge,
  Sparkles,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import { StatusPill } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/feedback/Spinner';
import MapEngine from '../../components/map/MapEngine';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import useToast from '../../hooks/useToast';
import useDriverLocationStream from '../../hooks/useDriverLocationStream';
import rideService from '../../services/ride.service';
import driverService from '../../services/driver.service';
import sosService from '../../services/sos.service';
import { fetchStreetRoute } from '../../utils/routeGeometry';
import soundEffects from '../../utils/soundEffects';

/**
 * Obsidian Geist Driver Active Trip Execution Cockpit
 * Step 1: En Route to Pickup -> "I Have Arrived"
 * Step 2: Passenger Boarding -> 4-Digit OTP Verification
 * Step 3: Travelling to Destination -> "Complete Trip"
 * Step 4: Trip Settled & Earnings Breakdown
 */
export default function DriverActiveTripPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, joinRide, leaveRide, isConnected } = useSocket();
  const toast = useToast();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workflow Action States
  const [arriving, setArriving] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Safety & Cancellation Modals
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [triggeringSos, setTriggeringSos] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Passenger no-show after waiting');
  const [cancelling, setCancelling] = useState(false);

  // Live GPS Telemetry Streamer for this active trip
  const {
    currentLocation,
    isStreaming,
    teleportTo,
    setSimulationRoute,
    setIsSimulating,
  } = useDriverLocationStream({
    rideId,
    intervalMs: 1800,
    autoStart: true,
    loop: false,
  });

  const autoArriveTimerRef = useRef(null);
  const [autoTeleportedNearPickup, setAutoTeleportedNearPickup] = useState(false);

  // Automatically teleport driver near pickup location after 2.5 seconds upon ride acceptance
  useEffect(() => {
    if (!ride) return;
    const isAssigned = ['driver_assigned', 'assigned', 'accepted'].includes(ride.status);
    if (!isAssigned || autoTeleportedNearPickup) return;

    autoArriveTimerRef.current = setTimeout(async () => {
      if (!ride.pickup_latitude || !ride.pickup_longitude) return;
      const pickupLat = parseFloat(ride.pickup_latitude);
      const pickupLng = parseFloat(ride.pickup_longitude);
      const nearPickupCoords = {
        latitude: Number((pickupLat + 0.00025).toFixed(6)),
        longitude: Number((pickupLng + 0.00025).toFixed(6)),
        bearing: 45,
        speed: 15,
      };

      try {
        await teleportTo(nearPickupCoords);
        await driverService.updateStatus({
          is_online: true,
          current_latitude: nearPickupCoords.latitude,
          current_longitude: nearPickupCoords.longitude,
        });
        setAutoTeleportedNearPickup(true);
        toast.info('Simulated GPS: Driver reached near pickup zone.', 'Auto-Navigated Near Pickup');
      } catch (err) {
        console.warn('Auto-teleport near pickup note:', err.message);
      }
    }, 2500);

    return () => {
      if (autoArriveTimerRef.current) {
        clearTimeout(autoArriveTimerRef.current);
      }
    };
  }, [ride, autoTeleportedNearPickup, teleportTo, toast]);

  // Load real road polyline and drive vehicle along route when trip starts (in_progress)
  useEffect(() => {
    if (!ride || ride.status !== 'in_progress') return;

    let isMounted = true;

    async function loadRoadRouteAndDrive() {
      try {
        const waypoints = [
          [parseFloat(ride.pickup_latitude), parseFloat(ride.pickup_longitude)],
        ];

        if (Array.isArray(ride.stops)) {
          ride.stops.forEach((s) => {
            if (s.latitude && s.longitude) {
              waypoints.push([parseFloat(s.latitude), parseFloat(s.longitude)]);
            }
          });
        }

        waypoints.push([parseFloat(ride.dropoff_latitude), parseFloat(ride.dropoff_longitude)]);

        const roadCoords = await fetchStreetRoute(waypoints);
        if (isMounted && roadCoords && roadCoords.length > 1) {
          setSimulationRoute(roadCoords, false);
          setIsSimulating(true);
        }
      } catch (err) {
        console.warn('Failed to load road simulation route:', err.message);
      }
    }

    loadRoadRouteAndDrive();

    return () => {
      isMounted = false;
    };
  }, [ride, setSimulationRoute, setIsSimulating]);

  // Manual helper to teleport driver near pickup
  const handleTeleportNearPickup = async () => {
    if (!ride?.pickup_latitude || !ride?.pickup_longitude) return;
    const pickupLat = parseFloat(ride.pickup_latitude);
    const pickupLng = parseFloat(ride.pickup_longitude);
    const nearPickupCoords = {
      latitude: Number((pickupLat + 0.00025).toFixed(6)),
      longitude: Number((pickupLng + 0.00025).toFixed(6)),
      bearing: 45,
      speed: 0,
    };
    await teleportTo(nearPickupCoords);
    try {
      await driverService.updateStatus({
        is_online: true,
        current_latitude: nearPickupCoords.latitude,
        current_longitude: nearPickupCoords.longitude,
      });
    } catch {
      // offline note
    }
    setAutoTeleportedNearPickup(true);
    toast.success('Driver coordinates updated near pickup location!', 'Simulated Location');
  };

  // Helper to teleport driver near pickup and mark arrived in one click
  const handleAutoArriveAtPickup = async () => {
    await handleTeleportNearPickup();
    await handleMarkArrived();
  };

  // Fetch initial ride record
  useEffect(() => {
    let isMounted = true;

    async function fetchTrip() {
      try {
        setLoading(true);
        const data = await rideService.getRideById(rideId);
        if (isMounted) {
          setRide(data);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err.message || 'Failed to load trip details.', 'Trip Error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (rideId) {
      fetchTrip();
    }

    return () => {
      isMounted = false;
    };
  }, [rideId, toast]);

  // Join dedicated WebSocket room for this ride
  useEffect(() => {
    if (!rideId) return;

    joinRide(rideId);

    return () => {
      leaveRide(rideId);
    };
  }, [rideId, joinRide, leaveRide]);

  // Real-Time Socket Event Listeners for Lifecycle Sync
  useEffect(() => {
    if (!socket || !rideId) return;

    const handleRideCancelled = (payload) => {
      if (payload.ride_id === rideId) {
        setRide((prev) => ({
          ...prev,
          status: 'cancelled',
          cancellation_reason: payload.reason,
        }));
        toast.warning(
          `Trip was cancelled by ${payload.cancelled_by}: ${payload.reason}`,
          'Trip Cancelled'
        );
      }
    };

    const handlePaymentSuccessful = () => {
      soundEffects.playPaymentSuccess();
      toast.success('Passenger completed payment settlement!', 'Payment Received');
    };

    socket.on('ride:cancelled', handleRideCancelled);
    socket.on('payment:successful', handlePaymentSuccessful);

    return () => {
      socket.off('ride:cancelled', handleRideCancelled);
      socket.off('payment:successful', handlePaymentSuccessful);
    };
  }, [socket, rideId, toast]);

  // Step 1: Mark Driver Arrived at Pickup
  const handleMarkArrived = async () => {
    try {
      setArriving(true);
      const updated = await driverService.markArrived(rideId);
      setRide(updated);
      soundEffects.playSuccessTick();
      toast.info('Arrival broadcasted to passenger. Awaiting 4-digit OTP.', 'Arrived at Pickup');
    } catch (err) {
      toast.error(err.message || 'Failed to update arrival status.');
    } finally {
      setArriving(false);
    }
  };

  // Step 2: Verify 4-Digit OTP to Start Trip
  const handleStartTrip = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 4) {
      toast.warning('Please enter the 4-digit verification OTP provided by the rider.');
      return;
    }

    try {
      setStarting(true);
      const updated = await driverService.startRide(rideId, otpCode.trim());
      setRide(updated);
      soundEffects.playSuccessTick();
      toast.success('OTP verified! Trip started. Navigate to destination.', 'Trip in Progress');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP code. Please check with rider.');
    } finally {
      setStarting(false);
    }
  };

  // Step 3: Complete Trip
  const handleCompleteTrip = async () => {
    try {
      setCompleting(true);
      const updated = await driverService.completeRide(rideId);
      setRide(updated);
      soundEffects.playPaymentSuccess();
      toast.success(
        `Trip completed! Total Fare: ₹${Math.round(updated.final_fare || 0)}`,
        'Trip Concluded'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to complete trip.');
    } finally {
      setCompleting(false);
    }
  };

  // Immediate Dropoff Arrival & Completion (User Dev Helper)
  const handleArrivedAtDropoffAndComplete = async () => {
    try {
      setCompleting(true);
      const dropoffCoords = {
        latitude: parseFloat(ride.dropoff_latitude),
        longitude: parseFloat(ride.dropoff_longitude),
        bearing: 0,
        speed: 0,
      };

      // 1. Instantly move driver marker & telemetry to dropoff coordinates
      await teleportTo(dropoffCoords);
      try {
        await driverService.updateStatus({
          is_online: true,
          current_latitude: dropoffCoords.latitude,
          current_longitude: dropoffCoords.longitude,
        });
      } catch {
        // status note
      }

      // 2. Call backend complete ride
      const updated = await driverService.completeRide(rideId);
      setRide(updated);
      soundEffects.playPaymentSuccess();
      toast.success(
        `Arrived at dropoff! Trip successfully completed. Total Fare: ₹${Math.round(updated.final_fare || 0)}`,
        'Trip Concluded'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to conclude trip at dropoff.');
    } finally {
      setCompleting(false);
    }
  };

  // Cancel Trip Handler
  const handleCancelTrip = async () => {
    try {
      setCancelling(true);
      await rideService.cancelRide(rideId, cancelReason);
      setRide((prev) => ({ ...prev, status: 'cancelled' }));
      setCancelModalOpen(false);
      toast.info('Trip was cancelled.');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel trip.');
    } finally {
      setCancelling(false);
    }
  };

  // Trigger SOS Distress Alert
  const handleTriggerSos = async () => {
    try {
      setTriggeringSos(true);
      const coords = currentLocation || {
        latitude: parseFloat(ride?.pickup_latitude || 12.9716),
        longitude: parseFloat(ride?.pickup_longitude || 77.5946),
      };

      await sosService.triggerAlert({
        ride_id: rideId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setSosModalOpen(false);
      toast.error('DRIVER SOS ALERT BROADCASTED: Support dispatched.', 'SOS ACTIVATED');
    } catch (err) {
      toast.error(err.message || 'Failed to trigger SOS alert.');
    } finally {
      setTriggeringSos(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-4 text-[#FAFAFA]">
        <Spinner size="lg" />
        <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">
          Connecting In-Car Telemetry...
        </span>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col text-[#FAFAFA]">
        <Navbar user={user} onLogout={logout} isConnected={isConnected} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <AlertTriangle className="size-12 text-[#F59E0B]" />
          <h1 className="text-2xl font-bold">Active Trip Not Found</h1>
          <Button variant="primary" onClick={() => navigate('/driver/dashboard')} icon={ArrowLeft}>
            Return to Dashboard
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pickupPoint = {
    address: ride.pickup_address,
    latitude: parseFloat(ride.pickup_latitude),
    longitude: parseFloat(ride.pickup_longitude),
  };

  const dropoffPoint = {
    address: ride.dropoff_address,
    latitude: parseFloat(ride.dropoff_latitude),
    longitude: parseFloat(ride.dropoff_longitude),
  };

  const intermediateStops = Array.isArray(ride.stops)
    ? ride.stops.map((s) => ({
        address: s.address,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
      }))
    : [];

  const grossFare = parseFloat(ride.final_fare || ride.estimated_fare || 240);
  const netEarnings = Math.round(grossFare * 0.8);

  const activeDriverPos = currentLocation || {
    latitude: parseFloat(ride.pickup_latitude),
    longitude: parseFloat(ride.pickup_longitude),
    bearing: 90,
    speed: 35,
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={isConnected} />

      <main className="flex-1 py-6 sm:py-8">
        <PageContainer maxWidth="7xl">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A] mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/driver/dashboard"
                className="size-9 rounded-[9px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors"
                title="Back to Console"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] tracking-tight">
                    Active Trip #{ride.id.slice(0, 8)}
                  </h1>
                  <StatusPill status={ride.status} />
                </div>
                <span className="text-[11px] font-mono text-[#71717A]">
                  Vehicle Category: {ride.vehicle_category?.toUpperCase() || 'STANDARD'}
                </span>
              </div>
            </div>

            {/* Quick Emergency Actions */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSosModalOpen(true)}
                icon={ShieldAlert}
              >
                Driver SOS
              </Button>

              {['driver_assigned', 'assigned', 'accepted', 'arrived'].includes(ride.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  className="text-[#EF4444] border-[#EF4444]/40 hover:bg-[#EF4444]/10"
                >
                  Cancel Trip
                </Button>
              )}
            </div>
          </div>

          {/* Main Grid: Live Route & Trip Execution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative isolate z-0 w-full h-[460px] sm:h-[560px] rounded-[16px] overflow-hidden border border-[#27272A] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <MapEngine
                  pickup={pickupPoint}
                  stops={intermediateStops}
                  dropoff={dropoffPoint}
                  driverLocation={activeDriverPos}
                  className="w-full h-full"
                />

                {/* Telemetry HUD Overlay */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 p-1.5 rounded-[10px] bg-[#09090B]/90 backdrop-blur-[12px] border border-[#27272A] text-xs font-mono shadow-xl">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18181B] text-[#FAFAFA]">
                    <Gauge className="size-3 text-[#34D399]" />
                    <span className="font-bold tabular-nums">
                      {Math.round(activeDriverPos.speed || 0)} km/h
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18181B] text-[#FAFAFA]">
                    <Compass className="size-3 text-[#3B82F6]" />
                    <span className="font-bold tabular-nums">
                      {Math.round(activeDriverPos.bearing || 0)}°
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#18181B] text-[10px] text-[#A1A1AA]">
                    <span className={`size-2 rounded-full ${isStreaming ? 'bg-[#10B981] animate-pulse' : 'bg-[#71717A]'}`} />
                    <span>BROADCASTING</span>
                  </div>
                </div>
              </div>

              {/* Waypoints Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card level={1} className="p-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono text-[#34D399] uppercase">Pickup Point</span>
                    <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                      {ride.pickup_address}
                    </span>
                  </div>
                </Card>

                <Card level={1} className="p-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-full bg-[#EF4444]/20 border border-[#EF4444] flex items-center justify-center text-[#EF4444] shrink-0 mt-0.5">
                    <Navigation className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono text-[#F87171] uppercase">Destination</span>
                    <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                      {ride.dropoff_address}
                    </span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Trip Execution Controls (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Step 1: Navigating to Pickup Point */}
              {['driver_assigned', 'assigned', 'accepted'].includes(ride.status) && (
                <Card level={2} className="p-5 border border-[#3B82F6] flex flex-col gap-4 shadow-[0_0_24px_rgba(59,130,246,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6] flex items-center justify-center text-[#60A5FA]">
                      <Navigation className="size-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#60A5FA] tracking-wider">
                        Step 1 of 3: Navigation
                      </span>
                      <h2 className="text-base font-bold text-[#FAFAFA]">
                        Heading to Passenger Pickup
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Navigate to <strong className="text-[#FAFAFA]">{ride.pickup_address}</strong>. Tap below once you reach the pickup zone.
                  </p>

                  {/* Dev Mode Simulation Assistant */}
                  <div className="p-3 rounded-[10px] bg-[#141418] border border-[#27272A] flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                      <span className="flex items-center gap-1.5 text-[#60A5FA]">
                        <Sparkles className="size-3.5" /> Dev Mode GPS Assist
                      </span>
                      <span className={autoTeleportedNearPickup ? 'text-[#34D399] font-bold' : 'text-[#FBBF24]'}>
                        {autoTeleportedNearPickup ? '● Near Pickup Zone' : '○ Teleporting in 2.5s...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTeleportNearPickup}
                        className="flex-1 py-1.5 px-2 rounded-[6px] bg-[#18181B] border border-[#27272A] hover:border-[#3B82F6] text-[11px] font-mono text-[#FAFAFA] transition-colors cursor-pointer text-center"
                      >
                        Teleport Near Pickup
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoArriveAtPickup}
                        className="flex-1 py-1.5 px-2 rounded-[6px] bg-[#10B981]/20 border border-[#10B981]/40 hover:bg-[#10B981]/30 text-[11px] font-mono text-[#34D399] font-bold transition-colors cursor-pointer text-center"
                      >
                        Teleport & Arrive
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={arriving}
                    onClick={handleMarkArrived}
                    icon={CheckCircle2}
                    // className="bg-[#3B82F6] hover:bg-[#60A5FA] text-[#FAFAFA] font-bold"
                  >
                    I Have Arrived at Pickup
                  </Button>
                </Card>
              )}

              {/* Step 2: Passenger Boarding & OTP Input */}
              {ride.status === 'arrived' && (
                <Card level={2} className="p-5 border border-[#F59E0B] bg-[rgba(245,158,11,0.06)] flex flex-col gap-4 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center text-[#FBBF24]">
                      <KeyRound className="size-5 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#FBBF24] tracking-wider">
                        Step 2 of 3: Boarding Verification
                      </span>
                      <h2 className="text-base font-bold text-[#FAFAFA]">
                        Enter Passenger 4-Digit OTP
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Ask the rider for their 4-digit verification code to authenticate and initiate the trip.
                  </p>

                  {/* Dev Helper for Instant OTP fill */}
                  {ride.otp_code && (
                    <div className="p-2.5 rounded-[8px] bg-[#141418] border border-[#F59E0B]/30 flex items-center justify-between text-xs">
                      <span className="text-[#A1A1AA] flex items-center gap-1.5 font-mono">
                        <KeyRound className="size-3.5 text-[#FBBF24]" />
                        Passenger OTP: <strong className="text-[#FAFAFA] font-bold text-sm tracking-wider">{ride.otp_code}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(ride.otp_code)}
                        className="px-2.5 py-1 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#FBBF24] hover:bg-[#F59E0B]/30 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleStartTrip} className="flex flex-col gap-3">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-full h-14 text-center text-3xl font-bold font-mono tracking-widest bg-[#09090B] border border-[#27272A] rounded-[12px] text-[#FAFAFA] focus:border-[#F59E0B] outline-none"
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={starting}
                      icon={Check}
                      className="bg-[#F59E0B] hover:bg-[#FBBF24] text-[#09090B] font-bold"
                    >
                      Verify OTP & Start Trip
                    </Button>
                  </form>
                </Card>
              )}

              {/* Step 3: En Route to Destination (With Auto-Driving & Arrived at Dropoff CTA) */}
              {ride.status === 'in_progress' && (
                <Card level={2} className="p-5 border border-[#10B981] bg-[rgba(16,185,129,0.06)] flex flex-col gap-4 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981]">
                      <Car className="size-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#34D399] tracking-wider">
                        Step 3 of 3: Trip In Progress
                      </span>
                      <h2 className="text-base font-bold text-[#FAFAFA]">
                        Heading to Dropoff Destination
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Driving passenger along the highlighted route to <strong className="text-[#FAFAFA]">{ride.dropoff_address}</strong>.
                  </p>

                  {/* Real-time moving telemetry status */}
                  <div className="p-3 rounded-[10px] bg-[#09090B] border border-[#27272A] flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#34D399]">
                      <span className="size-2 rounded-full bg-[#10B981] animate-ping" />
                      Live GPS: Navigating Route
                    </span>
                    <span className="text-[#A1A1AA] tabular-nums">
                      {Math.round(activeDriverPos.speed || 38)} km/h • {Math.round(activeDriverPos.bearing || 0)}°
                    </span>
                  </div>

                  {/* Primary CTA requested by User: Arrived at Dropoff */}
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={completing}
                    onClick={handleArrivedAtDropoffAndComplete}
                    icon={CheckCircle2}
                    className="bg-[#10B981] hover:bg-[#34D399] text-[#09090B] font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  >
                    Arrived at Dropoff & Complete Trip
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    loading={completing}
                    onClick={handleCompleteTrip}
                    className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] border-[#27272A]"
                  >
                    Standard Complete Trip
                  </Button>
                </Card>
              )}

              {/* Step 4: Trip Concluded Summary */}
              {ride.status === 'completed' && (
                <Card level={2} className="p-5 border border-[#10B981] flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#34D399]">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#34D399] tracking-wider">
                        Trip Completed
                      </span>
                      <h2 className="text-lg font-bold text-[#FAFAFA]">
                        Journey Concluded Successfully
                      </h2>
                    </div>
                  </div>

                  {/* Net Earnings Highlight */}
                  <div className="p-4 rounded-[12px] bg-[#141418] border border-[#27272A] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono text-[#34D399] uppercase">
                        Your Net Earnings (80%)
                      </span>
                      <span className="text-3xl font-bold font-mono text-[#FAFAFA]">
                        ₹{netEarnings}
                      </span>
                    </div>

                    <div className="flex flex-col items-end text-xs font-mono text-[#71717A]">
                      <span>Gross: ₹{Math.round(grossFare)}</span>
                      <span>Comm: -₹{Math.round(grossFare * 0.2)}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/driver/dashboard')}
                    icon={ArrowLeft}
                  >
                    Return to Driver Dashboard
                  </Button>
                </Card>
              )}

              {/* Trip Cancelled State */}
              {ride.status === 'cancelled' && (
                <Card level={2} className="p-5 border border-[#EF4444] bg-[#450A0A]/20 flex flex-col gap-3">
                  <h3 className="text-base font-bold text-[#F87171] flex items-center gap-2">
                    <AlertTriangle className="size-5" />
                    Trip Cancelled
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    Reason: {ride.cancellation_reason || 'Trip was cancelled.'}
                  </p>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/driver/dashboard')}
                    icon={ArrowLeft}
                    className="mt-2"
                  >
                    Return to Console
                  </Button>
                </Card>
              )}

              {/* Passenger Contact Card */}
              <Card level={1} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center font-bold text-sm text-[#FAFAFA]">
                      {ride.rider_name ? ride.rider_name.slice(0, 2).toUpperCase() : 'PS'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#FAFAFA]">
                        {ride.rider_name || 'Passenger Partner'}
                      </span>
                      <span className="text-xs text-[#71717A] font-mono">
                        {ride.total_distance_km || 14.5} km • ~{ride.total_duration_minutes || 35} mins
                      </span>
                    </div>
                  </div>

                  {ride.rider_phone && (
                    <a
                      href={`tel:${ride.rider_phone}`}
                      className="size-9 rounded-[8px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#34D399] hover:bg-[#1C1C21] transition-colors"
                      title="Call Passenger"
                    >
                      <Phone className="size-4" />
                    </a>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#A1A1AA]">Expected Payout:</span>
                  <span className="text-base font-bold text-[#FAFAFA] tabular-nums">
                    ₹{netEarnings}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Driver SOS Distress Modal */}
      <Modal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        title="DRIVER EMERGENCY SOS"
        description="Trigger emergency safety distress signal."
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-[10px] bg-[#450A0A] border border-[#EF4444] text-xs text-[#FCA5A5] leading-relaxed flex items-start gap-3">
            <ShieldAlert className="size-5 shrink-0 text-[#EF4444] mt-0.5 animate-pulse" />
            <span>
              Activating Driver SOS broadcasts your spatial vehicle coordinates to emergency response patrol and notifies company safety dispatchers.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setSosModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              loading={triggeringSos}
              onClick={handleTriggerSos}
              icon={ShieldAlert}
            >
              Broadcast Driver SOS
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Trip Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Accepted Trip"
        description="Select reason for cancellation."
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            {[
              'Passenger no-show after waiting',
              'Vehicle mechanical problem',
              'Unsafe pickup location',
              'Passenger requested cancellation',
            ].map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setCancelReason(reason)}
                className={`w-full p-2.5 rounded-[8px] text-left text-xs transition-colors cursor-pointer border ${
                  cancelReason === reason
                    ? 'bg-[#18181B] border-[#3B82F6] text-[#FAFAFA]'
                    : 'bg-[#141418] border-[#27272A] text-[#A1A1AA]'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setCancelModalOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              size="md"
              loading={cancelling}
              onClick={handleCancelTrip}
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
