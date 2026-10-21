# Security review

Reviewed against the public repository source and the live Supabase project `ugoaqdsnizudjifghtoz` on 2026-10-21.

## Browser configuration

- `index.html` loads local modules and styles with relative URLs; no build step or third-party runtime dependency is needed.
- The configured key uses Supabase's `sb_publishable_` prefix. A publishable key is designed to be present in browser code; it relies on Auth and RLS for access control.
- No service-role or secret key was found in the repository source.
- Supabase access tokens are stored in local storage. This permits session restore but means any script injection in this origin could read the token. Keep dependencies minimal and escape user content before rendering.

## Live database observations

- RLS is enabled on the public XP tables. Policies restrict project reads and writes to project owners or members; friendship records are scoped to their requester and addressee.
- `xp_profiles` is readable by every authenticated user. It currently exposes usernames and avatars, which may be intentional for friend search; confirm that this is the desired privacy model.
- The `xp_friends_respond` UPDATE policy checks that the row is pending and the caller is the addressee, but its `WITH CHECK` only preserves the addressee. An authenticated recipient can therefore change other mutable columns, including the requester, while responding.
- The `xp_invites_respond` UPDATE policy similarly checks the original invitee but its `WITH CHECK` only preserves the invitee. Other mutable invite fields are not constrained by that policy.
- Security advisors report that `public.xp_new_user()` is a `SECURITY DEFINER` function executable by both `anon` and `authenticated`. Its body and intended access model need review; revoke public execution or replace it with a narrowly scoped design if it is not deliberately callable.

These are live-project findings. They are recorded for a reviewed database migration; this frontend change does not mutate production schema or policies.

## Limits

RLS does not make client-reported task completion trustworthy. Any value stored only in local storage can be changed by the user. Do not present local XP as verified evidence of work.
