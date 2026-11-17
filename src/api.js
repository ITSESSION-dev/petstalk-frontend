// Cliente de la API de Pet's Talk
export const API_URL = (import.meta.env.VITE_API_URL || 'https://pets-api.sessian.tech').replace(/\/$/, '');

const TOKEN_KEY = 'petstalk_token';
const USER_KEY = 'petstalk_user';

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* sin storage */ }
}

export const session = {
  get token() { return safeGet(TOKEN_KEY); },
  get user() {
    try { return JSON.parse(safeGet(USER_KEY) || 'null'); } catch { return null; }
  },
  save(token, user) { safeSet(TOKEN_KEY, token); safeSet(USER_KEY, JSON.stringify(user)); },
  clear() { safeSet(TOKEN_KEY, null); safeSet(USER_KEY, null); }
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Revisá tu conexión.');
  }

  let data = null;
  try { data = await res.json(); } catch { /* respuesta vacía */ }

  if (res.status === 401 && session.token) {
    session.clear();
    window.dispatchEvent(new Event('petstalk:logout'));
  }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),

  listPets: () => request('/api/pets'),
  getPet: (id) => request(`/api/pets/${id}`),
  createPet: (payload) => request('/api/pets', { method: 'POST', body: payload }),
  updatePet: (id, payload) => request(`/api/pets/${id}`, { method: 'PUT', body: payload }),
  deletePet: (id) => request(`/api/pets/${id}`, { method: 'DELETE' }),

  getPreferences: (id) => request(`/api/pets/${id}/preferences`),
  savePreferences: (id, payload) => request(`/api/pets/${id}/preferences`, { method: 'PUT', body: payload }),

  listAgenda: (petId) => request(`/api/agenda/${petId}`),
  createAgenda: (payload) => request('/api/agenda', { method: 'POST', body: payload }),
  deleteAgenda: (id) => request(`/api/agenda/${id}`, { method: 'DELETE' }),

  history: (petId, limit = 30) => request(`/api/messages/history/${petId}?limit=${limit}`),
  trigger: (pet_id, trigger_type, extra_context = '') =>
    request('/api/messages/trigger', { method: 'POST', body: { pet_id, trigger_type, extra_context } })
};
