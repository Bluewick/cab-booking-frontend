import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Star,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/feedback/Skeleton';
import DriverInspectionDrawer from '../../components/admin/DriverInspectionDrawer';
import DriverRevokeModal from '../../components/admin/DriverRevokeModal';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import useSocket from '../../hooks/useSocket';
import driverService from '../../services/driver.service';

/**
 * Obsidian Geist Admin Driver Verification & Fleet Management Page
 * Allows system administrators to:
 * 1. View pending driver onboarding requests with live alerts
 * 2. Filter and search the registered driver directory
 * 3. Inspect vehicle specifications, license credentials, and telemetry
 * 4. Verify / Approve new drivers or revoke access with real-time socket propagation
 */
export default function AdminDriversPage() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  // Primary Data State
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all' | 'verified' | 'unverified'

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  // KPI Metrics
  const [kpis, setKpis] = useState({
    pending: 0,
    verified: 0,
    total: 0,
    online: 0,
  });

  // Drawer & Modal States
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverToRevoke, setDriverToRevoke] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1); // Reset to page 1 on search change
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // KPI Counter fetcher
  const fetchKpis = useCallback(async () => {
    try {
      const [pendingRes, verifiedRes, allRes] = await Promise.allSettled([
        driverService.getPendingDrivers({ page: 1, limit: 1 }),
        driverService.getAllDrivers({ is_verified: true, page: 1, limit: 1 }),
        driverService.getAllDrivers({ page: 1, limit: 1 }),
      ]);

      const pendingCount =
        pendingRes.status === 'fulfilled' ? pendingRes.value.meta?.total || 0 : 0;
      const verifiedCount =
        verifiedRes.status === 'fulfilled' ? verifiedRes.value.meta?.total || 0 : 0;
      const totalCount =
        allRes.status === 'fulfilled' ? allRes.value.meta?.total || 0 : 0;

      setKpis((prev) => ({
        ...prev,
        pending: pendingCount,
        verified: verifiedCount,
        total: totalCount,
      }));
    } catch (err) {
      console.warn('Could not update driver KPIs:', err.message);
    }
  }, []);

  // Main driver list fetcher
  const loadDrivers = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      try {
        let result;
        const params = {
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch,
        };

        if (activeTab === 'pending') {
          result = await driverService.getPendingDrivers(params);
        } else if (activeTab === 'verified') {
          result = await driverService.getAllDrivers({ ...params, is_verified: true });
        } else if (activeTab === 'unverified') {
          result = await driverService.getAllDrivers({ ...params, is_verified: false });
        } else {
          result = await driverService.getAllDrivers(params);
        }

        const driverList = result.drivers || [];
        setDrivers(driverList);
        setPaginationMeta(
          result.meta || {
            page: currentPage,
            limit: pageSize,
            total: driverList.length,
            total_pages: Math.ceil(driverList.length / pageSize) || 1,
          }
        );

        // Update online metric based on visible batch or kpis
        const onlineInBatch = driverList.filter((d) => Boolean(d.is_online)).length;
        setKpis((prev) => ({ ...prev, online: onlineInBatch }));
      } catch (err) {
        toast.error(err.message || 'Failed to load driver directory.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, currentPage, pageSize, debouncedSearch, toast]
  );

  // Trigger load on state changes
  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Initial KPI load
  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Real-time socket event listener for live verification updates
  useEffect(() => {
    if (!socket) return;

    const handleVerificationUpdated = (data) => {
      // Refresh list and KPIs when verification changes occur in the fleet
      fetchKpis();
      loadDrivers(true);
      toast.info(
        `Fleet update: Driver verification status changed (${data.driver_id?.slice(0, 8)}...)`
      );
    };

    socket.on('driver:verification_updated', handleVerificationUpdated);

    return () => {
      socket.off('driver:verification_updated', handleVerificationUpdated);
    };
  }, [socket, fetchKpis, loadDrivers, toast]);

  // Verification Action Handler (Approve / Verify)
  const handleVerify = async (driverIdOrUserId, isVerified) => {
    try {
      setActionLoadingId(driverIdOrUserId);
      await driverService.verifyDriver(driverIdOrUserId, isVerified);

      toast.success(
        isVerified
          ? 'Driver successfully verified and authorized for ride dispatch!'
          : 'Driver verification revoked. Driver has been set offline.'
      );

      // Optimistically update driver in table
      setDrivers((prev) =>
        prev.map((d) => {
          const match =
            d.driver_id === driverIdOrUserId ||
            d.user_id === driverIdOrUserId ||
            d.id === driverIdOrUserId;
          return match
            ? { ...d, is_verified: isVerified, is_online: isVerified ? d.is_online : false }
            : d;
        })
      );

      // Optimistically update drawer if open
      if (
        selectedDriver &&
        (selectedDriver.driver_id === driverIdOrUserId ||
          selectedDriver.user_id === driverIdOrUserId)
      ) {
        setSelectedDriver((prev) => ({
          ...prev,
          is_verified: isVerified,
          is_online: isVerified ? prev.is_online : false,
        }));
      }

      // Refresh KPIs and list in background
      fetchKpis();
      if (activeTab === 'pending' && isVerified) {
        // If driver was approved while viewing pending tab, re-sync list
        loadDrivers(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update driver verification status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Revoke Confirmation Workflow
  const handleOpenRevokeModal = (driver) => {
    setDriverToRevoke(driver);
  };

  const handleConfirmRevoke = async (driver) => {
    const targetId = driver.driver_id || driver.user_id || driver.id;
    await handleVerify(targetId, false);
    setDriverToRevoke(null);
  };

  // Manual Refresh
  const handleManualRefresh = () => {
    fetchKpis();
    loadDrivers(true);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#FAFAFA] selection:text-[#09090B]">
      <Navbar user={user} onLogout={logout} />

      <PageContainer maxWidth="7xl" className="flex-1 py-8">
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                Driver Fleet & Verification Desk
              </h1>
              <Badge variant="brand" size="sm">
                Admin Operations
              </Badge>
            </div>
            <p className="text-sm text-[#A1A1AA] mt-1.5 max-w-2xl">
              Inspect driver licenses, verify vehicle registrations, and authorize qualified drivers to operate across the UrbanCab network.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              icon={RefreshCw}
              loading={refreshing}
              loadingText="Syncing..."
              onClick={handleManualRefresh}
              className="text-xs shrink-0"
            >
              Sync Fleet
            </Button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 1. Pending Approvals */}
          <Card
            level={1}
            interactive
            onClick={() => handleTabChange('pending')}
            className={`p-4 transition-all duration-200 cursor-pointer ${
              activeTab === 'pending'
                ? '!border-[#F59E0B] !bg-[rgba(245,158,11,0.06)] ring-1 ring-[#F59E0B]/30'
                : 'hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">Pending Verification</span>
              <div className="p-2 rounded-[8px] bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-[#FBBF24]">
                <ShieldAlert className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#FAFAFA] tabular-nums font-mono">
                {kpis.pending}
              </span>
              {kpis.pending > 0 && (
                <Badge variant="warning" size="sm" pulse>
                  Action Required
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-[#71717A] mt-1 block">
              Drivers awaiting administrative credential review
            </span>
          </Card>

          {/* 2. Verified Active Fleet */}
          <Card
            level={1}
            interactive
            onClick={() => handleTabChange('verified')}
            className={`p-4 transition-all duration-200 cursor-pointer ${
              activeTab === 'verified'
                ? '!border-[#10B981] !bg-[rgba(16,185,129,0.06)] ring-1 ring-[#10B981]/30'
                : 'hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">Verified Fleet</span>
              <div className="p-2 rounded-[8px] bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.25)] text-[#34D399]">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#FAFAFA] tabular-nums font-mono">
                {kpis.verified}
              </span>
              <Badge variant="success" size="sm">
                Authorized
              </Badge>
            </div>
            <span className="text-[11px] text-[#71717A] mt-1 block">
              Fully approved drivers authorized to accept rides
            </span>
          </Card>

          {/* 3. Total Registered Directory */}
          <Card
            level={1}
            interactive
            onClick={() => handleTabChange('all')}
            className={`p-4 transition-all duration-200 cursor-pointer ${
              activeTab === 'all'
                ? '!border-[#FAFAFA] !bg-[#141418] ring-1 ring-[#FAFAFA]/20'
                : 'hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">Total Registered</span>
              <div className="p-2 rounded-[8px] bg-[#1C1C21] border border-[#27272A] text-[#A1A1AA]">
                <Users className="size-4 text-[#FAFAFA]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#FAFAFA] tabular-nums font-mono">
                {kpis.total}
              </span>
              <Badge variant="neutral" size="sm">
                All Time
              </Badge>
            </div>
            <span className="text-[11px] text-[#71717A] mt-1 block">
              Cumulative driver accounts in system database
            </span>
          </Card>

          {/* 4. Real-Time Online Fleet */}
          <Card level={1} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">Live On-Duty</span>
              <div className="p-2 rounded-[8px] bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.25)] text-[#60A5FA]">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#FAFAFA] tabular-nums font-mono">
                {kpis.online}
              </span>
              <Badge variant="brand" size="sm" pulse={kpis.online > 0}>
                Broadcasting
              </Badge>
            </div>
            <span className="text-[11px] text-[#71717A] mt-1 block">
              Drivers broadcasting active spatial telemetry
            </span>
          </Card>
        </div>

        {/* Filter Toolbar: Segmented Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5">
          {/* Segmented Tab Switcher */}
          <div className="inline-flex p-1 bg-[#141418] rounded-[10px] border border-[#27272A] overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('pending')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-[7px] transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/10'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <span>Pending Review</span>
              {kpis.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F59E0B] text-black tabular-nums">
                  {kpis.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-[7px] transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/10'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <span>All Drivers</span>
              <span className="text-[11px] text-[#71717A] tabular-nums font-mono">
                ({kpis.total})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('verified')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-[7px] transition-all cursor-pointer ${
                activeTab === 'verified'
                  ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/10'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <span>Verified Only</span>
              <span className="text-[11px] text-[#71717A] tabular-nums font-mono">
                ({kpis.verified})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('unverified')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-[7px] transition-all cursor-pointer ${
                activeTab === 'unverified'
                  ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/10'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <span>Unverified / Revoked</span>
            </button>
          </div>

          {/* Search Box & Page Size */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#71717A] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, email, plate..."
                className="w-full h-10 pl-9 pr-8 bg-[#141418] text-[#FAFAFA] placeholder:text-[#71717A] text-xs rounded-[8px] border border-[#27272A] focus:outline-none focus:border-[#FAFAFA] focus:ring-1 focus:ring-[#FAFAFA]/20 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
              className="h-10 px-2.5 bg-[#141418] text-[#FAFAFA] text-xs rounded-[8px] border border-[#27272A] focus:outline-none focus:border-[#FAFAFA] cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Driver List Table / Cards */}
        <div className="rounded-[12px] border border-[#27272A] bg-[#0F0F12] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]/70">
                <Skeleton variant="text" width="200px" height="18px" />
                <Skeleton variant="text" width="80px" height="18px" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-[#27272A]/40 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circle" width="40px" height="40px" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton variant="text" width="160px" height="14px" />
                      <Skeleton variant="text" width="120px" height="12px" />
                    </div>
                  </div>
                  <Skeleton variant="rect" width="120px" height="24px" />
                  <Skeleton variant="rect" width="90px" height="24px" />
                  <Skeleton variant="rect" width="100px" height="32px" />
                </div>
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="size-14 rounded-full bg-[#141418] border border-[#27272A] flex items-center justify-center mb-4 text-[#71717A]">
                {activeTab === 'pending' ? (
                  <CheckCircle2 className="size-7 text-[#10B981]" />
                ) : (
                  <Users className="size-7 text-[#71717A]" />
                )}
              </div>
              <h3 className="text-base font-semibold text-[#FAFAFA]">
                {activeTab === 'pending'
                  ? 'No Pending Verifications!'
                  : 'No drivers found matching criteria'}
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-md">
                {activeTab === 'pending'
                  ? 'All newly registered drivers have been reviewed. The onboarding queue is completely clear.'
                  : searchQuery
                  ? `No driver records match "${searchQuery}". Try searching with a different name, email, or license plate.`
                  : 'No driver profiles exist in this category at the moment.'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs"
                >
                  Clear Search Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272A] bg-[#141418]/80 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                    <th className="py-3 px-4">Driver Profile</th>
                    <th className="py-3 px-4">Vehicle Specification</th>
                    <th className="py-3 px-4">License & Rating</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/50 text-xs">
                  {drivers.map((driver) => {
                    const isVerified = Boolean(driver.is_verified);
                    const isOnline = Boolean(driver.is_online);
                    const driverId = driver.driver_id || driver.user_id || driver.id;
                    const isRowActionLoading = actionLoadingId === driverId;

                    return (
                      <tr
                        key={driverId}
                        className="hover:bg-[#141418]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedDriver(driver)}
                      >
                        {/* Driver Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {driver.avatar_url ? (
                              <img
                                src={driver.avatar_url}
                                alt={driver.full_name || 'Driver'}
                                className="size-10 rounded-full object-cover border border-[#27272A] shrink-0"
                              />
                            ) : (
                              <div className="size-10 rounded-full bg-[#1C1C21] border border-[#27272A] flex items-center justify-center font-bold text-[#FAFAFA] shrink-0">
                                {(driver.full_name || 'D').charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-[#FAFAFA] group-hover:text-blue-400 transition-colors truncate">
                                {driver.full_name || 'Unnamed Driver'}
                              </span>
                              <span className="text-[11px] text-[#71717A] truncate">
                                {driver.email || driver.phone_number || 'No contact info'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle Specification */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[#FAFAFA]">
                              {driver.make} {driver.model}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-[#FAFAFA] bg-[#141418] px-1.5 py-0.5 rounded border border-[#27272A] tracking-wider">
                                {driver.plate_number || 'N/A'}
                              </span>
                              <span className="text-[10px] text-[#A1A1AA] uppercase px-1 py-0.2 rounded bg-[#1C1C21]">
                                {driver.vehicle_category || 'standard'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* License & Rating */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[#FAFAFA] text-[11px] font-medium">
                              {driver.license_number || 'N/A'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
                              <Star className="size-3 fill-[#F59E0B] text-[#F59E0B]" />
                              <span className="font-medium text-[#FAFAFA] tabular-nums">
                                {Number(driver.rating_average || 5).toFixed(2)}
                              </span>
                              <span>•</span>
                              <span className="tabular-nums">{driver.total_rides || 0} rides</span>
                            </div>
                          </div>
                        </td>

                        {/* Verification Status */}
                        <td className="py-3.5 px-4">
                          {isVerified ? (
                            <Badge variant="success" size="sm" icon={ShieldCheck}>
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm" pulse icon={ShieldAlert}>
                              Pending Review
                            </Badge>
                          )}
                        </td>

                        {/* Live Telemetry Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full ${
                                isOnline ? 'bg-[#10B981] animate-pulse' : 'bg-[#71717A]'
                              }`}
                            />
                            <span className="text-[11px] text-[#A1A1AA]">
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()} // Prevent row click from triggering drawer
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Profile Button */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Inspect Driver Profile"
                              onClick={() => setSelectedDriver(driver)}
                              className="text-[#A1A1AA] hover:text-[#FAFAFA]"
                            >
                              <Eye className="size-4" />
                            </Button>

                            {/* Verification Toggle Actions */}
                            {isVerified ? (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Revoke Authorization"
                                loading={isRowActionLoading}
                                onClick={() => handleOpenRevokeModal(driver)}
                                className="text-[11px] text-[#F87171] border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[#EF4444]"
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                title="Verify & Authorize Driver"
                                loading={isRowActionLoading}
                                loadingText="Verifying..."
                                icon={CheckCircle2}
                                onClick={() => handleVerify(driverId, true)}
                                className="bg-[#10B981] hover:bg-[#059669] text-[11px] px-2.5"
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer / Pagination */}
          {!loading && drivers.length > 0 && (
            <div className="p-4 border-t border-[#27272A] bg-[#141418]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A1A1AA]">
              <div>
                Showing{' '}
                <strong className="text-[#FAFAFA] tabular-nums">
                  {(paginationMeta.page - 1) * paginationMeta.limit + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#FAFAFA] tabular-nums">
                  {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)}
                </strong>{' '}
                of <strong className="text-[#FAFAFA] tabular-nums">{paginationMeta.total}</strong> drivers
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationMeta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  icon={ChevronLeft}
                  className="text-xs"
                >
                  Previous
                </Button>

                <div className="px-3 py-1 bg-[#141418] border border-[#27272A] rounded-[6px] font-mono text-xs text-[#FAFAFA] tabular-nums">
                  {paginationMeta.page} / {paginationMeta.total_pages || 1}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationMeta.page >= (paginationMeta.total_pages || 1)}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, paginationMeta.total_pages || 1))
                  }
                  icon={ChevronRight}
                  iconPosition="right"
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Driver Full Inspection Drawer */}
      <DriverInspectionDrawer
        isOpen={Boolean(selectedDriver)}
        onClose={() => setSelectedDriver(null)}
        driver={selectedDriver}
        onVerify={handleVerify}
        onRevokeRequest={(d) => {
          setSelectedDriver(null);
          handleOpenRevokeModal(d);
        }}
        actionLoading={Boolean(actionLoadingId)}
      />

      {/* Destructive Revoke Confirmation Modal */}
      <DriverRevokeModal
        isOpen={Boolean(driverToRevoke)}
        onClose={() => setDriverToRevoke(null)}
        driver={driverToRevoke}
        onConfirm={handleConfirmRevoke}
        loading={Boolean(actionLoadingId)}
      />

      <Footer />
    </div>
  );
}
