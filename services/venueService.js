import { BASE_URL, buildHeaders, handleResponse } from './api';

export const getVenues = (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.manager) query.set('manager', params.manager);
  const qs = query.toString() ? `?${query}` : '';

  return fetch(`${BASE_URL}/venues${qs}`, {
    headers: buildHeaders(token),
  }).then(handleResponse);
};

export const getVenue = (id, token) =>
  fetch(`${BASE_URL}/venues/${id}`, {
    headers: buildHeaders(token),
  }).then(handleResponse);

export const createVenue = (token, body) =>
  fetch(`${BASE_URL}/venues`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const updateVenue = (id, token, body) =>
  fetch(`${BASE_URL}/venues/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const deleteVenue = (id, token) =>
  fetch(`${BASE_URL}/venues/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  }).then(handleResponse);

export const uploadVenueLogo = async (id, token, imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'logo.jpg',
    type: 'image/jpeg',
  });

  const res = await fetch(`${BASE_URL}/venues/${id}/logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse(res);
};

export const getVenueLogoUrl = (venueId) =>
  `${BASE_URL}/venues/${venueId}/logo`;
