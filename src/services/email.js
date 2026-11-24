import axios from 'axios';
import { JARVIS_BASE_URL } from './api/endpoints';

const client = axios.create({
    baseURL: `${JARVIS_BASE_URL}/api/email`,
    timeout: 30000,
});

function data(response) {
    return response.data;
}

export const emailService = {
    status: (restaurantId) => client.get(`/${restaurantId}/status`).then(data),
    connect: (restaurantId) => client.get(`/${restaurantId}/connect`).then(data),
    disconnect: (restaurantId) => client.post(`/${restaurantId}/disconnect`).then(data),
    automation: (restaurantId, enabled) => client.patch(`/${restaurantId}/automation`, { enabled }).then(data),
    threads: (restaurantId) => client.get(`/${restaurantId}/threads`).then(data),
    thread: (restaurantId, threadId) => client.get(`/${restaurantId}/threads/${threadId}`).then(data),
    reply: (restaurantId, threadId, text) => client.post(`/${restaurantId}/threads/${threadId}/reply`, { text }).then(data),
    autoReply: (restaurantId, threadId, enabled) => client.patch(`/${restaurantId}/threads/${threadId}/auto-reply`, { enabled }).then(data),
    sync: (restaurantId) => client.post(`/${restaurantId}/sync`).then(data),
};

export function emailError(error) {
    return error?.response?.data?.error || 'The email service could not be reached.';
}
