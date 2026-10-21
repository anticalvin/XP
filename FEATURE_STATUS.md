# XP NEXT: product status (October 2026)

## Live architecture
- Static, module-based HTML/CSS/JavaScript, deployed to GitHub Pages under /XP/.
- Guest progress stays in browser localStorage. Signing in loads account-scoped snapshots from Supabase; first-time import requires explicit choice.
- Tasks, projects, categories, XP, coins, timer, personal history, seven-day activity, friend search and request UI are present.
- Cloud saves use revision checks and pause on errors/conflicts rather than silently overwriting remote state.
- Existing Supabase Auth callback, refresh, API retry and logout support remain. Supabase built-in email sending is rate limited.

## Visual overhaul
- Dark urban interface with design tokens, responsive desktop/mobile navigation and restrained lime accent.
- Original inline SVG icon system in ui-icons.js for functional UI. Existing persisted emoji-prefixed categories are unchanged; friendly labels are derived at presentation time.
- Product copy is short and functional. XP is still explicitly self-reported.
- Accessible button labels, focus rings, reduced-motion support, modal roles and responsive safe-area spacing.

## Still not implemented or not fully tested
- Live multi-device auth and social user journeys require real-user browser verification.
- Cloud sync is snapshot-based with conflict refusal; offline queue/merge and Realtime are not implemented.
- Collaborative project membership UI is not implemented. XP is not verified/anti-cheat.
- No custom 3D avatar or original illustrated character assets yet. Existing avatar values remain stored for compatibility.
- No account deletion interface or backup-import restore flow.
- Security observations around friendship/invite update policies and public function execution remain in SECURITY_REVIEW.md and require a separate migration.
- A11y/manual device inspection and browser screenshot regression testing are recommended before claiming full production QA.

## Change discipline
No database schema, RLS, storage keys, account redirect URLs or dependencies were changed by the visual update.

## Account entry update

- Signed-out visitors first see an account-entry screen with separate Sign in and Create account tabs, plus an explicit Continue as guest option.
- Returning authenticated users bypass this screen after session restoration or email confirmation.
- Guest users who open Profile see a sign-in/create-account prompt rather than signed-in profile settings. Guest tasks remain locally stored.
- Supabase Auth endpoints, account-scoped cloud snapshots, and email confirmation behavior are unchanged. The built-in Supabase email sending quota still applies.
- Static regression tests cover mode wiring and signed-out navigation. Manual real-device authentication testing is still needed.
