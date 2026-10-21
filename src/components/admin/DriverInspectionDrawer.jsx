import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Car,
  Copy,
  Check,
  Star,
  Compass,
  Calendar,
  Clock,
} from 'lucide-react';
import Drawer from '../common/Drawer';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../feedback/Spinner';
import driverService from '../../services/driver.service';
import useToast from '../../hooks/useToast';

/**
 * Obsidian Geist Driver Inspection & Compliance Drawer
 * Renders full driver credentials, vehicle fleet verification details,
 * live GPS telemetry, and administrative verify/revoke actions.
 */
export default function DriverInspectionDrawer({
  isOpen,
  onClose,
  driver: initialDriver,
  onVerify,
  onRevokeRequest,
  actionLoading = false,
}) {
  const toast = useToast();
  const [driver, setDriver] = useState(initialDriver);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Sync state and fetch fresh details from GET /api/v1/drivers/:id
  useEffect(() => {
    if (!isOpen || !initialDriver) {
      setDriver(null);
      return;
    }

    setDriver(initialDriver);

    const targetId = initialDriver.driver_id || initialDriver.id || initialDriver.user_id;
    if (!targetId) return;

    let isMounted = true;
    setFetchingDetails(true);

    driverService.getDriverDetails(targetId)
      .then((fullData) => {
        if (!isMounted) return;
        if (fullData) {
          setDriver((prev) => ({ ...prev, ...fullData }));
        }
      })
      .catch((err) => {
        // Fall back gracefully to initialDriver if detailed endpoint fails
        console.warn('Could not fetch detailed driver profile:', err.message);
      })
      .finally(() => {
        if (isMounted) setFetchingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialDriver]);

  if (!isOpen || !driver) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`Copied to clipboard: ${text}`);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const isVerified = Boolean(driver.is_verified);
  const isOnline = Boolean(driver.is_online);

  const formattedDate = driver.created_at
    ? new Date(driver.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent registration';

  const lastLocationDate = driver.last_location_at
    ? new Date(driver.last_location_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const hasCoordinates =
    driver.current_latitude !== null &&
    driver.current_latitude !== undefined &&
    driver.current_longitude !== null &&
    driver.current_longitude !== undefined;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      title="Driver Inspection & Compliance"
      className="max-w-xl"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Loading overlay for background refresh */}
        {fetchingDetails && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#141418] border border-[#27272A] text-xs text-[#A1A1AA]">
            <Spinner size="xs" color="brand" />
            <span>Syncing latest profile telemetry...</span>
          </div>
        )}

        {/* Top Profile Header Card */}
        <div className="relative p-5 rounded-[14px] bg-[#141418] border border-[#27272A] flex flex-col gap-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="flex items-start gap-4">
            {/* Avatar / Monogram */}
            <div className="relative shrink-0">
              {driver.avatar_url ? (
                <img
                  src={driver.avatar_url}
                  alt={driver.full_name || 'Driver'}
                  className="size-16 rounded-full object-cover border-2 border-[#27272A] shadow-md"
                />
              ) : (
                <div className="size-16 rounded-full bg-gradient-to-br from-[#27272A] to-[#18181B] border border-[#3F3F46] flex items-center justify-center text-xl font-bold text-[#FAFAFA] shadow-md">
                  {(driver.full_name || 'Driver').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online/Offline status dot badge */}
              <div
                className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-[#141418] ${
                  isOnline ? 'bg-[#10B981]' : 'bg-[#71717A]'
                }`}
                title={isOnline ? 'Driver is Online' : 'Driver is Offline'}
              />
            </div>

            {/* Name & Quick Badges */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-lg font-semibold text-[#FAFAFA] truncate tracking-tight">
                  {driver.full_name || 'Unnamed Driver'}
                </h4>
                {isVerified ? (
                  <Badge variant="success" size="sm" icon={ShieldCheck}>
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm" pulse icon={ShieldAlert}>
                    Pending Review
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                <span className="flex items-center gap-1 font-mono">
                  <Star className="size-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="text-[#FAFAFA] font-medium tabular-nums">
                    {Number(driver.rating_average || 5).toFixed(2)}
                  </span>
                </span>
                <span>•</span>
                <span className="tabular-nums">
                  <strong className="text-[#FAFAFA]">{driver.total_rides || 0}</strong> trips
                </span>
                <span>•</span>
                <Badge
                  variant={isOnline ? 'success' : 'neutral'}
                  size="sm"
                  pulse={isOnline}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#71717A] mt-0.5">
                <Calendar className="size-3" />
                <span>Registered on {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Decision Header Bar */}
          <div className="pt-3 border-t border-[#27272A]/70 flex items-center justify-between gap-3">
            <span className="text-xs text-[#A1A1AA]">
              Status:{' '}
              <strong className={isVerified ? 'text-[#34D399]' : 'text-[#FBBF24]'}>
                {isVerified ? 'Authorized Partner' : 'Awaiting Admin Approval'}
              </strong>
            </span>

            {isVerified ? (
              <Button
                variant="destructive"
                size="sm"
                icon={UserX}
                loading={actionLoading}
                loadingText="Revoking..."
                onClick={() => onRevokeRequest(driver)}
              >
                Revoke Approval
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={UserCheck}
                loading={actionLoading}
                loadingText="Approving..."
                className="bg-[#10B981] hover:bg-[#059669] text-white"
                onClick={() => onVerify(driver.driver_id || driver.user_id, true)}
              >
                Approve Driver
              </Button>
            )}
          </div>
        </div>

        {/* Section 1: Vehicle Fleet Inspection */}
        <div className="p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272A]/70">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA] tracking-wide uppercase">
              <Car className="size-4 text-[#60A5FA]" />
              Vehicle Fleet Specification
            </span>
            <Badge variant="brand" size="sm">
              {driver.vehicle_category?.toUpperCase() || 'STANDARD'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Make & Model */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#71717A] uppercase font-semibold">Make & Model</span>
              <span className="text-sm font-medium text-[#FAFAFA]">
                {driver.make || 'Toyota'} {driver.model || 'Standard'}
              </span>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#71717A] uppercase font-semibold">Exterior Color</span>
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full border border-white/20"
                  style={{ backgroundColor: driver.color?.toLowerCase() || '#A1A1AA' }}
                />
                <span className="text-sm text-[#FAFAFA] capitalize">{driver.color || 'Silver'}</span>
              </div>
            </div>

            {/* License Plate Number */}
            <div className="sm:col-span-2 flex flex-col gap-1.5 mt-1">
              <span className="text-[11px] text-[#71717A] uppercase font-semibold">
                Official License Plate
              </span>
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#141418] border-2 border-[#27272A] shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center px-1.5 py-0.5 rounded bg-blue-700 text-[9px] font-bold text-white tracking-widest leading-none">
                    IND
                  </div>
                  <span className="font-mono text-base font-bold text-[#FAFAFA] tracking-widest tabular-nums">
                    {driver.plate_number || 'PENDING'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(driver.plate_number, 'plate')}
                  className="p-1 rounded text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                  title="Copy plate number"
                >
                  {copiedKey === 'plate' ? (
                    <Check className="size-4 text-[#10B981]" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Driver Licensing & Credentials */}
        <div className="p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272A]/70">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA] tracking-wide uppercase">
              <ShieldCheck className="size-4 text-[#34D399]" />
              Driver Licensing & Compliance
            </span>
            <span className="text-[11px] font-mono text-[#A1A1AA]">
              DL Reg. Record
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#141418] border border-[#27272A]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-[#71717A] uppercase">Driver License Number</span>
                <span className="font-mono text-sm font-semibold text-[#FAFAFA] tracking-wide tabular-nums">
                  {driver.license_number || 'Not provided'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(driver.license_number, 'dl')}
                className="p-1.5 rounded text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                title="Copy License Number"
              >
                {copiedKey === 'dl' ? (
                  <Check className="size-4 text-[#10B981]" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-[8px] bg-[#141418] border border-[#27272A] flex flex-col gap-1">
                <span className="text-[11px] text-[#71717A]">Rating Index</span>
                <div className="flex items-center gap-1.5">
                  <Star className="size-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="text-base font-semibold text-[#FAFAFA] tabular-nums">
                    {Number(driver.rating_average || 5).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#71717A]">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#141418] border border-[#27272A] flex flex-col gap-1">
                <span className="text-[11px] text-[#71717A]">Total Completed Rides</span>
                <span className="text-base font-semibold text-[#FAFAFA] tabular-nums">
                  {driver.total_rides || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Contact & System Identifiers */}
        <div className="p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272A]/70">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA] tracking-wide uppercase">
              <Mail className="size-4 text-[#A1A1AA]" />
              Contact & System Identifiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#71717A]">Email Address</span>
              <div className="flex items-center justify-between p-2 rounded bg-[#141418] border border-[#27272A]">
                <span className="text-[#FAFAFA] truncate" title={driver.email}>
                  {driver.email || 'N/A'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(driver.email, 'email')}
                  className="text-[#71717A] hover:text-[#FAFAFA] ml-1 shrink-0"
                >
                  {copiedKey === 'email' ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#71717A]">Phone Number</span>
              <div className="flex items-center justify-between p-2 rounded bg-[#141418] border border-[#27272A]">
                <span className="text-[#FAFAFA] font-mono">{driver.phone_number || 'N/A'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(driver.phone_number, 'phone')}
                  className="text-[#71717A] hover:text-[#FAFAFA] ml-1 shrink-0"
                >
                  {copiedKey === 'phone' ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Driver Profile ID */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#71717A]">Driver Profile ID</span>
              <div className="flex items-center justify-between p-2 rounded bg-[#141418] border border-[#27272A]">
                <span className="text-[#A1A1AA] font-mono truncate" title={driver.driver_id}>
                  {driver.driver_id || driver.id || 'N/A'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(driver.driver_id || driver.id, 'driver_id')}
                  className="text-[#71717A] hover:text-[#FAFAFA] ml-1 shrink-0"
                >
                  {copiedKey === 'driver_id' ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* User ID */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#71717A]">User ID</span>
              <div className="flex items-center justify-between p-2 rounded bg-[#141418] border border-[#27272A]">
                <span className="text-[#A1A1AA] font-mono truncate" title={driver.user_id}>
                  {driver.user_id || 'N/A'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(driver.user_id, 'user_id')}
                  className="text-[#71717A] hover:text-[#FAFAFA] ml-1 shrink-0"
                >
                  {copiedKey === 'user_id' ? <Check className="size-3.5 text-[#10B981]" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Real-Time Telemetry & Spatial Status */}
        <div className="p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272A]/70">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA] tracking-wide uppercase">
              <Compass className="size-4 text-[#F59E0B]" />
              Geospatial Telemetry
            </span>
            {hasCoordinates ? (
              <Badge variant="brand" size="sm" pulse>
                GPS Active
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                No Signal
              </Badge>
            )}
          </div>

          {hasCoordinates ? (
            <div className="flex flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-[#141418] border border-[#27272A] flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#71717A] uppercase">Latitude / Longitude</span>
                  <span className="font-mono font-medium text-[#FAFAFA] truncate">
                    {Number(driver.current_latitude).toFixed(4)}, {Number(driver.current_longitude).toFixed(4)}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#141418] border border-[#27272A] flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#71717A] uppercase">Speed & Bearing</span>
                  <span className="font-mono font-medium text-[#FAFAFA]">
                    {driver.speed || 0} km/h • {driver.bearing || 0}°
                  </span>
                </div>
              </div>

              {lastLocationDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
                  <Clock className="size-3 text-[#A1A1AA]" />
                  <span>Last beacon received at {lastLocationDate}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-[#71717A]">
              Driver is currently offline or has not broadcasted spatial coordinates yet.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#27272A] flex items-center justify-between gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            Close Drawer
          </Button>

          {isVerified ? (
            <Button
              variant="destructive"
              size="md"
              icon={UserX}
              loading={actionLoading}
              loadingText="Revoking..."
              onClick={() => onRevokeRequest(driver)}
            >
              Revoke Verification
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={UserCheck}
              loading={actionLoading}
              loadingText="Verifying..."
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              onClick={() => onVerify(driver.driver_id || driver.user_id, true)}
            >
              Verify & Approve Driver
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
