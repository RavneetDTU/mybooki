import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, Info, CreditCard, Building2, RotateCcw, ShieldAlert, TrendingDown } from 'lucide-react';
import { refundService } from '../services/refund';

// ─── Phase constants ──────────────────────────────────────────────────────────
const PHASE = { LOADING: 'loading', FORM: 'form', SUCCESS: 'success', ERROR: 'error' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => `R ${Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const RefundModal = ({ payment, onClose, onRefundSuccess }) => {
    const [phase, setPhase]           = useState(PHASE.LOADING);
    const [queryData, setQueryData]   = useState(null);
    const [queryError, setQueryError] = useState(null);
    const [result, setResult]         = useState(null);

    // Form state
    const [refundType, setRefundType]   = useState('full');   // 'full' | 'partial'
    const [amount, setAmount]           = useState('');
    const [reason, setReason]           = useState('');
    const [accHolder, setAccHolder]     = useState('');
    const [bankName, setBankName]       = useState('');
    const [branchCode, setBranchCode]   = useState('');
    const [accountNum, setAccountNum]   = useState('');
    const [accountType, setAccountType] = useState('');
    const [submitting, setSubmitting]   = useState(false);
    const [formError, setFormError]     = useState(null);

    // ── Run query on mount ────────────────────────────────────────────────────
    const [hasQueried, setHasQueried] = useState(false);
    if (!hasQueried) {
        setHasQueried(true);
        console.log('[RefundModal] Opening for payment:', payment.paymentId, '| gatewayTransactionId:', payment.gatewayTransactionId);
        refundService.queryRefund(payment.gatewayTransactionId)
            .then((data) => {
                if (!data.success || data.status !== 'REFUNDABLE') {
                    const msg = data.error || `Refund not available — status: ${data.status}`;
                    console.warn('[RefundModal] Payment is not refundable:', msg);
                    setQueryError(msg);
                    setPhase(PHASE.ERROR);
                    return;
                }
                setQueryData(data);
                // Pre-set amount to max for full refund
                setAmount(String(data.maxRefundable));
                // Default bankName to first option if available
                if (data.availableBanks?.length) setBankName(data.availableBanks[0].bank_name);
                console.log('[RefundModal] Query success — rendering form');
                console.log('[RefundModal] needsBankDetailsForFull:', data.needsBankDetailsForFull);
                console.log('[RefundModal] needsBankDetailsForPartial:', data.needsBankDetailsForPartial);
                console.log('[RefundModal] maxRefundable:', data.maxRefundable);
                setPhase(PHASE.FORM);
            })
            .catch((err) => {
                console.error('[RefundModal] Query error:', err.message);
                setQueryError(err.message);
                setPhase(PHASE.ERROR);
            });
    }

    // ── Derived: does current refund type need bank details? ──────────────────
    const needsBank = queryData
        ? (refundType === 'full' ? queryData.needsBankDetailsForFull : queryData.needsBankDetailsForPartial)
        : false;

    // ── Handle refund type toggle ─────────────────────────────────────────────
    const handleRefundTypeChange = (type) => {
        setRefundType(type);
        setFormError(null);
        if (type === 'full' && queryData) setAmount(String(queryData.maxRefundable));
        else setAmount('');
    };

    // ── Submit handler ────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setFormError(null);
        const amtNum = parseFloat(amount);
        if (!amount || isNaN(amtNum) || amtNum <= 0) { setFormError('Please enter a valid refund amount.'); return; }
        if (amtNum > queryData.maxRefundable) { setFormError(`Amount exceeds maximum refundable: ${fmt(queryData.maxRefundable)}`); return; }
        if (!reason || reason.trim().length < 3) { setFormError('Reason must be at least 3 characters.'); return; }
        if (needsBank) {
            if (!accHolder.trim()) { setFormError('Account holder name is required.'); return; }
            if (!bankName) { setFormError('Please select a bank.'); return; }
            if (!branchCode.trim() || !/^\d{1,6}$/.test(branchCode.trim())) { setFormError('Branch code must be numeric, max 6 digits.'); return; }
            if (!accountNum.trim() || !/^\d{1,12}$/.test(accountNum.trim())) { setFormError('Account number must be numeric, max 12 digits.'); return; }
            if (!accountType) { setFormError('Please select account type.'); return; }
        }

        const body = {
            paymentId:    queryData.paymentId,
            amount:       amtNum,
            reason:       reason.trim(),
            isFullRefund: refundType === 'full',
        };
        if (needsBank) {
            body.accHolder         = accHolder.trim();
            body.bankName          = bankName;
            body.bankBranchCode    = branchCode.trim();
            body.bankAccountNumber = accountNum.trim();
            body.bankAccountType   = accountType;
        }

        console.log('[RefundModal] Submitting refund with body:', body);
        setSubmitting(true);
        try {
            const data = await refundService.initiateRefund(body);
            setResult(data);
            if (data.success) {
                setPhase(PHASE.SUCCESS);
                onRefundSuccess?.();
            } else {
                setPhase(PHASE.ERROR);
                setQueryError(data.error);
            }
        } catch (err) {
            console.error('[RefundModal] Submit error:', err.message);
            setQueryError(err.message);
            setPhase(PHASE.ERROR);
        } finally {
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render helpers
    // ─────────────────────────────────────────────────────────────────────────

    const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3dd9d9]/40 focus:border-[#3dd9d9] transition-all';
    const labelCls = 'block text-xs font-semibold text-gray-800 mb-1 uppercase tracking-wide';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
        >
            {/* Modal card */}
            <div
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col"
                style={{ maxHeight: '90vh', animation: 'modalIn 0.2s ease' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <RotateCcw className="w-5 h-5 text-[#3dd9d9]" />
                        <div>
                            <h2 className="font-heading font-semibold text-foreground text-base leading-none">
                                Process Refund
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {payment.customerName} · {fmt(payment.amount)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* ── LOADING ─────────────────────────────────────────── */}
                    {phase === PHASE.LOADING && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-8 h-8 text-[#3dd9d9] animate-spin" />
                            <p className="text-sm text-muted-foreground">Checking refund eligibility…</p>
                        </div>
                    )}

                    {/* ── FORM ────────────────────────────────────────────── */}
                    {phase === PHASE.FORM && queryData && (
                        <>
                            {/* ── Transaction Breakdown Panel ─────────────────────── */}
                            <div className="rounded-xl border border-border overflow-hidden" style={{ animation: 'fadeSlideIn 0.2s ease' }}>
                                {/* Header row */}
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
                                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transaction Breakdown</span>
                                    <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{queryData.fundingType}</span>
                                </div>

                                {/* Gross Amount — from payment prop */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-white">
                                    <span className="text-xs text-muted-foreground">Gross Amount Paid</span>
                                    <span className="text-sm font-semibold text-foreground">{fmt(payment.amount)}</span>
                                </div>

                                {/* Gateway Fee — attention row, from payment prop */}
                                {payment.amountFee != null && (
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-amber-50">
                                        <div className="flex items-center gap-1.5">
                                            <TrendingDown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                            <span className="text-xs font-semibold text-amber-800">PayFast Gateway Fee</span>
                                        </div>
                                        <span className="text-sm font-bold text-amber-700">
                                            {fmt(Math.abs(payment.amountFee))}
                                        </span>
                                    </div>
                                )}

                                {/* Net Settlement — from payment prop */}
                                {payment.amountNet != null && (
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-white">
                                        <span className="text-xs text-muted-foreground">Net Settlement Amount</span>
                                        <span className="text-sm font-medium text-foreground">{fmt(payment.amountNet)}</span>
                                    </div>
                                )}

                                {/* Max Refundable — highlighted */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#3dd9d9]/8">
                                    <span className="text-xs font-semibold text-[#1a9090]">Max Refundable</span>
                                    <span className="text-sm font-bold text-[#1a9090]">{fmt(queryData.maxRefundable)}</span>
                                </div>
                            </div>

                            {/* Refund Type Toggle */}
                            <div>
                                <label className={labelCls}>Refund Type</label>
                                <div className="flex gap-2">
                                    {[
                                        { key: 'full',    label: 'Full Refund',    avail: queryData.fullRefundAvailable },
                                        { key: 'partial', label: 'Partial Refund', avail: queryData.partialRefundAvailable },
                                    ].map(({ key, label, avail }) => (
                                        <button
                                            key={key}
                                            onClick={() => avail && handleRefundTypeChange(key)}
                                            disabled={!avail}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer
                                                ${!avail ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground' :
                                                    refundType === key
                                                        ? 'border-[#3dd9d9] bg-[#3dd9d9]/10 text-foreground'
                                                        : 'border-border hover:border-[#3dd9d9]/50 text-foreground'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Full Refund Fee Absorption Warning ──────────────── */}
                            {refundType === 'full' && payment.amountFee != null && (
                                <div
                                    className="flex items-start gap-3 rounded-xl px-4 py-3 border"
                                    style={{
                                        background: 'linear-gradient(135deg, #fff7ed 0%, #fffbf5 100%)',
                                        borderColor: '#f59e0b',
                                        borderLeft: '4px solid #f59e0b',
                                        animation: 'fadeSlideIn 0.2s ease',
                                    }}
                                >
                                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-900 leading-snug">
                                        <span className="font-bold">Attention: </span>
                                        By proceeding with a full refund, your restaurant will bear the PayFast gateway fee of{' '}
                                        <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                            {fmt(Math.abs(payment.amountFee))}
                                        </span>
                                        {' '}— this charge is non-refundable and will be taken entirely by your business.
                                    </p>
                                </div>
                            )}

                            {/* Amount */}
                            <div>
                                <label className={labelCls}>Amount (ZAR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        max={queryData.maxRefundable}
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={refundType === 'full'}
                                        className={`${inputCls} pl-7 ${refundType === 'full' ? 'bg-muted/30 text-muted-foreground cursor-not-allowed' : ''}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Maximum: {fmt(queryData.maxRefundable)}</p>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className={labelCls}>Reason for Refund</label>
                                <textarea
                                    rows={2}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Customer cancellation, duplicate booking…"
                                    className={`${inputCls} resize-none`}
                                    maxLength={255}
                                />
                                <p className="text-xs text-muted-foreground mt-1">{reason.length}/255 characters</p>
                            </div>

                            {/* Bank Details Section — dynamic */}
                            {needsBank && (
                                <div style={{ animation: 'fadeSlideIn 0.25s ease' }}>
                                    {/* Professional info banner */}
                                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-800 mb-0.5">Bank Account Details Required</p>
                                            <p className="text-xs text-amber-700 leading-relaxed">
                                                This payment was made via <strong>{queryData.fundingType}</strong>. Since funds
                                                cannot be returned to the original source automatically, we kindly ask you to
                                                provide the customer's bank account details below so the refund can be
                                                transferred directly and securely.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bank Details</span>
                                        </div>

                                        {/* Account Holder */}
                                        <div>
                                            <label className={labelCls}>Account Holder Name</label>
                                            <input
                                                type="text"
                                                value={accHolder}
                                                onChange={(e) => setAccHolder(e.target.value)}
                                                placeholder="e.g. John Smith"
                                                className={inputCls}
                                            />
                                        </div>

                                        {/* Bank + Account Type row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Bank</label>
                                                <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls}>
                                                    {queryData.availableBanks?.map((b) => (
                                                        <option key={b.bank_name} value={b.bank_name}>{b.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Account Type</label>
                                                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={inputCls}>
                                                    <option value="">Select type</option>
                                                    <option value="current">Current</option>
                                                    <option value="savings">Savings</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Branch Code + Account Number row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Branch Code</label>
                                                <input
                                                    type="text"
                                                    value={branchCode}
                                                    onChange={(e) => setBranchCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="e.g. 250655"
                                                    className={inputCls}
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Account Number</label>
                                                <input
                                                    type="text"
                                                    value={accountNum}
                                                    onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                                    placeholder="e.g. 1234567890"
                                                    className={inputCls}
                                                    maxLength={12}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form Error */}
                            {formError && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{formError}</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── SUCCESS ─────────────────────────────────────────── */}
                    {phase === PHASE.SUCCESS && result && (
                        <div className="py-4 space-y-4" style={{ animation: 'fadeSlideIn 0.25s ease' }}>
                            <div className="flex flex-col items-center text-center gap-3 pb-2">
                                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-heading font-semibold text-foreground text-lg">Refund Processed!</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{result.message}</p>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl divide-y divide-border">
                                {[
                                    { label: 'Refund ID',            value: result.refundId,             mono: true },
                                    { label: 'Refunded Amount',      value: fmt(result.refundedAmount) },
                                    { label: 'Refund Method',        value: result.refundMethod },
                                    { label: 'Refund Status',        value: result.refundStatus },
                                    { label: 'Total Refunded',       value: fmt(result.totalRefunded) },
                                    { label: 'Remaining Refundable', value: fmt(result.remainingRefundable) },
                                ].map(({ label, value, mono }) => (
                                    <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className={`font-medium text-foreground ${mono ? 'font-mono text-xs bg-muted px-2 py-0.5 rounded' : ''}`}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ERROR (query error or not refundable) ───────────── */}
                    {phase === PHASE.ERROR && !result && (
                        <div className="py-8 flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-red-500" />
                            </div>
                            <div>
                                <p className="font-heading font-semibold text-foreground">Refund Not Available</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{queryError}</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
                    {phase === PHASE.FORM && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-5 py-2 text-sm font-semibold bg-foreground text-white rounded-lg hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {submitting ? 'Processing…' : 'Process Refund'}
                            </button>
                        </>
                    )}
                    {(phase === PHASE.SUCCESS || (phase === PHASE.ERROR && !result)) && (
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold bg-foreground text-white rounded-lg hover:bg-foreground/90 transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Keyframe animations injected inline */}
            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.97) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
