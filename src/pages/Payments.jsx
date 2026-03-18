import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Users, Calendar, Clock, Phone, ChevronDown, ChevronUp, X, DollarSign, Hash, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { paymentService } from '../services/payments';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Format Firestore-style timestamp ({ _seconds, _nanoseconds }) into a readable string.
 */
const formatTimestamp = (ts) => {
    if (!ts || !ts._seconds) return '—';
    const date = new Date(ts._seconds * 1000);
    return date.toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }) + ' · ' + date.toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format a booking date string (e.g. "2026-03-14") into a readable format.
 */
const formatBookingDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-ZA', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/**
 * Format currency in ZAR (South African Rand).
 */
const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Convert 24h time like "19:00" to "7:00 PM".
 */
const formatTime = (time) => {
    if (!time) return '—';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};


export const Payments = () => {
    const { restaurantId } = useAuthStore();
    const [payments, setPayments] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    const fetchPayments = useCallback(async () => {
        if (!restaurantId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await paymentService.getPayments(restaurantId);
            setPayments(data.payments);
            setTotalAmount(data.totalAmount);
            setTotalCount(data.total);
        } catch (err) {
            console.error('[Payments] Fetch failed:', err);
            setError(err.message || 'Failed to load payments');
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const toggleExpand = (paymentId) => {
        setExpandedRow((prev) => (prev === paymentId ? null : paymentId));
    };

    // Count successful payments
    const successCount = payments.filter((p) => p.status === 'success').length;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <h1 className="font-heading font-semibold text-foreground">
                        Payments
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        View booking payment transactions for your restaurant
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-5">

                {/* Summary Cards */}
                <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        {/* Total Payments Card */}
                        <div className="bg-white border-2 border-foreground rounded-lg px-6 py-3 min-w-[160px]">
                            <p className="text-xs text-muted-foreground mb-1">
                                Total Payments
                            </p>
                            <p className="text-2xl font-heading text-foreground">
                                {totalCount}
                            </p>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="bg-white border border-border rounded-lg px-6 py-3 min-w-[160px]">
                            <p className="text-xs text-muted-foreground mb-1">
                                Total Revenue
                            </p>
                            <p className="text-2xl font-heading text-foreground">
                                {formatCurrency(totalAmount)}
                            </p>
                        </div>

                        {/* Success Rate Card */}
                        <div className="bg-white border border-border rounded-lg px-6 py-3 min-w-[160px]">
                            <p className="text-xs text-muted-foreground mb-1">
                                Successful
                            </p>
                            <p className="text-2xl font-heading text-foreground">
                                {successCount}<span className="text-sm text-muted-foreground font-normal"> / {totalCount}</span>
                            </p>
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchPayments}
                        disabled={isLoading}
                        className="px-5 py-3 bg-foreground text-white rounded-lg hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg font-medium text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-60" />
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={fetchPayments}
                            className="px-4 py-2 border border-border rounded-md hover:bg-muted/20 text-sm font-medium cursor-pointer transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && payments.length === 0 && (
                    <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                        <p className="text-muted-foreground">
                            No payment transactions found
                        </p>
                    </div>
                )}

                {/* Payments Table */}
                {!isLoading && !error && payments.length > 0 && (
                    <div className="bg-white border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guests</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid At</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payments.map((payment, index) => (
                                    <>
                                        {/* Main Row */}
                                        <tr
                                            key={payment.paymentId}
                                            className={`hover:bg-muted/10 transition-all cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-muted/5'} ${expandedRow === payment.paymentId ? 'bg-muted/15' : ''}`}
                                            onClick={() => toggleExpand(payment.paymentId)}
                                        >
                                            {/* Customer */}
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">{payment.customerName || '—'}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3" />
                                                        {payment.customerPhone || '—'}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Booking Date */}
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-foreground">{formatBookingDate(payment.bookingDate)}</span>
                                            </td>

                                            {/* Booking Time */}
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-foreground">{formatTime(payment.bookingTime)}</span>
                                            </td>

                                            {/* Guests */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-sm text-foreground">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {payment.guests}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-semibold text-foreground">{formatCurrency(payment.amount)}</span>
                                            </td>

                                            

                                            {/* Status */}
                                            <td className="px-4 py-3 text-center">
                                                {payment.status === 'success' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Success
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {payment.status || 'Unknown'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Paid At */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs text-muted-foreground">{formatTimestamp(payment.paidAt)}</span>
                                            </td>

                                            {/* Expand Toggle */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpand(payment.paymentId);
                                                    }}
                                                    title="More details"
                                                >
                                                    {expandedRow === payment.paymentId ? (
                                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Details Row */}
                                        {expandedRow === payment.paymentId && (
                                            <tr key={`${payment.paymentId}-details`} className="bg-muted/10">
                                                <td colSpan={10} className="px-6 py-4">
                                                    <div className="flex items-start gap-8 text-sm">
                                                        {/* Payment ID */}
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium">Payment ID</p>
                                                            <p className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">{payment.paymentId}</p>
                                                        </div>
                                                        {/* Call SID */}
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium">Call SID</p>
                                                            <p className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">{payment.callSid}</p>
                                                        </div>
                                                        {/* Gateway Transaction ID */}
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-0.5 font-medium">Gateway Transaction ID</p>
                                                            <p className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">{payment.gatewayTransactionId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};