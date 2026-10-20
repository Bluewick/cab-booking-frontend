import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  Trash2,
  X,
  ChevronDown,
  Loader2,
  Building2,
  Plane,
  Train,
} from 'lucide-react';
import { placesService, POPULAR_CITIES, POPULAR_HUBS } from '../../services/places.service';
import useToast from '../../hooks/useToast';

/**
 * Obsidian Geist Location Search & Autocomplete Input
 * Features real-time search-as-you-type predictions, keyboard navigation,
 * multi-city quick filters, and instant GPS geolocation.
 */
export default function LocationSearchInput({
  label = 'Location',
  value = { address: '', latitude: null, longitude: null },
  onChange,
  placeholder = 'Search address, city, or landmark...',
  variant = 'emerald', // 'emerald' | 'amber' | 'crimson'
  onRemove = null,
  showGpsButton = false,
  disabled = false,
  stopNumber = null,
}) {
  const toast = useToast();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [prevAddress, setPrevAddress] = useState(value?.address || '');
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [isOpen, setIsOpen] = useState(false);
  const [rawPredictions, setRawPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geolocating, setGeolocating] = useState(false);

  // Sync internal input value when external value changes
  if (value?.address !== prevAddress) {
    setPrevAddress(value?.address || '');
    setInputValue(value?.address || '');
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search-as-you-type predictions
  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 2) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setActiveIndex(-1);

      try {
        const results = await placesService.searchPredictions(query, {
          signal: controller.signal,
          limit: 7,
        });
        setRawPredictions(results);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Search prediction error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue]);

  const predictions = inputValue.trim().length >= 2 ? rawPredictions : [];

  // Handle Selection of a prediction or popular landmark
  const handleSelectLocation = (place) => {
    const updated = {
      address: place.address || place.title,
      latitude: place.latitude,
      longitude: place.longitude,
    };
    setInputValue(updated.address);
    onChange(updated);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Keyboard Navigation (Arrow Keys + Enter + Escape)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const currentList = inputValue.trim().length >= 2 ? predictions : filteredHubs;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : currentList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && currentList[activeIndex]) {
        handleSelectLocation(currentList[activeIndex]);
      } else if (currentList.length > 0) {
        handleSelectLocation(currentList[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
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

        // Reverse geocode to get real street / area name
        const resolvedAddress = await placesService.reverseGeocode(latRounded, lngRounded);
        setGeolocating(false);

        const updated = {
          address: resolvedAddress || `Current GPS Location (${latRounded}, ${lngRounded})`,
          latitude: latRounded,
          longitude: lngRounded,
        };

        setInputValue(updated.address);
        onChange(updated);
        toast.success(`Pickup locked: ${updated.address}`, 'GPS Fixed');
      },
      (err) => {
        setGeolocating(false);
        toast.warning(err.message || 'Unable to retrieve your location. Search manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleClear = () => {
    setInputValue('');
    setPredictions([]);
    onChange({ address: '', latitude: null, longitude: null });
    inputRef.current?.focus();
    setIsOpen(true);
  };

  // Color theme presets
  const variantStyles = {
    emerald: {
      dot: 'bg-[#10B981] shadow-[0_0_8px_#10B981]',
      text: 'text-[#34D399]',
      borderFocus: 'focus-within:border-[#10B981] focus-within:ring-1 focus-within:ring-[#10B981]',
      icon: 'text-[#10B981]',
    },
    amber: {
      dot: 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]',
      text: 'text-[#FBBF24]',
      borderFocus: 'focus-within:border-[#F59E0B] focus-within:ring-1 focus-within:ring-[#F59E0B]',
      icon: 'text-[#F59E0B]',
    },
    crimson: {
      dot: 'bg-[#EF4444] shadow-[0_0_8px_#EF4444]',
      text: 'text-[#F87171]',
      borderFocus: 'focus-within:border-[#EF4444] focus-within:ring-1 focus-within:ring-[#EF4444]',
      icon: 'text-[#EF4444]',
    },
  }[variant] || {
    dot: 'bg-[#3B82F6]',
    text: 'text-[#60A5FA]',
    borderFocus: 'focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]',
    icon: 'text-[#3B82F6]',
  };

  // Filter curated hubs when user hasn't typed a query yet
  const filteredHubs = POPULAR_HUBS.filter((hub) => {
    if (selectedCity === 'All') return true;
    return hub.city.toLowerCase() === selectedCity.toLowerCase();
  });

  // Pick suitable icon based on place type
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

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 w-full">
      {/* Waypoint Header Bar */}
      <div className="flex items-center justify-between text-xs mb-0.5">
        <span className={`flex items-center gap-1.5 font-medium ${variantStyles.text}`}>
          <span className={`size-2 rounded-full ${variantStyles.dot}`} />
          {label} {stopNumber ? `#${stopNumber}` : ''}
        </span>

        <div className="flex items-center gap-2">
          {showGpsButton && (
            <button
              type="button"
              disabled={disabled || geolocating}
              onClick={handleUseCurrentLocation}
              className="flex items-center gap-1 text-[11px] text-[#60A5FA] hover:text-[#93C5FD] transition-colors cursor-pointer disabled:opacity-50"
              title="Use Current Device GPS"
            >
              <Crosshair className={`size-3 ${geolocating ? 'animate-spin' : ''}`} />
              <span>{geolocating ? 'Locating...' : 'Current GPS'}</span>
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              className="text-[#71717A] hover:text-[#EF4444] transition-colors cursor-pointer p-0.5 rounded"
              title="Remove waypoint"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Input Box Shell */}
      <div
        className={`relative flex items-center bg-[#141418] border border-[#27272A] rounded-[10px] px-3 py-2 text-xs transition-all ${variantStyles.borderFocus}`}
      >
        <MapPin className={`size-4 mr-2 shrink-0 ${variantStyles.icon}`} />

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-[#FAFAFA] placeholder:text-[#71717A] outline-none text-xs font-sans pr-16"
        />

        {/* Right Action Icons: Spinner / Clear / Chevron */}
        <div className="absolute right-2.5 flex items-center gap-1.5 text-[#71717A]">
          {isSearching && (
            <Loader2 className="size-3.5 text-[#60A5FA] animate-spin shrink-0" />
          )}

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-[#FAFAFA] transition-colors p-0.5 rounded cursor-pointer"
              title="Clear input"
            >
              <X className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="hover:text-[#FAFAFA] transition-colors p-0.5 rounded cursor-pointer"
            title="Browse locations"
          >
            <ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Predictions & Popular Hubs Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-[#141418]/95 backdrop-blur-[16px] border border-[#27272A] rounded-[12px] shadow-[0_16px_36px_rgba(0,0,0,0.85)] overflow-hidden max-h-72 flex flex-col">
          {/* Case 1: Active Live Predictions */}
          {inputValue.trim().length >= 2 ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-[#27272A] text-xs font-medium text-[#A1A1AA] flex items-center justify-between bg-[#0F0F12]">
                <span className="flex items-center gap-1.5 truncate">
                  <Search className="size-3 text-[#3B82F6]" />
                  <span>Search Predictions for "{inputValue}"</span>
                </span>
                {isSearching && <span className="text-[#60A5FA] animate-pulse">Searching...</span>}
              </div>

              <div className="overflow-y-auto max-h-56 divide-y divide-[#27272A]/40">
                {predictions.length > 0 ? (
                  predictions.map((pred, idx) => (
                    <button
                      key={pred.id}
                      type="button"
                      onClick={() => handleSelectLocation(pred)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full px-3 py-2.5 text-left text-xs flex items-start gap-2.5 transition-colors cursor-pointer ${
                        activeIndex === idx ? 'bg-[#1C1C21]' : 'hover:bg-[#1C1C21]/60'
                      }`}
                    >
                      <div className="mt-0.5 p-1 rounded bg-[#27272A]/60">
                        {renderPlaceIcon(pred.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#FAFAFA] font-medium truncate flex items-center justify-between">
                          <span className="truncate">{pred.title}</span>
                          {pred.latitude && (
                            <span className="text-[10px] text-[#71717A] ml-2 shrink-0 tabular-nums">
                              {pred.latitude.toFixed(2)}°, {pred.longitude.toFixed(2)}°
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
                    No matching locations found for "{inputValue}".<br />
                    <span className="text-[11px] text-[#A1A1AA] mt-1 inline-block">
                      Try searching Mumbai, Pune, Delhi, or a prominent landmark.
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            /* Case 2: Curated Popular Hubs with City Tabs */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* City Filter Tabs Bar */}
              <div className="p-2 border-b border-[#27272A] bg-[#0F0F12]">
                <div className="text-[11px] text-[#71717A] uppercase mb-1.5 flex items-center justify-between font-medium">
                  <span>Popular City Destinations</span>
                  <span className="text-[10px] text-[#60A5FA]">Instant 1-Click Pick</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedCity === city
                          ? 'bg-[#3B82F6] text-[#FAFAFA] font-medium shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                          : 'bg-[#1C1C21] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hubs List */}
              <div className="overflow-y-auto max-h-56 divide-y divide-[#27272A]/40">
                {filteredHubs.map((hub, idx) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => handleSelectLocation(hub)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      activeIndex === idx ? 'bg-[#1C1C21]' : 'hover:bg-[#1C1C21]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 mr-2">
                      <div className="p-1 rounded bg-[#27272A]/60">
                        {renderPlaceIcon(hub.type)}
                      </div>
                      <div className="truncate">
                        <div className="text-[#FAFAFA] truncate font-medium">{hub.name}</div>
                        <div className="text-[10px] text-[#71717A] truncate">
                          {hub.city}, {hub.state}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#A1A1AA] bg-[#27272A] px-1.5 py-0.5 rounded shrink-0">
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
  );
}
