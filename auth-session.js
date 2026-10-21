export class AuthSession {
  constructor({ baseUrl, publicKey, storage, fetcher = fetch, onChange = () => {}, onExpired = () => {}, now = Date.now, schedule = setTimeout, cancel = clearTimeout, storageKey = 'xp-web-auth' }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.publicKey = publicKey;
    this.storage = storage;
    this.fetcher = fetcher;
    this.onChange = onChange;
    this.onExpired = onExpired;
    this.now = now;
    this.schedule = schedule;
    this.cancel = cancel;
    this.storageKey = storageKey;
    this.session = null;
    this.timer = null;
    this.refreshing = null;
  }

  get token() { return this.session?.access_token || null; }
  get user() { return this.session?.user || null; }

  persist(value, preserveExpiry = false) {
    const expires_at = preserveExpiry && value.expires_at
      ? value.expires_at
      : this.now() + Number(value.expires_in || 0) * 1000;
    this.session = { ...value, expires_at };
    this.storage.setItem(this.storageKey, JSON.stringify(this.session));
    this.onChange(this.session);
    if (this.timer) this.cancel(this.timer);
    if (expires_at > this.now()) {
      this.timer = this.schedule(() => this.refresh().catch(() => this.expire()), Math.max(1000, expires_at - this.now() - 60000));
    }
    return this.session;
  }

  clear() {
    if (this.timer) this.cancel(this.timer);
    this.timer = null;
    this.session = null;
    this.storage.removeItem(this.storageKey);
    this.onChange(null);
  }

  expire() {
    this.clear();
    this.onExpired();
  }

  async restore() {
    let old;
    try { old = JSON.parse(this.storage.getItem(this.storageKey) || 'null'); }
    catch { this.clear(); return false; }
    if (!old) return false;
    if (old.access_token && old.expires_at > this.now() + 60000) {
      this.persist(old, true);
      return true;
    }
    if (!old.refresh_token) { this.clear(); return false; }
    try { await this.refresh(old); return true; }
    catch { this.clear(); return false; }
  }

  async refresh(source = this.session) {
    if (this.refreshing) return this.refreshing;
    const current = source || JSON.parse(this.storage.getItem(this.storageKey) || 'null');
    if (!current?.refresh_token) throw new Error('Session expired. Please sign in again.');
    this.refreshing = (async () => {
      const response = await this.fetcher(this.baseUrl + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: this.publicKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: current.refresh_token })
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok || !value.access_token) throw new Error(value.msg || value.message || value.error_description || 'Session refresh failed');
      return this.persist(value);
    })();
    try { return await this.refreshing; }
    finally { this.refreshing = null; }
  }

  async signIn(email, password, mode = 'login') {
    const endpoint = mode === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    const response = await this.fetcher(this.baseUrl + endpoint, {
      method: 'POST',
      headers: { apikey: this.publicKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(value.msg || value.message || value.error_description || 'Could not sign in');
    if (!value.access_token) return null;
    return this.persist(value);
  }

  async request(path, options = {}) {
    if (!this.token) throw new Error('Sign in first');
    const run = () => this.fetcher(this.baseUrl + path, {
      ...options,
      headers: { apikey: this.publicKey, 'Content-Type': 'application/json', ...options.headers, Authorization: 'Bearer ' + this.token },
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
    });
    let response = await run();
    if (response.status === 401) { await this.refresh(); response = await run(); }
    return response;
  }

  async signOut() {
    try {
      if (this.token) await this.fetcher(this.baseUrl + '/auth/v1/logout', { method: 'POST', headers: { apikey: this.publicKey, Authorization: 'Bearer ' + this.token } });
    } finally { this.clear(); }
  }
}
