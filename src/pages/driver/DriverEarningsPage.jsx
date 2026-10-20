import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/feedback/Skeleton';
import useAuth from '../../hooks/useAuth';
import paymentService from '../../services/payment.service';

export default function DriverEarningsPage() {
  const { user, logout } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        setLoading(true);
        const data = await paymentService.getEarnings();
        setEarnings(data);
      } catch (err) {
        console.warn('Could not fetch driver earnings:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  const summary = earnings?.summary || {
    total_gross: '0.00',
    total_commission_deducted: '0.00',
    total_net_earnings: '0.00',
    total_completed_trips: 0,
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 py-10">
        <PageContainer maxWidth="6xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                  Driver Earnings & Settlement Ledger
                </h1>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Track gross trip bookings, platform deductions, and net payout balances
                </p>
              </div>
              <Badge variant="success" pulse>
                Payouts Active
              </Badge>
            </div>

            {/* Earnings KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card level={1} className="p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-[#A1A1AA] uppercase">Total Net Earnings</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#34D399] font-mono tabular-nums">
                  ₹{summary.total_net_earnings}
                </span>
                <p className="text-[11px] text-[#71717A]">Direct bank deposits</p>
              </Card>

              <Card level={1} className="p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-[#A1A1AA] uppercase">Gross Bookings</span>
                <span className="text-2xl font-bold text-[#FAFAFA] font-mono tabular-nums">
                  ₹{summary.total_gross}
                </span>
                <p className="text-[11px] text-[#71717A]">Total rider charges</p>
              </Card>

              <Card level={1} className="p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-[#A1A1AA] uppercase">Platform Fees (20%)</span>
                <span className="text-2xl font-bold text-[#F87171] font-mono tabular-nums">
                  ₹{summary.total_commission_deducted}
                </span>
                <p className="text-[11px] text-[#71717A]">Commission & taxes</p>
              </Card>

              <Card level={1} className="p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-[#A1A1AA] uppercase">Settled Trips</span>
                <span className="text-2xl font-bold text-[#60A5FA] font-mono tabular-nums">
                  {summary.total_completed_trips}
                </span>
                <p className="text-[11px] text-[#71717A]">Concluded journeys</p>
              </Card>
            </div>

            {/* Recent Earnings Table */}
            <Card level={1} className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#27272A] bg-[#141418]">
                <h3 className="text-sm font-semibold text-[#FAFAFA]">
                  Trip Settlement Breakdown
                </h3>
              </div>

              {loading ? (
                <div className="p-5 flex flex-col gap-2">
                  <Skeleton variant="rect" width="100%" height="40px" />
                  <Skeleton variant="rect" width="100%" height="40px" />
                </div>
              ) : !earnings?.recent_earnings || earnings.recent_earnings.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71717A]">
                  No settled trips recorded in this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141418]/60 text-[#71717A] uppercase font-mono border-b border-[#27272A]">
                      <tr>
                        <th className="px-5 py-3">Ride ID & Date</th>
                        <th className="px-5 py-3">Route</th>
                        <th className="px-5 py-3">Gross</th>
                        <th className="px-5 py-3">Commission</th>
                        <th className="px-5 py-3">Net Earning</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]/50">
                      {earnings.recent_earnings.map((item) => (
                        <tr key={item.id} className="hover:bg-[#141418] transition-colors">
                          <td className="px-5 py-3.5 font-mono text-[#A1A1AA]">
                            <p className="text-[#FAFAFA]">{item.ride_id.slice(0, 8)}...</p>
                            <span className="text-[10px] text-[#71717A]">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 max-w-xs truncate text-[#E4E4E7]">
                            <p className="truncate">{item.pickup_address}</p>
                            <p className="text-[#71717A] text-[11px] truncate">→ {item.dropoff_address}</p>
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular-nums text-[#FAFAFA]">
                            ₹{item.gross_amount}
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular-nums text-[#F87171]">
                            -₹{item.platform_commission}
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular-nums font-semibold text-[#34D399]">
                            ₹{item.net_driver_earnings}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={item.payout_status === 'settled' ? 'success' : 'warning'} size="sm">
                              {item.payout_status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
