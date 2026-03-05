/**
 * Auth Service
 * Handles authentication logic with mock credentials.
 * Replace with a real API call when backend auth is ready.
 *
 * Credentials:
 *   billy@gmail.com / billy@123  → restaurantId: '1'
 *   ryan@gmail.com  / ryan@123   → restaurantId: '2'
 */

const MOCK_USERS = [
    {
        email: 'billy@gmail.com',
        password: 'billy@123',
        name: 'Billy',
        role: 'owner',
        restaurantId: '1',
    },
    {
        email: 'ryan@gmail.com',
        password: 'ryan@123',
        name: 'Ryan',
        role: 'owner',
        restaurantId: '2',
    },
    {
        email: 'bjorn@gmail.com',
        password: 'bjorn@123',
        name: 'Bjorn',
        role: 'owner',
        restaurantId: '3',
    },
    {
        email: 'wine@gmail.com',
        password: 'wine@123',
        name: 'Wine Tasting Terrance',
        role: 'owner',
        restaurantId: '4',
    },
];

/**
 * Generate a deterministic mock token that encodes user identity.
 * Format: mock-jwt.<base64(payload)>.<timestamp>
 */
const generateMockToken = (user) => {
    const payload = {
        email: user.email,
        id: user.restaurantId,
        restaurantId: user.restaurantId,
        name: user.name,
        role: user.role,
        iat: Date.now(),
    };
    const encoded = btoa(JSON.stringify(payload));
    return `mock-jwt.${encoded}.${Date.now()}`;
};

export const authService = {
    /**
     * Authenticate a user against mock credentials.
     * Returns { success, token, user } or throws on failure.
     */
    login: async (credentials) => {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 600));

        const found = MOCK_USERS.find(
            (u) =>
                u.email === credentials.email &&
                u.password === credentials.password
        );

        if (!found) {
            throw new Error('Invalid email or password');
        }

        const { password, ...userWithoutPassword } = found;

        return {
            success: true,
            token: generateMockToken(found),
            user: userWithoutPassword, // { email, name, role, restaurantId }
        };
    },

    /**
     * Decode the mock token and extract the payload.
     * Use this to restore session data from a stored token.
     */
    decodeToken: (token) => {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            return JSON.parse(atob(parts[1]));
        } catch {
            return null;
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        return { success: true, message: 'Password updated successfully' };
    },

    /**
     * Register a new restaurant via multipart/form-data.
     * POST https://register.jarviscalling.ai/api/register
     *
     * @param {Object} formData - All registration fields from the Signup form
     * @param {File|null} verificationDoc - The uploaded document file
     * @returns {Promise<{ message: string, registrationId: string }>}
     */
    register: async (formData, verificationDoc) => {
        const body = new FormData();
        body.append('name', formData.name);
        body.append('email', formData.email);
        body.append('password', formData.password);
        body.append('restaurantName', formData.restaurantName);
        body.append('restaurantEmail', formData.restaurantEmail);
        body.append('restaurantPhone', formData.restaurantPhone);
        body.append('restaurantAddress', formData.restaurantAddress);
        body.append('contactName', formData.contactName);
        body.append('contactPhone', formData.contactPhone);
        body.append('contactEmail', formData.contactEmail);
        if (verificationDoc) {
            body.append('verificationDoc', verificationDoc);
        }

        console.log('[Auth] Submitting registration for:', formData.email);

        const response = await fetch('https://register.jarviscalling.ai/api/register', {
            method: 'POST',
            body, // fetch sets Content-Type: multipart/form-data automatically
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || `Registration failed (${response.status})`);
        }

        console.log('[Auth] Registration response:', data);
        return data; // { message, registrationId }
    },
};
