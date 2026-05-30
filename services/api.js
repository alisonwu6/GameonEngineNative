export const BASE_URL = 'https://wombat04.ifn666.com/assessment02/api';

export const buildHeaders = (token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const handleResponse = async (res) => {
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};
