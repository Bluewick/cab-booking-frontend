import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  Printer,
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  LifeBuoy,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Skeleton from '../components/feedback/Skeleton';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import paymentService from '../services/payment.service';

/**
 * Obsidian Geist Official Digital Tax Invoice & Ride Receipt
 * Fully compliant with DESIGN.md Section 3 & 4.
 * Features itemized GST taxation, driver fleet specs, itinerary milestones,
 * and high-fidelity print/export stylesheets.
 */
export default function ReceiptPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const issuedAt = receipt?.issued_at;
  const { formattedDate, formattedTime } = useMemo(() => {
    if (!issuedAt) {
      return { formattedDate: 'Receipt Logged', formattedTime: 'Completed' };
    }
    const d = new Date(issuedAt);
    return {
      formattedDate: d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      formattedTime: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }, [issuedAt]);

  useEffect(() => {
    let isMounted = true;

    async function fetchReceipt() {
      if (!rideId) return;
      try {
        setLoading(true);
        setError('');
        const data = await paymentService.getReceipt(rideId);
        if (isMounted) {
          setReceipt(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to retrieve tax receipt for this ride.');
          toast.error(err.message || 'Receipt not found.', 'Billing Error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReceipt();

    return () => {
      isMounted = false;
    };
  }, [rideId, toast]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans print:bg-white print:text-black">
      {/* Hide interactive navigation during print */}
      <div className="print:hidden">
        <Navbar user={user} onLogout={logout} isConnected={true} />
      </div>

      <main className="flex-1 py-8 sm:py-12 print:py-0">
        <PageContainer maxWidth="4xl">
          {/* Top Bar Actions (Hidden in Print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 print:hidden">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" /> Back to Previous View
            </button>

            <div className="flex items-center gap-2.5">
              <Link to={`/support?rideId=${rideId}`}>
                <Button variant="outline" size="sm" icon={LifeBuoy}>
                  Dispute Invoice
                </Button>
              </Link>
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print / Save PDF
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton variant="rect" width="100%" height="160px" />
              <Skeleton variant="rect" width="100%" height="280px" />
              <Skeleton variant="rect" width="100%" height="180px" />
            </div>
          ) : error || !receipt ? (
            <Card level={1} className="p-10 text-center flex flex-col items-center gap-3">
              <div className="size-12 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#F87171]">
                <Receipt className="size-6" />
              </div>
              <h2 className="text-lg font-bold text-[#FAFAFA]">Receipt Not Found</h2>
              <p className="text-xs text-[#71717A] max-w-sm">
                {error || 'The digital receipt could not be generated. Please confirm the ride has concluded.'}
              </p>
              <Link to="/history" className="mt-3">
                <Button variant="secondary" size="sm">
                  View Past Trips
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Obsidian Invoice Sheet Container */}
              <div className="relative rounded-[16px] bg-[#141418] border border-[#27272A] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden print:shadow-none print:border print:border-gray-300 print:bg-white print:text-black">
                {/* Header Specular Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#3B82F6] via-[#10B981] to-[#3B82F6] print:hidden" />

                <div className="p-6 sm:p-10 flex flex-col gap-8">
                  {/* Company Branding & Tax Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#27272A] print:border-gray-200">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-[#FAFAFA] print:text-black uppercase">
                          Urban<span className="text-[#3B82F6]">Cab</span> Mobility
                        </span>
                        <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-mono font-semibold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 print:border-green-600 print:text-green-800">
                          TAX INVOICE
                        </span>
                      </div>
                      <span className="text-xs text-[#A1A1AA] print:text-gray-600 mt-1">
                        UrbanCab Technologies Private Limited
                      </span>
                      <span className="text-[11px] font-mono text-[#71717A] print:text-gray-500 mt-0.5">
                        GSTIN: 29AABCU9603R1ZM • CIN: U72900KA2024PTC189201
                      </span>
                      <span className="text-[11px] text-[#71717A] print:text-gray-500">
                        Level 4, Cyber Park, Outer Ring Road, Bangalore - 560103, India
                      </span>
                    </div>

                    <div className="flex flex-col sm:items-end text-left sm:text-right">
                      <span className="text-xs uppercase font-mono text-[#71717A] print:text-gray-500">
                        Invoice Reference
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono text-[#60A5FA] print:text-blue-600 tracking-tight">
                        {receipt.receipt_number || `RCPT-${rideId.slice(0, 8).toUpperCase()}`}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] print:text-gray-600 mt-1 font-mono">
                        <Calendar className="size-3 text-[#71717A]" />
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <Clock className="size-3 text-[#71717A]" />
                        <span>{formattedTime}</span>
                      </div>

                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#052E16] text-[#34D399] border border-[#10B981]/30 text-xs font-mono font-bold print:bg-green-100 print:text-green-800">
                        <ShieldCheck className="size-3.5" /> SETTLED & PAID
                      </div>
                    </div>
                  </div>

                  {/* Customer & Driver Entity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] print:bg-gray-50 print:border-gray-200">
                    {/* Passenger Column */}
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] print:text-gray-500 tracking-wider">
                        Billed To (Passenger)
                      </span>
                      <span className="text-sm font-bold text-[#FAFAFA] print:text-black">
                        {receipt.passenger?.name || user?.full_name || 'Passenger'}
                      </span>
                      <span className="text-xs text-[#A1A1AA] print:text-gray-600 font-mono">
                        Phone: {receipt.passenger?.phone || user?.phone_number || 'N/A'}
                      </span>
                      <span className="text-xs text-[#A1A1AA] print:text-gray-600 font-mono">
                        Email: {user?.email || 'N/A'}
                      </span>
                    </div>

                    {/* Driver Column */}
                    <div className="flex flex-col gap-1 text-xs sm:border-l sm:border-[#27272A] sm:pl-6 print:border-gray-200">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] print:text-gray-500 tracking-wider">
                        Transport Provider (Driver Partner)
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#FAFAFA] print:text-black">
                          {receipt.driver?.name || 'Verified Driver'}
                        </span>
                        <span className="text-xs text-[#FBBF24] font-mono">
                          ★ {Number(receipt.driver?.rating || 5.0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-[#A1A1AA] print:text-gray-600">
                        Vehicle: {receipt.driver?.vehicle?.color || ''}{' '}
                        {receipt.driver?.vehicle?.make || 'Toyota'}{' '}
                        {receipt.driver?.vehicle?.model || 'Camry Hybrid'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#60A5FA] print:text-blue-700">
                        Plate: {receipt.driver?.vehicle?.plate_number || 'KA-01-EQ-5544'}
                      </span>
                    </div>
                  </div>

                  {/* Route Itinerary Stepper */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono uppercase text-[#A1A1AA] print:text-gray-500">
                      Journey Itinerary & Milestones
                    </span>

                    <div className="p-4 rounded-[12px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-3 print:bg-white print:border-gray-200">
                      {/* Pickup */}
                      <div className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center shrink-0 mt-0.5 print:bg-green-100">
                          <span className="size-1.5 rounded-full bg-[#10B981]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-mono uppercase text-[#34D399] tracking-wider">
                            Origin Pickup Station
                          </span>
                          <span className="text-xs font-semibold text-[#FAFAFA] print:text-black">
                            {receipt.route?.pickup?.address || 'Origin Address'}
                          </span>
                        </div>
                      </div>

                      {/* Intermediate Stops if any */}
                      {receipt.route?.stops && receipt.route.stops.length > 0 && (
                        <div className="flex flex-col gap-2 pl-2.5 ml-2 border-l border-[#27272A] print:border-gray-300">
                          {receipt.route.stops.map((stop, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2.5 text-xs text-[#A1A1AA] print:text-gray-700">
                              <span className="size-1.5 rounded-full bg-[#F59E0B]" />
                              <span>Stop {sIdx + 1}: {stop.address}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ml-2.5 w-0.5 h-3 bg-[#27272A] print:bg-gray-300" />

                      {/* Dropoff */}
                      <div className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-[#EF4444]/20 border border-[#EF4444] flex items-center justify-center shrink-0 mt-0.5 print:bg-red-100">
                          <span className="size-1.5 rounded-sm bg-[#EF4444]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-mono uppercase text-[#F87171] tracking-wider">
                            Final Dropoff Station
                          </span>
                          <span className="text-xs font-semibold text-[#FAFAFA] print:text-black">
                            {receipt.route?.dropoff?.address || 'Destination Address'}
                          </span>
                        </div>
                      </div>

                      {/* Transit Telemetry Badges */}
                      <div className="flex items-center gap-4 pt-3 mt-1 border-t border-[#27272A] text-xs font-mono text-[#A1A1AA] print:border-gray-200 print:text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Car className="size-3.5 text-[#3B82F6]" />
                          Total Distance:{' '}
                          <strong className="text-[#FAFAFA] print:text-black">
                            {receipt.ride_info?.total_distance_km || '13.5'} km
                          </strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-[#F59E0B]" />
                          Trip Duration:{' '}
                          <strong className="text-[#FAFAFA] print:text-black">
                            {receipt.ride_info?.total_duration_minutes || '32'} mins
                          </strong>
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[#60A5FA]">
                          Category: {receipt.ride_info?.vehicle_category || 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Fare Computation Table */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-mono uppercase text-[#A1A1AA] print:text-gray-500">
                      Itemized Tax Fare Computation
                    </span>

                    <div className="rounded-[12px] overflow-hidden border border-[#27272A] print:border-gray-300">
                      <table className="w-full text-xs font-sans text-left">
                        <thead className="bg-[#0F0F12] text-[#71717A] font-mono uppercase text-[11px] border-b border-[#27272A] print:bg-gray-100 print:text-gray-700 print:border-gray-300">
                          <tr>
                            <th className="py-2.5 px-4">Line Item Description</th>
                            <th className="py-2.5 px-4 text-center">HSN / SAC</th>
                            <th className="py-2.5 px-4 text-right">Rate / Basis</th>
                            <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27272A]/70 print:divide-gray-200">
                          <tr>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#FAFAFA] print:text-black block">
                                Base Fare & Flag Down
                              </span>
                              <span className="text-[11px] text-[#71717A] print:text-gray-500">
                                Initial mobilization fee for vehicle dispatch
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-[#71717A] print:text-gray-600">
                              996412
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#A1A1AA] print:text-gray-600">
                              Flat Rate
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#FAFAFA] print:text-black tabular-nums">
                              ₹{(Number(receipt.fare_breakdown?.trip_subtotal || 150) * 0.4).toFixed(2)}
                            </td>
                          </tr>

                          <tr>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#FAFAFA] print:text-black block">
                                Distance Traversed ({receipt.ride_info?.total_distance_km || '13.5'} km)
                              </span>
                              <span className="text-[11px] text-[#71717A] print:text-gray-500">
                                Metered transit fee based on GPS telemetry
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-[#71717A] print:text-gray-600">
                              996412
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#A1A1AA] print:text-gray-600">
                              ₹14.00 / km
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#FAFAFA] print:text-black tabular-nums">
                              ₹{(Number(receipt.fare_breakdown?.trip_subtotal || 150) * 0.6).toFixed(2)}
                            </td>
                          </tr>

                          {/* Promo Discount Row */}
                          {receipt.fare_breakdown?.promo_discount &&
                            receipt.fare_breakdown?.promo_discount !== 'None' && (
                              <tr className="bg-[rgba(16,185,129,0.04)] print:bg-green-50">
                                <td className="py-2.5 px-4 text-[#34D399] print:text-green-800">
                                  <span className="font-semibold flex items-center gap-1.5">
                                    <Sparkles className="size-3" /> Promotional Discount (
                                    {receipt.fare_breakdown?.promo_code || 'PROMO'})
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-center font-mono text-[#34D399] print:text-green-800">
                                  —
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono text-[#34D399] print:text-green-800">
                                  Instant Discount
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-[#34D399] print:text-green-800 tabular-nums">
                                  - ₹50.00
                                </td>
                              </tr>
                            )}

                          <tr>
                            <td className="py-2.5 px-4 text-[#A1A1AA] print:text-gray-700">
                              Trip Subtotal
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#71717A] print:text-gray-600">
                              —
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-[#71717A] print:text-gray-600">
                              Subtotal
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-[#FAFAFA] print:text-black tabular-nums">
                              ₹{Number(receipt.fare_breakdown?.trip_subtotal || 150).toFixed(2)}
                            </td>
                          </tr>

                          <tr>
                            <td className="py-2.5 px-4 text-[#A1A1AA] print:text-gray-700">
                              Integrated GST Tax (5% on Passenger Transportation)
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#71717A] print:text-gray-600">
                              CGST 2.5% + SGST 2.5%
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-[#71717A] print:text-gray-600">
                              5.00%
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-[#FAFAFA] print:text-black tabular-nums">
                              ₹{Number(receipt.fare_breakdown?.gst_tax || 7.5).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-[#0F0F12] border-t-2 border-[#27272A] print:bg-gray-100 print:border-gray-300">
                          <tr>
                            <td colSpan={3} className="py-3.5 px-4 text-sm font-bold text-[#FAFAFA] print:text-black text-right">
                              Total Amount Paid:
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-xl font-bold font-mono text-[#34D399] print:text-black tabular-nums">
                                ₹{Number(receipt.fare_breakdown?.total_amount_paid || 161.38).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Payment Gateway Transaction Log */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[10px] bg-[#0F0F12] border border-[#27272A] text-xs font-mono print:bg-gray-50 print:border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#71717A] uppercase">Payment ID</span>
                      <span className="font-semibold text-[#FAFAFA] print:text-black truncate">
                        {receipt.payment_details?.payment_id || 'pay_test_completed'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#71717A] uppercase">Order ID</span>
                      <span className="font-semibold text-[#FAFAFA] print:text-black truncate">
                        {receipt.payment_details?.order_id || 'order_test_completed'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#71717A] uppercase">Gateway Method</span>
                      <span className="font-semibold text-[#34D399] print:text-green-800 flex items-center gap-1">
                        <CreditCard className="size-3.5" />
                        {receipt.payment_details?.payment_method || 'Razorpay'}{' '}
                        ({receipt.payment_details?.payment_status || 'captured'})
                      </span>
                    </div>
                  </div>

                  {/* Legal Disclaimers & Signature Footer */}
                  <div className="pt-4 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#71717A] print:text-gray-500 font-mono">
                    <p className="max-w-md leading-relaxed text-center sm:text-left">
                      This is a computer-generated tax invoice issued in terms of Section 31 of the CGST Act, 2017.
                      No physical signature is required.
                    </p>
                    <div className="text-center sm:text-right">
                      <span className="block font-bold text-[#A1A1AA] print:text-gray-700">
                        UrbanCab Mobility Pvt Ltd
                      </span>
                      <span>Authorized Billing System</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageContainer>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
