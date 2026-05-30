import { BASE_URL, buildHeaders, handleResponse } from './api';

export const getSpaces = (venueId, token) =>
  fetch(`${BASE_URL}/venues/${venueId}/spaces`, {
    headers: buildHeaders(token),
  }).then(handleResponse);

export const createSpace = (venueId, token, body) =>
  fetch(`${BASE_URL}/venues/${venueId}/spaces`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const updateSpace = (venueId, spaceId, token, body) =>
  fetch(`${BASE_URL}/venues/${venueId}/spaces/${spaceId}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const deleteSpace = (venueId, spaceId, token) =>
  fetch(`${BASE_URL}/venues/${venueId}/spaces/${spaceId}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  }).then(handleResponse);
