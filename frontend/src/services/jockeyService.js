import { httpRequest } from '../api/httpClient';
export function getJockeyProfile() {
    return httpRequest('/api/jockey/profile', {
        fallbackError: 'Unable to load the jockey profile.'
    });
}
export function createJockeyProfile(payload) {
    return httpRequest('/api/jockey/profile', {
        method: 'POST',
        body: payload,
        fallbackError: 'Unable to create the jockey profile.'
    });
}
export function updateJockeyProfile(payload) {
    return httpRequest('/api/jockey/profile', {
        method: 'PUT',
        body: payload,
        fallbackError: 'Unable to update the jockey profile.'
    });
}
// The backend currently uses DELETE /api/jockey/profile. The UI treats it as profile deactivation.
export function deactivateJockeyProfile() {
    return httpRequest('/api/jockey/profile', {
        method: 'DELETE',
        fallbackError: 'Unable to deactivate the jockey profile.'
    });
}
export function getJockeyInvitations() {
    return httpRequest('/api/jockey/invitations', {
        fallbackError: 'Unable to load jockey invitations.'
    });
}
export function acceptJockeyInvitation(invitationId) {
    return httpRequest(`/api/jockey/invitations/${invitationId}/accept`, {
        method: 'PUT',
        fallbackError: 'Unable to accept the invitation.'
    });
}
export function rejectJockeyInvitation(invitationId) {
    return httpRequest(`/api/jockey/invitations/${invitationId}/reject`, {
        method: 'PUT',
        fallbackError: 'Unable to reject the invitation.'
    });
}
