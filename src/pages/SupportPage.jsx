import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LifeBuoy,
  Plus,
  CheckCircle2,
  Clock,
  PackageSearch,
  CreditCard,
  ShieldAlert,
  MessageSquare,
  Car,
  Calendar,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Skeleton from '../components/feedback/Skeleton';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import api from '../services/api';

/**
 * Obsidian Geist Help Center & Support Desk
 * Adheres strictly to DESIGN.md with structured conversation bubbles,
 * quick-launch category cards, status filtering, and verified resolution highlights.
 */
export default function SupportPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(() =>
    Boolean(searchParams.get('rideId') || searchParams.get('category'))
  );
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'resolved'

  // Modal Form State
  const [category, setCategory] = useState(
    () => searchParams.get('category') || 'lost_item'
  );
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [rideId, setRideId] = useState(() => searchParams.get('rideId') || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [ticketRes, ridesRes] = await Promise.allSettled([
          api.get('/api/v1/support/my'),
          api.get('/api/v1/rides/history?page=1&limit=10'),
        ]);

        if (isMounted) {
          if (ticketRes.status === 'fulfilled') {
            setTickets(ticketRes.value.data?.tickets || []);
          }
          if (ridesRes.status === 'fulfilled') {
            setRecentRides(ridesRes.value.data?.rides || []);
          }
        }
      } catch (err) {
        if (isMounted) console.warn('Could not fetch support tickets:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenCategory = (cat) => {
    setCategory(cat);
    setModalOpen(true);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      toast.warning('Please provide an inquiry subject and detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/api/v1/support', {
        category,
        subject,
        description,
        ride_id: rideId ? rideId : undefined,
      });

      toast.success(
        'Your support ticket has been registered. An incident dispatcher is on it.',
        'Ticket Created'
      );
      setTickets((prev) => [res.data, ...prev]);
      setSubject('');
      setDescription('');
      setRideId('');
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter === 'resolved') return t.status === 'resolved';
      if (statusFilter === 'open') return t.status !== 'resolved';
      return true;
    });
  }, [tickets, statusFilter]);

  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const openCount = tickets.filter((t) => t.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 py-10">
        <PageContainer maxWidth="6xl">
          <div className="flex flex-col gap-8">
            {/* Top Operations Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                    Help Center & Support Desk
                  </h1>
                  <Badge variant="brand">24/7 Operations</Badge>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">
                  Report forgotten items, fare disputes, or vehicle feedback for immediate dispatcher resolution.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setCategory('lost_item');
                  setModalOpen(true);
                }}
                icon={Plus}
                className="font-semibold"
              >
                Create Support Ticket
              </Button>
            </div>

            {/* Quick Action Assistance Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                level={1}
                interactive
                onClick={() => handleOpenCategory('lost_item')}
                className="p-4 flex flex-col gap-2.5 group hover:border-[#3B82F6]/50"
              >
                <div className="size-9 rounded-[8px] bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
                  <PackageSearch className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-[#60A5FA] transition-colors">
                    Lost & Forgotten Item
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                    Left bag, phone, or keys in driver's vehicle
                  </p>
                </div>
              </Card>

              <Card
                level={1}
                interactive
                onClick={() => handleOpenCategory('payment_issue')}
                className="p-4 flex flex-col gap-2.5 group hover:border-[#10B981]/50"
              >
                <div className="size-9 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform">
                  <CreditCard className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-[#34D399] transition-colors">
                    Billing & Fare Disputes
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                    Double charges, toll adjustments, or refunds
                  </p>
                </div>
              </Card>

              <Card
                level={1}
                interactive
                onClick={() => handleOpenCategory('driver_behavior')}
                className="p-4 flex flex-col gap-2.5 group hover:border-[#F59E0B]/50"
              >
                <div className="size-9 rounded-[8px] bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#FBBF24] group-hover:scale-105 transition-transform">
                  <Car className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-[#FBBF24] transition-colors">
                    Driver & Transit Feedback
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                    Route deviations, vehicle condition, or conduct
                  </p>
                </div>
              </Card>

              <Card
                level={1}
                interactive
                onClick={() => handleOpenCategory('safety')}
                className="p-4 flex flex-col gap-2.5 group hover:border-[#EF4444]/50"
              >
                <div className="size-9 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#F87171] group-hover:scale-105 transition-transform">
                  <ShieldAlert className="size-4.5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-[#F87171] transition-colors">
                    Safety & Emergency Patrol
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">
                    High-priority incident reports & security review
                  </p>
                </div>
              </Card>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-[12px] bg-[#0F0F12] border border-[#27272A]">
              <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[#141418] border border-[#27272A]">
                {[
                  { id: 'all', label: `All Tickets (${tickets.length})` },
                  { id: 'open', label: `In Progress (${openCount})` },
                  { id: 'resolved', label: `Resolved (${resolvedCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-[#27272A] text-[#FAFAFA] font-semibold shadow-sm'
                        : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline">
                Avg Dispatcher Response: &lt; 2h
              </span>
            </div>

            {/* Ticket Stream */}
            {loading ? (
              <div className="flex flex-col gap-4">
                <Skeleton variant="rect" width="100%" height="140px" />
                <Skeleton variant="rect" width="100%" height="140px" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card level={1} className="p-12 text-center flex flex-col items-center gap-3">
                <div className="size-12 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#71717A]">
                  <LifeBuoy className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-[#FAFAFA]">
                  {statusFilter === 'all'
                    ? 'No support inquiries filed'
                    : `No ${statusFilter} support tickets`}
                </h3>
                <p className="text-xs text-[#71717A] max-w-sm leading-relaxed">
                  Have a question regarding a past ride, invoice, or driver encounter? File a ticket to get dedicated resolution.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  icon={Plus}
                  className="mt-2"
                >
                  Create Support Ticket
                </Button>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredTickets.map((ticket) => {
                  const isResolved = ticket.status === 'resolved';
                  const createdAt = ticket.created_at ? new Date(ticket.created_at) : new Date(0);
                  const formattedDate = createdAt.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = createdAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <Card
                      key={ticket.id}
                      level={1}
                      className="p-5 flex flex-col gap-4 border border-[#27272A] hover:border-[#3F3F46] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                    >
                      {/* Ticket Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#27272A]/70">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                              isResolved
                                ? 'bg-[#052E16] text-[#34D399] border-[#10B981]/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : 'bg-[#451A03] text-[#FBBF24] border-[#F59E0B]/30 animate-pulse'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isResolved ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                              }`}
                            />
                            {isResolved ? 'RESOLVED' : 'IN INVESTIGATION'}
                          </span>

                          <span className="text-[11px] font-mono text-[#60A5FA] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded-[5px]">
                            #{ticket.id.slice(0, 8).toUpperCase()}
                          </span>

                          <span className="text-xs font-mono uppercase text-[#A1A1AA] bg-[#141418] border border-[#27272A] px-2 py-0.5 rounded-[5px]">
                            {ticket.category?.replace('_', ' ')}
                          </span>

                          {ticket.ride_id && (
                            <span className="text-[11px] font-mono text-[#71717A]">
                              Ride: #{ticket.ride_id.slice(0, 8).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono text-[#71717A] flex items-center gap-1">
                          <Calendar className="size-3 text-[#A1A1AA]" />
                          {formattedDate} • {formattedTime}
                        </span>
                      </div>

                      {/* Subject Headline */}
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-bold text-[#FAFAFA] tracking-tight">
                          {ticket.subject}
                        </h3>
                      </div>

                      {/* Conversation Flow Container */}
                      <div className="flex flex-col gap-3">
                        {/* 1. Customer Report Bubble */}
                        <div className="p-3.5 rounded-[10px] bg-[#141418] border border-[#27272A] text-xs flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-[#A1A1AA]">
                            <MessageSquare className="size-3.5 text-[#3B82F6]" />
                            <span className="font-semibold text-[#FAFAFA]">Your Reported Inquiry:</span>
                          </div>
                          <p className="text-xs text-[#E4E4E7] leading-relaxed pl-5">
                            {ticket.description}
                          </p>
                        </div>

                        {/* 2. Admin Resolution Bubble (if resolved) */}
                        {ticket.admin_response ? (
                          <div className="p-4 rounded-[10px] bg-[#052E16]/80 border border-[rgba(16,185,129,0.3)] shadow-[0_0_16px_rgba(16,185,129,0.15)] flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
                                <CheckCircle2 className="size-4 text-[#10B981]" />
                                <span>Official Operations Resolution</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#34D399]/70 uppercase">
                                Verified Action
                              </span>
                            </div>
                            <p className="text-xs text-[#FAFAFA] leading-relaxed pl-5 font-normal">
                              {ticket.admin_response}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-[10px] bg-[#451A03]/30 border border-[#F59E0B]/20 text-xs text-[#FBBF24] flex items-center gap-2">
                            <Clock className="size-3.5 shrink-0" />
                            <span>
                              Assigned to regional safety & dispatch unit. You will receive an update once the investigation concludes.
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </PageContainer>
      </main>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Open Support Ticket"
        description="Submit an official inquiry to the 24/7 Operations & Dispatch Desk."
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="flex flex-col gap-4 pt-1">
          <Select
            label="Inquiry Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'lost_item', label: 'Forgotten / Lost Item in Cab' },
              { value: 'payment_issue', label: 'Payment, Surge or Toll Dispute' },
              { value: 'driver_behavior', label: 'Driver Transit Feedback / Route Issue' },
              { value: 'safety', label: 'Safety Incident / Emergency Escalation' },
              { value: 'other', label: 'General Account Inquiry' },
            ]}
          />

          {recentRides.length > 0 && (
            <Select
              label="Associated Ride (Optional)"
              value={rideId}
              onChange={(e) => setRideId(e.target.value)}
              options={[
                { value: '', label: 'None / General Inquiry' },
                ...recentRides.map((r) => ({
                  value: r.id,
                  label: `#${r.id.slice(0, 8).toUpperCase()} • ${r.pickup_address?.slice(0, 24)}... (₹${r.final_fare || r.estimated_fare})`,
                })),
              ]}
            />
          )}

          <Input
            label="Subject Headline"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="e.g. Left black travel umbrella on the rear seat"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A1A1AA]">
              Detailed Explanation <span className="text-[#F87171]">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details such as item color, approximate transit time, or dispute reason..."
              className="w-full bg-[#141418] text-[#FAFAFA] text-xs rounded-[9px] border border-[#27272A] p-3 focus:outline-none focus:border-[#FAFAFA] focus:ring-2 focus:ring-white/10 placeholder-[#71717A] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272A]/70">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              loadingText="Submitting Ticket..."
              icon={Plus}
            >
              Register Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
