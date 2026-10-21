# XP NEXT

XP NEXT is a playful real-life productivity demo published from this repository's root through GitHub Pages. It keeps the current visual identity and does not require a build step, paid API, server, or runtime dependency.

Live demo: <https://anticalvin.github.io/XP/>

## Run locally

Serve the repository root over HTTP (the app uses JavaScript modules, so `file://` is not supported):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Run the automated tests with Node.js 22 or later:

```sh
npm test
```

## Project layout

- `index.html` provides the static app shell and relative asset links. Relative paths are required for the GitHub Pages `/XP/` repository path.
- `style.css` contains the responsive playful interface styles.
- `app.js` renders screens and handles browser interactions and Supabase Auth/social requests.
- `auth-session.js` owns Supabase sign-in, refresh, request retry, and sign-out handling.
- `core.js` contains pure task, XP, recommendation, and browser persistence logic.
- `tests/` covers task state, auth session refresh/sign-out, and Pages asset paths.
- `FEATURE_STATUS.md` and `SECURITY_REVIEW.md` record verified behavior, gaps, and live database findings.

## Data and security

Personal tasks, projects, XP, coins, and activity history are stored in local browser storage. They do not sync between devices and are not authoritative proof of work. Social sign-in and friendship lookup use the Supabase project configured in `app.js`; its browser key is a public publishable key and must rely on RLS for access control. Never put a Supabase secret or service-role key in this repository.

The database policies were inspected on 2026-10-21. The review found fields that can be changed by friend-response and invite-response UPDATE policies; see `SECURITY_REVIEW.md`. Those production policies need a reviewed database migration before XP presents social data as a security boundary.

## GitHub Pages

The `pages.yml` workflow runs tests on pull requests and deploys only after a successful push to `main` or a manual workflow run. GitHub Pages publishes the repository root; there is no compile or install step.
