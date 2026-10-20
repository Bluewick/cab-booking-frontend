import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, LifeBuoy, Car } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="w-full bg-[#09090B] border-t border-[#27272A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-[8px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#FAFAFA]">
                <Car className="size-4" />
              </div>
              <span className="font-bold text-base text-[#FAFAFA] tracking-tight">
                Urban<span className="text-[#3B82F6]">Cab</span>
              </span>
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Obsidian-engineered on-demand mobility platform. High-precision GPS dispatching, multi-stop routing, and seamless digital settlements.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] font-mono">
              Rider Services
            </h4>
            <Link to="/" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Book a Ride
            </Link>
            <Link to="/history" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Trip History & Receipts
            </Link>
            <Link to="/profile" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Emergency Contacts & Profile
            </Link>
          </div>

          {/* Driver Fleet */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] font-mono">
              Driver Fleet
            </h4>
            <Link to="/driver/dashboard" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Driver Console
            </Link>
            <Link to="/driver/register-vehicle" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Register Vehicle & Onboarding
            </Link>
            <Link to="/driver/earnings" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Earnings & Settlement Ledger
            </Link>
          </div>

          {/* Safety & Payments */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] font-mono">
              Safety & Payments
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#34D399]">
              <ShieldCheck className="size-4 shrink-0" />
              <span>24/7 SOS & Telemetry Monitoring</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#60A5FA]">
              <CreditCard className="size-4 shrink-0" />
              <span>Razorpay Verified Sandbox</span>
            </div>
            <Link to="/support" className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
              <LifeBuoy className="size-4 shrink-0" />
              <span>Customer Help Center</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#27272A]/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A]">
          <p>© {CURRENT_YEAR} UrbanCab Technologies. Obsidian Geist Design System.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[#34D399]">● Backend Connected: 5213</span>
            <span>Razorpay Test SDK Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
