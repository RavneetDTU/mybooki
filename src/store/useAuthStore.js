import { create } from 'zustand';
import { authService } from '../services/auth';

const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    RESTAURANT_ID: 'restaurantId',
    USER: 'authUser',
};

/**
 * Restore user from localStorage on page refresh.
 * Decodes the stored token to rebuild user state.
 */
const restoreUserFromStorage = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;
    return authService.decodeToken(token);
};

export const useAuthStore = create((set) => ({
    // ── State ────────────────────────────────────────────────────
    user: restoreUserFromStorage(),
    token: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null,
    restaurantId: localStorage.getItem(STORAGE_KEYS.RESTAURANT_ID) || null,
    isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
    isLoading: false,
    error: null,

    // ── Actions ──────────────────────────────────────────────────

    /**
     * Login with { email, password }.
     * Persists token, restaurantId, and user payload to localStorage.
     */
    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.login(credentials);

            if (response.success) {
                const { token, user } = response;

                // Persist to localStorage
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
                localStorage.setItem(STORAGE_KEYS.RESTAURANT_ID, user.restaurantId);

                set({
                    user,
                    token,
                    restaurantId: user.restaurantId,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });

                return response;
            }
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    /**
     * Clear session completely.
     */
    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.RESTAURANT_ID);

        set({
            user: null,
            token: null,
            restaurantId: null,
            isAuthenticated: false,
            error: null,
        });
    },
}));
