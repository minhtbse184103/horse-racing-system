import { httpRequest } from '../api/httpClient';
export function getOwnerDashboard() {
    return httpRequest('/api/owner/dashboard', {
        fallbackError: 'Unable to load the owner dashboard.'
    });
}
export function getOwnerHorses() {
    return httpRequest('/api/owner/horses', {
        fallbackError: 'Unable to load the horse list.'
    });
}
export function getOwnerHorseById(horseId) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        fallbackError: 'Unable to load horse details.'
    });
}
export function createHorse(payload) {
    return httpRequest('/api/owner/horses', {
        method: 'POST',
        body: payload,
        fallbackError: 'Unable to add the horse.'
    });
}
export function updateHorse(horseId, payload) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        method: 'PUT',
        body: payload,
        fallbackError: 'Unable to update the horse.'
    });
}
export function deleteHorse(horseId) {
    return httpRequest(`/api/owner/horses/${horseId}`, {
        method: 'DELETE',
        fallbackError: 'Unable to delete the horse.'
    });
}
export function getTournaments() {
    return httpRequest('/api/tournaments', {
        fallbackError: 'Unable to load tournaments.'
    });
}
export function getOwnerInvitations() {
    return httpRequest('/api/owner/invitations', {
        fallbackError: 'Unable to load jockey invitations.'
    });
}
export function inviteJockey(payload) {
    return httpRequest('/api/owner/invitations', {
        method: 'POST',
        body: payload,
        fallbackError: 'Unable to send the jockey invitation.'
    });
}
export function cancelOwnerInvitation(invitationId) {
    return httpRequest(`/api/owner/invitations/${invitationId}/cancel`, {
        method: 'PUT',
        fallbackError: 'Unable to cancel the jockey invitation.'
    });
}
