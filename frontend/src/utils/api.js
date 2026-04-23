const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  signup: async (name, email, password) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return response.json();
  },

  // Secrets
  createSecret: async (encryptedData, expiresAt, teamId = null) => {
    const response = await fetch(`${API_URL}/api/secrets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ encryptedData, expiresAt, teamId })
    });
    return response.json();
  },

  getSecret: async (id, password = null) => {
    const response = await fetch(`${API_URL}/api/secrets/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return response.json();
  },

  getUserSecrets: async (tag = null) => {
    const url = tag 
      ? `${API_URL}/api/secrets/user?tag=${tag}`
      : `${API_URL}/api/secrets/user`;
    const response = await fetch(url, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  getSecretLogs: async (secretId) => {
    const response = await fetch(`${API_URL}/api/secrets/${secretId}/logs`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  downloadSecretFile: async (secretId) => {
    const response = await fetch(`${API_URL}/api/secrets/${secretId}/download`, {
      headers: getAuthHeader()
    });
    return response;
  },

  // Teams
  createTeam: async (name) => {
    const response = await fetch(`${API_URL}/api/teams/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  getTeams: async () => {
    const response = await fetch(`${API_URL}/api/teams`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  getTeamById: async (id) => {
    const response = await fetch(`${API_URL}/api/teams/${id}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  inviteMember: async (teamId, email) => {
    const response = await fetch(`${API_URL}/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  removeMember: async (teamId, memberId) => {
    const response = await fetch(`${API_URL}/api/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return response.json();
  },

  updateMemberRole: async (teamId, memberId, role) => {
    const response = await fetch(`${API_URL}/api/teams/${teamId}/members/${memberId}/role`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ role })
    });
    return response.json();
  },

  // Activity
  getActivityLogs: async (limit = 20, teamId = null) => {
    const params = new URLSearchParams({ limit });
    if (teamId) params.append('teamId', teamId);
    const response = await fetch(`${API_URL}/api/activity/logs?${params}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  getAnalytics: async (teamId = null) => {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    const response = await fetch(`${API_URL}/api/activity/analytics?${params}`, {
      headers: getAuthHeader()
    });
    return response.json();
  }
};
