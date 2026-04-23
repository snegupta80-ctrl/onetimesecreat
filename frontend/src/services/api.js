const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  console.log(`API Request: ${API_URL}${endpoint}`);
  console.log('Token exists:', !!token);
  console.log('Token length:', token ? token.length : 0);

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  console.log(`Response status: ${res.status}`);

  if (res.status === 401) {
    console.error('Unauthorized - token invalid or missing');
    // Clear invalid token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
  }

  return res.json();
};

export default apiRequest;
