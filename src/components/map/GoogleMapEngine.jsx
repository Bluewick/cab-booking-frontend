import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  GOOGLE_MAPS_DARK_STYLE,
  GOOGLE_MAPS_LIGHT_STYLE,
  DEFAULT_MAP_CENTER,
  ROUTE_HIGHLIGHT_THEMES,
} from './mapStyles';
import { generateCurvedRoute, fetchStreetRoute } from '../../utils/routeGeometry';
import { createGoogleTopDownCarIcon } from './vehicleMarkerSvg';
import useTheme from '../../hooks/useTheme';

/**
 * Native Google Maps Engine with Illuminated Road Route Highlighting
 * - Powered by @googlemaps/js-api-loader v2 functional API
 * - Renders high-contrast dark asphalt Google Map with real road-snapped polylines
 * - Dual-layer neon glow (diffused outer halo + bright inner core + directional chevrons)
 * - Automatic OSRM real road network fallback if Google Directions is restricted on demo keys
 * - Live interactive route highlight color switcher (Azure, Emerald, Amber, Violet)
 */
export default function GoogleMapEngine({
  apiKey,
  center = DEFAULT_MAP_CENTER,
  zoom = 13,
  pickup = null,
  stops = [],
  dropoff = null,
  driverLocation = null,
  interactive = true,
  onMapClick = null,
  onFallback = null,
  initialHighlightColor = 'azure',
  className = '',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routePolylinesRef = useRef([]);
  const currentRouteCoordsRef = useRef([]);

  const [loadError, setLoadError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState(initialHighlightColor);

  const { resolvedTheme } = useTheme();

  // Helper to render high-contrast dual-layer glowing polyline on Google Map canvas
  const renderHighlightedRoute = useCallback(
    (coords, themeKey = activeTheme) => {
      const map = mapRef.current;
      if (!map || !window.google) return;

      // Purge active route polylines
      routePolylinesRef.current.forEach((poly) => poly.setMap(null));
      routePolylinesRef.current = [];

      if (!coords || coords.length < 2) {
        currentRouteCoordsRef.current = [];
        return;
      }

      currentRouteCoordsRef.current = coords;
      const theme = ROUTE_HIGHLIGHT_THEMES[themeKey] || ROUTE_HIGHLIGHT_THEMES.azure;
      const isLight = resolvedTheme === 'light';

      // Layer 1: Outer diffused neon glow halo
      const glowPolyline = new window.google.maps.Polyline({
        path: coords,
        map: map,
        strokeColor: isLight ? '#3B82F6' : theme.glowColor,
        strokeOpacity: isLight ? 0.28 : theme.glowOpacity,
        strokeWeight: isLight ? 8 : theme.glowWeight,
        zIndex: 10,
      });

      // Layer 2: Inner luminous core polyline with directional travel chevrons
      const corePolyline = new window.google.maps.Polyline({
        path: coords,
        map: map,
        strokeColor: isLight ? '#1D4ED8' : theme.coreColor,
        strokeOpacity: 0.98,
        strokeWeight: theme.coreWeight,
        zIndex: 11,
        icons: [
          {
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 2.2,
              fillColor: isLight ? '#FFFFFF' : theme.arrowColor,
              fillOpacity: 0.95,
              strokeColor: isLight ? '#1D4ED8' : theme.glowColor,
              strokeWeight: 1.2,
            },
            offset: '45px',
            repeat: '95px',
          },
        ],
      });

      routePolylinesRef.current = [glowPolyline, corePolyline];
    },
    [activeTheme, resolvedTheme]
  );

  // Re-render polyline whenever user switches highlight color theme or resolvedTheme
  useEffect(() => {
    if (currentRouteCoordsRef.current.length >= 2) {
      renderHighlightedRoute(currentRouteCoordsRef.current, activeTheme);
    }
  }, [activeTheme, resolvedTheme, renderHighlightedRoute]);

  // Initialize Google Maps instance with modern v2 functional API
  useEffect(() => {
    if (!containerRef.current || !apiKey) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    // Global listener for Google Maps authentication failures
    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed (invalid or restricted API key).');
      if (isMounted) {
        setLoadError('Google Maps Authentication failed (Invalid, expired, or restricted API key).');
      }
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
    };

    async function initGoogleMaps() {
      try {
        setOptions({
          key: apiKey.trim(),
          v: 'weekly',
          libraries: ['places', 'geometry'],
        });

        const [{ Map }, routesLib] = await Promise.all([
          importLibrary('maps'),
          importLibrary('routes'),
          importLibrary('marker'),
          importLibrary('places'),
          importLibrary('geometry'),
        ]);

        if (!isMounted || !containerRef.current) return;

        const centerLat = center[0] ?? center.lat ?? DEFAULT_MAP_CENTER.lat;
        const centerLng = center[1] ?? center.lng ?? DEFAULT_MAP_CENTER.lng;

        const map = new Map(containerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoom,
          styles: resolvedTheme === 'light' ? GOOGLE_MAPS_LIGHT_STYLE : GOOGLE_MAPS_DARK_STYLE,
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          backgroundColor: resolvedTheme === 'light' ? '#f8fafc' : '#09090b',
        });

        // Initialize DirectionsRenderer with suppressed default markers and polylines
        // so our custom glowing neon route and waypoints have full control
        const DirectionsRendererClass =
          routesLib?.DirectionsRenderer || window.google?.maps?.DirectionsRenderer;

        let directionsRenderer = null;
        if (DirectionsRendererClass) {
          directionsRenderer = new DirectionsRendererClass({
            map: map,
            suppressMarkers: true,
            suppressPolylines: true, // We draw our custom glowing dual-layer highlighted polyline
          });
        }

        if (onMapClick) {
          map.addListener('click', (e) => {
            onMapClick({
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng(),
            });
          });
        }

        mapRef.current = map;
        directionsRendererRef.current = directionsRenderer;
        if (isMounted) {
          setMapReady(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Google Maps Load Error:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Google Maps failed to load');
          setIsLoading(false);
        }
      }
    }

    initGoogleMaps();

    return () => {
      isMounted = false;
      window.gm_authFailure = prevAuthFailure;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      routePolylinesRef.current.forEach((p) => p.setMap(null));
      routePolylinesRef.current = [];
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
        driverMarkerRef.current = null;
      }
    };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamically update Google Map styles and background when resolvedTheme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setOptions({
      styles: resolvedTheme === 'light' ? GOOGLE_MAPS_LIGHT_STYLE : GOOGLE_MAPS_DARK_STYLE,
      backgroundColor: resolvedTheme === 'light' ? '#f8fafc' : '#09090b',
    });
  }, [resolvedTheme, mapReady]);

  // Update Waypoints & Calculate Road-Snapped Highlighted Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google || !mapReady) return;

    let isCancelled = false;

    // Clear previous custom markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    const routePoints = [];

    // 1. Pickup Marker (Emerald)
    if (pickup && pickup.latitude && pickup.longitude) {
      const pos = { lat: pickup.latitude, lng: pickup.longitude };
      bounds.extend(pos);
      routePoints.push([pickup.latitude, pickup.longitude]);

      const marker = new window.google.maps.Marker({
        position: pos,
        map: map,
        title: `Pickup: ${pickup.address || ''}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FAFAFA',
          strokeWeight: 2,
        },
        zIndex: 20,
      });
      markersRef.current.push(marker);
    }

    // 2. Intermediate Stops (Numbered Amber Pills)
    if (stops && stops.length > 0) {
      stops.forEach((stop, idx) => {
        if (!stop.latitude || !stop.longitude) return;
        const pos = { lat: stop.latitude, lng: stop.longitude };
        bounds.extend(pos);
        routePoints.push([stop.latitude, stop.longitude]);

        const marker = new window.google.maps.Marker({
          position: pos,
          map: map,
          label: {
            text: `${idx + 1}`,
            color: '#09090B',
            fontWeight: 'bold',
            fontSize: '11px',
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#F59E0B',
            fillOpacity: 1,
            strokeColor: '#FAFAFA',
            strokeWeight: 2,
          },
          zIndex: 20,
        });
        markersRef.current.push(marker);
      });
    }

    // 3. Dropoff Marker (Crimson Target)
    if (dropoff && dropoff.latitude && dropoff.longitude) {
      const pos = { lat: dropoff.latitude, lng: dropoff.longitude };
      bounds.extend(pos);
      routePoints.push([dropoff.latitude, dropoff.longitude]);

      const marker = new window.google.maps.Marker({
        position: pos,
        map: map,
        title: `Dropoff: ${dropoff.address || ''}`,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FAFAFA',
          strokeWeight: 2,
        },
        zIndex: 20,
      });
      markersRef.current.push(marker);
    }

    // 4. Moving Driver Vehicle Marker with Heading (Top-Down Aerial Vehicle Model)
    if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
      const pos = { lat: driverLocation.latitude, lng: driverLocation.longitude };
      bounds.extend(pos);

      const carIcon = createGoogleTopDownCarIcon(driverLocation.bearing || 0);

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: map,
          title: `Driver (${Math.round(driverLocation.speed || 0)} km/h)`,
          icon: carIcon || {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            rotation: driverLocation.bearing || 0,
          },
          zIndex: 30,
        });
      } else {
        driverMarkerRef.current.setPosition(pos);
        if (carIcon) {
          driverMarkerRef.current.setIcon(carIcon);
        } else {
          driverMarkerRef.current.setIcon({
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            rotation: driverLocation.bearing || 0,
          });
        }
      }
    } else if (!driverLocation && driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
      driverMarkerRef.current = null;
    }

    // 5. Query Street Route & Draw High-Contrast Glowing Road Highlight
    if (routePoints.length >= 2) {
      // Step A: Immediate curved preview so user feels zero latency
      const instantRoute = generateCurvedRoute(routePoints, 20);
      renderHighlightedRoute(instantRoute.map(([lat, lng]) => ({ lat, lng })));

      // Step B: Query Google DirectionsService
      if (window.google?.maps?.DirectionsService) {
        const directionsService = new window.google.maps.DirectionsService();

        const waypoints = (stops || [])
          .filter((s) => s.latitude && s.longitude)
          .map((s) => ({
            location: { lat: s.latitude, lng: s.longitude },
            stopover: true,
          }));

        directionsService.route(
          {
            origin: { lat: pickup.latitude, lng: pickup.longitude },
            destination: { lat: dropoff.latitude, lng: dropoff.longitude },
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (isCancelled) return;

            if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.overview_path) {
              renderHighlightedRoute(result.routes[0].overview_path);

              // Fit to Google's precise road bounds
              if (result.routes[0].bounds) {
                map.fitBounds(result.routes[0].bounds, { top: 60, right: 60, bottom: 60, left: 60 });
              }
            } else {
              // If Google Directions returns REQUEST_DENIED or fails on demo key:
              // Fallback to real road network snapping via OSRM
              console.warn(
                'Google DirectionsService returned status:',
                status,
                '— Falling back to OpenStreet Road network polyline.'
              );
              fetchStreetRoute(routePoints).then((roadCoords) => {
                if (!isCancelled && roadCoords && roadCoords.length >= 2) {
                  const googleCoords = roadCoords.map(([lat, lng]) => ({ lat, lng }));
                  renderHighlightedRoute(googleCoords);
                }
              });
            }
          }
        );
      } else {
        // Fallback to OSRM real street routing directly
        fetchStreetRoute(routePoints).then((roadCoords) => {
          if (!isCancelled && roadCoords && roadCoords.length >= 2) {
            const googleCoords = roadCoords.map(([lat, lng]) => ({ lat, lng }));
            renderHighlightedRoute(googleCoords);
          }
        });
      }
    } else {
      // Clear route polyline
      renderHighlightedRoute([]);
    }

    // Fit Bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }

    return () => {
      isCancelled = true;
    };
  }, [mapReady, pickup, stops, dropoff, driverLocation, renderHighlightedRoute]);

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#09090B] text-center p-6 border border-[#27272A] rounded-[14px]">
        <div className="size-11 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mb-3 text-[#F87171]">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[#FAFAFA] mb-1">Google Maps Engine Notice</h4>
        <p className="text-xs text-[#A1A1AA] max-w-md mb-4 leading-relaxed font-mono">
          {loadError}
        </p>
        <div className="flex items-center gap-3">
          {onFallback && (
            <button
              type="button"
              onClick={onFallback}
              className="px-4 py-2 rounded-lg bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 text-xs font-medium text-[#60A5FA] border border-[#3B82F6]/40 transition-colors cursor-pointer shadow-sm"
            >
              Switch to Free Street Map (Leaflet)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={`w-full h-full ${className}`} />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 dark:bg-[#09090B]/85 backdrop-blur-sm">
          <div className="size-8 rounded-full border-2 border-[#3B82F6]/30 border-t-[#3B82F6] animate-spin mb-2" />
          <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">Initializing Google Maps...</span>
        </div>
      )}

      {/* Floating Route Highlight Color Palette Selector */}
      {mapReady && (
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 p-1 rounded-[10px] bg-white/95 dark:bg-[#09090B]/90 backdrop-blur-[14px] border border-[#E4E4E7] dark:border-[#27272A] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
          <span className="text-[10px] font-mono text-[#71717A] px-1.5">Route:</span>
          {Object.entries(ROUTE_HIGHLIGHT_THEMES).map(([key, theme]) => {
            const isSelected = activeTheme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTheme(key)}
                title={`Highlight road route in ${theme.name}`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-mono transition-all cursor-pointer border ${
                  isSelected
                    ? theme.chipClass + ' font-semibold shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                    : 'border-transparent text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                <span className={`size-1.5 rounded-full ${theme.dotClass}`} />
                <span className="capitalize">{key}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
