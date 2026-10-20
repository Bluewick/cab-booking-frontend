import React, { useState } from 'react';
import { Gauge, Compass, Maximize2, Minimize2 } from 'lucide-react';
import MapEngine from './MapEngine';

/**
 * Obsidian Geist LiveRouteMap with Floating HUD Telemetry Overlay
 */
export default function LiveRouteMap({
  pickup,
  stops = [],
  dropoff,
  driverLocation = null,
  routeStats = { distance_km: 13.5, duration_minutes: 33 },
  height = '480px',
  interactive = true,
  onMapClick = null,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{ height: expanded ? '85vh' : height }}
      className={`relative isolate z-0 w-full rounded-[16px] overflow-hidden border border-[#27272A] shadow-sm dark:shadow-[0_16px_40px_rgba(0,0,0,0.8)] transition-all duration-300 ${className}`}
    >
      {/* Interactive Map Core Engine */}
      <MapEngine
        pickup={pickup}
        stops={stops}
        dropoff={dropoff}
        driverLocation={driverLocation}
        interactive={interactive}
        onMapClick={onMapClick}
        className="w-full h-full"
      />

      {/* Floating Header HUD Overlay */}
      <div className="absolute top-4 inset-x-4 pointer-events-none z-20 flex items-center justify-between gap-3">
        {/* Route Summary Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] bg-white/95 dark:bg-[#0F0F12]/90 backdrop-blur-[16px] border border-[#E4E4E7] dark:border-[#27272A] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          <div className="size-2 rounded-full bg-[#10B981] animate-pulse" />
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-[#09090B] dark:text-[#FAFAFA]">
              {routeStats?.distance_km ? `${routeStats.distance_km} km` : 'Calculating...'}
            </span>
            <span className="text-[#E4E4E7] dark:text-[#27272A]">|</span>
            <span className="text-[#2563EB] dark:text-[#60A5FA] font-medium">
              {routeStats?.duration_minutes ? `~${routeStats.duration_minutes} mins` : 'Estimating...'}
            </span>
            {stops && stops.length > 0 && (
              <>
                <span className="text-[#E4E4E7] dark:text-[#27272A]">|</span>
                <span className="text-[#D97706] dark:text-[#FBBF24] font-mono">
                  {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Viewport Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {driverLocation && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/95 dark:bg-[#0F0F12]/90 backdrop-blur-[16px] border border-[#E4E4E7] dark:border-[#27272A] text-xs font-mono text-[#09090B] dark:text-[#FAFAFA] shadow-sm">
              <Gauge className="size-3.5 text-[#059669] dark:text-[#34D399]" />
              <span>{Math.round(driverLocation.speed || 0)} km/h</span>
              <Compass className="size-3.5 text-[#2563EB] dark:text-[#60A5FA] ml-1" />
              <span>{Math.round(driverLocation.bearing || 0)}°</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse map' : 'Expand map'}
            className="p-2 rounded-[8px] bg-white/95 dark:bg-[#0F0F12]/90 backdrop-blur-[16px] border border-[#E4E4E7] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46] transition-colors shadow-sm dark:shadow-lg cursor-pointer"
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Floating Bottom Route Legend (Mobile & Desktop) */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-20 hidden sm:flex items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-[8px] bg-white/95 dark:bg-[#09090B]/85 backdrop-blur-[12px] border border-[#E4E4E7] dark:border-[#27272A] text-[11px] font-mono shadow-sm">
          <div className="flex items-center gap-1.5 text-[#059669] dark:text-[#34D399]">
            <span className="size-2 rounded-full bg-[#10B981]" />
            <span>Pickup</span>
          </div>
          {stops.length > 0 && (
            <div className="flex items-center gap-1.5 text-[#D97706] dark:text-[#FBBF24]">
              <span className="size-2 rounded-full bg-[#F59E0B]" />
              <span>Stops ({stops.length})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[#DC2626] dark:text-[#F87171]">
            <span className="size-2 rounded-full bg-[#EF4444]" />
            <span>Dropoff</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#2563EB] dark:text-[#60A5FA]">
            <span className="w-3 h-1 rounded bg-[#3B82F6]" />
            <span>Route</span>
          </div>
        </div>
      </div>

    </div>
  );
}
