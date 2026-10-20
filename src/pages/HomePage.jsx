import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Badge, { StatusPill } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LiveRouteMap from '../components/map/LiveRouteMap';
import WaypointAddressSelector from '../components/booking/WaypointAddressSelector';
import VehicleCategorySelector from '../components/booking/VehicleCategorySelector';
import RideSearchingModal from '../components/booking/RideSearchingModal';
import SOSModal from '../components/safety/SOSModal';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import fareService from '../services/fare.service';
import rideService from '../services/ride.service';
import { BANGALORE_LOCATIONS } from '../utils/routeGeometry';
import {
  ShieldAlert,
  ArrowRight,
  Tag,
  CheckCircle2,
  X,
  Navigation,
  AlertCircle,
  Route,
  Clock,
  Waypoints,
} from 'lucide-react';

function formatTripDuration(minutes) {
  if (!minutes || minutes <= 0) return '~0 min';
  const totalMins = Math.round(minutes);
  if (totalMins < 60) return `~${totalMins} min`;
  const hrs = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  return remainingMins > 0 ? `~${hrs}h ${remainingMins}m` : `~${hrs} hr`;
}

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // If authenticated user is a driver partner, forward directly to operations console
  useEffect(() => {
    if (user?.role === 'driver') {
      navigate('/driver/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Route Waypoint State (Defaults to prominent transit hub, fully customizable)
  const [pickup, setPickup] = useState({
    address: 'MG Road Metro Station, Bangalore',
    latitude: BANGALORE_LOCATIONS.mg_road.lat,
    longitude: BANGALORE_LOCATIONS.mg_road.lng,
  });

  const [stops, setStops] = useState([]);

  const [dropoff, setDropoff] = useState({
    address: 'Bellandur EcoSpace Tech Park, Bangalore',
    latitude: BANGALORE_LOCATIONS.bellandur.lat,
    longitude: BANGALORE_LOCATIONS.bellandur.lng,
  });

  const [category, setCategory] = useState('comfort');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Fare & Estimation State
  const [routeStats, setRouteStats] = useState({ distance_km: 14.54, duration_minutes: 38 });
  const [estimates, setEstimates] = useState([]);

  // Dispatch / Request Ride States
  const [requestingRide, setRequestingRide] = useState(false);
  const [searchingModalOpen, setSearchingModalOpen] = useState(false);
  const [activeRideData, setActiveRideData] = useState(null);

  // Active / Existing Trip Recovery States
  const [existingActiveRide, setExistingActiveRide] = useState(null);
  const [cancellingExisting, setCancellingExisting] = useState(false);
  const [activeRidePromptModal, setActiveRidePromptModal] = useState(null);

  // Driver GPS State (Null prior to ride dispatch; rendered only when a driver is actively moving)
  const [driverLocation] = useState(null);

  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Check for an ongoing active ride on mount or when auth state updates
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    async function checkActiveRide() {
      try {
        const active = await rideService.getActiveRide();
        if (isMounted && active) {
          setExistingActiveRide(active);
        }
      } catch (err) {
        console.warn('Active ride check note:', err.message);
      }
    }

    checkActiveRide();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const displayActiveRide = isAuthenticated ? existingActiveRide : null;

  // Cancel an existing active ride directly from HomePage
  const handleCancelExistingRide = async (rideIdToCancel) => {
    try {
      setCancellingExisting(true);
      await rideService.cancelRide(rideIdToCancel, 'User opted to reset active ride');
      setExistingActiveRide(null);
      setActiveRidePromptModal(null);
      toast.success('Previous active ride was cancelled. You can now request a new trip.', 'Ride Cancelled');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel previous ride.', 'Cancel Error');
    } finally {
      setCancellingExisting(false);
    }
  };

  // Initial calculation on mount / waypoint changes
  useEffect(() => {
    let isMounted = true;

    async function initFare() {
      if (!pickup?.latitude || !dropoff?.latitude) return;

      try {
        const validStops = (stops || []).filter((s) => s?.latitude && s?.longitude);
        const data = await fareService.estimateFare({
          pickup,
          stops: validStops,
          dropoff,
        });
        if (isMounted) {
          if (data?.route) setRouteStats(data.route);
          if (data?.estimates) setEstimates(data.estimates);
        }
      } catch {
        // Fallback default
      }
    }

    initFare();

    return () => {
      isMounted = false;
    };
  }, [pickup, stops, dropoff]);

  // Handle Promo Code Validation
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    try {
      setApplyingPromo(true);
      const promoData = await fareService.applyPromo({
        code: promoCode.trim().toUpperCase(),
        order_amount: 250.0,
      });
      setAppliedPromo(promoData);
      toast.success(`Discount of ₹${promoData.discount_applied} applied!`, 'Promo Code Applied');
    } catch (err) {
      toast.error(err.message || 'Invalid or expired promo code.', 'Promo Error');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    toast.info('Promo code removed.');
  };

  // Dispatch Ride Request to Backend
  const handleRequestRide = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to request an UrbanCab ride.');
      navigate('/login');
      return;
    }

    try {
      setRequestingRide(true);
      const validStops = (stops || []).filter((s) => s?.latitude && s?.longitude);
      const payload = {
        pickup,
        stops: validStops,
        dropoff,
        vehicle_category: category,
        promo_code: appliedPromo ? appliedPromo.code : undefined,
      };

      const result = await rideService.requestRide(payload);
      setActiveRideData(result);
      setSearchingModalOpen(true);
      toast.success('Searching for available drivers near your pickup point!', 'Ride Dispatched');
    } catch (err) {
      const errMsg = err.message || '';
      // Check if user already has an active ride request (e.g. status driver_assigned)
      const uuidMatch = errMsg.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (uuidMatch || errMsg.toLowerCase().includes('already have an active ride')) {
        const foundId = uuidMatch ? uuidMatch[1] : existingActiveRide?.id;
        const fallbackRide = { id: foundId, status: 'driver_assigned' };
        setExistingActiveRide((prev) => prev || fallbackRide);
        setActiveRidePromptModal({
          id: foundId,
          message: errMsg,
        });
        toast.warning('You already have an active ride request in progress.', 'Active Ride Detected');
      } else {
        toast.error(errMsg || 'Could not dispatch ride request. Please try again.', 'Request Error');
      }
    } finally {
      setRequestingRide(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1 py-6 sm:py-8">
        <PageContainer>
          {/* Top Operational Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#27272A]">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA]">
                  {user?.full_name ? `Where to, ${user.full_name.split(' ')[0]}?` : 'Request an UrbanCab Ride'}
                </h1>
                <Badge variant="brand" pulse>Instant Dispatch</Badge>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Configure pickup and destination with live upfront fare calculation & verified driver tracking.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSosModalOpen(true)}
                icon={ShieldAlert}
                title="Immediate Safety & SOS Patrol Escalation"
              >
                Emergency SOS
              </Button>
            </div>
          </div>

          {/* Split Screen 2-Column Map & Booking Workspace */}
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Multi-Stop Routing & Tier Selection (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Active Ride In-Progress Recovery Banner */}
              {displayActiveRide && (
                <Card
                  level={2}
                  className="p-4 border-2 border-[#3B82F6] bg-[rgba(59,130,246,0.08)] shadow-[0_0_24px_rgba(59,130,246,0.2)] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6] flex items-center justify-center text-[#60A5FA]">
                        <Navigation className="size-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#60A5FA] tracking-wider font-semibold">
                          Active Trip In Progress
                        </span>
                        <h3 className="text-sm font-bold text-[#FAFAFA]">
                          Trip #{displayActiveRide.id?.slice(0, 8)}
                        </h3>
                      </div>
                    </div>
                    <StatusPill status={displayActiveRide.status} />
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    You currently have an active ride request. Track the driver en route or cancel the trip to request a new ride.
                  </p>

                  <div className="flex items-center gap-2.5 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/rides/${displayActiveRide.id}`)}
                      icon={ArrowRight}
                      iconPosition="right"
                      className="bg-[#3B82F6] hover:bg-[#60A5FA] text-[#FAFAFA] font-semibold"
                    >
                      Resume Trip
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      loading={cancellingExisting}
                      onClick={() => handleCancelExistingRide(displayActiveRide.id)}
                      className="text-[#EF4444] border-[#EF4444]/40 hover:bg-[#EF4444]/10"
                    >
                      Cancel Ride
                    </Button>
                  </div>
                </Card>
              )}

              <Card level={1} className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                  <div>
                    <h2 className="text-base font-semibold text-[#FAFAFA]">
                      Trip Waypoint Planner
                    </h2>
                    <p className="text-xs text-[#71717A]">
                      Configure origin, multi-stops, and final destination
                    </p>
                  </div>
                  <Badge variant="brand" pulse>
                    Live GPS
                  </Badge>
                </div>

                {/* Waypoint Address Selector Component */}
                <WaypointAddressSelector
                  pickup={pickup}
                  onPickupChange={setPickup}
                  stops={stops}
                  onStopsChange={setStops}
                  dropoff={dropoff}
                  onDropoffChange={setDropoff}
                  disabled={requestingRide}
                />

                {/* Route Telemetry HUD Bar */}
                <div className="rounded-2xl bg-[#141418] border border-[#27272A] p-2.5 sm:p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                  <div className="grid grid-cols-3 divide-x divide-[#27272A]/70">
                    {/* 1. Distance */}
                    <div className="flex items-center gap-2 sm:gap-2.5 px-1 sm:px-2 min-w-0">
                      <div className="size-8 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 flex items-center justify-center shrink-0 text-[#60A5FA]">
                        <Route className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-[#71717A] truncate">
                          Distance
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#FAFAFA] tabular-nums truncate">
                          {routeStats.distance_km} km
                        </span>
                      </div>
                    </div>

                    {/* 2. Est. Duration */}
                    <div className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 min-w-0">
                      <div className="size-8 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 flex items-center justify-center shrink-0 text-[#34D399]">
                        <Clock className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-[#71717A] truncate">
                          Est. Time
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#34D399] tabular-nums truncate">
                          {formatTripDuration(routeStats.duration_minutes)}
                        </span>
                      </div>
                    </div>

                    {/* 3. Stops */}
                    <div className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 min-w-0">
                      <div className="size-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center shrink-0 text-[#FBBF24]">
                        <Waypoints className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-[#71717A] truncate">
                          Route
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#FAFAFA] tabular-nums truncate">
                          {stops.length === 0 ? 'Direct' : `${stops.length} ${stops.length === 1 ? 'Stop' : 'Stops'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Tier Selector Component */}
                <VehicleCategorySelector
                  selectedCategory={category}
                  onSelectCategory={setCategory}
                  estimates={estimates}
                  disabled={requestingRide}
                />

                {/* Promo Code Input */}
                <div className="pt-2 border-t border-[#27272A] flex flex-col gap-2">
                  <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                    <Input
                      icon={Tag}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo Code (e.g. URBAN50)"
                      className="text-xs h-9 uppercase"
                      disabled={Boolean(appliedPromo) || applyingPromo}
                    />
                    {appliedPromo ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromo}
                        className="h-9 shrink-0 text-[#EF4444]"
                      >
                        <X className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        loading={applyingPromo}
                        className="h-9 shrink-0"
                      >
                        Apply
                      </Button>
                    )}
                  </form>

                  {appliedPromo && (
                    <div className="p-2.5 rounded-[8px] bg-[#052E16]/80 border border-[#10B981]/30 flex items-center justify-between text-xs text-[#34D399]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        Code Applied: {appliedPromo.code}
                      </span>
                      <span className="font-semibold text-xs tabular-nums text-[#34D399]">-₹{appliedPromo.discount_applied} OFF</span>
                    </div>
                  )}
                </div>

                {/* Confirm Request CTA */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={requestingRide}
                  onClick={handleRequestRide}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="mt-2"
                >
                  {isAuthenticated ? 'Request UrbanCab Ride' : 'Sign in to Request Ride'}
                </Button>
              </Card>
            </div>

            {/* Right Column: Interactive Map Engine (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <LiveRouteMap
                pickup={pickup}
                stops={stops}
                dropoff={dropoff}
                driverLocation={driverLocation}
                routeStats={routeStats}
                height="560px"
              />

              {/* Waypoint Coordinates Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card level={1} className="p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#34D399] font-medium">
                    <span className="size-2 rounded-full bg-[#10B981]" />
                    <span>Pickup Point</span>
                  </div>
                  <p className="text-xs font-semibold text-[#FAFAFA] truncate">{pickup.address}</p>
                  <span className="text-[11px] text-[#71717A] tabular-nums">
                    {pickup.latitude?.toFixed(4)}° N, {pickup.longitude?.toFixed(4)}° E
                  </span>
                </Card>

                <Card level={1} className="p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#FBBF24] font-medium">
                    <span className="size-2 rounded-full bg-[#F59E0B]" />
                    <span>Intermediate Stops ({stops.length})</span>
                  </div>
                  <p className="text-xs font-semibold text-[#FAFAFA] truncate">
                    {stops[0]?.address || 'Direct Journey'}
                  </p>
                  <span className="text-[11px] text-[#71717A] tabular-nums">
                    {stops.length === 0 ? 'No intermediate stops' : `${stops.length} stop${stops.length > 1 ? 's' : ''} planned`}
                  </span>
                </Card>

                <Card level={1} className="p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#F87171] font-medium">
                    <span className="size-2 rounded-full bg-[#EF4444]" />
                    <span>Dropoff Target</span>
                  </div>
                  <p className="text-xs font-semibold text-[#FAFAFA] truncate">{dropoff.address}</p>
                  <span className="text-[11px] text-[#71717A] tabular-nums">
                    {dropoff.latitude?.toFixed(4)}° N, {dropoff.longitude?.toFixed(4)}° E
                  </span>
                </Card>
              </div>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Ride Searching Modal */}
      <RideSearchingModal
        isOpen={searchingModalOpen}
        onClose={() => setSearchingModalOpen(false)}
        rideData={activeRideData}
        onRideCancelled={() => {
          setActiveRideData(null);
        }}
      />

      {/* High-Priority SOS Distress Modal */}
      <SOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        currentLocation={pickup}
      />

      {/* Active Ride Recovery Dialog */}
      <Modal
        isOpen={Boolean(activeRidePromptModal)}
        onClose={() => setActiveRidePromptModal(null)}
        title="Active Ride Request in Progress"
        description="Our system detected that you already have an ongoing ride session."
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-[10px] bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.3)] text-xs text-[#60A5FA] leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#FAFAFA]">
                {activeRidePromptModal?.message || 'You already have an active ride request.'}
              </p>
              <p className="mt-1 text-[#A1A1AA]">
                You can resume tracking your driver, or cancel this active trip if you wish to start a new ride.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              loading={cancellingExisting}
              onClick={() => activeRidePromptModal?.id && handleCancelExistingRide(activeRidePromptModal.id)}
              className="text-[#EF4444] border-[#EF4444]/40 hover:bg-[#EF4444]/10"
            >
              Cancel This Ride
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const id = activeRidePromptModal?.id || existingActiveRide?.id;
                setActiveRidePromptModal(null);
                if (id) navigate(`/rides/${id}`);
              }}
              icon={ArrowRight}
              iconPosition="right"
              className="bg-[#3B82F6] hover:bg-[#60A5FA] text-[#FAFAFA]"
            >
              Resume Ride
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
