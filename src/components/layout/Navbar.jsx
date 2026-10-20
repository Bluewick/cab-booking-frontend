import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Car,
  Radio,
  ShieldAlert,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Receipt,
  Wallet,
  LifeBuoy,
  ShieldCheck,
  Briefcase,
  Activity,
} from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import { useSocket } from '../../hooks/useSocket';

/**
 * Obsidian Geist Professional Navbar
 * Role-Based Access Control (RBAC):
 * - Riders see only: Book Ride, Trips, Support
 * - Drivers see only: Driver Console, Earnings, Vehicles, Support
 * - Admins see: SOS Dispatch Room, Fleet Monitor, Trips, Support
 * Features rich UserDropdownMenu with verified badges and role routing.
 */
export default function Navbar({
  user = null,
  isConnected: propIsConnected,
  onLogout,
}) {
  const socketContext = useSocket();
  const isConnected = propIsConnected !== undefined ? propIsConnected : socketContext.isConnected;
  const connectionStatus = socketContext.connectionStatus || 'disconnected';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const navLinkClass = ({ isActive }) =>
    `text-xs sm:text-sm font-medium transition-colors duration-150 px-3 py-1.5 rounded-[6px] ${
      isActive
        ? 'text-[#FAFAFA] bg-[#1C1C21] font-semibold shadow-sm'
        : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#141418]'
    }`;

  // Role resolution
  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin';
  const isRider = !user || user?.role === 'rider';

  // Brand logo destination based on role
  const brandDestination = isDriver ? '/driver/dashboard' : isAdmin ? '/admin/sos' : '/';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Telemetry Status */}
        <div className="flex items-center gap-4">
          <Link to={brandDestination} className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-[9px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#FAFAFA] group-hover:border-[#3F3F46] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-colors">
              <Car className="size-5 text-[#FAFAFA]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[#FAFAFA] leading-none">
                Urban<span className="text-[#3B82F6]">Cab</span>
              </span>
              {/* <span className="text-[10px] text-[#71717A] tracking-wider uppercase font-mono mt-0.5">
                {isDriver ? 'Driver Portal' : isAdmin ? 'Ops Dispatch' : 'Geist Mobility'}
              </span> */}
            </div>
          </Link>

          {/* Real-time Socket Indicator */}
          {/* <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#141418] border border-[#27272A] text-[11px] font-mono text-[#A1A1AA]"
            title={`WebSocket Engine: ${connectionStatus.toUpperCase()}`}
          >
            <span
              className={`size-2 rounded-full ${
                isConnected
                  ? 'bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]'
                  : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
                  ? 'bg-[#F59E0B] animate-pulse shadow-[0_0_8px_#F59E0B]'
                  : 'bg-[#71717A]'
              }`}
            />
            <span className="text-[10px] uppercase font-semibold">
              {isConnected
                ? 'LIVE'
                : connectionStatus === 'reconnecting'
                ? 'RECONNECTING'
                : connectionStatus === 'connecting'
                ? 'SYNCING'
                : 'OFFLINE'}
            </span>
          </div> */}
        </div>

        {/* Desktop Navigation Links — Strictly Role-Filtered */}
        <nav className="hidden md:flex items-center gap-1">
          {/* 1. Rider Navigation */}
          {isRider && (
            <>
              <NavLink to="/" end className={navLinkClass}>
                Book Ride
              </NavLink>
              {user && (
                <NavLink to="/history" className={navLinkClass}>
                  Trips
                </NavLink>
              )}
              <NavLink to="/support" className={navLinkClass}>
                Support
              </NavLink>
              {!user && (
                <Link
                  to="/register?role=driver"
                  className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] px-2.5 py-1.5 flex items-center gap-1 transition-colors"
                >
                  <Briefcase className="size-3.5 text-[#34D399]" />
                  <span>Drive with Us</span>
                </Link>
              )}
            </>
          )}

          {/* 2. Driver Partner Navigation */}
          {isDriver && (
            <>
              <NavLink to="/driver/dashboard" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <Radio className="size-3.5 text-[#10B981]" />
                  Console
                </span>
              </NavLink>
              <NavLink to="/driver/earnings" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-[#60A5FA]" />
                  Earnings
                </span>
              </NavLink>
              <NavLink to="/driver/register-vehicle" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <Car className="size-3.5 text-[#F59E0B]" />
                  Vehicle
                </span>
              </NavLink>
              <NavLink to="/support" className={navLinkClass}>
                Partner Support
              </NavLink>
            </>
          )}

          {/* 3. Admin Navigation */}
          {isAdmin && (
            <>
              <NavLink to="/admin/sos" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-[#F87171]" />
                  SOS Dispatch
                </span>
              </NavLink>
              <NavLink to="/admin/support" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <LifeBuoy className="size-3.5 text-[#60A5FA]" />
                  Support Desk
                </span>
              </NavLink>
              <NavLink to="/admin/health" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <Activity className="size-3.5 text-[#34D399]" />
                  System Health
                </span>
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                Trips Audit
              </NavLink>
            </>
          )}
        </nav>

        {/* User Session Actions & Professional Dropdown */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Theme Selector */}
          <ThemeToggle variant="segmented" size="sm" />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] bg-[#141418] border border-[#27272A] hover:border-[#3F3F46] transition-all cursor-pointer shadow-sm"
              >
                {/* Avatar with initials or photo */}
                <div className="size-7 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-xs font-bold text-[#FAFAFA] shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'User'}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    user.full_name ? user.full_name[0].toUpperCase() : 'U'
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#FAFAFA] max-w-[120px] truncate leading-tight">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase font-bold tracking-wider leading-none mt-0.5 ${
                      isDriver
                        ? 'text-[#34D399]'
                        : isAdmin
                        ? 'text-[#F87171]'
                        : 'text-[#60A5FA]'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <ChevronDown
                  className={`size-3.5 text-[#71717A] transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180 text-[#FAFAFA]' : ''
                  }`}
                />
              </button>

              {/* Floating Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-[14px] bg-[#141418]/95 backdrop-blur-[20px] border border-[#27272A] shadow-[0_20px_48px_rgba(0,0,0,0.85)] p-2 z-50 animate-scaleUp flex flex-col gap-1">
                  {/* User Identity Header */}
                  <div className="p-3 rounded-[10px] bg-[#0F0F12] border border-[#27272A]/70 flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-sm font-bold text-[#FAFAFA] shrink-0">
                      {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#FAFAFA] truncate">
                        {user.full_name || 'UrbanCab User'}
                      </span>
                      <span className="text-[11px] text-[#71717A] truncate font-mono">
                        {user.email}
                      </span>
                      <span className="text-[10px] font-mono text-[#34D399] flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="size-3" /> Verified {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items (Role Tailored) */}
                  <div className="flex flex-col gap-0.5 pt-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                    >
                      <User className="size-4 text-[#A1A1AA]" />
                      <span>My Profile & Settings</span>
                    </Link>

                    {isRider && (
                      <Link
                        to="/history"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                      >
                        <Receipt className="size-4 text-[#A1A1AA]" />
                        <span>Trip History & Receipts</span>
                      </Link>
                    )}

                    {isDriver && (
                      <>
                        <Link
                          to="/driver/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                        >
                          <Radio className="size-4 text-[#10B981]" />
                          <span>Driver Console</span>
                        </Link>
                        <Link
                          to="/driver/earnings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                        >
                          <Wallet className="size-4 text-[#60A5FA]" />
                          <span>Weekly Earnings & Payouts</span>
                        </Link>
                        <Link
                          to="/driver/register-vehicle"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                        >
                          <Car className="size-4 text-[#F59E0B]" />
                          <span>Vehicle Fleet Details</span>
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/sos"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                      >
                        <ShieldAlert className="size-4 text-[#F87171]" />
                        <span>Emergency SOS Dispatch</span>
                      </Link>
                    )}

                    <Link
                      to="/support"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                    >
                      <LifeBuoy className="size-4 text-[#A1A1AA]" />
                      <span>Help & Support Center</span>
                    </Link>

                    {/* Quick Theme Switch */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-[#0F0F12] border border-[#27272A]/70 text-xs mt-1">
                      <span className="text-[11px] font-medium text-[#A1A1AA]">Appearance</span>
                      <ThemeToggle variant="segmented" size="sm" />
                    </div>
                  </div>

                  {/* Sign Out Action */}
                  {onLogout && (
                    <div className="pt-1 mt-1 border-t border-[#27272A]/70">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#F87171] hover:bg-[#450A0A]/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="size-4" />
                        <span>Sign Out of UrbanCab</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-[8px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#141418] cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Strictly Role-Filtered) */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-5 border-t border-[#27272A] bg-[#09090B] flex flex-col gap-2 animate-fadeIn">
          {/* 1. Rider Mobile Navigation */}
          {isRider && (
            <>
              <NavLink
                to="/"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Book Ride
              </NavLink>
              {user && (
                <NavLink
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  Trip History & Receipts
                </NavLink>
              )}
              <NavLink
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Help & Support
              </NavLink>
            </>
          )}

          {/* 2. Driver Mobile Navigation */}
          {isDriver && (
            <>
              <NavLink
                to="/driver/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Operations Console
              </NavLink>
              <NavLink
                to="/driver/earnings"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Weekly Earnings
              </NavLink>
              <NavLink
                to="/driver/register-vehicle"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Vehicle Fleet
              </NavLink>
              <NavLink
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Partner Support
              </NavLink>
            </>
          )}

          {/* 3. Admin Mobile Navigation */}
          {isAdmin && (
            <>
              <NavLink
                to="/admin/sos"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Emergency SOS Dispatch
              </NavLink>
              <NavLink
                to="/admin/support"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Support & Dispute Desk
              </NavLink>
              <NavLink
                to="/admin/health"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                System Health & Telemetry
              </NavLink>
              <NavLink
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Trips Audit
              </NavLink>
            </>
          )}

          {/* Mobile Theme Selector */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-[#141418] border border-[#27272A] mt-1">
            <span className="text-xs font-medium text-[#A1A1AA]">Appearance</span>
            <ThemeToggle variant="segmented" size="sm" showLabels={true} />
          </div>

          {/* Mobile Profile & Sign Out Bar */}
          <div className="pt-3 border-t border-[#27272A] flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#141418]">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-xs text-[#FAFAFA]"
                  >
                    <User className="size-4 text-[#A1A1AA]" />
                    <span className="font-semibold">{user.full_name || user.email}</span>
                    <span className="text-[10px] font-mono text-[#60A5FA]">({user.role})</span>
                  </Link>
                </div>
                {onLogout && (
                  <Button
                    variant="destructive"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    icon={LogOut}
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
