let authValue: string | null = null;

export function setAuth({ login, token }: { login: string; token: string }) {
  const creds = `${login}:${token}`;
  authValue = btoa(creds);
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth', authValue);
  }
}

export function getAuth() {
  if (authValue === null && typeof window !== 'undefined') {
    authValue = localStorage.getItem('auth');
  }
  return authValue;
}

export function unAuth() {
  authValue = '';
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth');
  }
}
