import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LifeBuoy,
  CheckCircle2,
  PackageSearch,
  CreditCard,
  ShieldAlert,
  Search,
  Filter,
  User,
  Mail,
  Car,
  RefreshCw,
  Send,
  CornerDownRight,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/feedback/Skeleton';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import supportService from '../../services/support.service';

const CATEGORY_MAP = {
  lost_item: {
    label: 'Lost Item',
    icon: PackageSearch,
    badgeVariant: 'warning',
  },
  payment_issue: {
    label: 'Payment & Fare',
    icon: CreditCard,
    badgeVariant: 'info',
  },
  driver_behavior: {
    label: 'Driver Feedback',
    icon: User,
    badgeVariant: 'secondary',
  },
  safety: {
    label: 'Safety Escalation',
    icon: ShieldAlert,
    badgeVariant: 'error',
  },
  other: {
    label: 'General Inquiry',
    icon: LifeBuoy,
    badgeVariant: 'outline',
  },
};

const QUICK_RESPONSES = [
  'We have contacted your driver. The lost item was secured and deposited at our central hub for pickup.',
  'Your fare dispute has been reviewed and verified. A full refund of the contested surcharge has been initiated.',
  'We have recorded this report and our driver safety compliance team has flagged the profile for inspection.',
  'Thank you for bringing this to our attention. Our operations team has resolved this inquiry.',
];

/**
 * Obsidian Geist Central Customer Support & Dispute Desk (Admin)
 * Strictly conforms to DESIGN.md dark-first aesthetic, category badges, and resolution workflows.
 */
export default function AdminSupportPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Active Inspection & Response Dialog
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminStatus, setAdminStatus] = useState('resolved');
  const [adminResponse, setAdminResponse] = useState('');
  const [updating, setUpdating] = useState(false);

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;
    supportService.getAllTickets()
      .then((ticketList) => {
        if (!isMounted) return;
        setTickets(Array.isArray(ticketList) ? ticketList : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        toast.error(err.message || 'Could not fetch support queue.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Manual refresh queue handler
  const handleRefreshQueue = useCallback(async () => {
    try {
      setRefreshing(true);
      const ticketList = await supportService.getAllTickets();
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      toast.success(`Support queue refreshed (${ticketList.length} tickets)`);
    } catch (err) {
      toast.error(err.message || 'Could not fetch support queue.');
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Derived Summary Counts
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  // Filtered ticket queue
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = t.subject?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchUser = t.user_name?.toLowerCase().includes(q) || t.user_email?.toLowerCase().includes(q);
        const matchId = t.id?.toLowerCase().includes(q);
        const matchRide = t.ride_id?.toLowerCase().includes(q);
        return matchSubject || matchDesc || matchUser || matchId || matchRide;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  const handleOpenTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setAdminStatus(ticket.status === 'open' ? 'in_progress' : ticket.status);
    setAdminResponse(ticket.admin_response || '');
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!adminResponse.trim()) {
      toast.warning('Please enter an official administrative resolution response.');
      return;
    }

    try {
      setUpdating(true);
      const updated = await supportService.updateTicket(selectedTicket.id, {
        status: adminStatus,
        admin_response: adminResponse.trim(),
      });

      toast.success('Ticket response published and status updated.', 'Ticket Resolved');

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, ...updated, status: adminStatus, admin_response: adminResponse.trim() }
            : t
        )
      );
      setSelectedTicket(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update support ticket.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#3B82F6]/30">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 py-8 sm:py-12">
        <PageContainer maxWidth="6xl">
          <div className="flex flex-col gap-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[10px] bg-[#141418] border border-[#27272A] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                    <LifeBuoy className="size-5 text-[#60A5FA]" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                    Support & Dispute Operations Desk
                  </h1>
                </div>
                <p className="text-xs text-[#A1A1AA] max-w-xl">
                  Centralized queue to triage customer inquiries, lost items, fare disputes, and driver behavior reports.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQueue}
                  loading={refreshing}
                  loadingText="Refreshing..."
                  icon={RefreshCw}
                >
                  Refresh Queue
                </Button>
              </div>
            </div>

            {/* Metrics Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card level={2} className="p-4 flex flex-col gap-1">
                <span className="text-xs font-mono uppercase text-[#71717A]">Total Tickets</span>
                <span className="text-2xl font-bold font-mono text-[#FAFAFA] tabular-nums">
                  {metrics.total}
                </span>
              </Card>

              <Card level={2} className="p-4 flex flex-col gap-1 border-amber-900/40 bg-[#141418]">
                <span className="text-xs font-mono uppercase text-[#F59E0B]">Open / Pending</span>
                <span className="text-2xl font-bold font-mono text-[#FBBF24] tabular-nums">
                  {metrics.open}
                </span>
              </Card>

              <Card level={2} className="p-4 flex flex-col gap-1 border-blue-900/40 bg-[#141418]">
                <span className="text-xs font-mono uppercase text-[#3B82F6]">In Progress</span>
                <span className="text-2xl font-bold font-mono text-[#60A5FA] tabular-nums">
                  {metrics.inProgress}
                </span>
              </Card>

              <Card level={2} className="p-4 flex flex-col gap-1 border-emerald-900/40 bg-[#141418]">
                <span className="text-xs font-mono uppercase text-[#10B981]">Resolved</span>
                <span className="text-2xl font-bold font-mono text-[#34D399] tabular-nums">
                  {metrics.resolved}
                </span>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#141418] border border-[#27272A]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search subject, user, ticket ID, or ride ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#09090B] text-[#FAFAFA] text-xs rounded-[8px] pl-9 pr-3 py-2 border border-[#27272A] focus:outline-none focus:border-[#FAFAFA] placeholder-[#71717A] transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                  <Filter className="size-3.5" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-[#09090B] text-[#FAFAFA] text-xs rounded-[8px] px-2.5 py-1.5 border border-[#27272A] focus:outline-none focus:border-[#FAFAFA]"
                  >
                    <option value="all">All Categories</option>
                    <option value="lost_item">Lost Item</option>
                    <option value="payment_issue">Payment Issue</option>
                    <option value="driver_behavior">Driver Behavior</option>
                    <option value="safety">Safety Escalation</option>
                    <option value="other">General Inquiry</option>
                  </select>
                </div>

                {/* Status Segmented Tabs */}
                <div className="flex items-center bg-[#09090B] p-1 rounded-[8px] border border-[#27272A] text-xs">
                  {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-[6px] capitalize transition-colors font-mono text-[11px] ${
                        statusFilter === st
                          ? 'bg-[#27272A] text-[#FAFAFA] font-medium'
                          : 'text-[#71717A] hover:text-[#A1A1AA]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tickets Table / List */}
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton variant="rect" width="100%" height="90px" />
                <Skeleton variant="rect" width="100%" height="90px" />
                <Skeleton variant="rect" width="100%" height="90px" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card level={1} className="p-12 text-center flex flex-col items-center gap-3">
                <CheckCircle2 className="size-10 text-[#10B981]" />
                <h3 className="text-base font-bold text-[#FAFAFA]">
                  No Tickets Match Current Filter
                </h3>
                <p className="text-xs text-[#71717A] max-w-sm">
                  There are no pending support tickets matching this criteria. Change your filters or search terms.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTickets.map((ticket) => {
                  const catConfig = CATEGORY_MAP[ticket.category] || CATEGORY_MAP.other;
                  const Icon = catConfig.icon;

                  return (
                    <Card
                      key={ticket.id}
                      level={2}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#3F3F46]"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-[10px] bg-[#09090B] border border-[#27272A] text-[#FAFAFA] shrink-0 mt-0.5">
                          <Icon className="size-5 text-[#60A5FA]" />
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                ticket.status === 'resolved'
                                  ? 'success'
                                  : ticket.status === 'in_progress'
                                  ? 'info'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {catConfig.label}
                            </Badge>
                            <span className="text-xs font-mono text-[#71717A]">
                              ID: {ticket.id.slice(0, 8)}...
                            </span>
                            <span className="text-xs font-mono text-[#71717A]">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-[#FAFAFA] truncate">
                            {ticket.subject}
                          </h3>

                          <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                            {ticket.description}
                          </p>

                          {/* User info snippet */}
                          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-[#71717A]">
                            {ticket.user_name && (
                              <span className="flex items-center gap-1 text-[#A1A1AA]">
                                <User className="size-3 text-[#71717A]" />
                                {ticket.user_name}
                              </span>
                            )}
                            {ticket.user_email && (
                              <span className="flex items-center gap-1 text-[#A1A1AA]">
                                <Mail className="size-3 text-[#71717A]" />
                                {ticket.user_email}
                              </span>
                            )}
                            {ticket.ride_id && (
                              <span className="flex items-center gap-1 text-[#60A5FA]">
                                <Car className="size-3" />
                                Ride: {ticket.ride_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>

                          {/* Existing resolution snippet if already resolved */}
                          {ticket.admin_response && (
                            <div className="mt-2 p-2.5 rounded-[8px] bg-[#09090B] border border-[#27272A] flex items-start gap-2 text-xs">
                              <CornerDownRight className="size-3.5 text-[#34D399] shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono uppercase text-[#34D399] font-semibold">
                                  Official Admin Resolution
                                </span>
                                <p className="text-xs text-[#D4D4D8] mt-0.5 line-clamp-1">
                                  {ticket.admin_response}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <Button
                          variant={ticket.status === 'resolved' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleOpenTicketDetails(ticket)}
                        >
                          {ticket.status === 'resolved' ? 'Review / Edit' : 'Respond & Resolve'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </PageContainer>
      </main>

      {/* Ticket Inspection & Resolution Modal */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title="Customer Support Investigation"
        description="Inspect passenger grievance and publish verified operational response."
        size="lg"
      >
        {selectedTicket && (
          <form onSubmit={handleUpdateTicket} className="flex flex-col gap-5 font-sans">
            {/* Header Metadata Container */}
            <div className="p-4 rounded-[10px] bg-[#141418] border border-[#27272A] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {CATEGORY_MAP[selectedTicket.category]?.label || selectedTicket.category}
                  </Badge>
                  <span className="text-xs font-mono text-[#71717A]">
                    Ticket ID: {selectedTicket.id}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#71717A]">
                  Submitted: {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#FAFAFA]">{selectedTicket.subject}</h4>
                <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed bg-[#09090B] p-3 rounded-[8px] border border-[#27272A]">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Passenger & Ride info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#27272A]/60">
                <div className="flex items-center gap-2 text-[#A1A1AA]">
                  <User className="size-3.5 text-[#71717A]" />
                  <span>User: {selectedTicket.user_name || 'Passenger'} ({selectedTicket.user_phone || selectedTicket.user_email || 'Verified Rider'})</span>
                </div>
                {selectedTicket.ride_id && (
                  <div className="flex items-center gap-2 text-[#60A5FA] font-mono text-[11px]">
                    <Car className="size-3.5 text-[#60A5FA]" />
                    <span>Ride ID: {selectedTicket.ride_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Template Pills */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider">
                Quick Response Templates:
              </span>
              <div className="flex flex-col gap-1.5">
                {QUICK_RESPONSES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAdminResponse(tmpl);
                      setAdminStatus('resolved');
                    }}
                    className="text-left text-xs p-2 rounded-[6px] bg-[#141418] border border-[#27272A] hover:border-[#3B82F6] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors leading-relaxed"
                  >
                    "{tmpl}"
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-medium text-[#A1A1AA]">
                Update Dispute Resolution Status <span className="text-[#EF4444]">*</span>
              </label>

              <select
                value={adminStatus}
                onChange={(e) => setAdminStatus(e.target.value)}
                className="bg-[#141418] text-[#FAFAFA] text-xs font-mono rounded-[8px] px-3 py-2 border border-[#27272A] focus:outline-none focus:border-[#FAFAFA]"
              >
                <option value="in_progress">Mark as In Progress</option>
                <option value="resolved">Mark as Resolved</option>
                <option value="open">Keep as Open</option>
              </select>
            </div>

            {/* Admin Response Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A1A1AA]">
                Official Administrator Reply <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Provide clear steps taken (e.g. driver contacted, item stored at locker, refund processed)..."
                className="w-full bg-[#141418] text-[#FAFAFA] text-xs font-sans rounded-[8px] border border-[#27272A] p-3 focus:outline-none focus:border-[#FAFAFA] placeholder-[#71717A] leading-relaxed transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]/70">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedTicket(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={updating}
                loadingText="Updating..."
                icon={Send}
              >
                Publish Resolution
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
