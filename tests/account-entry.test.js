import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
test('signed-out initial entry waits for session restoration',()=>{
 assert.match(app,/entryState='loading'/);
 assert.match(app,/if\(!user&&entryState==='welcome'\)/);
 assert.match(app,/const active=await auth\.restore\(\)/);
 assert.match(app,/if\(active\)\{entryState='app'/);
});
test('both auth modes are rendered and routed to real Supabase auth',()=>{
 assert.match(app,/data-mode="login"/);
 assert.match(app,/data-mode="signup"/);
 assert.match(app,/signup\?'Create your account':'Welcome back'/);
 assert.match(app,/data-mode="\$\{authMode\}"/);
 assert.match(app,/auth\.signIn\(email,password,mode\)/);
});
test('guest profile has distinct create account and sign in actions',()=>{
 assert.match(app,/function profileGuest\(/);
 assert.match(app,/data-auth="signup"/);
 assert.match(app,/data-auth="login"/);
 assert.match(app,/user\?you\(\):profileGuest\(\)/);
 assert.match(app,/data-guest="1"/);
});
test('signed-out landing is responsive and has accessible labels',()=>{
 assert.match(css,/\.entry-grid/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(app,/aria-label="Account action"/);
});
