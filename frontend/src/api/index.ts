// API client: auth, files, share (structure only)
const baseUrl = import.meta.env.VITE_API_URL || '';

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    me: (token: string) =>
      fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
  },
  files: {
    list: (token: string) => fetch(`${baseUrl}/files`, { headers: { Authorization: `Bearer ${token}` } }),
    get: (id: string, token: string) => fetch(`${baseUrl}/files/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
    delete: (id: string, token: string) => fetch(`${baseUrl}/files/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
    share: (id: string, expiresInSeconds: number, token: string) =>
      fetch(`${baseUrl}/files/${id}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ expiresInSeconds }) }),
  },
  share: (token: string) => `${baseUrl}/share/${token}`,
};
