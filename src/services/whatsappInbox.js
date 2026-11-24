import axios from 'axios';
import { WHATSAPP_INBOX_ENDPOINTS } from './api/endpoints';

const client = axios.create({ timeout: 30000 });

function root(restaurantId) {
    return WHATSAPP_INBOX_ENDPOINTS.ROOT(restaurantId);
}

async function unwrap(request) {
    const response = await request;
    return response.data;
}

export const whatsappInboxService = {
    conversations: (restaurantId, params) => unwrap(client.get(`${root(restaurantId)}/conversations`, { params })),
    conversation: (restaurantId, conversationId) => unwrap(client.get(`${root(restaurantId)}/conversations/${conversationId}`)),
    messages: (restaurantId, conversationId, params) => unwrap(client.get(`${root(restaurantId)}/conversations/${conversationId}/messages`, { params })),
    bookings: (restaurantId, conversationId) => unwrap(client.get(`${root(restaurantId)}/conversations/${conversationId}/bookings`)),
    markRead: (restaurantId, conversationId) => unwrap(client.post(`${root(restaurantId)}/conversations/${conversationId}/read`)),
    send: (restaurantId, conversationId, text) => unwrap(client.post(`${root(restaurantId)}/conversations/${conversationId}/messages`, { text })),
    repair: (restaurantId) => unwrap(client.post(`${root(restaurantId)}/repair`)),
    mediaUrl: (restaurantId, conversationId, mediaId) => `${root(restaurantId)}/media/${mediaId}?conversationId=${encodeURIComponent(conversationId)}`,
};

export function inboxError(error) {
    return error?.response?.data?.error || 'The WhatsApp inbox could not be loaded.';
}
