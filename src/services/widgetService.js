import axios from 'axios';

/**
 * Widget Service
 * Handles all communication with the Booki AI Widget backend.
 * Base URL automatically switches: localhost:3000 in dev, env var in production.
 */

const WIDGET_BASE_URL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:3000'
        : (import.meta.env.VITE_WIDGET_API_URL || 'https://widget.jarviscalling.ai');

const widgetClient = axios.create({
    baseURL: WIDGET_BASE_URL,
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
    getConversations: async (restaurantId) => {
        try {
            console.log('[Widget] Fetching conversations for restaurantId:', restaurantId);
            const res = await widgetClient.get(`/api/conversations`, { params: { restaurantId } });
            console.log('[Widget] Conversations response:', res.data);
            return res.data;
        } catch (error) {
            console.error('[Widget] Failed to fetch conversations:', error);
            throw error;
        }
    },
};
