// Session helpers. The token is read by the axios interceptor in api/client.js;
// `user` is cached so the navbar can branch on role without a /auth/me round-trip.

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Where a given role belongs after login.
export function homeFor(user) {
  if (user?.role === 'pharmacy') return '/partner';
  if (user?.role === 'admin') return '/admin';
  return '/';
}
