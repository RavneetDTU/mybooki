import axios from 'axios';
import { JARVIS_BASE_URL } from './api/endpoints';

/**
 * Widget Service
 * Handles all communication with the Booki AI Widget backend.
 * Base URL automatically switches: localhost:3000 in dev, env var in production.
 */

const WIDGET_BASE_URL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:3000'
        : (import.meta.env.VITE_WIDGET_API_URL || 'https://widget.booki.co.za');

const widgetClient = axios.create({
    baseURL: WIDGET_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

const phoneClient = axios.create({
    baseURL: JARVIS_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

export const widgetService = {

    /**
     * Get full restaurant profile (name, settings, questionFlow).
     * GET /api/restaurants/[restaurantId]
     */
    getSettings: async (restaurantId) => {
        try {
            console.log('[Widget] Fetching restaurant profile for restaurantId:', restaurantId);
            const res = await widgetClient.get(`/api/restaurants/${restaurantId}`);
            console.log('[Widget] Restaurant profile response:', res.data);
            return res.data;
        } catch (error) {
            console.error('[Widget] Failed to fetch restaurant profile:', error);
            throw error;
        }
    },

    /**
     * Get questions for a restaurant, sorted by order.
     * Calls GET /api/restaurants/[restaurantId] (full profile) and extracts questionFlow.
     * Returns { success, data: [ ...questions ] } to match the expected shape.
     */
    getQuestions: async (restaurantId) => {
        try {
            console.log('[Widget] Fetching questions for restaurantId:', restaurantId);
            const res = await widgetClient.get(`/api/restaurants/${restaurantId}`);
            const questionFlow = res.data?.data?.questionFlow || [];
            console.log('[Widget] Questions extracted from profile:', questionFlow);
            return { success: true, data: questionFlow };
        } catch (error) {
            console.error('[Widget] Failed to fetch questions:', error);
            throw error;
        }
    },

    /**
     * Add a single new question.
     * The server auto-inserts it second-to-last (before Confirmation).
     * POST /api/restaurants/[restaurantId]/questions
     * body: { title, botMessage, isRequired }
     */
    addQuestion: async (restaurantId, payload) => {
        try {
            console.log('[Widget] Adding question for restaurantId:', restaurantId, '| Payload:', payload);
            const res = await widgetClient.post(`/api/restaurants/${restaurantId}/questions`, payload);
            console.log('[Widget] Add question response:', res.data);
            return res.data;
        } catch (error) {
            console.error('[Widget] Failed to add question:', error);
            throw error;
        }
    },

    /**
     * Full replacement of the entire question flow.
     * Used for editing (botMessage, title, isRequired) AND for reordering.
     * Array position = order. Server reassigns 1…N. Existing IDs preserved.
     * PUT /api/restaurants/[restaurantId]/questions
     * body: [ ...allQuestions in desired order ]
     */
    replaceQuestionFlow: async (restaurantId, questionsArray) => {
        try {
            console.log('[Widget] Replacing full question flow for restaurantId:', restaurantId, '| Questions count:', questionsArray.length);
            console.log('[Widget] Question flow payload:', questionsArray);
            const res = await widgetClient.put(`/api/restaurants/${restaurantId}/questions`, { questionFlow: questionsArray });
            console.log('[Widget] Replace question flow response:', res.data);
            return res.data;
        } catch (error) {
            console.error('[Widget] Failed to replace question flow:', error);
            throw error;
        }
    },

    /**
     * Delete a single question by ID.
     * Protected: Greeting and Confirmation will return 400.
     * DELETE /api/restaurants/[restaurantId]/questions/[questionId]
     */
    deleteQuestion: async (restaurantId, questionId) => {
        try {
            console.log('[Widget] Deleting question | restaurantId:', restaurantId, '| questionId:', questionId);
            const res = await widgetClient.delete(`/api/restaurants/${restaurantId}/questions/${questionId}`);
            console.log('[Widget] Delete question response:', res.data);
            return res.data;
        } catch (error) {
            console.error('[Widget] Failed to delete question:', error);
            throw error;
        }
    },

    /**
     * Get all widget conversations for a restaurant (sorted newest first).
     * GET /api/conversations?restaurantId=[restaurantId]
     */
    listConversations: async (restaurantId, params = {}) => {
        const res = await phoneClient.get('/api/widget/conversations', { params: { restaurantId, limit: 30, ...params } });
        return res.data;
    },

    getConversation: async (restaurantId, sessionId, params = {}) => {
        const query = { ...params };
        if (restaurantId) query.restaurantId = restaurantId;
        const res = await phoneClient.get(`/api/widget/conversations/${sessionId}`, { params: query });
        return res.data;
    },

    sendChat: async ({ sessionId, visitorKey, text, kickoff, websiteDomain }) => {
        const res = await phoneClient.post('/api/widget/chat', { sessionId, visitorKey, text, kickoff, websiteDomain });
        return res.data;
    },

    ensureSession: async () => {
        const key = 'booki-phone-widget';
        let stored = null;
        try { stored = JSON.parse(window.sessionStorage.getItem(key) || ''); } catch { stored = null; }
        if (stored?.sessionId && stored?.visitorKey) {
            try {
                const saved = await phoneClient.get(`/api/widget/conversations/${stored.sessionId}`, { params: { visitorKey: stored.visitorKey, limit: 1 } });
                if (saved.data?.conversation) return stored;
            } catch { /* start a fresh session */ }
        }
        const session = { sessionId: crypto.randomUUID(), visitorKey: crypto.randomUUID() };
        window.sessionStorage.setItem(key, JSON.stringify(session));
        await phoneClient.post('/api/widget/chat', {
            ...session,
            kickoff: true,
            websiteDomain: window.location.hostname || '',
        });
        return session;
    },

    shareLocation: async (session) => {
        if (!navigator.geolocation || !session?.sessionId) return null;
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
        });
        const res = await phoneClient.post('/api/widget/place', {
            ...session,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        });
        return res.data?.area || null;
    },

    saveConversation: async (body) => {
        const res = await phoneClient.post('/api/widget/conversations', body);
        return res.data;
    },

    getConversations: async (restaurantId) => {
        const res = await phoneClient.get('/api/widget/conversations', { params: { restaurantId, limit: 30 } });
        return res.data;
    },
};
