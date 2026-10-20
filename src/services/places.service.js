/**
 * Places & Geocoding Service (Photon / OpenStreetMap / Google Places)
 * Provides lightning-fast place autocomplete predictions, search,
 * reverse geocoding, and curated major hub presets.
 */

// Curated Popular Metro Hubs & Landmarks across India
export const POPULAR_CITIES = ['All', 'Mumbai', 'Pune', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Chennai'];

export const POPULAR_HUBS = [
  // Mumbai
  {
    id: 'mum-1',
    name: 'Gateway of India, Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Gateway of India, Colaba, Mumbai, Maharashtra',
    latitude: 18.9220,
    longitude: 72.8347,
    hub: 'South Mumbai',
    type: 'landmark',
  },
  {
    id: 'mum-2',
    name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'CSMT Railway Station, Fort, Mumbai, Maharashtra',
    latitude: 18.9404,
    longitude: 72.8358,
    hub: 'Transit Hub',
    type: 'station',
  },
  {
    id: 'mum-3',
    name: 'Bandra Kurla Complex (BKC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'BKC, Bandra East, Mumbai, Maharashtra',
    latitude: 19.0657,
    longitude: 72.8687,
    hub: 'Financial District',
    type: 'business',
  },
  {
    id: 'mum-4',
    name: 'Chhatrapati Shivaji Maharaj Int. Airport (BOM T2)',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Terminal 2, CSMI Airport, Andheri East, Mumbai, Maharashtra',
    latitude: 19.0896,
    longitude: 72.8656,
    hub: 'International Airport',
    type: 'airport',
  },
  {
    id: 'mum-5',
    name: 'Marine Drive Promenade',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Netaji Subhash Chandra Bose Rd, Marine Drive, Mumbai, Maharashtra',
    latitude: 18.9322,
    longitude: 72.8236,
    hub: 'Seafront Hub',
    type: 'landmark',
  },
  {
    id: 'mum-6',
    name: 'Andheri West Infiniti Mall / Link Rd',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Infiniti Mall, New Link Rd, Andheri West, Mumbai, Maharashtra',
    latitude: 19.1413,
    longitude: 72.8315,
    hub: 'Western Suburbs',
    type: 'commercial',
  },

  // Pune
  {
    id: 'pune-1',
    name: 'Shivajinagar Railway Station',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Shivajinagar Station, Shivajinagar, Pune, Maharashtra',
    latitude: 18.5314,
    longitude: 73.8446,
    hub: 'Central Pune',
    type: 'station',
  },
  {
    id: 'pune-2',
    name: 'Pune International Airport (PNQ Lohegaon)',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Pune Airport, New Airport Rd, Viman Nagar, Pune, Maharashtra',
    latitude: 18.5804,
    longitude: 73.9182,
    hub: 'Airport',
    type: 'airport',
  },
  {
    id: 'pune-3',
    name: 'Hinjawadi Rajiv Gandhi Infotech Park Phase 1',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Phase 1, Hinjawadi Rajiv Gandhi Infotech Park, Pune, Maharashtra',
    latitude: 18.5913,
    longitude: 73.7389,
    hub: 'IT Corridor',
    type: 'business',
  },
  {
    id: 'pune-4',
    name: 'Shaniwar Wada Heritage Fort',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Shaniwar Wada, Kasba Peth, Pune, Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    hub: 'Old City Hub',
    type: 'landmark',
  },
  {
    id: 'pune-5',
    name: 'Magarpatta Cybercity / Hadapsar',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Cybercity, Magarpatta, Hadapsar, Pune, Maharashtra',
    latitude: 18.5147,
    longitude: 73.9298,
    hub: 'East Tech Hub',
    type: 'business',
  },
  {
    id: 'pune-6',
    name: 'Kothrud Chandani Chowk Junction',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Chandani Chowk, Kothrud, Pune, Maharashtra',
    latitude: 18.5074,
    longitude: 73.7924,
    hub: 'West Gateway',
    type: 'transit',
  },

  // Bengaluru
  {
    id: 'blr-1',
    name: 'MG Road Metro Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'MG Road Metro Station, MG Road, Bengaluru, Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    hub: 'Central Metro',
    type: 'station',
  },
  {
    id: 'blr-2',
    name: 'Kempegowda Int. Airport (BLR T1)',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Kempegowda Int Airport, Devanahalli, Bengaluru, Karnataka',
    latitude: 13.1986,
    longitude: 77.7066,
    hub: 'Airport',
    type: 'airport',
  },
  {
    id: 'blr-3',
    name: 'Koramangala Sony World Junction',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Sony World Signal, 80ft Rd, Koramangala 4th Block, Bengaluru, Karnataka',
    latitude: 12.9352,
    longitude: 77.6245,
    hub: 'Startup Hub',
    type: 'commercial',
  },
  {
    id: 'blr-4',
    name: 'Bellandur EcoSpace Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'EcoSpace Tech Park, Outer Ring Rd, Bellandur, Bengaluru, Karnataka',
    latitude: 12.9279,
    longitude: 77.6835,
    hub: 'Outer Ring Rd',
    type: 'business',
  },
  {
    id: 'blr-5',
    name: 'Whitefield ITPL Main Gate',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka',
    latitude: 12.9856,
    longitude: 77.7315,
    hub: 'Tech Corridor',
    type: 'business',
  },
  {
    id: 'blr-6',
    name: 'Electronic City Toll Plaza Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Hosur Rd, Phase 1, Electronic City, Bengaluru, Karnataka',
    latitude: 12.8452,
    longitude: 77.6602,
    hub: 'South Tech Hub',
    type: 'transit',
  },

  // Delhi NCR
  {
    id: 'del-1',
    name: 'Connaught Place (CP Inner Circle)',
    city: 'Delhi NCR',
    state: 'Delhi',
    address: 'Connaught Place, New Delhi, Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    hub: 'Central Delhi',
    type: 'commercial',
  },
  {
    id: 'del-2',
    name: 'Indira Gandhi Int. Airport (DEL T3)',
    city: 'Delhi NCR',
    state: 'Delhi',
    address: 'Terminal 3, IGI Airport, New Delhi, Delhi',
    latitude: 28.5562,
    longitude: 77.1000,
    hub: 'Airport',
    type: 'airport',
  },
  {
    id: 'del-3',
    name: 'Cyber City DLF Phase 2, Gurugram',
    city: 'Delhi NCR',
    state: 'Haryana',
    address: 'DLF Cyber City, Sector 24, Gurugram, Haryana',
    latitude: 28.4952,
    longitude: 77.0895,
    hub: 'Cyber Hub',
    type: 'business',
  },

  // Hyderabad
  {
    id: 'hyd-1',
    name: 'Hitec City Cyber Towers',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Cyber Towers, Hitec City, Madhapur, Hyderabad, Telangana',
    latitude: 17.4504,
    longitude: 78.3808,
    hub: 'IT Hub',
    type: 'business',
  },
  {
    id: 'hyd-2',
    name: 'Rajiv Gandhi Int. Airport (HYD Shamshabad)',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Shamshabad, Hyderabad, Telangana',
    latitude: 17.2403,
    longitude: 78.4294,
    hub: 'Airport',
    type: 'airport',
  },

  // Chennai
  {
    id: 'chn-1',
    name: 'Puratchi Thalaivar Dr. M.G.R Chennai Central',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'Kannappar Thidal, Periyamet, Chennai, Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    hub: 'Transit Hub',
    type: 'station',
  },
  {
    id: 'chn-2',
    name: 'Tidel Park / OMR IT Expressway',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'Rajiv Gandhi Salai, Taramani, Chennai, Tamil Nadu',
    latitude: 12.9892,
    longitude: 80.2487,
    hub: 'IT Corridor',
    type: 'business',
  },
];

const searchCache = new Map();

/**
 * Places Service with Photon OSM + Fallback geocoders
 */
export const placesService = {
  /**
   * Search for location predictions as the user types
   * @param {string} query Search input
   * @param {Object} options { signal, limit }
   */
  async searchPredictions(query, options = {}) {
    const trimmed = (query || '').trim();
    if (trimmed.length < 2) return [];

    const cacheKey = trimmed.toLowerCase();
    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey);
    }

    // 1. Try Photon Geocoding API (Fast, Free, CORS Enabled)
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=${options.limit || 6}`;
      const res = await fetch(url, { signal: options.signal });

      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const results = data.features.map((feature, idx) => {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates || [0, 0];

            const name = props.name || props.street || props.city || trimmed;
            const contextParts = [
              props.street && props.street !== name ? props.street : null,
              props.district || props.suburb || props.locality,
              props.city && props.city !== name ? props.city : null,
              props.county,
              props.state,
              props.country,
            ].filter(Boolean);

            // Deduplicate context parts
            const uniqueContext = Array.from(new Set(contextParts));
            const subtitle = uniqueContext.slice(0, 3).join(', ');
            const fullAddress = [name, subtitle].filter(Boolean).join(', ');

            return {
              id: `photon-${props.osm_type || 'p'}-${props.osm_id || idx}-${idx}`,
              title: name,
              subtitle: subtitle || props.country || 'Location',
              address: fullAddress,
              latitude: Math.round(coords[1] * 100000) / 100000,
              longitude: Math.round(coords[0] * 100000) / 100000,
              type: props.osm_value || props.type || 'place',
              city: props.city || props.county || '',
            };
          });

          searchCache.set(cacheKey, results);
          return results;
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('[PlacesService] Photon autocomplete query fallback:', err.message);
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&addressdetails=1`;
      const res = await fetch(nomUrl, {
        signal: options.signal,
        headers: { 'User-Agent': 'UrbanCabMobility/1.0' },
      });

      if (res.ok) {
        const items = await res.json();
        const results = items.map((item, idx) => {
          const parts = (item.display_name || '').split(',').map((s) => s.trim());
          const title = parts[0] || item.name || trimmed;
          const subtitle = parts.slice(1, 4).join(', ');

          return {
            id: `nom-${item.place_id || idx}`,
            title: title,
            subtitle: subtitle || 'Location',
            address: item.display_name || `${title}, ${subtitle}`,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            type: item.type || 'place',
            city: item.address?.city || item.address?.town || item.address?.county || '',
          };
        });

        searchCache.set(cacheKey, results);
        return results;
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('[PlacesService] Nominatim fallback failed:', err.message);
    }

    // 3. Fallback: Filter popular landmark presets by match
    const localMatches = POPULAR_HUBS.filter(
      (hub) =>
        hub.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        hub.city.toLowerCase().includes(trimmed.toLowerCase()) ||
        hub.address.toLowerCase().includes(trimmed.toLowerCase())
    ).map((hub) => ({
      id: hub.id,
      title: hub.name,
      subtitle: `${hub.city}, ${hub.state}`,
      address: hub.address,
      latitude: hub.latitude,
      longitude: hub.longitude,
      type: hub.type,
      city: hub.city,
    }));

    return localMatches;
  },

  /**
   * Reverse geocode GPS coordinates to human-readable address
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const url = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const feature = data.features?.[0];
        if (feature) {
          const props = feature.properties || {};
          const title = props.name || props.street || props.district || props.city || 'Custom Location';
          const details = [props.district, props.city, props.state].filter(Boolean).join(', ');
          return details ? `${title}, ${details}` : title;
        }
      }
    } catch (err) {
      console.warn('[PlacesService] Reverse geocode error:', err.message);
    }
    return `Location (${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)})`;
  },
};

export default placesService;
