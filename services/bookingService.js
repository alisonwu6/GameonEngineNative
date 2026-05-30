import { BASE_URL, buildHeaders, handleResponse } from './api';

export const createBooking = (token, body) =>
  fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const getMyBookings = (token) =>
  fetch(`${BASE_URL}/bookings`, {
    headers: buildHeaders(token),
  }).then(handleResponse);

export const updateBookingStatus = (id, token, status) =>
  fetch(`${BASE_URL}/bookings/${id}/status`, {
    method: 'PATCH',
    headers: buildHeaders(token),
    body: JSON.stringify({ status }),
  }).then(handleResponse);

export const deleteBooking = (id, token) =>
  fetch(`${BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  }).then(handleResponse);
