# XP NEXT feature status

This page separates behavior visible in the frontend from features that still need implementation or verification.

## Verified in source and automated tests

- GitHub Pages serves a static app from the repository root, with CSS and JavaScript loaded through relative paths so the `/XP/` project path works.
- Personal tasks, project records, XP, coins, character profile, and activity history persist in browser local storage.
- The next-task recommendation ranks unfinished work by due date, priority, and the user's available time.
- Completing a task awards personal XP once. Reopening and completing it again does not award XP a second time.
- Deleting a task removes it from active lists while preserving the already-earned XP and activity record.
- The automated core tests cover completion, duplicate XP prevention, deletion, project creation, recommendation, and persistence.
- The frontend contains a Supabase publishable key. No service-role or secret key is present in the source.
- Auth session behavior has automated tests for refresh on restore, retrying one 401 after refresh, and clearing local state during sign-out.
- Live schema inspection found RLS enabled for the public XP tables, with owner/member predicates on project data and user predicates on friend rows.

## Present but not fully verified end to end

- Email sign-up and sign-in use Supabase Auth. A manual account flow was not run during this source audit.
- Session refresh, 401 retry, sign-out, and expired-session handling are implemented and covered with mocked network tests; a real-account browser flow still needs end-to-end verification.
- Friend search and friend requests use the live Supabase tables. There are no seeded users in the inspected project, so multi-account collaboration was not exercised.
- The profile's seven-day chart is a basic count of local completed tasks. It is not a server-side analytics service.

## Incomplete

- Tasks, projects, XP, and profile progress remain local to one browser. Signing in does not sync personal progress across devices.
- The UI does not yet implement collaborative project creation, project membership/invites, or shared task completion, despite related database tables existing.
- XP is self-reported and client-side. It is not suitable for a competitive leaderboard or rewards with monetary value.
- Friends have no blocking, abuse-reporting, or privacy controls in the current UI.
- No dedicated analytics page, export/import restore flow, or account deletion flow is implemented.
- The production RLS policies for friend and project-invite updates need hardening. See `SECURITY_REVIEW.md`.

## Cloud sync foundation (draft PR #2)

- Added an RLS-protected `xp_personal_state` table in the XP Supabase project, plus a revision-checked `xp_save_personal_state` RPC.
- Added `cloud-sync.js` and cloud load/save hooks for signed-in accounts. Guest mode remains local.
- First-time signed-in accounts with local guest progress are asked whether to import or start fresh.
- This is a **snapshot-based early implementation**, not granular task sync. Two-device concurrent edits are detected as conflicts, not merged.
- Cross-device real-browser tests have **not** yet been performed. Offline mutation queue, Realtime, and server-authorized XP rewards are not implemented.
- The existing friendship and invite policy security findings remain outstanding.
- Do not merge this draft PR until end-to-end account tests and conflict-handling UX are complete.
