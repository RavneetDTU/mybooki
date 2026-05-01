import { REFUND_ENDPOINTS } from './api/endpoints';

/**
 * Refund Service
 * Handles the 2-step PayFast refund flow.
 *
 * Step 1: queryRefund  → GET  /api/refund/query/:gatewayTransactionId
 * Step 2: initiateRefund → POST /api/refund/initiate
 */

export const refundService = {

    /**
     * Step 1 — Query refund eligibility for a payment.
     * Call this first before showing the refund modal form.
     *
     * @param {string} gatewayTransactionId - The PayFast pf_payment_id stored as gatewayTransactionId
     * @returns {Promise<Object>} - Full query response: { success, paymentId, gatewayTransactionId,
     *                              fundingType, status, maxRefundable, fullRefundAvailable,
     *                              partialRefundAvailable, needsBankDetailsForFull,
     *                              needsBankDetailsForPartial, availableBanks, _raw }
     */
    queryRefund: async (gatewayTransactionId) => {
        const url = REFUND_ENDPOINTS.QUERY(gatewayTransactionId);
        console.log('[Refund] Step 1 — Querying refund eligibility');
        console.log('[Refund] GET', url);
        console.log('[Refund] gatewayTransactionId:', gatewayTransactionId);

        const response = await fetch(url);
        const data = await response.json();

        console.log('[Refund] Query response status:', response.status);
        console.log('[Refund] Query response data:', data);

        if (!response.ok) {
            console.error('[Refund] Query request failed with HTTP', response.status);
            throw new Error(data.error || `Query failed with status ${response.status}`);
        }

        return data;
    },

    /**
     * Step 2 — Initiate the refund.
     * Only call after queryRefund returns a REFUNDABLE status.
     *
     * Scenario A (PAYMENT_SOURCE / Card): body has no bank fields.
     * Scenario B (BANK_PAYOUT / EFT):     body includes bank details.
     *
     * @param {Object} body
     * @param {string}  body.paymentId          - Internal Firebase payment ID (from Step 1 response)
     * @param {number}  body.amount             - Refund amount in Rands (backend converts to cents)
     * @param {string}  body.reason             - Admin-provided reason (3–255 chars)
     * @param {boolean} body.isFullRefund        - true for full refund, false for partial
     *
     * BANK_PAYOUT only (when needsBankDetailsForFull / needsBankDetailsForPartial is true):
     * @param {string}  [body.accHolder]         - Account holder name
     * @param {string}  [body.bankName]          - Bank code from availableBanks (e.g. "FNB")
     * @param {string}  [body.bankBranchCode]    - Branch code (numeric, max 6 digits)
     * @param {string}  [body.bankAccountNumber] - Account number (numeric, max 12 digits)
     * @param {string}  [body.bankAccountType]   - "current" or "savings"
     *
     * @returns {Promise<Object>} - { success, refundId, paymentId, refundedAmount,
     *                               refundMethod, refundStatus, totalRefunded,
     *                               remainingRefundable, message }
     */
    initiateRefund: async (body) => {
        const url = REFUND_ENDPOINTS.INITIATE;
        console.log('[Refund] Step 2 — Initiating refund');
        console.log('[Refund] POST', url);
        console.log('[Refund] Request body:', body);
        console.log('[Refund] isFullRefund:', body.isFullRefund, '| amount:', body.amount, '| paymentId:', body.paymentId);

        if (body.bankName) {
            console.log('[Refund] BANK_PAYOUT mode — bank details included');
        } else {
            console.log('[Refund] PAYMENT_SOURCE mode — no bank details needed');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        console.log('[Refund] Initiate response status:', response.status);
        console.log('[Refund] Initiate response data:', data);

        if (data.success) {
            console.log('[Refund] ✅ Refund processed successfully');
            console.log('[Refund] refundId:', data.refundId);
            console.log('[Refund] refundMethod:', data.refundMethod);
            console.log('[Refund] refundedAmount:', data.refundedAmount);
            console.log('[Refund] remainingRefundable:', data.remainingRefundable);
        } else {
            console.error('[Refund] ❌ Refund failed:', data.error);
        }

        return data;
    },
};
