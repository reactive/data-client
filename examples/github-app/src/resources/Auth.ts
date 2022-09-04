let authValue: string | null = null;

export function setAuth({ login, token }: { login: string; token: string }) {
  const creds = `${login}:${token}`;
  authValue = btoa(creds);
  localStorage.setItem('auth', authValue);
}

export function getAuth() {
  if (authValue === null) {
    authValue = localStorage.getItem('auth');
  }
  return authValue;
}

export function unAuth() {
  authValue = '';
  localStorage.removeItem('auth');
}
