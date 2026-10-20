import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';
import { calculateBearing, calculateDistanceKm } from '../utils/calculateBearing';

/**
 * Standard Bangalore telemetry loop for desktop simulation & headless testing
 */
const DEFAULT_SIMULATION_TRACK = [
  [12.9716, 77.5946], // MG Road Central
  [12.9738, 77.6012],
  [12.9760, 77.6095],
  [12.9780, 77.6200],
  [12.9783, 77.6408], // Indiranagar 100ft Road
  [12.9710, 77.6415],
  [12.9650, 77.6420], // Domlur Flyover
  [12.9500, 77.6350],
  [12.9352, 77.6245], // Koramangala 80ft Road
  [12.9340, 77.6101], // Koramangala 5th Block
  [12.9560, 77.5990], // Richmond Circle
  [12.9716, 77.5946], // Return to Central
];

/**
 * Driver Telemetry Streaming Hook
 * Streams real-time GPS coordinates via navigator.geolocation,
 * throttles dispatches to 2.5s intervals, computes dynamic bearing/speed,
 * and features a built-in simulation track for development testing.
 */
export function useDriverLocationStream({
  rideId = null,
  intervalMs = 2500,
  autoStart = false,
  customSimulationRoute = null,
  loop = true,
  simulateMovement = null,
  initialPosition = null,
} = {}) {
  const { isConnected, updateDriverLocation } = useSocket();

  const hasHardwareGps = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

  // If simulateMovement is not explicitly specified, default to true ONLY if an active rideId is present
  const shouldSimulateMovement =
    simulateMovement !== null ? simulateMovement : Boolean(rideId);

  const [isStreaming, setIsStreaming] = useState(autoStart);
  const [isSimulating, setIsSimulating] = useState(!hasHardwareGps);
  const [currentLocation, setCurrentLocation] = useState(initialPosition || null);
  const [lastError, setLastError] = useState(hasHardwareGps ? null : 'Geolocation API not supported.');

  const prevLocationRef = useRef(initialPosition || null);
  const watchIdRef = useRef(null);
  const simulationTimerRef = useRef(null);
  const simulationIndexRef = useRef(0);
  const lastEmitTimeRef = useRef(0);

  const trackRef = useRef(
    customSimulationRoute && customSimulationRoute.length > 1
      ? customSimulationRoute
      : DEFAULT_SIMULATION_TRACK
  );
  const loopRef = useRef(loop);

  // Sync track when customSimulationRoute or loop changes
  useEffect(() => {
    loopRef.current = loop;
    if (customSimulationRoute && customSimulationRoute.length > 1) {
      trackRef.current = customSimulationRoute;
      simulationIndexRef.current = 0;
    }
  }, [customSimulationRoute, loop]);

  // Helper to dispatch telemetry to backend with throttling
  const dispatchLocation = useCallback(
    async (coords) => {
      const now = Date.now();
      if (now - lastEmitTimeRef.current < intervalMs - 200) {
        return; // Throttled
      }
      lastEmitTimeRef.current = now;

      setCurrentLocation(coords);
      prevLocationRef.current = coords;

      if (isConnected) {
        try {
          await updateDriverLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            bearing: coords.bearing || 0,
            speed: coords.speed || 0,
            ride_id: rideId,
          });
        } catch (err) {
          console.warn('[Telemetry] Location dispatch failed:', err.message);
        }
      }
    },
    [isConnected, intervalMs, rideId, updateDriverLocation]
  );

  // Instant teleportation without throttle (for dev mode jumps & arrive events)
  const teleportTo = useCallback(
    async (coords) => {
      lastEmitTimeRef.current = 0;
      setCurrentLocation(coords);
      prevLocationRef.current = coords;

      if (isConnected) {
        try {
          await updateDriverLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            bearing: coords.bearing || 0,
            speed: coords.speed || 0,
            ride_id: rideId,
          });
        } catch (err) {
          console.warn('[Telemetry] Teleport dispatch failed:', err.message);
        }
      }
    },
    [isConnected, rideId, updateDriverLocation]
  );

  // Dynamic route update helper
  const setSimulationRoute = useCallback((points, shouldLoop = false) => {
    if (points && points.length > 1) {
      trackRef.current = points;
      loopRef.current = shouldLoop;
      simulationIndexRef.current = 0;
    }
  }, []);

  // Simulation Runner (Step-by-step waypoint progression when in transit, stationary when parked)
  useEffect(() => {
    if (!isStreaming || !isSimulating) {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
      return;
    }

    const stepSimulation = () => {
      const currentTrack = trackRef.current;
      if (!currentTrack || currentTrack.length < 1) return;

      // 1. If parked/idle (not simulating movement), keep vehicle stationary at parked location
      if (!shouldSimulateMovement) {
        const active = prevLocationRef.current || {
          latitude: currentTrack[0][0],
          longitude: currentTrack[0][1],
          bearing: 90,
        };

        dispatchLocation({
          latitude: active.latitude,
          longitude: active.longitude,
          bearing: active.bearing || 90,
          speed: 0,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 2. If simulating active movement (e.g. driving during active trip)
      if (currentTrack.length < 2) return;

      const currIdx = simulationIndexRef.current;
      let nextIdx;

      if (loopRef.current) {
        nextIdx = (currIdx + 1) % currentTrack.length;
      } else {
        if (currIdx >= currentTrack.length - 1) {
          // Reached destination, hold position
          const [destLat, destLng] = currentTrack[currentTrack.length - 1];
          dispatchLocation({
            latitude: destLat,
            longitude: destLng,
            bearing: 0,
            speed: 0,
            timestamp: new Date().toISOString(),
          });
          return;
        }
        nextIdx = currIdx + 1;
      }

      simulationIndexRef.current = nextIdx;

      const [currLat, currLng] = currentTrack[currIdx];
      const [nextLat, nextLng] = currentTrack[nextIdx];

      const bearing = calculateBearing(currLat, currLng, nextLat, nextLng);
      const distanceKm = calculateDistanceKm(currLat, currLng, nextLat, nextLng);

      // Estimate realistic driving speed based on step distance
      const speedKmh = Math.max(
        22,
        Math.min(60, Math.round((distanceKm / (intervalMs / 3600000)) * 10) / 10)
      );

      dispatchLocation({
        latitude: currLat,
        longitude: currLng,
        bearing,
        speed: speedKmh,
        timestamp: new Date().toISOString(),
      });
    };

    // Execute first step immediately
    stepSimulation();
    simulationTimerRef.current = setInterval(stepSimulation, intervalMs);

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    };
  }, [isStreaming, isSimulating, shouldSimulateMovement, intervalMs, dispatchLocation]);

  // Real Hardware GPS Watcher
  useEffect(() => {
    if (!isStreaming || isSimulating) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const handleSuccess = (position) => {
      setLastError(null);
      const { latitude, longitude, heading, speed } = position.coords;

      let computedBearing = heading;
      if (computedBearing === null || isNaN(computedBearing)) {
        if (prevLocationRef.current) {
          computedBearing = calculateBearing(
            prevLocationRef.current.latitude,
            prevLocationRef.current.longitude,
            latitude,
            longitude
          );
        } else {
          computedBearing = 0;
        }
      }

      // Convert speed from m/s to km/h if available
      const speedKmh = speed !== null && !isNaN(speed) ? Math.round(speed * 3.6) : 0;

      dispatchLocation({
        latitude,
        longitude,
        bearing: computedBearing,
        speed: speedKmh,
        timestamp: new Date(position.timestamp).toISOString(),
      });
    };

    const handleError = (error) => {
      console.warn('[Telemetry] Geolocation error:', error.message);
      setLastError(error.message);
      // Auto-fallback to simulation on permission denial
      if (error.code === error.PERMISSION_DENIED) {
        setIsSimulating(true);
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000,
    });

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isStreaming, isSimulating, dispatchLocation]);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  return {
    isStreaming,
    isSimulating,
    currentLocation,
    lastError,
    startStreaming,
    stopStreaming,
    toggleSimulation,
    setIsSimulating,
    teleportTo,
    setSimulationRoute,
  };
}

export default useDriverLocationStream;
