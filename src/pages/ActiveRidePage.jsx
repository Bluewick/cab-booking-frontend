import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  MapPin,
  Navigation,
  ShieldAlert,
  Phone,
  CheckCircle2,
  Clock,
  Compass,
  AlertTriangle,
  CreditCard,
  KeyRound,
  ArrowLeft,
  Copy,
  Check,
  Receipt,
  Star,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/common/Card';
import Badge, { StatusPill } from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Spinner from '../components/feedback/Spinner';
import MapEngine from '../components/map/MapEngine';
import SOSModal from '../components/safety/SOSModal';
import RatingModal from '../components/feedback/RatingModal';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import useToast from '../hooks/useToast';
import rideService from '../services/ride.service';
import paymentService from '../services/payment.service';
import soundEffects from '../utils/soundEffects';

const CANCELLATION_REASONS = [
  'Driver is taking too long to arrive',
  'Driver requested to cancel',
  'Entered incorrect pickup / dropoff address',
  'Changed travel plans',
  'Found alternative transportation',
  'Safety concern',
];

/**
 * Obsidian Geist Live Ride Tracking & Navigation Console
 * Coordinates real-time driver telemetry streaming, state transitions,
 * arrival OTP verification, and emergency SOS distress channels.
 */
export default function ActiveRidePage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, joinRide, leaveRide, isConnected } = useSocket();
  const toast = useToast();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  // Modals & UI States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [cancelling, setCancelling] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);

  // Fetch initial ride record
  useEffect(() => {
    let isMounted = true;

    async function fetchRide() {
      try {
        const data = await rideService.getRideById(rideId);
        if (isMounted) {
          setRide(data);
          if (data?.driver_location) {
            setDriverLocation(data.driver_location);
          }
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err.message || 'Failed to load ride details.', 'Ride Error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (rideId) {
      fetchRide();
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

  // Real-Time Socket Event Listeners for Trip Progression
  useEffect(() => {
    if (!socket || !rideId) return;

    // 1. Moving Driver Telemetry Stream
    const handleLocationBroadcast = (payload) => {
      setDriverLocation({
        latitude: parseFloat(payload.latitude),
        longitude: parseFloat(payload.longitude),
        bearing: parseFloat(payload.bearing || 0),
        speed: parseFloat(payload.speed || 0),
        timestamp: payload.timestamp,
      });
    };

    // 2. Driver Assigned (if coming from searching state)
    const handleDriverAssigned = (payload) => {
      if (payload.ride_id === rideId) {
        soundEffects.playBookingConfirmed();
        setRide((prev) => ({
          ...prev,
          status: 'driver_assigned',
          driver_name: payload.driver?.name,
          driver_phone: payload.driver?.phone,
          driver_rating: payload.driver?.rating,
          vehicle_make: payload.vehicle?.make,
          vehicle_model: payload.vehicle?.model,
          vehicle_plate: payload.vehicle?.plate,
          vehicle_color: payload.vehicle?.color,
        }));
        if (payload.driver_location) {
          setDriverLocation(payload.driver_location);
        }
        toast.success('Driver partner assigned to your trip!', 'Driver Matched');
      }
    };

    // 3. Driver Arrived at Pickup Point
    const handleDriverArrived = (payload) => {
      if (payload.ride_id === rideId) {
        soundEffects.playDriverArrived();
        setRide((prev) => ({ ...prev, status: 'arrived' }));
        toast.info(
          'Your driver has arrived at the pickup location. Share your OTP to begin.',
          'Driver Arrived!'
        );
      }
    };

    // 4. Trip Initiated (OTP verified)
    const handleRideStarted = (payload) => {
      if (payload.ride_id === rideId) {
        soundEffects.playSuccessTick();
        setRide((prev) => ({ ...prev, status: 'in_progress', started_at: payload.started_at }));
        toast.success('Trip started. Have a safe journey!', 'Trip in Progress');
      }
    };

    // 5. Trip Completed
    const handleRideCompleted = (payload) => {
      if (payload.ride_id === rideId) {
        soundEffects.playPaymentSuccess();
        setRide((prev) => ({
          ...prev,
          status: 'completed',
          final_fare: payload.final_fare,
          completed_at: payload.completed_at,
        }));
        toast.success(
          `Destination reached! Final fare: ₹${Math.round(payload.final_fare || 0)}`,
          'Trip Completed'
        );
      }
    };

    // 6. Trip Cancelled
    const handleRideCancelled = (payload) => {
      if (payload.ride_id === rideId) {
        setRide((prev) => ({
          ...prev,
          status: 'cancelled',
          cancellation_fee: payload.cancellation_fee,
          cancellation_reason: payload.reason,
        }));
        toast.warning(
          `Ride was cancelled by ${payload.cancelled_by}. Reason: ${payload.reason}`,
          'Trip Cancelled'
        );
      }
    };

    socket.on('ride:location_broadcast', handleLocationBroadcast);
    socket.on('ride:driver_assigned', handleDriverAssigned);
    socket.on('ride:driver_arrived', handleDriverArrived);
    socket.on('ride:started', handleRideStarted);
    socket.on('ride:completed', handleRideCompleted);
    socket.on('ride:cancelled', handleRideCancelled);

    return () => {
      socket.off('ride:location_broadcast', handleLocationBroadcast);
      socket.off('ride:driver_assigned', handleDriverAssigned);
      socket.off('ride:driver_arrived', handleDriverArrived);
      socket.off('ride:started', handleRideStarted);
      socket.off('ride:completed', handleRideCompleted);
      socket.off('ride:cancelled', handleRideCancelled);
    };
  }, [socket, rideId, toast]);

  // Cancel Trip Handler
  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await rideService.cancelRide(rideId, cancelReason);
      setRide((prev) => ({ ...prev, status: 'cancelled' }));
      setCancelModalOpen(false);
      toast.info('Your ride was cancelled successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel trip.', 'Cancellation Error');
    } finally {
      setCancelling(false);
    }
  };

  const copyOtpToClipboard = () => {
    if (ride?.otp_code) {
      navigator.clipboard.writeText(ride.otp_code);
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2000);
      toast.info('OTP copied to clipboard.');
    }
  };

  const handlePayWithRazorpay = async () => {
    if (!ride) return;
    try {
      setPaying(true);
      await paymentService.checkout({
        ride,
        user,
        onSuccess: (result) => {
          setPaying(false);
          setRide((prev) => ({
            ...prev,
            payment_status: 'captured',
            payment_id: result.payment?.payment_id,
          }));
          soundEffects.playPaymentSuccess();
          toast.success('Payment captured and ride settled successfully!', 'Payment Verified');
          // Automatically trigger driver review dialog upon settlement
          setRatingModalOpen(true);
        },
        onDismiss: () => {
          setPaying(false);
          toast.info('Payment window was closed. You can settle the fare anytime.');
        },
        onError: (err) => {
          setPaying(false);
          toast.error(err.message || 'Payment could not be completed.', 'Payment Failed');
        },
      });
    } catch (err) {
      setPaying(false);
      toast.error(err.message || 'Payment initialization error.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-4 text-[#FAFAFA]">
        <Spinner size="lg" />
        <span className="text-xs font-mono text-[#A1A1AA] tracking-wider uppercase">
          Loading Trip Telemetry...
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
          <h1 className="text-2xl font-bold">Trip Record Not Found</h1>
          <p className="text-xs text-[#A1A1AA] max-w-sm">
            The requested ride identifier #{rideId} does not exist or access has expired.
          </p>
          <Button variant="primary" onClick={() => navigate('/')} icon={ArrowLeft}>
            Return to Booking
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Construct Map Props from Ride
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

  const isCancellable = [
    'requested',
    'searching',
    'driver_assigned',
    'accepted',
    'assigned',
    'arrived',
  ].includes(ride.status);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={isConnected} />

      <main className="flex-1 py-6 sm:py-8">
        <PageContainer maxWidth="7xl">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A] mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="size-9 rounded-[9px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors"
                title="Back to Booking"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] tracking-tight">
                    Ride #{ride.id.slice(0, 8)}
                  </h1>
                  <StatusPill status={ride.status} />
                </div>
                <span className="text-[11px] font-mono text-[#71717A]">
                  Dispatched: {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSosModalOpen(true)}
                icon={ShieldAlert}
              >
                Emergency SOS
              </Button>

              {isCancellable && (
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

          {/* Main Grid: Map & Live Dispatch Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Real Map with Live Telemetry (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative isolate z-0 w-full h-[440px] sm:h-[540px] rounded-[16px] overflow-hidden border border-[#27272A] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <MapEngine
                  pickup={pickupPoint}
                  stops={intermediateStops}
                  dropoff={dropoffPoint}
                  driverLocation={driverLocation}
                  className="w-full h-full"
                />

                {/* Floating Telemetry Stats Overlay */}
                {driverLocation && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 p-1.5 rounded-[10px] bg-[#09090B]/90 backdrop-blur-[12px] border border-[#27272A] text-xs font-mono shadow-xl">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#18181B] text-[#FAFAFA]">
                      <span className="text-[10px] text-[#71717A]">SPD:</span>
                      <span className="font-bold tabular-nums">
                        {Math.round(driverLocation.speed || 0)} km/h
                      </span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#18181B] text-[#FAFAFA]">
                      <Compass className="size-3 text-[#3B82F6]" />
                      <span className="font-bold tabular-nums">
                        {Math.round(driverLocation.bearing || 0)}°
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Waypoint Path Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card level={1} className="p-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono text-[#34D399] uppercase">Pickup</span>
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

            {/* Right Column: Trip Console & Verification (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Status Banner */}
              <Card
                level={2}
                className={`p-4 border ${
                  ride.status === 'arrived'
                    ? 'border-[#F59E0B] bg-[rgba(245,158,11,0.08)]'
                    : ride.status === 'in_progress'
                    ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.08)]'
                    : ride.status === 'completed'
                    ? 'border-[#10B981] bg-[rgba(16,185,129,0.08)]'
                    : ['driver_assigned', 'assigned', 'accepted'].includes(ride.status)
                    ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.08)]'
                    : 'border-[#27272A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {ride.status === 'arrived' && (
                    <Clock className="size-6 text-[#FBBF24] shrink-0 animate-bounce" />
                  )}
                  {ride.status === 'in_progress' && (
                    <Navigation className="size-6 text-[#60A5FA] shrink-0 animate-pulse" />
                  )}
                  {ride.status === 'completed' && (
                    <CheckCircle2 className="size-6 text-[#34D399] shrink-0" />
                  )}
                  {['driver_assigned', 'assigned', 'accepted'].includes(ride.status) && (
                    <Car className="size-6 text-[#60A5FA] shrink-0 animate-pulse" />
                  )}
                  {['requested', 'searching'].includes(ride.status) && (
                    <Compass className="size-6 text-[#F59E0B] shrink-0 animate-spin" />
                  )}

                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-mono tracking-wider font-semibold">
                      {['driver_assigned', 'assigned', 'accepted'].includes(ride.status) && 'Driver Assigned • En Route'}
                      {ride.status === 'arrived' && 'Driver Arrived at Pickup Point'}
                      {ride.status === 'in_progress' && 'Trip In Progress'}
                      {ride.status === 'completed' && 'Trip Completed Successfully'}
                      {ride.status === 'cancelled' && 'Trip Cancelled'}
                      {['requested', 'searching'].includes(ride.status) && 'Searching For Drivers'}
                    </span>
                    <span className="text-xs text-[#A1A1AA] mt-0.5">
                      {['driver_assigned', 'assigned', 'accepted'].includes(ride.status) && 'Your driver partner is heading towards the pickup station.'}
                      {ride.status === 'arrived' && 'Please meet your driver and share the 4-digit OTP.'}
                      {ride.status === 'in_progress' && 'Travelling to your final destination.'}
                      {ride.status === 'completed' && 'Thank you for riding with UrbanCab.'}
                      {ride.status === 'cancelled' && `Reason: ${ride.cancellation_reason || 'Cancelled'}`}
                      {['requested', 'searching'].includes(ride.status) && 'Broadcasting request to nearby available drivers.'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 4-Digit Verification OTP Card (Crucial for Assigned & Arrived states) */}
              {ride.otp_code && ['driver_assigned', 'assigned', 'accepted', 'arrived'].includes(ride.status) && (
                <Card level={2} className="p-4 bg-gradient-to-br from-[#141418] to-[#1C1C21] border-[#3B82F6]/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#60A5FA]">
                      <KeyRound className="size-4" />
                      <span>Start Trip Verification OTP</span>
                    </div>
                    <button
                      type="button"
                      onClick={copyOtpToClipboard}
                      className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                    >
                      {otpCopied ? <Check className="size-3 text-[#10B981]" /> : <Copy className="size-3" />}
                      <span>{otpCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 py-2">
                    {ride.otp_code.split('').map((digit, idx) => (
                      <span
                        key={idx}
                        className="size-12 rounded-[10px] bg-[#09090B] border border-[#27272A] flex items-center justify-center text-2xl font-bold font-mono text-[#FAFAFA] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-center text-[#71717A] mt-2">
                    Provide this code to the driver upon boarding to initiate your ride.
                  </p>
                </Card>
              )}

              {/* Assigned Driver Profile Card */}
              {ride.driver_name && (
                <Card level={1} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center font-bold text-sm text-[#FAFAFA]">
                        {ride.driver_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#FAFAFA]">{ride.driver_name}</span>
                        <span className="text-xs text-[#FBBF24] font-mono flex items-center gap-1">
                          ★ {Number(ride.driver_rating || 4.9).toFixed(1)} Rating
                        </span>
                      </div>
                    </div>

                    {ride.driver_phone && (
                      <a
                        href={`tel:${ride.driver_phone}`}
                        className="size-9 rounded-[8px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#34D399] hover:bg-[#1C1C21] transition-colors"
                        title="Call Driver"
                      >
                        <Phone className="size-4" />
                      </a>
                    )}
                  </div>

                  {/* Vehicle Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-[#09090B] border border-[#27272A]">
                      <span className="text-[10px] text-[#71717A] block">Vehicle</span>
                      <span className="font-semibold text-[#FAFAFA] truncate block">
                        {ride.vehicle_color} {ride.vehicle_make} {ride.vehicle_model}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#09090B] border border-[#27272A]">
                      <span className="text-[10px] text-[#71717A] block">License Plate</span>
                      <span className="font-bold text-[#60A5FA] tracking-wider block">
                        {ride.vehicle_plate || 'KA-01-MJ-4091'}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Fare & Invoicing Summary */}
              <Card level={1} className="p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] pb-2 border-b border-[#27272A]">
                  <span>Payment & Fare Breakdown</span>
                  <Badge variant="brand">{ride.vehicle_category?.toUpperCase() || 'STANDARD'}</Badge>
                </div>

                <div className="flex justify-between text-xs text-[#A1A1AA]">
                  <span>Total Distance</span>
                  <span className="text-[#FAFAFA] font-mono">{ride.total_distance_km || 14.5} km</span>
                </div>

                <div className="flex justify-between text-xs text-[#A1A1AA]">
                  <span>Estimated Duration</span>
                  <span className="text-[#FAFAFA] font-mono">{ride.total_duration_minutes || 35} mins</span>
                </div>

                {ride.discount_amount > 0 && (
                  <div className="flex justify-between text-xs text-[#34D399]">
                    <span>Promo Discount</span>
                    <span className="font-mono">- ₹{Math.round(ride.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-[#27272A]">
                  <span className="text-xs font-bold text-[#FAFAFA]">
                    {ride.status === 'completed' ? 'Final Amount Due' : 'Estimated Total'}
                  </span>
                  <span className="text-xl font-bold font-mono text-[#FAFAFA]">
                    ₹{Math.round(ride.final_fare || ride.estimated_fare || 0)}
                  </span>
                </div>

                {/* Settle Payment CTA on Completion */}
                {ride.status === 'completed' && (
                  <div className="flex flex-col gap-3 pt-2">
                    {ride.payment_status === 'captured' || ride.payment_status === 'paid' ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#052E16] border border-[#10B981]/30 text-xs font-mono text-[#34D399]">
                          <span className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="size-4" /> Settled in Full
                          </span>
                          <span className="text-[11px] text-[#34D399]/80">
                            {ride.payment_id ? `#${ride.payment_id.slice(0, 12)}` : 'Captured'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link to={`/receipt/${ride.id}`}>
                            <Button variant="primary" size="md" fullWidth icon={Receipt}>
                              Tax Invoice
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="md"
                            fullWidth
                            icon={Star}
                            onClick={() => setRatingModalOpen(true)}
                          >
                            Rate Driver
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth
                          loading={paying}
                          loadingText="Launching Gateway..."
                          onClick={handlePayWithRazorpay}
                          icon={CreditCard}
                          className="font-semibold shadow-[0_0_24px_rgba(59,130,246,0.3)]"
                        >
                          Pay ₹{Math.round(ride.final_fare || ride.estimated_fare || 0)} with Razorpay
                        </Button>

                        {/* Test card info helper */}
                        <div className="p-2.5 rounded-[8px] bg-[#09090B] border border-[#27272A] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#3B82F6]">Test Card:</span>
                            <span className="text-[#FAFAFA] font-bold">4100 2800 0000 1007</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('4100280000001007');
                              setCardCopied(true);
                              setTimeout(() => setCardCopied(false), 2000);
                            }}
                            className="text-[10px] text-[#60A5FA] hover:text-[#FAFAFA] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {cardCopied ? <Check className="size-3 text-[#34D399]" /> : <Copy className="size-3" />}
                            <span>{cardCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Ride Request"
        description="Select a reason for cancelling your journey."
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <span className="text-xs font-mono text-[#A1A1AA]">Cancellation Reason</span>
            <div className="flex flex-col gap-1.5">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCancelReason(reason)}
                  className={`w-full p-2.5 rounded-[8px] text-left text-xs transition-colors cursor-pointer border ${
                    cancelReason === reason
                      ? 'bg-[#18181B] border-[#3B82F6] text-[#FAFAFA]'
                      : 'bg-[#141418] border-[#27272A] text-[#A1A1AA] hover:bg-[#18181B]'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-[8px] bg-[#450A0A]/40 border border-[#EF4444]/30 text-[11px] text-[#F87171] leading-relaxed">
            Note: If the driver has already arrived at the pickup station, a standard cancellation fee of ₹50.00 will apply.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setCancelModalOpen(false)}>
              Keep Trip
            </Button>
            <Button
              variant="destructive"
              size="md"
              loading={cancelling}
              onClick={handleConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* High-Priority SOS Distress Modal */}
      <SOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        rideId={rideId}
        currentLocation={driverLocation}
      />

      {/* Driver Rating & Review Dialog */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        ride={ride}
      />

      <Footer />
    </div>
  );
}
