/**
 * Obsidian Geist Map Styling Configuration
 * Tuned specifically for #09090B carbon canvas and high-contrast glowing route lines
 */

export const DEFAULT_MAP_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
}; // Bangalore Central (matches backend mock dataset)

export const CARTO_DARK_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  subdomains: 'abcd',
  maxZoom: 20,
};

// Base dark streets (no labels baked in)
export const CARTO_DARK_NO_LABELS = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  subdomains: 'abcd',
  maxZoom: 20,
};

// Isolated street & place labels (rendered with high-contrast filter)
export const CARTO_DARK_ONLY_LABELS = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  subdomains: 'abcd',
  maxZoom: 20,
};

// High-visibility, crisp daytime navigation street map
export const CARTO_VOYAGER_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  subdomains: 'abcd',
  maxZoom: 20,
};

// 100% Free worldwide dark street tiles without API keys or watermarks
export const ESRI_DARK_TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  maxZoom: 16,
};

export const OSM_DARK_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

export const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#09090b' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#09090b' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fafafa' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e4e4e7' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#18181b' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#71717a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#1c1c21' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#3f3f46' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#050507' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3f3f46' }],
  },
];

/**
 * Obsidian Geist High-Visibility Daytime Navigation Google Maps Style
 * Clean, soft-slate surfaces, bright white streets, and serene water geometry
 */
export const GOOGLE_MAPS_LIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fed7aa' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#fdba74' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#dbeafe' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2563eb' }],
  },
];


/**
 * High-Visibility Route Highlight Color Themes for Google Maps and Leaflet
 */
export const ROUTE_HIGHLIGHT_THEMES = {
  azure: {
    id: 'azure',
    name: 'Electric Azure',
    glowColor: '#1D4ED8',
    glowWeight: 10,
    glowOpacity: 0.42,
    coreColor: '#60A5FA',
    coreWeight: 4.5,
    arrowColor: '#FFFFFF',
    border: '#3B82F6',
    dotClass: 'bg-[#3B82F6]',
    chipClass: 'border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#60A5FA]',
  },
  emerald: {
    id: 'emerald',
    name: 'Cyber Emerald',
    glowColor: '#047857',
    glowWeight: 10,
    glowOpacity: 0.42,
    coreColor: '#34D399',
    coreWeight: 4.5,
    arrowColor: '#FFFFFF',
    border: '#10B981',
    dotClass: 'bg-[#10B981]',
    chipClass: 'border-[#10B981]/40 bg-[#10B981]/15 text-[#34D399]',
  },
  amber: {
    id: 'amber',
    name: 'Neon Amber',
    glowColor: '#B45309',
    glowWeight: 10,
    glowOpacity: 0.42,
    coreColor: '#FBBF24',
    coreWeight: 4.5,
    arrowColor: '#FFFFFF',
    border: '#F59E0B',
    dotClass: 'bg-[#F59E0B]',
    chipClass: 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#FBBF24]',
  },
  violet: {
    id: 'violet',
    name: 'Luminous Violet',
    glowColor: '#6D28D9',
    glowWeight: 10,
    glowOpacity: 0.42,
    coreColor: '#A78BFA',
    coreWeight: 4.5,
    arrowColor: '#FFFFFF',
    border: '#8B5CF6',
    dotClass: 'bg-[#8B5CF6]',
    chipClass: 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#C4B5FD]',
  },
};

