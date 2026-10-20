/**
 * Generates an interpolated, curved street-like route polyline between start, stops, and end coordinates
 */
export function generateCurvedRoute(points, steps = 15) {
  if (!points || points.length < 2) return [];

  const fullRoute = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Create a slight perpendicular offset to mimic real street navigation curves
    const midLat = (p1[0] + p2[0]) / 2;
    const midLng = (p1[1] + p2[1]) / 2;
    const offset = (Math.sin(i * 1.5 + 0.8) * 0.0035);

    const controlPoint = [midLat + offset, midLng - offset];

    // Quadratic Bezier interpolation
    for (let t = 0; t <= 1; t += 1 / steps) {
      const lat =
        (1 - t) * (1 - t) * p1[0] +
        2 * (1 - t) * t * controlPoint[0] +
        t * t * p2[0];
      const lng =
        (1 - t) * (1 - t) * p1[1] +
        2 * (1 - t) * t * controlPoint[1] +
        t * t * p2[1];
      fullRoute.push([lat, lng]);
    }
  }

  // Ensure final point is exact
  fullRoute.push(points[points.length - 1]);
  return fullRoute;
}

const routeCache = new Map();

/**
 * Fetches real turn-by-turn road polyline from OSRM (Open Source Routing Machine)
 * Snaps accurately to real roads and highways.
 * Falls back to curved Bezier interpolation if offline or request fails.
 */
export async function fetchStreetRoute(points) {
  if (!points || points.length < 2) return [];

  const cacheKey = points
    .map(([lat, lng]) => `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`)
    .join(';');

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const coordsString = points
      .map(([lat, lng]) => `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 0) {
      // OSRM returns [longitude, latitude], convert to Leaflet [latitude, longitude]
      const streetCoords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      routeCache.set(cacheKey, streetCoords);
      return streetCoords;
    }
  } catch (err) {
    console.warn('[Routing] Real road routing fallback to curved path:', err.message);
  }

  const fallback = generateCurvedRoute(points, 20);
  return fallback;
}

/**
 * Standard Coordinates for Bangalore Demo Nodes (from Backend API specification)
 */
export const BANGALORE_LOCATIONS = {
  mg_road: {
    name: 'MG Road Metro Station',
    lat: 12.9716,
    lng: 77.5946,
  },
  koramangala: {
    name: 'Koramangala Sony World Junction',
    lat: 12.9352,
    lng: 77.6245,
  },
  bellandur: {
    name: 'Bellandur EcoSpace Tech Park',
    lat: 12.9279,
    lng: 77.6835,
  },
  indiranagar: {
    name: '100ft Road, Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
  },
  whitefield: {
    name: 'ITPB, Whitefield',
    lat: 12.9866,
    lng: 77.7381,
  },
};
