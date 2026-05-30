import { BASE_URL, buildHeaders, handleResponse } from './api';

export const login = (email, password) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const register = (name, email, password, role) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ name, email, password, role }),
  }).then(handleResponse);

export const getMe = (token) =>
  fetch(`${BASE_URL}/auth/me`, {
    headers: buildHeaders(token),
  }).then(handleResponse);
