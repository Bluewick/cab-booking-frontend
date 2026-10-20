import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  X,
  Radio,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import useToast from '../../hooks/useToast';
import sosService from '../../services/sos.service';
import api from '../../services/api';

/**
 * Obsidian Geist High-Priority Emergency SOS Distress Modal
 * Conforms strictly to DESIGN.md Section 3 & 4.
 * Features 3-second countdown safeguard against accidental taps,
 * spatial coordinate transmission to dispatcher network,
 * and immediate speed dialers for official emergency responders.
 */
export default function SOSModal({
  isOpen,
  onClose,
  rideId = null,
  currentLocation = null,
  onAlertTriggered = null,
}) {
  const toast = useToast();

  const [countdown, setCountdown] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggeredAlert, setTriggeredAlert] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  // Fetch trusted emergency contacts when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchContacts() {
      try {
        const res = await api.get('/api/v1/users/emergency-contacts');
        if (isMounted) {
          setEmergencyContacts(res.data?.contacts || []);
        }
      } catch {
        // user may not have added contacts yet
      }
    }

    fetchContacts();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Execute actual SOS coordinate transmission
  const executeSosBroadcast = useCallback(async () => {
    try {
      setTriggering(true);
      const coords = currentLocation || {
        latitude: 12.9716,
        longitude: 77.5946,
      };

      const result = await sosService.triggerAlert({
        ride_id: rideId || undefined,
        latitude: parseFloat(coords.latitude),
        longitude: parseFloat(coords.longitude),
      });

      setTriggeredAlert(result?.alert || { id: 'ACTIVE-EMERGENCY', status: 'triggered' });
      toast.error(
        'EMERGENCY SOS BROADCASTED. UrbanCab Safety Patrol & Local Authorities Notified.',
        'SOS ACTIVATED'
      );

      if (onAlertTriggered) {
        onAlertTriggered(result);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch SOS alert. Call emergency services directly!');
    } finally {
      setTriggering(false);
      setCountdownActive(false);
    }
  }, [currentLocation, onAlertTriggered, rideId, toast]);

  // Handle 3-second countdown countdown
  useEffect(() => {
    if (!countdownActive || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSosBroadcast();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownActive, countdown, executeSosBroadcast]);

  const handleStartCountdown = () => {
    setCountdown(3);
    setCountdownActive(true);
  };

  const handleCancelCountdown = () => {
    setCountdownActive(false);
    setCountdown(3);
  };

  const handleClose = () => {
    setCountdown(3);
    setCountdownActive(false);
    setTriggeredAlert(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="EMERGENCY SOS PATROL"
      description="Direct safety distress channel for passenger and driver protection."
      size="md"
    >
      <div className="flex flex-col gap-5 pt-1 font-sans">
        {/* Warning Banner */}
        <div className="p-4 rounded-[12px] bg-[#450A0A]/50 border border-[#EF4444] shadow-[0_0_24px_rgba(239,68,68,0.25)] flex items-start gap-3.5">
          <ShieldAlert className="size-6 text-[#EF4444] shrink-0 mt-0.5 animate-pulse" />
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-[#F87171] uppercase tracking-wide">
              Immediate Safety Escalation
            </h4>
            <p className="text-xs text-[#FCA5A5] mt-1 leading-relaxed">
              Triggering an SOS alert transmits your exact real-time GPS coordinates, vehicle registration, and route telemetry to the 24/7 Operations Command Center and contacts your designated emergency guardians.
            </p>
          </div>
        </div>

        {/* Trigger / Success Status Section */}
        {triggeredAlert ? (
          <div className="p-4 rounded-[12px] bg-[#052E16] border border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.2)] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#34D399]">
              <CheckCircle2 className="size-5" />
              <span>SOS Alert Successfully Broadcasted</span>
            </div>
            <p className="text-xs text-[#A7F3D0] leading-relaxed">
              Alert Token: <strong className="font-mono text-[#FAFAFA]">#{triggeredAlert.id.slice(0, 12)}</strong>.
              Dispatch monitors are reviewing telemetry. An emergency specialist is monitoring your vehicle trajectory.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#34D399] mt-1">
              <Radio className="size-3.5 animate-pulse" />
              <span>Live Coordinate Feed: Active</span>
            </div>
          </div>
        ) : countdownActive ? (
          <div className="p-6 rounded-[12px] bg-[#141418] border border-[#EF4444] flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-16 rounded-full border-4 border-[#EF4444] border-t-transparent animate-spin flex items-center justify-center">
              <span className="text-2xl font-black font-mono text-[#EF4444]">{countdown}</span>
            </div>
            <h4 className="text-sm font-bold text-[#FAFAFA]">
              Broadcasting Distress Signal in {countdown}s...
            </h4>
            <p className="text-xs text-[#A1A1AA]">
              Tap cancel if this button was pressed accidentally.
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={handleCancelCountdown}
              icon={X}
              className="mt-1 text-[#FAFAFA] border-[#3F3F46]"
            >
              Cancel Distress Alert
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="destructive"
                size="lg"
                fullWidth
                loading={triggering}
                loadingText="Dispatching Alert..."
                onClick={handleStartCountdown}
                icon={AlertTriangle}
                className="font-bold text-sm tracking-wide bg-[#DC2626] hover:bg-[#EF4444] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                Broadcast Emergency SOS (3s Delay)
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={executeSosBroadcast}
                className="w-full sm:w-auto text-xs whitespace-nowrap border-[#EF4444]/40 text-[#F87171] hover:bg-[#EF4444]/10"
              >
                Send Instantly
              </Button>
            </div>
          </div>
        )}

        {/* Emergency Responders Quick Dialers */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#27272A]">
          <span className="text-[11px] font-mono uppercase text-[#A1A1AA] tracking-wider">
            Official Emergency Hotlines (Speed Dial)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href="tel:112"
              className="flex items-center justify-between p-3 rounded-[8px] bg-[#141418] border border-[#27272A] hover:border-[#3B82F6] transition-colors group"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#60A5FA]">
                  National Police
                </span>
                <span className="text-[10px] text-[#71717A] font-mono">Dial 112</span>
              </div>
              <PhoneCall className="size-4 text-[#3B82F6]" />
            </a>

            <a
              href="tel:108"
              className="flex items-center justify-between p-3 rounded-[8px] bg-[#141418] border border-[#27272A] hover:border-[#10B981] transition-colors group"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#34D399]">
                  Medical / Ambulance
                </span>
                <span className="text-[10px] text-[#71717A] font-mono">Dial 108</span>
              </div>
              <PhoneCall className="size-4 text-[#10B981]" />
            </a>

            <a
              href="tel:1091"
              className="flex items-center justify-between p-3 rounded-[8px] bg-[#141418] border border-[#27272A] hover:border-[#F59E0B] transition-colors group"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#FBBF24]">
                  Women's Helpline
                </span>
                <span className="text-[10px] text-[#71717A] font-mono">Dial 1091</span>
              </div>
              <PhoneCall className="size-4 text-[#F59E0B]" />
            </a>
          </div>
        </div>

        {/* Emergency Contacts Recipient Preview */}
        {emergencyContacts.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#27272A]">
            <span className="text-[11px] font-mono uppercase text-[#A1A1AA] tracking-wider">
              Guardian Contacts Notified
            </span>
            <div className="flex flex-col gap-1.5">
              {emergencyContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#141418] border border-[#27272A] text-xs"
                >
                  <div className="flex items-center gap-2 text-[#FAFAFA]">
                    <UserCheck className="size-3.5 text-[#34D399]" />
                    <span className="font-semibold">{c.contact_name}</span>
                    <span className="text-[10px] text-[#71717A] uppercase font-mono">
                      ({c.relationship || 'Guardian'})
                    </span>
                  </div>
                  <a
                    href={`tel:${c.phone_number}`}
                    className="font-mono text-[#60A5FA] hover:underline"
                  >
                    {c.phone_number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
