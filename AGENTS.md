<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Workshop starter app

A small Next.js (App Router, TypeScript, Tailwind v4) app shell used in the "Add auth with Clerk by prompting Devin" workshop. Each attendee turns it into their own app idea: they give Devin a name and a one-line description, and Devin brands the app, adds Clerk, and fills in a "Coming soon" page. It starts with **no authentication**.

## Commands

- Install: `npm install`
- Dev server: `npm run dev` (http://localhost:3000)
- Public link to the dev server: `npm run share` (see "Sharing the app")
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

Run lint, typecheck and build before opening a PR.

## Layout

- `app.config.ts` — app `name`, `description`, `emoji`, `accent` color and `upcomingFeatures` (the "Coming soon" list). Branding and the feature list live here, not in components.
- `app/page.tsx` — public landing page that pitches the app. Must stay public.
- `app/dashboard/page.tsx` — the signed-in home: a greeting, an "Open your library" button, the Continue watching row, then one card per `upcomingFeatures` entry and a "Keep building" hint pointing at the next feature (keep that hint). When `upcomingFeatures` is empty it shows a single "everything on the roadmap is live" card instead.
- `app/library/page.tsx` — signed-in poster grid of every video in the library, with the Continue watching row on top.
- `app/watch/[id]/page.tsx` — signed-in player page for one video: title and year, resume position, subtitle tracks and file info.
- `app/api/roadmap/route.ts` — returns `upcomingFeatures` as JSON.
- `app/api/library/route.ts` — `GET` returns `{ videos }` from the library scan.
- `app/api/stream/[id]/route.ts` — streams a video file with HTTP Range support (200 / 206 / 416).
- `app/api/poster/[id]/route.ts` — serves a video's local poster image.
- `app/api/subtitles/[id]/[track]/route.ts` — serves a sidecar `.srt`/`.vtt` subtitle track as WebVTT.
- `app/api/progress/route.ts` — `GET` lists the signed-in user's in-progress videos; `POST { videoId, position, duration }` saves playback progress.
- All the pages above call `await auth.protect()`, and all API routes return `401` JSON when signed out.
- `lib/library.ts` — library root, recursive scan, video ids (base64url of the relative path) and safe path resolution. `lib/metadata.ts` parses titles and years from file names, `lib/posters.ts` finds poster images, `lib/range.ts` and `lib/stream.ts` handle Range requests, `lib/subtitles.ts` finds and converts subtitles, and `lib/progress.ts` stores watch progress.
- `components/Header.tsx` — top nav with Dashboard and Library links, followed by the Clerk sign-in / user controls.
- `components/VideoCard.tsx`, `components/VideoPlayer.tsx`, `components/ContinueWatching.tsx` — poster card, client-side player (subtitles, resume, progress reporting) and the Continue watching row.
- `WATCHTIME_LIBRARY_DIR` — folder of videos to serve, read from the server's filesystem (default `~/Videos`). Dotfiles and symlinked folders are skipped, and paths can't escape it.
- `WATCHTIME_DATA_DIR` — where per-user data such as `progress.json` is written (default `.watchtime/` in the project, which is gitignored).
- `docs/` and `workshop/` — the attendee walkthrough and facilitator material. Don't modify them for app changes.

## Planning requests

- When the user asks for a plan, or asks to change a plan, reply with the plan and stop. Don't edit files, install packages or run commands (including the Clerk CLI) until the user explicitly approves, e.g. by saying "approved". Feedback on a plan is not approval: reply with the full updated plan and wait again.

## Customizing the app

- When the user gives an app name and description, update `app.config.ts`: use their name and description as written (fix only typos), choose a fitting emoji and accent color, and write 4–6 `upcomingFeatures` that follow from the description. Each one should be concrete and small enough to build in one Devin session. Titles under 5 words, descriptions one sentence.
- Adjust the landing page copy to fit the app if needed, but keep it one screen and keep the call to action pointing at `/dashboard`.
- When a feature from `upcomingFeatures` gets built, remove it from the list and link to it from the header.

## Adding Clerk (rules)

- Set up Clerk with the Clerk CLI: `npx -y clerk@latest init`. It works without a Clerk account ("accountless"): it creates a claimable development app, writes keys to `.env.local`, installs `@clerk/nextjs`, wraps the app in `<ClerkProvider>`, and adds `proxy.ts` plus sign-in / sign-up routes. Don't hand-write that setup unless the CLI failed.
- Never ask the user to paste Clerk keys, never print `.env.local`, and never commit `.env*` files (except `.env.example`) or the `.clerk/` folder.
- This project is on Next.js 16, so the Clerk middleware file is `proxy.ts` (not `middleware.ts`).
- `auth()` from `@clerk/nextjs/server` is async — always `await auth()`.
- Use Clerk's prebuilt components (`SignInButton`, `SignUpButton`, `UserButton`, `Show`, `SignIn`, `SignUp`, `UserProfile`) and style them with the `appearance` prop, using the accent color from `app.config.ts`.
- API routes (e.g. `/api/roadmap`) should return `401` JSON when signed out rather than redirecting.
- After setup, run `npx -y clerk@latest doctor` and fix what it reports.
- New Clerk apps only collect email + password at sign-up, so `user.firstName` can be `null`. Fall back to something sensible (e.g. the part of the email before `@`).
- Sign-up may show a "Verify you are human" (Cloudflare) check that automated browsers can't pass. Don't try to bypass it, and don't ask the user to sign up in your own browser: the user tests sign-up at the public link (see "Sharing the app").
- To test sign-up without a real inbox, use an email containing `+clerk_test` (e.g. `jane+clerk_test@example.com`) and the verification code `424242`.

## Sharing the app

- Clerk sign-in doesn't work in the built-in Devin browser preview, so don't share one. Instead, with the dev server running on port 3000, run `npm run share` in a separate shell and keep it running. It starts a Cloudflare quick tunnel (no account needed) and prints a public `https://<random>.trycloudflare.com` link; send that link to the user.
- `next.config.ts` allows `*.trycloudflare.com` in `allowedDevOrigins` so the dev server's scripts load through the link. Keep it.
- The link is public while the tunnel runs, and changes every time `npm run share` restarts. If you restart it, send the new link and say the old one no longer works. Don't put the link in commits or PRs.
- Before sending the link, check it yourself with `curl`: `/` returns 200, `/dashboard` redirects to an `https://` sign-in URL, and `/api/roadmap` returns 401. Then tell the user what you checked and that the sign-up test is theirs to do in their own browser.

## Claiming the Clerk app

- When the user asks to claim their Clerk app, run `npx -y clerk@latest open --print`. It prints a one-time claim URL (`https://dashboard.clerk.com/apps/claim?...`). Send it only to the user in this chat: it works like a password, so never put it in files, commits, PRs or logs.
- After the user claims it, the keys in `.env.local` stay the same and the running app keeps working. The claim page then asks the user to paste the keys into `.env.local`: tell them to click "Otherwise skip" instead, and never ask them to send you the keys. Settings such as password rules are changed by the user in the Clerk Dashboard.
