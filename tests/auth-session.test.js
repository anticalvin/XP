import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthSession } from '../auth-session.js';

function harness(fetcher, now = 1_800_000_000_000) {
  const values = new Map();
  const calls = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const auth = new AuthSession({ baseUrl: 'https://example.supabase.co', publicKey: 'sb_publishable_test', storage, fetcher: async (...args) => { calls.push(args); return fetcher(...args); }, now: () => now, schedule: () => 1, cancel: () => {} });
  return { auth, storage, calls, now };
}
const response = (status, value) => ({ status, ok: status >= 200 && status < 300, json: async () => value, text: async () => JSON.stringify(value) });

test('expired stored sessions refresh during restore', async () => {
  const h = harness(async () => response(200, { access_token: 'fresh', refresh_token: 'rotated', expires_in: 3600, user: { id: 'u1' } }));
  h.storage.setItem('xp-web-auth', JSON.stringify({ access_token: 'old', refresh_token: 'r1', expires_at: h.now - 1, user: { id: 'u1' } }));
  assert.equal(await h.auth.restore(), true);
  assert.equal(h.auth.token, 'fresh');
  assert.equal(JSON.parse(h.storage.getItem('xp-web-auth')).refresh_token, 'rotated');
  assert.equal(h.calls[0][0], 'https://example.supabase.co/auth/v1/token?grant_type=refresh_token');
});

test('an expired API token refreshes and retries once', async () => {
  let apiCalls = 0;
  const h = harness(async (url) => {
    if (url.includes('grant_type=refresh_token')) return response(200, { access_token: 'fresh', refresh_token: 'r2', expires_in: 3600, user: { id: 'u1' } });
    apiCalls += 1;
    return apiCalls === 1 ? response(401, { message: 'expired' }) : response(200, [{ id: 'item' }]);
  });
  h.auth.persist({ access_token: 'old', refresh_token: 'r1', expires_in: 1, user: { id: 'u1' } });
  const result = await h.auth.request('/rest/v1/xp_profiles');
  assert.equal(result.status, 200);
  assert.equal(apiCalls, 2);
  assert.equal(h.auth.token, 'fresh');
});

test('sign out clears the local session even when the network fails', async () => {
  const h = harness(async () => { throw new Error('offline'); });
  h.auth.persist({ access_token: 'token', refresh_token: 'r1', expires_in: 3600, user: { id: 'u1' } });
  await assert.rejects(h.auth.signOut(), /offline/);
  assert.equal(h.auth.token, null);
  assert.equal(h.storage.getItem('xp-web-auth'), null);
});

test('signup requests the live XP confirmation redirect', async () => {
 const h=harness(async()=>response(200,{user:{id:'u1'}}));
 h.auth.redirectUrl='https://anticalvin.github.io/XP/';
 await h.auth.signIn('test@example.com','pass123','signup');
 assert.equal(new URL(h.calls[0][0]).searchParams.get('redirect_to'),'https://anticalvin.github.io/XP/');
});
test('email confirmation verifies user before restoring session', async () => {
 const h=harness(async()=>response(200,{id:'u1',email:'test@example.com'}));
 assert.equal(await h.auth.completeEmailConfirmation('#access_token=abc&refresh_token=xyz&expires_in=3600'),true);
 assert.equal(h.auth.user.id,'u1');
 assert.equal(h.calls[0][0],'https://example.supabase.co/auth/v1/user');
});
