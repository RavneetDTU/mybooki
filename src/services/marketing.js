import apiClient from './api/axios';
import { MARKETING_ENDPOINTS } from './api/endpoints';

function root(restaurantId) {
    return MARKETING_ENDPOINTS.ROOT(restaurantId);
}

async function unwrap(request) {
    const response = await request;
    return response.data;
}

export const marketingService = {
    overview: (restaurantId) => unwrap(apiClient.get(`${root(restaurantId)}/overview`)),
    analytics: (restaurantId) => unwrap(apiClient.get(`${root(restaurantId)}/analytics`)),
    settings: (restaurantId) => unwrap(apiClient.get(`${root(restaurantId)}/settings`)),
    saveSettings: (restaurantId, body) => unwrap(apiClient.put(`${root(restaurantId)}/settings`, body)),
    contacts: (restaurantId, params) => unwrap(apiClient.get(`${root(restaurantId)}/contacts`, { params })),
    saveContact: (restaurantId, body) => unwrap(apiClient.post(`${root(restaurantId)}/contacts`, body)),
    updateContact: (restaurantId, contactId, body) => unwrap(apiClient.patch(`${root(restaurantId)}/contacts/${contactId}`, body)),
    importContacts: (restaurantId, body) => unwrap(apiClient.post(`${root(restaurantId)}/contacts/import`, body)),
    assignGroup: (restaurantId, body) => unwrap(apiClient.post(`${root(restaurantId)}/contacts/group`, body)),
    exportContacts: (restaurantId) => apiClient.get(`${root(restaurantId)}/contacts/export`, { responseType: 'text' }).then((response) => response.data),
    templates: (restaurantId) => unwrap(apiClient.get(`${root(restaurantId)}/templates`)),
    saveTemplate: (restaurantId, body) => unwrap(apiClient.post(`${root(restaurantId)}/templates`, body)),
    updateTemplate: (restaurantId, templateId, body) => unwrap(apiClient.patch(`${root(restaurantId)}/templates/${templateId}`, body)),
    submitTemplate: (restaurantId, templateId) => unwrap(apiClient.post(`${root(restaurantId)}/templates/${templateId}/submit`)),
    syncTemplates: (restaurantId) => unwrap(apiClient.post(`${root(restaurantId)}/templates/sync`)),
    deleteTemplate: (restaurantId, templateId) => unwrap(apiClient.delete(`${root(restaurantId)}/templates/${templateId}`)),
    campaigns: (restaurantId) => unwrap(apiClient.get(`${root(restaurantId)}/campaigns`)),
    createCampaign: (restaurantId, body) => unwrap(apiClient.post(`${root(restaurantId)}/campaigns`, body)),
    updateCampaign: (restaurantId, campaignId, body) => unwrap(apiClient.patch(`${root(restaurantId)}/campaigns/${campaignId}`, body)),
    preview: (restaurantId, audience) => unwrap(apiClient.post(`${root(restaurantId)}/campaigns/preview`, { audience })),
    launch: (restaurantId, campaignId) => unwrap(apiClient.post(`${root(restaurantId)}/campaigns/${campaignId}/launch`, { confirm: true })),
    control: (restaurantId, campaignId, action) => unwrap(apiClient.post(`${root(restaurantId)}/campaigns/${campaignId}/${action}`)),
    campaign: (restaurantId, campaignId) => unwrap(apiClient.get(`${root(restaurantId)}/campaigns/${campaignId}`)),
    recipients: (restaurantId, campaignId, params) => unwrap(apiClient.get(`${root(restaurantId)}/campaigns/${campaignId}/recipients`, { params })),
    importLeads: (restaurantId, campaignId, body) => unwrap(apiClient.post(`${root(restaurantId)}/campaigns/${campaignId}/leads`, body)),
    conversations: (restaurantId, params) => unwrap(apiClient.get(`${root(restaurantId)}/conversations`, { params })),
    conversation: (restaurantId, conversationId, params) => unwrap(apiClient.get(`${root(restaurantId)}/conversations/${conversationId}`, { params })),
    sendMessage: (restaurantId, conversationId, text) => unwrap(apiClient.post(`${root(restaurantId)}/conversations/${conversationId}/messages`, { text })),
    setMode: (restaurantId, conversationId, mode) => unwrap(apiClient.post(`${root(restaurantId)}/conversations/${conversationId}/mode`, { mode })),
};

export function marketingError(error) {
    return error?.response?.data?.error || error?.message || 'Something went wrong.';
}
