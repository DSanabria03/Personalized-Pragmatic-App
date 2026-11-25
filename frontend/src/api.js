// Talking to the backend + remembering who is logged in and the app settings (in this browser).

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SESSION_KEY = 'pip-session';
const SETTINGS_KEY = 'pip-settings';

// ---------------------------------------------------------------- session (who is logged in)
export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: the login just isn't remembered */
  }
}

// The message of a backend error. Usually "detail" is a sentence for the user; when the data sent doesn't have the
// right shape (status 422) FastAPI sends a list instead: [{ loc: ['body', 'weekly_goal'], msg: 'Input should be...' }].
function errorMessage(detail, status) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    const problems = detail.map((d) => {
      const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
      return field ? `${String(field).replace(/_/g, ' ')}: ${d.msg}` : d.msg;
    });
    return `Please check the data: ${problems.join('; ')}.`;
  }
  return `Error ${status}`;
}

// fetch() with the login token. Throws an Error with the backend's message if something goes wrong.
export async function api(path, { method = 'GET', body, token } = {}) {
  const session = loadSession();
  const authToken = token || (session && session.token);
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(errorMessage(data.detail, response.status));
    error.status = response.status;
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------- settings
export const DEFAULT_SETTINGS = {
  language: 'en', // 'en' or 'it'
  voice: true, // Pip and the customers read their sentences aloud
  grownUpPause: true, // pause for the therapist / grown-up after the first choice that doesn't fit
};

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
