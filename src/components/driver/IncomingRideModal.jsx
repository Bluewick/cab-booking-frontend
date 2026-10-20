import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Clock, Check, X, BellRing } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import useToast from '../../hooks/useToast';
import driverService from '../../services/driver.service';
import soundEffects from '../../utils/soundEffects';

/**
 * Incoming Ride Dispatch Modal
 * Pops up when a new ride opportunity is broadcasted to the driver.
 * Features 15-second auto-expiration countdown ring and instant trip acceptance.
 */
export default function IncomingRideModal({
  isOpen,
  onClose,
  request,
  onAcceptSuccess,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [accepting, setAccepting] = useState(false);
  const audioPlayedRef = useRef(false);

  // Play audio chime and trigger 15-second countdown
  useEffect(() => {
    if (!isOpen || !request) {
      audioPlayedRef.current = false;
      return;
    }

    if (!audioPlayedRef.current) {
      soundEffects.playIncomingRequestPing();
      audioPlayedRef.current = true;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // Auto-dismiss on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen, request, onClose]);

  if (!isOpen || !request) return null;

  const grossFare = parseFloat(request.estimated_fare || 240);
  const netEarnings = Math.round(grossFare * 0.8); // 80% driver net payout

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const ride = await driverService.acceptRide(request.ride_id);
      toast.success('Trip accepted! Proceeding to pickup navigation.', 'Ride Accepted');
      if (onAcceptSuccess) {
        onAcceptSuccess(ride);
      }
      onClose();
      navigate(`/driver/trips/${request.ride_id}`);
    } catch (err) {
      toast.error(err.message || 'Ride is no longer available or was accepted by another driver.');
      onClose();
    } finally {
      setAccepting(false);
    }
  };

  const progressPercent = (secondsRemaining / 15) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      className="!p-0 !bg-[#09090B] border-2 border-[#3B82F6] shadow-[0_0_40px_rgba(59,130,246,0.3)] overflow-hidden"
    >
      <div className="relative p-6 flex flex-col gap-5">
        {/* Top Header with Chime Bell & Timer Ring */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-[9px] bg-[#3B82F6]/20 border border-[#3B82F6] flex items-center justify-center text-[#60A5FA] animate-pulse">
              <BellRing className="size-5" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#60A5FA]">
                New Trip Dispatch
              </span>
              <h2 className="text-lg font-bold text-[#FAFAFA] leading-none mt-0.5">
                Incoming Ride Opportunity
              </h2>
            </div>
          </div>

          {/* 15s Countdown Ring */}
          <div className="relative size-11 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#27272A]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#3B82F6] transition-all duration-1000 ease-linear"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-[#FAFAFA] tabular-nums">
              {secondsRemaining}s
            </span>
          </div>
        </div>

        {/* Driver Net Earnings Highlight */}
        <div className="p-4 rounded-[12px] bg-gradient-to-br from-[#18181B] to-[#141418] border border-[#27272A] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-[#34D399] uppercase tracking-wider">
              Your Net Payout (80%)
            </span>
            <span className="text-3xl font-bold font-mono text-[#FAFAFA] tabular-nums">
              ₹{netEarnings}
            </span>
          </div>

          <div className="flex flex-col items-end text-xs font-mono text-[#71717A]">
            <span>Gross Fare: ₹{Math.round(grossFare)}</span>
            <span className="text-[#3B82F6] font-semibold flex items-center gap-1 mt-1">
              <Clock className="size-3" /> ~{request.duration_minutes || 25} mins
            </span>
            <span>{request.distance_km || 8.5} km total</span>
          </div>
        </div>

        {/* Route Waypoints Itinerary */}
        <div className="flex flex-col gap-3 p-3.5 rounded-[12px] bg-[#0F0F12] border border-[#27272A] text-xs">
          {/* Pickup Point */}
          <div className="flex items-start gap-2.5">
            <div className="size-6 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
              <MapPin className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-[#34D399] uppercase">Pickup Point</span>
              <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                {request.pickup?.address || 'Pickup Station'}
              </span>
            </div>
          </div>

          <div className="w-0.5 h-3 bg-[#27272A] ml-3" />

          {/* Dropoff Point */}
          <div className="flex items-start gap-2.5">
            <div className="size-6 rounded-full bg-[#EF4444]/20 border border-[#EF4444] flex items-center justify-center text-[#EF4444] shrink-0 mt-0.5">
              <Navigation className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-[#F87171] uppercase">Final Destination</span>
              <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                {request.dropoff?.address || 'Destination Dropoff'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            icon={X}
            disabled={accepting}
            className="border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            Decline
          </Button>

          <Button
            variant="primary"
            size="lg"
            loading={accepting}
            onClick={handleAccept}
            icon={Check}
            className="bg-[#10B981] text-[#09090B] hover:bg-[#34D399] shadow-[0_0_16px_rgba(16,185,129,0.4)]"
          >
            Accept Ride
          </Button>
        </div>
      </div>
    </Modal>
  );
}
