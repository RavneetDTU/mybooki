import { create } from 'zustand';
import { authService } from '../services/auth';

export const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
    isAuthenticated: !!localStorage.getItem('authToken'),
    isLoading: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.login(credentials);
            if (response.success) {
                localStorage.setItem('authToken', response.token);
                set({
                    user: response.user,
                    token: response.token,
                    isAuthenticated: true,
                    isLoading: false
                });
                return response;
            }
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.signup(data);
            if (response.success) {
                localStorage.setItem('authToken', response.token);
                set({
                    user: response.user,
                    token: response.token,
                    isAuthenticated: true,
                    isLoading: false
                });
                return response;
            }
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false, error: null });
    },
}));
