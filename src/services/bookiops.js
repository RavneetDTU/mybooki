/**
 * BookiOps client — onboarding ingest, number-change ingest, and restaurant session.
 * Enabled only when VITE_BOOKIOPS_API_URL is set (feature-safe when unset).
 */

const BOOKIOPS_API_URL = String(import.meta.env.VITE_BOOKIOPS_API_URL || '')
    .trim()
    .replace(/\/$/, '');

export const isBookiOpsEnabled = () => Boolean(BOOKIOPS_API_URL);

async function request(path, { method = 'GET', body, token, idempotencyKey } = {}) {
    if (!BOOKIOPS_API_URL) {
        throw new Error('BookiOps is not configured');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (idempotencyKey) headers['Idempotency-Key'] = String(idempotencyKey);

    const res = await fetch(`${BOOKIOPS_API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.error || data.message || `Request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
    return data;
}

export const bookiopsService = {
    /**
     * Exchange restaurant owner credentials for a BookiOps ingest JWT.
     * POST /auth/restaurant-session
     */
    createRestaurantSession: async (email, password) => {
        const data = await request('/auth/restaurant-session', {
            method: 'POST',
            body: { email, password },
        });
        return {
            token: data.token,
            restaurantId: data.restaurantId,
            expiresIn: data.expiresIn,
        };
    },

    /**
     * Record a public signup in BookiOps for admin review.
     * POST /ingest/onboarding-requests (unauthenticated JSON).
     * Sends password so BookiOps can store a hash. Does not send the verification file.
     */
    submitOnboardingRequest: async (formData, { idempotencyKey } = {}) => {
        const body = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            restaurantName: formData.restaurantName,
            restaurantEmail: formData.restaurantEmail,
            restaurantPhone: formData.restaurantPhone,
            restaurantAddress: formData.restaurantAddress,
            contactName: formData.contactName,
            contactPhone: formData.contactPhone,
            contactEmail: formData.contactEmail,
            source: 'public_signup',
        };
        const key =
            idempotencyKey ||
            String(formData.email || '').trim().toLowerCase() ||
            null;
        return request('/ingest/onboarding-requests', {
            method: 'POST',
            body,
            idempotencyKey: key,
        });
    },

    /**
     * Attach register.booki.co.za result to an existing onboarding request.
     * POST /ingest/onboarding-requests/:id/register-sync
     */
    markOnboardingRegisterSync: async (id, { registrationId, status, error } = {}) => {
        return request(`/ingest/onboarding-requests/${id}/register-sync`, {
            method: 'POST',
            body: { registrationId, status, error },
        });
    },

    /**
     * Submit a number-change request for admin approval.
     * POST /ingest/number-change-requests
     */
    submitNumberChangeRequest: async (token, requestedNumber) => {
        const data = await request('/ingest/number-change-requests', {
            method: 'POST',
            token,
            body: { requestedNumber },
        });
        return data.request;
    },

    /**
     * Current pending number-change request for this restaurant (if any).
     * GET /ingest/number-change-requests/current
     */
    getCurrentNumberChangeRequest: async (token) => {
        const data = await request('/ingest/number-change-requests/current', { token });
        return data.request || null;
    },
};
