import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crosshair,
  ArrowUpDown,
  Plus,
  X,
  Search,
  Loader2,
  MapPin,
  Plane,
  Train,
  Building2,
} from 'lucide-react';
import { placesService, POPULAR_CITIES, POPULAR_HUBS } from '../../services/places.service';
import useToast from '../../hooks/useToast';

/**
 * Obsidian Geist Redesigned Trip Waypoint Planner
 * Matches the reference architecture:
 * - Route indicator track on the left (origin dot, connecting line, intermediate dots, terminal square)
 * - Clean unified input group on the right ("Current location", divider with swap button, "Where to?")
 * - Sleek "+ add stops" pill button underneath
 * - No monospace AI-slop fonts; clean professional typography and micro-interactions
 */
export default function WaypointAddressSelector({
  pickup = { address: '', latitude: null, longitude: null },
  onPickupChange,
  stops = [],
  onStopsChange,
  dropoff = { address: '', latitude: null, longitude: null },
  onDropoffChange,
  disabled = false,
}) {
  const toast = useToast();
  const containerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Field focus tracking: 'pickup' | 'dropoff' | 'stop-${index}' | null
  const [activeField, setActiveField] = useState(null);

  // Search predictions & autocomplete state
  const [rawPredictions, setRawPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geolocating, setGeolocating] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveField(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current active query string directly from props
  const getActiveQuery = useCallback(() => {
    if (activeField === 'pickup') return (pickup?.address || '').trim();
    if (activeField === 'dropoff') return (dropoff?.address || '').trim();
    if (activeField?.startsWith('stop-')) {
      const idx = parseInt(activeField.replace('stop-', ''), 10);
      return (stops[idx]?.address || '').trim();
    }
    return '';
  }, [activeField, pickup?.address, dropoff?.address, stops]);

  const activeQuery = getActiveQuery();

  // Debounced search-as-you-type prediction fetcher
  useEffect(() => {
    if (!activeField || activeQuery.length < 2) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setActiveIndex(-1);

      try {
        const results = await placesService.searchPredictions(activeQuery, {
          signal: controller.signal,
          limit: 6,
        });
        setRawPredictions(results);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Search prediction error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeQuery, activeField]);

  // Derived predictions array - active only when query is at least 2 chars
  const predictions = activeQuery.length >= 2 ? rawPredictions : [];

  // Handle selecting a place (from predictions or curated hubs)
  const handleSelectPlace = (place) => {
    const selected = {
      address: place.address || place.title,
      latitude: place.latitude,
      longitude: place.longitude,
    };

    if (activeField === 'pickup') {
      onPickupChange(selected);
    } else if (activeField === 'dropoff') {
      onDropoffChange(selected);
    } else if (activeField?.startsWith('stop-')) {
      const idx = parseInt(activeField.replace('stop-', ''), 10);
      const updatedStops = [...stops];
      updatedStops[idx] = selected;
      onStopsChange(updatedStops);
    }

    setActiveField(null);
    setActiveIndex(-1);
  };

  // Browser Geolocation for Pickup
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const latRounded = Math.round(latitude * 100000) / 100000;
        const lngRounded = Math.round(longitude * 100000) / 100000;

        const resolvedAddress = await placesService.reverseGeocode(latRounded, lngRounded);
        setGeolocating(false);

        const updated = {
          address: resolvedAddress || `Current Location (${latRounded}, ${lngRounded})`,
          latitude: latRounded,
          longitude: lngRounded,
        };

        onPickupChange(updated);
        setActiveField(null);
        toast.success(`Pickup set: ${updated.address}`, 'GPS Fixed');
      },
      (err) => {
        setGeolocating(false);
        toast.warning(err.message || 'Unable to retrieve your location. Search manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Swap pickup & dropoff (and reverse stops if any)
  const handleSwap = () => {
    if (!pickup?.address && !dropoff?.address) return;

    const tempPickup = { ...pickup };
    const tempDropoff = { ...dropoff };

    onPickupChange(tempDropoff);
    onDropoffChange(tempPickup);

    if (stops.length > 0) {
      onStopsChange([...stops].reverse());
    }

    toast.info('Origin and destination waypoints swapped.');
  };

  // Add a new intermediate stop (up to 3)
  const handleAddStop = () => {
    if (stops.length >= 3) {
      toast.warning('Maximum 3 intermediate stops permitted per trip.');
      return;
    }

    const newStop = { address: '', latitude: null, longitude: null };
    const newStops = [...stops, newStop];
    onStopsChange(newStops);
    setActiveField(`stop-${stops.length}`);
  };

  // Remove an intermediate stop
  const handleRemoveStop = (index, e) => {
    e?.stopPropagation();
    const newStops = stops.filter((_, i) => i !== index);
    onStopsChange(newStops);
    if (activeField === `stop-${index}`) {
      setActiveField(null);
    }
    toast.info(`Stop ${index + 1} removed.`);
  };

  // Handle clearing an individual input
  const handleClearField = (field, e) => {
    e?.stopPropagation();
    if (field === 'pickup') {
      onPickupChange({ address: '', latitude: null, longitude: null });
    } else if (field === 'dropoff') {
      onDropoffChange({ address: '', latitude: null, longitude: null });
    } else if (field.startsWith('stop-')) {
      const idx = parseInt(field.replace('stop-', ''), 10);
      const updatedStops = [...stops];
      updatedStops[idx] = { address: '', latitude: null, longitude: null };
      onStopsChange(updatedStops);
    }
  };

  // Filter curated hubs when user query is short
  const filteredHubs = POPULAR_HUBS.filter((hub) => {
    if (selectedCity === 'All') return true;
    return hub.city.toLowerCase() === selectedCity.toLowerCase();
  });

  const renderPlaceIcon = (type) => {
    switch (type) {
      case 'airport':
        return <Plane className="size-3.5 text-[#60A5FA] shrink-0" />;
      case 'station':
      case 'railway':
        return <Train className="size-3.5 text-[#FBBF24] shrink-0" />;
      case 'business':
      case 'commercial':
      case 'building':
        return <Building2 className="size-3.5 text-[#A78BFA] shrink-0" />;
      default:
        return <MapPin className="size-3.5 text-[#A1A1AA] shrink-0" />;
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!activeField) return;

    const currentList = activeQuery.length >= 2 ? predictions : filteredHubs;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : currentList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && currentList[activeIndex]) {
        handleSelectPlace(currentList[activeIndex]);
      } else if (currentList.length > 0) {
        handleSelectPlace(currentList[0]);
      }
    } else if (e.key === 'Escape') {
      setActiveField(null);
    }
  };

  const isDropdownOpen = Boolean(activeField);

  return (
    <div ref={containerRef} className="flex flex-col gap-3 w-full relative">
      {/* Upper Section: Route Indicators + Inputs Card */}
      <div className="flex items-start gap-3 w-full">
        {/* Left Column: Route Indicator Track */}
        <div className="w-4 shrink-0 relative self-stretch select-none flex flex-col items-center">
          {/* Vertical continuous line connecting origin to destination */}
          <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-[1.5px] bg-[#27272A]" />

          {/* Top Origin Node (Emerald Dot) */}
          <div
            className="size-2.5 rounded-full bg-[#10B981] absolute left-1/2 -translate-x-1/2 top-6 -translate-y-1/2 z-10 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            title="Pickup Origin"
          />

          {/* Intermediate Stops Nodes */}
          {stops.map((_, idx) => (
            <div
              key={idx}
              className="size-2 rounded-full bg-[#71717A] ring-2 ring-[#0F0F12] absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ top: `${(idx + 1) * 48 + 24}px` }}
              title={`Intermediate Stop ${idx + 1}`}
            />
          ))}

          {/* Terminal Destination Node (Solid Square) */}
          <div
            className="size-2.5 rounded-[2px] bg-[#a8a8a8] absolute left-1/2 -translate-x-1/2 bottom-6 translate-y-1/2 z-10 shadow-[0_0_6px_rgba(250,250,250,0.3)]"
            title="Final Destination"
          />
        </div>

        {/* Right Column: Unified Inputs Container & Dropdown */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Unified Inputs Card Shell */}
          <div className="rounded-2xl bg-[#141418] border border-[#27272A] hover:border-[#3F3F46] focus-within:border-[#52525B] transition-colors relative shadow-sm">
            {/* 1. Pickup Input Row */}
            <div className="h-12 flex items-center pl-4 pr-3 relative">
              <input
                type="text"
                disabled={disabled}
                value={pickup?.address || ''}
                onChange={(e) => onPickupChange({ ...pickup, address: e.target.value })}
                onFocus={() => {
                  setActiveField('pickup');
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Current location"
                className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder:text-[#71717A] outline-none font-normal pr-2"
              />

              {/* Actions: Clear Button + GPS Crosshair */}
              <div className="flex items-center gap-1 shrink-0">
                {pickup?.address && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleClearField('pickup', e)}
                    className="p-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors rounded cursor-pointer"
                    title="Clear location"
                  >
                    <X className="size-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  disabled={disabled || geolocating}
                  onClick={handleUseCurrentLocation}
                  className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-all rounded-lg cursor-pointer disabled:opacity-50"
                  title="Use current GPS location"
                >
                  <Crosshair
                    className={`size-4.5 ${geolocating ? 'animate-spin text-[#3B82F6]' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Divider Line between Pickup and Next Row */}
            <div className="border-t border-[#27272A] relative">
              {/* Circular Floating Swap Button */}
              <button
                type="button"
                disabled={disabled}
                onClick={handleSwap}
                className="absolute right-3.5 -translate-y-1/2 z-20 size-7 rounded-full bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Swap pickup and destination"
              >
                <ArrowUpDown className="size-3.5" />
              </button>
            </div>

            {/* Intermediate Stop Rows (If present) */}
            {stops.map((stop, idx) => (
              <div
                key={idx}
                className="h-12 flex items-center pl-4 pr-3 relative border-b border-[#27272A] animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  disabled={disabled}
                  value={stop?.address || ''}
                  onChange={(e) => {
                    const newStops = [...stops];
                    newStops[idx] = { ...stop, address: e.target.value };
                    onStopsChange(newStops);
                  }}
                  onFocus={() => {
                    setActiveField(`stop-${idx}`);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={`Stop ${idx + 1} destination...`}
                  className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder:text-[#71717A] outline-none font-normal pr-2"
                />

                <div className="flex items-center gap-1 shrink-0">
                  {stop?.address && (
                    <button
                      type="button"
                      onClick={(e) => handleClearField(`stop-${idx}`, e)}
                      className="p-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors rounded cursor-pointer"
                      title="Clear stop"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => handleRemoveStop(idx, e)}
                    className="p-1 text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors rounded cursor-pointer"
                    title="Remove stop"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* 2. Destination / Dropoff Row */}
            <div className="h-12 flex items-center pl-4 pr-3 relative">
              <input
                type="text"
                disabled={disabled}
                value={dropoff?.address || ''}
                onChange={(e) => onDropoffChange({ ...dropoff, address: e.target.value })}
                onFocus={() => {
                  setActiveField('dropoff');
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Where to?"
                className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder:text-[#71717A] outline-none font-normal pr-2"
              />

              {dropoff?.address && !disabled && (
                <button
                  type="button"
                  onClick={(e) => handleClearField('dropoff', e)}
                  className="p-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors rounded cursor-pointer shrink-0"
                  title="Clear destination"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Floating Predictions & Popular Destinations Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#141418] border border-[#27272A] rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden flex flex-col max-h-72 divide-y divide-[#27272A]/50 animate-in fade-in zoom-in-95 duration-150">
              {/* Active Search Predictions when query >= 2 chars */}
              {activeQuery.length >= 2 ? (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-[#27272A] text-xs font-medium text-[#A1A1AA] flex items-center justify-between bg-[#0F0F12]">
                    <span className="flex items-center gap-2 truncate">
                      <Search className="size-3.5 text-[#3B82F6] shrink-0" />
                      <span className="truncate">Search results for "{activeQuery}"</span>
                    </span>
                    {isSearching && (
                      <span className="flex items-center gap-1.5 text-[11px] text-[#60A5FA]">
                        <Loader2 className="size-3 animate-spin" />
                        <span>Searching...</span>
                      </span>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-56 divide-y divide-[#27272A]/40">
                    {predictions.length > 0 ? (
                      predictions.map((pred, idx) => (
                        <button
                          key={pred.id}
                          type="button"
                          onClick={() => handleSelectPlace(pred)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full px-3.5 py-2.5 text-left text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                            activeIndex === idx ? 'bg-[#1C1C21]' : 'hover:bg-[#1C1C21]/60'
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-[#27272A]/70 shrink-0">
                            {renderPlaceIcon(pred.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[#FAFAFA] font-medium truncate flex items-center justify-between">
                              <span className="truncate">{pred.title}</span>
                              {pred.city && (
                                <span className="text-[11px] text-[#71717A] ml-2 shrink-0">
                                  {pred.city}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                              {pred.subtitle}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : !isSearching ? (
                      <div className="p-4 text-center text-xs text-[#71717A]">
                        No matching locations found for "{activeQuery}".<br />
                        <span className="text-[11px] text-[#A1A1AA] mt-1 inline-block">
                          Try searching a landmark, station, or city area.
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                /* Curated Popular Hubs & Quick Pick Cities */
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Current GPS Quick Pick (Only for Pickup) */}
                  {activeField === 'pickup' && (
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="w-full px-3.5 py-2.5 text-left text-xs flex items-center gap-3 hover:bg-[#1C1C21] transition-colors border-b border-[#27272A] cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#34D399] shrink-0">
                        <Crosshair className={`size-4 ${geolocating ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#FAFAFA] font-medium">Use Current GPS Location</span>
                        <span className="text-[11px] text-[#A1A1AA]">
                          Instant fix using device sensors
                        </span>
                      </div>
                    </button>
                  )}

                  {/* City Filter Pills */}
                  <div className="p-2.5 border-b border-[#27272A] bg-[#0F0F12]">
                    <div className="text-[11px] text-[#71717A] font-medium uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Popular Destinations</span>
                      <span className="text-[11px] text-[#60A5FA] normal-case">1-Tap Select</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {POPULAR_CITIES.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setSelectedCity(city)}
                          className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            selectedCity === city
                              ? 'bg-[#3B82F6] text-[#FAFAFA] font-medium shadow-sm'
                              : 'bg-[#1C1C21] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Curated Hubs List */}
                  <div className="overflow-y-auto max-h-52 divide-y divide-[#27272A]/40">
                    {filteredHubs.map((hub, idx) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => handleSelectPlace(hub)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          activeIndex === idx ? 'bg-[#1C1C21]' : 'hover:bg-[#1C1C21]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 mr-2">
                          <div className="p-1.5 rounded-lg bg-[#27272A]/60 shrink-0">
                            {renderPlaceIcon(hub.type)}
                          </div>
                          <div className="truncate">
                            <div className="text-[#FAFAFA] font-medium truncate">{hub.name}</div>
                            <div className="text-[11px] text-[#71717A] truncate">
                              {hub.city}, {hub.state}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#A1A1AA] bg-[#27272A] px-2 py-0.5 rounded-md shrink-0">
                          {hub.hub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lower Section: "+ add stops" Pill Button */}
      <div className="pl-7 flex items-center">
        <button
          type="button"
          disabled={disabled || stops.length >= 3}
          onClick={handleAddStop}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#FAFAFA] transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <Plus className="size-3.5 text-[#3B82F6] group-hover:rotate-90 transition-transform duration-200 shrink-0" />
          <span>{stops.length >= 3 ? 'Max stops reached' : 'Add stop'}</span>
          {stops.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#27272A] text-[10px] text-[#A1A1AA] tabular-nums font-normal border border-[#3F3F46]/50">
              {stops.length}/3
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
