import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, X, UserCheck, MapPin, Navigation } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import useSocket from '../../hooks/useSocket';
import useToast from '../../hooks/useToast';
import rideService from '../../services/ride.service';

/**
 * Obsidian Geist Ride Searching Modal
 * Features a luminous 360-degree radar sweep animation, live driver discovery counter,
 * and automatic transition to ActiveRidePage when `ride:driver_assigned` is received.
 */
export default function RideSearchingModal({
  isOpen,
  onClose,
  rideData,
  onRideCancelled,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { socket, isConnected } = useSocket();

  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [cancelling, setCancelling] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState(null);

  const rideId = rideData?.ride?.id || rideData?.id;
  const nearbyDriversCount = rideData?.nearby_drivers_count || 4;

  // 60-second countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Listen for real-time `ride:driver_assigned` event from backend
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleDriverAssigned = (payload) => {
      // payload: { ride_id, driver: { name, phone, rating }, vehicle: { make, model, plate, color }, driver_location }
      if (rideId && payload.ride_id !== rideId) return;

      setAssignedDriver(payload);
      toast.success(
        `Driver ${payload.driver?.name || 'Partner'} accepted your request!`,
        'Driver Assigned'
      );

      // Brief delay so user sees match feedback, then redirect to ActiveRidePage
      setTimeout(() => {
        onClose();
        navigate(`/rides/${payload.ride_id}`);
      }, 1200);
    };

    socket.on('ride:driver_assigned', handleDriverAssigned);

    return () => {
      socket.off('ride:driver_assigned', handleDriverAssigned);
    };
  }, [socket, isOpen, rideId, navigate, onClose, toast]);

  const handleCancelRequest = async () => {
    if (!rideId) {
      onClose();
      return;
    }

    try {
      setCancelling(true);
      await rideService.cancelRide(rideId, 'Rider cancelled during driver search');
      toast.info('Ride request was cancelled.');
      if (onRideCancelled) onRideCancelled();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request.', 'Cancel Error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title=""
      size="md"
      className="!p-0 !bg-[#09090B] border border-[#27272A] overflow-hidden"
    >
      <div className="relative p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#3B82F6]/15 blur-3xl pointer-events-none" />

        {assignedDriver ? (
          /* Driver Matched Success State */
          <div className="flex flex-col items-center gap-4 py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="size-20 rounded-full bg-[#10B981]/20 border-2 border-[#10B981] flex items-center justify-center text-[#10B981] shadow-[0_0_24px_rgba(16,185,129,0.5)]">
              <UserCheck className="size-10" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase font-mono tracking-wider text-[#34D399]">
                Driver Partner Connected
              </span>
              <h2 className="text-2xl font-bold text-[#FAFAFA]">
                {assignedDriver.driver?.name} is on the way!
              </h2>
              <p className="text-xs text-[#A1A1AA] font-mono mt-1">
                {assignedDriver.vehicle?.make} {assignedDriver.vehicle?.model} •{' '}
                <span className="text-[#FAFAFA] font-bold">{assignedDriver.vehicle?.plate}</span>
              </p>
            </div>
          </div>
        ) : (
          /* Searching Radar State */
          <>
            {/* Luminous Radar Disk */}
            <div className="relative size-44 sm:size-48 my-4 flex items-center justify-center">
              {/* Outer Pulsing Rings */}
              <div className="absolute inset-0 rounded-full border border-[#27272A] animate-ping opacity-25" />
              <div className="absolute inset-4 rounded-full border border-[#3B82F6]/30" />
              <div className="absolute inset-10 rounded-full border border-[#27272A]" />
              <div className="absolute inset-16 rounded-full border border-[#3B82F6]/40" />

              {/* Radar Sweep Needle */}
              <div className="absolute inset-0 rounded-full animate-radar pointer-events-none overflow-hidden">
                <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-tr from-[#3B82F6]/40 via-[#3B82F6]/10 to-transparent" />
              </div>

              {/* Center Pulsing Orb */}
              <div className="relative z-10 size-14 rounded-full bg-[#141418] border-2 border-[#3B82F6] flex items-center justify-center text-[#60A5FA] shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                <Radio className="size-7 animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] tracking-tight">
                Contacting Nearby Drivers...
              </h2>
              <p className="text-xs text-[#A1A1AA] max-w-xs leading-relaxed">
                Dispatched request to{' '}
                <span className="text-[#FAFAFA] font-semibold">{nearbyDriversCount} nearby vehicles</span>.
                Awaiting driver partner confirmation.
              </p>
            </div>

            {/* Live Stats Pill */}
            <div className="mt-5 w-full flex items-center justify-between p-3 rounded-[10px] bg-[#141418] border border-[#27272A] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[#A1A1AA]">
                  {isConnected ? 'Real-Time Dispatch Live' : 'Connecting Engine...'}
                </span>
              </div>
              <span className="text-[#FAFAFA] tabular-nums font-bold">
                {secondsRemaining}s remaining
              </span>
            </div>

            {/* Trip Summary Preview */}
            {rideData?.ride && (
              <div className="mt-3 w-full p-3 rounded-[10px] bg-[#0F0F12] border border-[#27272A] text-left text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-[#34D399] shrink-0 mt-0.5" />
                  <span className="text-[#A1A1AA] truncate">
                    <strong className="text-[#FAFAFA]">Pickup:</strong> {rideData.ride.pickup_address}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="size-3.5 text-[#F87171] shrink-0 mt-0.5" />
                  <span className="text-[#A1A1AA] truncate">
                    <strong className="text-[#FAFAFA]">Dropoff:</strong> {rideData.ride.dropoff_address}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#27272A] text-[11px] font-mono text-[#A1A1AA]">
                  <span>Estimated Fare:</span>
                  <span className="text-[#FAFAFA] font-bold text-sm">
                    ₹{Math.round(rideData.ride.estimated_fare || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Cancel Action */}
            <div className="mt-6 w-full flex items-center justify-center">
              <Button
                variant="destructive"
                size="md"
                fullWidth
                loading={cancelling}
                onClick={handleCancelRequest}
                icon={X}
              >
                Cancel Ride Request
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
