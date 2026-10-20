/**
 * Top-Down Aerial Vehicle Marker Icon (SVG)
 * Faithful recreation of modern top-down aerial ride-hailing vehicle (Uber / Citymapper style).
 * Features:
 * - Crisp white aerodynamic sedan chassis with rounded bumpers and side mirrors
 * - Dark tinted windshield, rear glass, and passenger side windows with B-pillar
 * - Coral/peach wrap-around corner lights (front DRLs & rear tail lamps)
 * - Soft ambient chassis drop-shadow for realistic elevation above map tiles
 * - Center-of-mass rotation origin (17px, 32px) for smooth 60fps steering turns
 */

export const TOP_DOWN_CAR_BODY_INNER = `
  <defs>
    <!-- Soft Headlight Forward Illumination Beam -->
    <linearGradient id="headlightBeam" x1="17" y1="5" x2="17" y2="-12" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
    </linearGradient>
    <!-- Subtle Glass Glare Gradient -->
    <linearGradient id="glassGlare" x1="10" y1="16" x2="24" y2="25" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.04" />
    </linearGradient>
  </defs>

  <!-- Forward Navigation / Headlight Ambient Beam -->
  <polygon points="12,5 22,5 27,-10 7,-10" fill="url(#headlightBeam)" />

  <!-- Left Side Mirror -->
  <path
    d="M 6 20.5
       C 3.5 19.5, 1.2 20, 0.8 21.2
       C 0.5 22.2, 1.4 23.2, 3.6 23.6
       C 4.8 23.8, 5.6 23.2, 6 22.4 Z"
    fill="#FFFFFF"
    stroke="#D4D4D8"
    stroke-width="0.6"
  />

  <!-- Right Side Mirror -->
  <path
    d="M 28 20.5
       C 30.5 19.5, 32.8 20, 33.2 21.2
       C 33.5 22.2, 32.6 23.2, 30.4 23.6
       C 29.2 23.8, 28.4 23.2, 28 22.4 Z"
    fill="#FFFFFF"
    stroke="#D4D4D8"
    stroke-width="0.6"
  />

  <!-- Main Aerodynamic Car Body Chassis -->
  <path
    d="M 12 4.6
       C 14 4.1, 20 4.1, 22 4.6
       C 26 5.2, 28 7.2, 28.6 11.2
       C 29.1 15.2, 28.6 22, 28.6 28
       C 28.1 34, 28.6 40, 29.1 46.2
       C 29.6 52.4, 29.1 56.4, 27.6 58.4
       C 26 60.2, 22 60.8, 17 60.8
       C 12 60.8, 8 60.2, 6.4 58.4
       C 4.9 56.4, 4.4 52.4, 4.9 46.2
       C 5.4 40, 5.9 34, 5.4 28
       C 5.4 22, 4.9 15.2, 5.4 11.2
       C 6 7.2, 8 5.2, 12 4.6 Z"
    fill="#FFFFFF"
    stroke="#D4D4D8"
    stroke-width="0.75"
  />

  <!-- Front Hood Aerodynamic Creases -->
  <path d="M 13.5 9 L 14.8 15 M 20.5 9 L 19.2 15" stroke="#E4E4E7" stroke-width="0.5" stroke-linecap="round" />

  <!-- Front Left Wrap-around Corner Light (Coral/Peach Glow) -->
  <path
    d="M 6.8 7.4
       C 8.2 5.8, 10.6 5.1, 12.5 4.9
       C 11.2 6.2, 9 7.6, 7.8 9.5
       C 7.2 9, 6.9 8.2, 6.8 7.4 Z"
    fill="#FDA4AF"
    opacity="0.95"
  />

  <!-- Front Right Wrap-around Corner Light (Coral/Peach Glow) -->
  <path
    d="M 27.2 7.4
       C 25.8 5.8, 23.4 5.1, 21.5 4.9
       C 22.8 6.2, 25 7.6, 26.2 9.5
       C 26.8 9, 27.1 8.2, 27.2 7.4 Z"
    fill="#FDA4AF"
    opacity="0.95"
  />

  <!-- Front Windshield (Dark Automotive Tinted Glass) -->
  <path
    d="M 10 16.2
       C 13 15, 21 15, 24 16.2
       C 25.4 17.2, 25.9 22.2, 26.1 25.4
       C 21 26.2, 13 26.2, 7.9 25.4
       C 8.1 22.2, 8.6 17.2, 10 16.2 Z"
    fill="#09090B"
  />
  <!-- Windshield Reflection Glare -->
  <path
    d="M 10 16.2
       C 13 15, 21 15, 24 16.2
       C 25.4 17.2, 25.9 22.2, 26.1 25.4
       C 21 26.2, 13 26.2, 7.9 25.4
       C 8.1 22.2, 8.6 17.2, 10 16.2 Z"
    fill="url(#glassGlare)"
  />

  <!-- Left Front Side Passenger Window -->
  <path
    d="M 6.6 18.8
       C 7.4 18.8, 7.8 19.8, 8 24.8
       L 6.7 24.8
       C 6.4 22.8, 6.4 20.8, 6.6 18.8 Z"
    fill="#09090B"
  />
  <!-- Right Front Side Passenger Window -->
  <path
    d="M 27.4 18.8
       C 26.6 18.8, 26.2 19.8, 26 24.8
       L 27.3 24.8
       C 27.6 22.8, 27.6 20.8, 27.4 18.8 Z"
    fill="#09090B"
  />

  <!-- B-Pillars (Chassis Body Color dividing windows) -->
  <rect x="6.2" y="24.8" width="1.6" height="2" fill="#FFFFFF" />
  <rect x="26.2" y="24.8" width="1.6" height="2" fill="#FFFFFF" />

  <!-- Left Rear Side Passenger Window -->
  <path
    d="M 6.7 26.8
       L 8 26.8
       C 7.8 32.8, 7.5 36.8, 6.9 38.8
       L 6.5 37.8
       C 6.4 33.8, 6.5 29.8, 6.7 26.8 Z"
    fill="#09090B"
  />
  <!-- Right Rear Side Passenger Window -->
  <path
    d="M 27.3 26.8
       L 26 26.8
       C 26.2 32.8, 26.5 36.8, 27.1 38.8
       L 27.5 37.8
       C 27.6 33.8, 27.5 29.8, 27.3 26.8 Z"
    fill="#09090B"
  />

  <!-- Roof Panel (Sleek Clean White) -->
  <path
    d="M 8.2 25.8
       C 13 26.4, 21 26.4, 25.8 25.8
       L 25.8 39.2
       C 21 38.6, 13 38.6, 8.2 39.2 Z"
    fill="#FFFFFF"
  />

  <!-- Rear Window Glass (Dark Automotive Tinted Glass) -->
  <path
    d="M 8.1 39.2
       C 13 38.6, 21 38.6, 25.9 39.2
       C 25.4 43.2, 24.6 47.4, 23.4 49
       C 21 50.4, 13 50.4, 10.6 49
       C 9.4 47.4, 8.6 43.2, 8.1 39.2 Z"
    fill="#09090B"
  />
  <path
    d="M 11.2 48.2
       C 13.5 49.2, 17.5 49.2, 19.8 48.6"
    stroke="#FFFFFF"
    stroke-width="0.5"
    stroke-linecap="round"
    opacity="0.25"
    fill="none"
  />

  <!-- Rear Trunk Line Accent -->
  <path d="M 12 55.5 C 15 56.2, 19 56.2, 22 55.5" stroke="#E4E4E7" stroke-width="0.5" stroke-linecap="round" />

  <!-- Rear Left Wrap-around Taillight (Coral-Red Glow) -->
  <path
    d="M 6.4 54.4
       C 5.9 56.8, 7.4 58.8, 9.8 59.8
       C 10 58.8, 10.2 57.4, 10.2 56.2
       C 8.4 55.8, 7.4 55.2, 6.4 54.4 Z"
    fill="#FDA4AF"
    opacity="0.95"
  />

  <!-- Rear Right Wrap-around Taillight (Coral-Red Glow) -->
  <path
    d="M 27.6 54.4
       C 28.1 56.8, 26.6 58.8, 24.2 59.8
       C 24 58.8, 23.8 57.4, 23.8 56.2
       C 25.6 55.8, 26.6 55.2, 27.6 54.4 Z"
    fill="#FDA4AF"
    opacity="0.95"
  />

  <!-- High-mount Third Brake Strip -->
  <path d="M 15 51.5 L 19 51.5" stroke="#FB7185" stroke-width="1" stroke-linecap="round" />
`;

export const TOP_DOWN_CAR_SVG = `
<svg width="34" height="64" viewBox="0 0 34 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.55)); display: block;">
  ${TOP_DOWN_CAR_BODY_INNER}
</svg>
`;

/**
 * Creates an L.divIcon instance for Leaflet map engines.
 * Centers precisely on the car's 17px, 32px center of gravity.
 */
export function createTopDownCarIcon(L, bearing = 0) {
  return L.divIcon({
    className: 'leaflet-driver-vehicle-marker',
    html: `
      <div class="driver-marker-wrapper" style="width: 34px; height: 64px; position: relative; pointer-events: auto;">
        <div class="driver-car-rotate" style="width: 34px; height: 64px; transform: rotate(${bearing}deg); transform-origin: 17px 32px; transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1); will-change: transform;">
          ${TOP_DOWN_CAR_SVG}
        </div>
      </div>
    `,
    iconSize: [34, 64],
    iconAnchor: [17, 32],
    popupAnchor: [0, -32],
  });
}

/**
 * Creates a google.maps.Icon with top-down aerodynamic vehicle SVG rotated by bearing.
 * Uses a 72x72 square viewport with center at (36, 36) so the 34x64 car
 * rotates 360 degrees smoothly without edge clipping or offset drift.
 */
export function createGoogleTopDownCarIcon(bearing = 0, size = 46) {
  if (typeof window === 'undefined' || !window.google?.maps) return null;

  // Car center is at (17, 32). In a 72x72 box, translation to place center at (36, 36) is:
  // x = 36 - 17 = 19, y = 36 - 32 = 4.
  const svg = `<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(${Math.round(bearing)} 36 36)">
      <g transform="translate(19, 4)">
        ${TOP_DOWN_CAR_BODY_INNER}
      </g>
    </g>
  </svg>`;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return {
    url,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
}
