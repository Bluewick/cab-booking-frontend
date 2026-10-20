import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CARTO_DARK_NO_LABELS,
  CARTO_DARK_ONLY_LABELS,
  CARTO_VOYAGER_TILES,
  OSM_DARK_TILES,
  DEFAULT_MAP_CENTER,
} from './mapStyles';
import { generateCurvedRoute, fetchStreetRoute } from '../../utils/routeGeometry';
import GoogleMapEngine from './GoogleMapEngine';
import { createTopDownCarIcon } from './vehicleMarkerSvg';
import useTheme from '../../hooks/useTheme';

/**
 * Obsidian Geist Universal Map Engine
 * - Level 1: Native Google Maps (Turn-by-turn Directions) when VITE_GOOGLE_MAPS_API_KEY is present
 * - Level 2: CartoDB Dark Matter with High-Contrast Boosted Labels & OSRM Real Road-Snapping Navigation
 * - Level 3: Worldwide OpenStreetMap with Obsidian Dark Filter (100% Free, Zero Watermarks, No Keys Required)
 */
export default function MapEngine({
  center = [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
  zoom = 13,
  pickup = null,
  stops = [],
  dropoff = null,
  driverLocation = null,
  interactive = true,
  onMapClick = null,
  className = '',
}) {
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);

  // If Google Maps API key is configured in .env and user hasn't switched to Leaflet fallback
  if (googleApiKey && googleApiKey.trim() !== '' && !useLeafletFallback) {
    return (
      <div className={`relative isolate z-0 w-full h-full min-h-[380px] bg-[#09090B] overflow-hidden rounded-[14px] border border-[#27272A] ${className}`}>
        <GoogleMapEngine
          apiKey={googleApiKey}
          center={center}
          zoom={zoom}
          pickup={pickup}
          stops={stops}
          dropoff={dropoff}
          driverLocation={driverLocation}
          interactive={interactive}
          onMapClick={onMapClick}
          onFallback={() => setUseLeafletFallback(true)}
        />
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/95 dark:bg-[#09090B]/90 backdrop-blur-md border border-[#E4E4E7] dark:border-[#27272A] text-[10px] font-mono text-[#2563EB] dark:text-[#60A5FA] shadow-sm dark:shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
            Google Maps Active
          </span>
          <span className="text-[#D4D4D8] dark:text-[#3F3F46]">|</span>
          <button
            type="button"
            onClick={() => setUseLeafletFallback(true)}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
            title="Switch to Leaflet & Carto Street Map"
          >
            Switch to Leaflet
          </button>
        </div>
      </div>
    );
  }

  // Fallback / Default Real Street Map (Leaflet + High-Contrast CartoDB & OSRM Road Routing)
  return (
    <LeafletStreetEngine
      center={center}
      zoom={zoom}
      pickup={pickup}
      stops={stops}
      dropoff={dropoff}
      driverLocation={driverLocation}
      interactive={interactive}
      onMapClick={onMapClick}
      className={className}
      onSwitchToGoogle={
        googleApiKey && googleApiKey.trim() !== ''
          ? () => setUseLeafletFallback(false)
          : null
      }
    />
  );
}

function LeafletStreetEngine({
  center,
  zoom,
  pickup,
  stops,
  dropoff,
  driverLocation,
  interactive,
  onMapClick,
  className,
  onSwitchToGoogle = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayersRef = useRef([]);
  const markersLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);
  const driverLayerRef = useRef(null);
  const driverMarkerInstanceRef = useRef(null);

  const rawCartoKey = import.meta.env.VITE_CARTO_API_KEY;
  const cartoApiKey = rawCartoKey ? rawCartoKey.replace(/^["']|["']$/g, '').trim() : '';

  const { resolvedTheme } = useTheme();

  // Manual theme override if clicked on map HUD: null | 'dark' | 'voyager'
  const [manualMapTheme, setManualMapTheme] = useState(null);
  const mapTheme = manualMapTheme || (resolvedTheme === 'light' ? 'voyager' : 'dark');

  // Initialize Map Instance & Custom Panes once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: interactive,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
    });

    // Custom high-priority pane for illuminated street and place labels
    const labelsPane = map.createPane('labelsPane');
    labelsPane.style.zIndex = '450';
    labelsPane.style.pointerEvents = 'none';

    if (interactive) {
      L.control
        .zoom({
          position: 'bottomright',
        })
        .addTo(map);
    }

    markersLayerRef.current = L.layerGroup().addTo(map);
    polylineLayerRef.current = L.layerGroup().addTo(map);
    driverLayerRef.current = L.layerGroup().addTo(map);

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      driverMarkerInstanceRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tile Layers Management (Swaps cleanly on mapTheme or API key change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Purge active tile layers
    tileLayersRef.current.forEach((layer) => {
      try {
        map.removeLayer(layer);
      } catch {
        // layer already detached
      }
    });
    tileLayersRef.current = [];

    if (cartoApiKey) {
      if (mapTheme === 'voyager') {
        // High-clarity daylight navigation street map
        const voyagerLayer = L.tileLayer(`${CARTO_VOYAGER_TILES.url}?key=${cartoApiKey}`, {
          subdomains: CARTO_VOYAGER_TILES.subdomains,
          maxZoom: CARTO_VOYAGER_TILES.maxZoom,
        }).addTo(map);
        tileLayersRef.current.push(voyagerLayer);
      } else {
        // High-Contrast Obsidian Dark: Separated base layer + brightened readable labels overlay
        const baseLayer = L.tileLayer(`${CARTO_DARK_NO_LABELS.url}?key=${cartoApiKey}`, {
          subdomains: CARTO_DARK_NO_LABELS.subdomains,
          maxZoom: CARTO_DARK_NO_LABELS.maxZoom,
          className: 'carto-dark-streets',
        }).addTo(map);

        const labelsLayer = L.tileLayer(`${CARTO_DARK_ONLY_LABELS.url}?key=${cartoApiKey}`, {
          subdomains: CARTO_DARK_ONLY_LABELS.subdomains,
          maxZoom: CARTO_DARK_ONLY_LABELS.maxZoom,
          pane: 'labelsPane',
          className: 'carto-high-contrast-labels',
        }).addTo(map);

        tileLayersRef.current.push(baseLayer, labelsLayer);
      }
    } else {
      // Zero-key fallback OpenStreetMap with Obsidian CSS filter
      const osmLayer = L.tileLayer(OSM_DARK_TILES.url, {
        maxZoom: OSM_DARK_TILES.maxZoom,
        attribution: OSM_DARK_TILES.attribution,
      }).addTo(map);
      tileLayersRef.current.push(osmLayer);
    }
  }, [mapTheme, cartoApiKey]);

  // Route Polyline & Waypoint Markers Effect (Snaps to real road networks via OSRM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polylineLayer = polylineLayerRef.current;

    if (!map || !markersLayer || !polylineLayer) return;

    markersLayer.clearLayers();
    polylineLayer.clearLayers();

    const waypointsForBounds = [];
    const routePoints = [];

    // 1. Pickup Waypoint Marker (Emerald Halo)
    if (pickup && pickup.latitude && pickup.longitude) {
      const pickupLatLng = [pickup.latitude, pickup.longitude];
      waypointsForBounds.push(pickupLatLng);
      routePoints.push(pickupLatLng);

      const pickupIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute size-7 rounded-full bg-[#10B981]/20 animate-ping"></span>
            <span class="size-6 rounded-full bg-[#10B981]/30 border border-[#10B981] flex items-center justify-center shadow-[0_0_12px_#10B981]">
              <span class="size-2.5 rounded-full bg-[#FAFAFA]"></span>
            </span>
            <span class="absolute -top-7 whitespace-nowrap bg-[#0F0F12]/90 border border-[#10B981]/40 text-[#34D399] text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg">
              PICKUP
            </span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(pickupLatLng, { icon: pickupIcon })
        .bindPopup(`<b style="color: #34D399">Pickup:</b><br/>${pickup.address || 'Pickup Point'}`)
        .addTo(markersLayer);
    }

    // 2. Intermediate Stops (Numbered Amber Pills)
    if (stops && stops.length > 0) {
      stops.forEach((stop, index) => {
        if (!stop.latitude || !stop.longitude) return;
        const stopLatLng = [stop.latitude, stop.longitude];
        waypointsForBounds.push(stopLatLng);
        routePoints.push(stopLatLng);

        const stopIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="size-6 rounded-full bg-[#F59E0B]/30 border border-[#F59E0B] flex items-center justify-center shadow-[0_0_10px_#F59E0B]">
                <span class="text-[10px] font-bold text-[#FAFAFA] font-mono">${index + 1}</span>
              </span>
              <span class="absolute -top-7 whitespace-nowrap bg-[#0F0F12]/90 border border-[#F59E0B]/40 text-[#FBBF24] text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg">
                STOP ${index + 1}
              </span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker(stopLatLng, { icon: stopIcon })
          .bindPopup(`<b style="color: #FBBF24">Stop ${index + 1}:</b><br/>${stop.address || 'Way-station'}`)
          .addTo(markersLayer);
      });
    }

    // 3. Dropoff Waypoint Marker (Crimson Target)
    if (dropoff && dropoff.latitude && dropoff.longitude) {
      const dropoffLatLng = [dropoff.latitude, dropoff.longitude];
      waypointsForBounds.push(dropoffLatLng);
      routePoints.push(dropoffLatLng);

      const dropoffIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="size-6 rounded-full bg-[#EF4444]/30 border border-[#EF4444] flex items-center justify-center shadow-[0_0_12px_#EF4444]">
              <span class="size-2.5 rounded-sm bg-[#FAFAFA]"></span>
            </span>
            <span class="absolute -top-7 whitespace-nowrap bg-[#0F0F12]/90 border border-[#EF4444]/40 text-[#F87171] text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg">
              DROPOFF
            </span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(dropoffLatLng, { icon: dropoffIcon })
        .bindPopup(`<b style="color: #F87171">Dropoff:</b><br/>${dropoff.address || 'Destination'}`)
        .addTo(markersLayer);
    }

    // Glowing Neon Polyline Renderer
    const renderRoutePolyline = (coords) => {
      polylineLayer.clearLayers();

      // Outer diffused neon glow
      L.polyline(coords, {
        color: '#3B82F6',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(polylineLayer);

      // Inner electric azure core
      L.polyline(coords, {
        color: '#60A5FA',
        weight: 3.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(polylineLayer);
    };

    // 4. Render Route (Instant preview + Accurate Real Road Navigation via OSRM)
    let isCancelled = false;

    if (routePoints.length >= 2) {
      // Step A: Immediate curve preview so user feels zero latency
      const instantRoute = generateCurvedRoute(routePoints, 20);
      renderRoutePolyline(instantRoute);

      // Step B: Async road network snapping (follows actual streets & highways)
      fetchStreetRoute(routePoints).then((roadCoords) => {
        if (!isCancelled && roadCoords && roadCoords.length >= 2) {
          renderRoutePolyline(roadCoords);
        }
      });
    }

    // 5. Bounds Fitting
    if (waypointsForBounds.length >= 2) {
      const bounds = L.latLngBounds(waypointsForBounds);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    } else if (waypointsForBounds.length === 1) {
      map.setView(waypointsForBounds[0], 14, { animate: true });
    }

    return () => {
      isCancelled = true;
    };
  }, [pickup, stops, dropoff]);

  // Moving Driver Telemetry Effect (Separated to maintain 60fps without polyline re-fetches)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const driverLayer = driverLayerRef.current;

    if (!map || !driverLayer) return;

    // If driverLocation is null, unmounted, or missing coordinates, remove marker
    if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
      if (driverMarkerInstanceRef.current) {
        try {
          driverLayer.removeLayer(driverMarkerInstanceRef.current);
        } catch {
          // layer already detached
        }
        driverMarkerInstanceRef.current = null;
      }
      return;
    }

    const driverLatLng = [driverLocation.latitude, driverLocation.longitude];
    const bearing = driverLocation.bearing || 0;
    const speed = Math.round(driverLocation.speed || 0);

    const popupContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; padding: 2px 4px; line-height: 1.4; color: #FAFAFA;">
        <div style="font-weight: 700; color: #38BDF8; display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
          Active Vehicle
        </div>
        <div style="margin-top: 2px; color: #D4D4D8;">
          Speed: <span style="font-weight: 600; color: #FAFAFA;">${speed} km/h</span> | 
          Heading: <span style="font-family: monospace; color: #A1A1AA;">${Math.round(bearing)}°</span>
        </div>
      </div>
    `;

    // If marker doesn't exist yet, instantiate it with top-down aerodynamic vehicle SVG
    if (!driverMarkerInstanceRef.current) {
      const carIcon = createTopDownCarIcon(L, bearing);
      const marker = L.marker(driverLatLng, {
        icon: carIcon,
        zIndexOffset: 1000,
      })
        .bindPopup(popupContent)
        .addTo(driverLayer);

      driverMarkerInstanceRef.current = marker;
    } else {
      // Smoothly update marker coordinates on map canvas
      driverMarkerInstanceRef.current.setLatLng(driverLatLng);

      // Smoothly rotate the top-down car model along heading angle
      const markerEl = driverMarkerInstanceRef.current.getElement();
      if (markerEl) {
        const rotateEl = markerEl.querySelector('.driver-car-rotate');
        if (rotateEl) {
          rotateEl.style.transform = `rotate(${bearing}deg)`;
        }
      }

      driverMarkerInstanceRef.current.setPopupContent(popupContent);
    }
  }, [driverLocation]);

  return (
    <div className={`relative isolate z-0 w-full h-full min-h-[380px] bg-[#09090B] overflow-hidden rounded-[14px] border border-[#27272A] ${className}`}>
      <div
        ref={mapContainerRef}
        className={`w-full h-full min-h-[380px] ${!cartoApiKey && resolvedTheme === 'dark' ? 'leaflet-dark-mode' : ''}`}
      />

      <div className="absolute inset-x-0 top-0 h-10 pointer-events-none bg-gradient-to-b from-white/60 dark:from-[#09090B]/60 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none bg-gradient-to-t from-white/60 dark:from-[#09090B]/60 to-transparent z-10" />

      {/* Map Theme Toggle & Attribution Badge */}
      <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 p-1 rounded-[10px] bg-white/95 dark:bg-[#09090B]/90 backdrop-blur-[14px] border border-[#E4E4E7] dark:border-[#27272A] shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
        {cartoApiKey ? (
          <>
            <button
              type="button"
              onClick={() => setManualMapTheme('dark')}
              title="High-Contrast Obsidian Dark Map with Illuminated Labels"
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono transition-all cursor-pointer ${
                mapTheme === 'dark'
                  ? 'bg-[#27272A] text-[#FAFAFA] font-semibold border border-[#3F3F46] shadow-[0_0_10px_rgba(255,255,255,0.06)]'
                  : 'text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              Dark Mode
            </button>
            <button
              type="button"
              onClick={() => setManualMapTheme('voyager')}
              title="High-Visibility Daytime Street Navigation"
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono transition-all cursor-pointer ${
                mapTheme === 'voyager'
                  ? 'bg-[#3B82F6]/25 text-[#60A5FA] border border-[#3B82F6]/60 font-semibold shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              Day Streets
            </button>
          </>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-mono text-[#A1A1AA]">
            Live Street Map (Watermark-Free)
          </span>
        )}

        {onSwitchToGoogle && (
          <>
            <span className="text-[#3F3F46]">|</span>
            <button
              type="button"
              onClick={onSwitchToGoogle}
              title="Switch to Google Maps"
              className="px-2.5 py-1 rounded-[6px] text-[11px] font-mono text-[#60A5FA] hover:text-[#93C5FD] transition-all cursor-pointer border border-[#3B82F6]/30 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20"
            >
              Google Maps
            </button>
          </>
        )}
      </div>
    </div>
  );
}

