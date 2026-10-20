import React from 'react';
import { Users, Zap, Clock, CheckCircle2 } from 'lucide-react';
import standardCab from '../../assets/cabIcons/standard_cab.png';
import comfortCab from '../../assets/cabIcons/comfort_cab.png';
import premiumCab from '../../assets/cabIcons/premium_cab.png';

const CATEGORIES = [
  {
    id: 'standard',
    name: 'Urban Standard',
    description: 'Electric sedan for fast, affordable city hops',
    capacity: 4,
    eta: '3-5 min',
    image: standardCab,
    fallbackPrice: 180,
  },
  {
    id: 'comfort',
    name: 'Urban Comfort',
    description: 'Spacious luxury EV with whisper-quiet cabin',
    capacity: 4,
    eta: '2-4 min',
    image: comfortCab,
    fallbackPrice: 240,
  },
  {
    id: 'xl',
    name: 'Urban XL',
    description: 'Executive black edition for VIP group rides',
    capacity: 6,
    eta: '5-8 min',
    image: premiumCab,
    fallbackPrice: 360,
  },
];

/**
 * Obsidian Geist Vehicle Category & Surge Pricing Selector
 * Features authentic 3D vehicle renders on illuminated pedestals,
 * live real-time pricing, capacity badges, and crisp responsive states.
 */
export default function VehicleCategorySelector({
  selectedCategory,
  onSelectCategory,
  estimates = [],
  disabled = false,
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">
          Select Vehicle Tier
        </span>
        <span className="text-[11px] text-[#71717A] flex items-center gap-1 font-normal">
          <CheckCircle2 className="size-3 text-[#34D399]" />
          Guaranteed upfront fare
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {CATEGORIES.map((cat) => {
          const estimate = estimates.find(
            (e) =>
              e.vehicle_category === cat.id ||
              (cat.id === 'xl' && (e.vehicle_category === 'xl' || e.vehicle_category === 'premium'))
          );
          const price = estimate ? Math.round(estimate.estimated_fare) : cat.fallbackPrice;
          const isSurging = estimate && estimate.surge_multiplier > 1.0;
          const isSelected =
            selectedCategory === cat.id ||
            (cat.id === 'xl' && selectedCategory === 'premium');

          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectCategory(cat.id)}
              className={`group w-full p-3 sm:p-3.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border relative overflow-hidden select-none ${
                isSelected
                  ? 'bg-[#18181B] border-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.22)] ring-1 ring-[#3B82F6]'
                  : 'bg-[#141418] border-[#27272A] hover:border-[#3F3F46] hover:bg-[#18181B]/70'
              }`}
            >
              {/* Subtle ambient highlight for selected tier */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-36 h-20 bg-[#3B82F6]/10 blur-2xl pointer-events-none" />
              )}

              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* 3D Cab Image Pedestal */}
                <div
                  className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden transition-all ${
                    isSelected
                      ? 'bg-[#18181B] border-[#3B82F6]/40 shadow-[0_0_16px_rgba(59,130,246,0.18)]'
                      : 'bg-[#09090B]/80 border-[#27272A]/70 group-hover:border-[#3F3F46]'
                  }`}
                >
                  {/* Pedestal ambient radial glow */}
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      isSelected
                        ? 'opacity-100 bg-[radial-gradient(ellipse_at_50%_75%,rgba(59,130,246,0.25)_0%,transparent_75%)]'
                        : 'opacity-50 bg-[radial-gradient(ellipse_at_50%_75%,rgba(255,255,255,0.08)_0%,transparent_70%)]'
                    }`}
                  />

                  <img
                    src={cat.image}
                    alt={cat.name}
                    className={`w-full h-full object-contain p-1 relative z-10 transition-transform duration-200 drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] ${
                      isSelected ? 'scale-105' : 'group-hover:scale-105'
                    }`}
                  />
                </div>

                {/* Tier Metadata & Arrival Info */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold text-[#FAFAFA] tracking-tight">
                      {cat.name}
                    </span>

                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1C1C21] border border-[#27272A] text-[11px] text-[#A1A1AA] font-medium shrink-0">
                      <Users className="size-3 text-[#71717A]" /> {cat.capacity}
                    </span>

                    {isSurging && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#451A03] border border-[#F59E0B]/40 text-[#FBBF24] text-[10px] font-semibold shrink-0">
                        <Zap className="size-2.5 fill-current" /> {estimate.surge_multiplier}x
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#71717A] line-clamp-1 mt-0.5">
                    {cat.description}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] text-[#A1A1AA] mt-1 font-medium">
                    <Clock className="size-3 text-[#34D399]" /> {cat.eta} away
                  </span>
                </div>
              </div>

              {/* Fare & Price Column */}
              <div className="flex flex-col items-end shrink-0 pl-3">
                <span className="text-base sm:text-lg font-bold text-[#FAFAFA] tabular-nums tracking-tight">
                  ₹{price}
                </span>
                <span className="text-[11px] text-[#71717A] font-medium">est. total</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
