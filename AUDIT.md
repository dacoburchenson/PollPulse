# PollPulse Codebase Audit

**Repo:** https://github.com/dacoburchenson/PollPulse
**Auditor:** Elon (CTO)
**Date:** 2026-07-08
**Branch:** `main` @ `95ce8ed` (single commit — "Initial commit")
**LOC:** ~8,462 across 56 source files (32 in `src/app`, 38 in `src/components/ui`, ~10 app-specific)

---

## Executive Summary

PollPulse is a Next.js 15 / Firebase / Genkit polling platform that looks polished in screenshots but is **prototype-grade under the hood**: ~70% of UI is mock data, the entire app is client-rendered (no SSR), the Firestore security model is dangerously permissive for `campaigns`, and the consumer/brand distinction is enforced only by a client-side radio button. There is **zero test coverage**. Authentication, role separation, and the response-write path need a security refactor before this is safe to point at real users or a live Firebase project.

The good news: the codebase is small, well-organized, and uses modern idioms (shadcn/ui, Tailwind, Server Actions, Genkit flows). A focused 2–3 week refactor would close the critical gaps and ship a credible MVP.

---

## 🔴 CRITICAL

### C1. Firestore security rules allow ANY authenticated user to write ANYONE'S campaign
**File:** `firestore.rules` (the whole file)
```
match /campaigns/{campaignId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == request.resource.data.userId;
}
```
Two flaws stacked:
1. `request.resource.data.userId` is the **incoming** document. A malicious user can `setDoc(campaign, { userId: victimUid, ... })` and overwrite any campaign by setting `userId` to the victim's UID on the request. There is **no ownership check on update/delete** — the rule only validates the new doc shape.
2. **No delete rule.** Default-deny in Firestore means deletes are blocked, but `write` covers `create | update | delete`, so a user can never legitimately delete from the client.

**Fix:**
```js
match /campaigns/{campaignId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == request.resource.data.userId
                 && request.resource.data.keys().hasAll(['name','status','userId']);
  allow update: if request.auth.uid == resource.data.userId
                 && request.auth.uid == request.resource.data.userId; // prevent userId reassignment
  allow delete: if request.auth.uid == resource.data.userId;
}
match /campaigns/{campaignId}/responses/{responseId} {
  allow create: if request.auth != null
                 && request.resource.data.userId == request.auth.uid;
  allow read:   if request.auth != null
                 && (request.auth.uid == resource.data.userId
                     || get(/databases/$(database)/documents/campaigns/$(campaignId)).data.userId == request.auth.uid);
}
```

### C2. `responses` subcollection has no security rule at all
**File:** `firestore.rules`
The app writes consumer survey responses to `campaigns/{id}/responses/{responseId}` (see `src/app/consumer/survey/[id]/page.tsx:112`). **No rule exists for this path.** A user can:
- Write responses for other users (`userId` is client-supplied — there is nothing stopping `userId: "anyone"`)
- Read every response ever submitted to every campaign
- Skew a brand's analytics arbitrarily

This is a **data integrity** and **privacy** disaster in the making.

**Fix:** Add the rule block shown in C1, and also enforce `submittedAt` server-side (Cloud Function with `serverTimestamp()` or `request.time`).

### C3. No role/auth distinction between "brand" and "consumer"
The login screen (`src/app/(auth)/login/page.tsx:21`) and signup screen (`src/app/(auth)/signup/page.tsx:21`) collect a `userType` via a `RadioGroup`. That value lives only in **component state** — it is never written to the Firebase user, never read from a custom claim, and never enforced anywhere. A user simply picks "Brand" on the login screen and is routed to `/dashboard` (`login/page.tsx:45-49`).

Consequences:
- Any consumer can access the brand dashboard and create campaigns under their own UID.
- The Firestore rules don't differentiate — there's no role check.
- The `userProfiles` collection is the only place this could be stored and **it is never read for routing**; it just gets overwritten by the consumer profile form.

**Fix:** Use **Firebase Auth custom claims** (`admin.auth().setCustomUserClaims(uid, { role: 'brand' | 'consumer' })`) set via a Cloud Function on signup. Read the claim in the AuthContext and route accordingly. Add a Firestore rule that gates `userProfiles/{userId}` read by `request.auth.token.role` so brands can see aggregated consumer data but not individual profiles.

### C4. Next.js build is configured to ignore type errors and lint errors
**File:** `next.config.ts:5-10`
```ts
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```
This is fine for fast prototyping, but combined with **zero tests** it means the repo is one refactor away from shipping runtime-only TypeScript regressions. With `strict: true` in `tsconfig.json`, the type errors are real and being intentionally hidden.

**Fix:** Remove both flags before any production deployment. Make CI run `tsc --noEmit` and `next lint` as hard gates.

### C5. `.env` is not committed, but `apphosting.yaml` deploys with `maxInstances: 1` and no env config
**File:** `apphosting.yaml` (the whole file — 7 lines)
The deploy target only declares `maxInstances: 1`. There is no `env:` block. If secrets like the Genkit Google AI API key aren't injected, the AI flow will fail at runtime.

**Fix:** Add an `env:` block (or rely on Firebase App Hosting's secret manager) and document all required env vars in a `.env.example`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GOOGLE_GENAI_API_KEY` (or equivalent for `@genkit-ai/google-genai`)

---

## 🟠 HIGH

### H1. Hardcoded mock data masquerades as real data
Multiple pages have **hardcoded** analytics with `Math.random()` that re-runs on every load. Users will see "12,834 participants" and "$12,234.56 spent" that change every time they refresh:
- `src/app/(app)/dashboard/page.tsx:20-30` (chartData)
- `src/app/(app)/dashboard/analytics/page.tsx:33-58` (timeData, campaignData, deviceData)
- `src/app/consumer/dashboard/page.tsx:117, 131, 142` (Lifetime Earnings, Surveys Completed, Rank)
- `src/app/consumer/rewards/page.tsx:20-27, 50, 64` (reward history, balances)
- `src/app/consumer/leaderboard/page.tsx:19-30` (entire leaderboard is a static array — including a "Consumer User (You)" row at rank 4)
- `src/app/(app)/dashboard/campaigns/[id]/report/page.tsx:31-78` (every chart uses constants)
- `src/app/(app)/dashboard/audience/page.tsx:65-72` (segments live in component state, lost on refresh)

**Risk:** A founder pitching this demo to investors or seed-stage users will have a credible-looking product that falls apart the moment someone asks "where does the number come from?" Worse, the seed users will lose trust the moment the numbers jump.

**Fix:** Replace with Firestore queries + Cloud Functions aggregations. For the demo, at minimum show "—" with a `loading` skeleton and an "Analytics coming soon" callout.

### H2. Zero test coverage
There is no test runner, no test files, no `vitest.config`/`jest.config`/`playwright.config`, no `__tests__` directory, and no `*.test.*` / `*.spec.*` files anywhere. The repo has `typecheck` and `lint` scripts but no `test` script.

**Fix:** Add **Vitest** for unit tests (cheap, fast, ESM-native) and **Playwright** for E2E:
1. Start with `src/lib/firebase.ts` mock + `src/ai/flows/generate-questions.ts` schema validation.
2. Add a Firestore emulator integration test that exercises the security rules (the rules' rewrite in C1 needs test coverage).
3. Add Playwright smoke tests for the three critical flows: signup → login → create campaign → take survey → see result.

### H3. `genkit:dev` and `genkit:watch` scripts use broken `tsx` flag ordering
**File:** `package.json:7-8`
```json
"genkit:dev": "genkit start -- tsx src/ai/dev.ts",
"genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
```
`tsx` takes `--watch` as a script-level flag (`tsx watch src/ai/dev.ts`), not as a positional argument to `genkit`. The `--watch` flag is being passed to `genkit`, which ignores it, meaning **AI question generation has no watch mode**. Also note: `src/ai/dev.ts` only does `dotenv.config()` + imports the flow — it doesn't actually start the Genkit server itself; `genkit start` does.

**Fix:**
```json
"genkit:dev":   "genkit start -- node --import tsx src/ai/dev.ts",
"genkit:watch": "genkit start -- tsx watch src/ai/dev.ts"
```
Or, simpler, drop `dev.ts` and point Genkit at the flow files directly.

### H4. The Google sign-in flow is unauthenticated on success and exposes raw error messages
**Files:** `src/app/(auth)/login/page.tsx:50-55, 71-75`, `src/app/(auth)/signup/page.tsx:54-58, 75-79`
```ts
} catch (error: any) {
  setError(error.message);
}
```
`error.message` from Firebase Auth is fine for `auth/wrong-password` and `auth/user-not-found` cases, but raw messages for other errors can leak internal details. More importantly, `error: any` discards the Firebase `AuthError` typing.

**Fix:** Map `error.code` to user-friendly strings via a small `mapAuthError(code: string): string` helper. Type the catch as `unknown` and narrow.

### H5. Client-side mutation of state result is a code smell and causes stale UIs
**Files:** `src/app/(app)/dashboard/campaigns/new/page.tsx:185`, `edit/[id]/page.tsx:241`
```ts
state.result = null; // mutate state directly
```
This is mutating the object returned by `useActionState`. It will work but it bypasses React's render cycle. The AI-generated questions card will re-show on the next render because `state` itself is stable.

**Fix:** Add a `clearResult` action to the server action signature, or use a local `useState` for "dismissed result" and reset on next generation.

### H6. Race condition in `useAuthState` + redirect pattern
**Files:** virtually every page (e.g. `src/app/consumer/dashboard/page.tsx:42-91`, `src/app/(app)/dashboard/campaigns/new/page.tsx:88-92`)
Pattern is:
```ts
useEffect(() => {
  if (!loading && !user) router.push('/login');
}, [user, loading, router]);
```
The `useEffect` is called **after** the render, and the early-return `if (loading || !user) return <div>Loading...</div>` already short-circuits the body. But the `useEffect` dependency `toast` from `useToast()` returns a **fresh function reference on every render** of `useToast` consumers. This causes the effect to re-run on every state update, which:
- Re-fires the Firestore query on every toast/parent re-render.
- Can trigger double-redirects and double-fetches.

**Fix:** Use `useAuthState` together with a higher-level `useRequireAuth()` hook that returns `{ user, loading }` once, and use `useEffect`'s empty dep array for one-shot redirects. Memoize toast calls (or just call the dispatcher once).

### H7. The campaign-form submit button is `type="button"` while the form is missing a `name` attribute on submit
**File:** `src/app/(app)/dashboard/campaigns/new/page.tsx:195`
```tsx
<form>   ← no onSubmit handler
  ...
</form>
```
The "Save Draft" and "Launch Campaign" buttons are `type="button"` and call `handleSubmit` manually. That's fine, but the `<form>` element lacks `onSubmit` and there's no `<input type="hidden">` for the campaign name when using the form. More importantly, the Genkit `<form action={formAction}>` is a **nested form** inside the outer form, which is invalid HTML and will cause browser auto-quirks (e.g. a stray "Enter" press in the outer form submits the inner form).

**Fix:** Move the Genkit form out of the outer `<form>`, or remove the outer wrapper and use the buttons directly.

### H8. Delete uses `confirm()` and isn't keyboard-accessible
**File:** `src/app/(app)/dashboard/campaigns/page.tsx:108-127`
```ts
if (confirm("Are you sure you want to delete this campaign?")) { ... }
```
Browser `confirm()` is blocking, not styled, and is a poor UX pattern. The codebase already uses shadcn's `AlertDialog` elsewhere — use it here for consistency.

**Fix:** Convert to `<AlertDialog>` like `audience/page.tsx:265-278` already does.

### H9. No pagination / no real-time subscription on `getDocs` queries
**Files:** `src/app/consumer/dashboard/page.tsx:50`, `src/app/(app)/dashboard/campaigns/page.tsx:67`
```ts
const q = query(collection(db, "campaigns"), where("status", "==", "Active"));
const querySnapshot = await getDocs(q);
```
`getDocs()` pulls every matching doc into memory. For a brand dashboard, this is a real problem once a brand has >100 campaigns. For the consumer dashboard, every active campaign across the whole platform is downloaded.

**Fix:** Use `limit()` + cursor pagination, or move to `onSnapshot` with a small `limit(20)` and a "load more" button. Combine with a composite index on `(status, createdAt)` for the consumer dashboard.

---

## 🟡 MEDIUM

### M1. `next.config.ts:11-25` — `images.remotePatterns` only allows two hosts
The `landing-page.tsx` uses `https://images.unsplash.com/...` and `https://placehold.co/...` directly. Both are allowed, but the Unsplash images are hot-linked from production Unsplash's CDN, which can rate-limit or change URLs. Also no `sizes` attribute is set on `<Image>` for responsive optimization.

**Fix:** Self-host the hero images or proxy via `next/image` with a Next.js loader. Add `sizes` to every `<Image>` call.

### M2. `package.json:48` — `patch-package` is installed but unused
There's no `patches/` directory and no `postinstall` script invoking it. The `.gitignore` doesn't include a `patches/` exemption, suggesting it was added for a planned patch that never happened.

**Fix:** Remove the dependency, or document it and add `"postinstall": "patch-package"` to `scripts`.

### M3. `react-firebase-hooks` is unmaintained
**File:** `package.json:52`, used in 6+ files
`react-firebase-hooks` v5 was last meaningfully updated in 2023 and has had sporadic issues with React 18 strict mode and React 19. Firebase itself ships `useAuthState`-like helpers and the official recommendation for new code is to use the Web SDK's `onAuthStateChanged` directly.

**Fix:** Replace with a 10-line `useAuthState` custom hook using `onAuthStateChanged`. Removes the dependency entirely.

### M4. `dotenv` is loaded in `src/ai/dev.ts` but Next.js loads `.env` automatically
**File:** `src/ai/dev.ts:2-3`
```ts
import { config } from 'dotenv';
config();
```
This is needed because `genkit start -- tsx ...` runs outside Next.js, so the env file isn't auto-loaded. But this only loads `.env` — there's no fallback to `.env.local`, which is where Next.js convention puts dev secrets.

**Fix:** Change to `config({ path: '.env.local' })` and fall back to `.env`.

### M5. `: any` used 14 times — defeats `strict: true`
See `src/app/(app)/dashboard/analytics/page.tsx:29-31`, `src/app/(app)/dashboard/page.tsx:18`, `src/app/(app)/dashboard/campaigns/page.tsx:47`, `src/app/consumer/dashboard/page.tsx:30`, plus `catch (error: any)` in 6 places.

**Fix:** Replace with proper types. `catch (error)` is fine in strict mode if you narrow: `if (error instanceof FirebaseError) ...`.

### M6. `docs/blueprint.md` is misleading the build
The blueprint specifies `Primary color: #8000FF` (a hex value), but `globals.css:17` uses `hsl(276 100% 50%)` which is `~#A000FF` — **different hue, different saturation**. The accent is similarly off (`#FF0080` vs `hsl(330 100% 50%)` = `#FF0099`). Tailwind's CSS variable system makes this easy to drift further with future edits.

**Fix:** Define brand colors as named CSS variables in `globals.css` (e.g. `--brand-violet: 270 100% 50%`) and reuse them for both primary and accent. Document the mapping in a `STYLEGUIDE.md`.

### M7. `tsconfig.json` target is `ES2017`
**File:** `tsconfig.json:3`
```
"target": "ES2017",
```
With Next.js 15 / React 19, `ES2020` (or `ES2022`) is the realistic minimum. `ES2017` forces the build to down-level modern syntax and ships bigger bundles.

**Fix:** Bump to `"target": "ES2022"`.

### M8. `(app)/profile/page.tsx` is fully static — buttons do nothing
**File:** `src/app/(app)/profile/page.tsx:60-110`
"Save Changes" and "Update Privacy Settings" are bare `<Button>` elements with no `onClick`. Default values are hardcoded "Acme Inc." and "contact@acme.inc".

**Fix:** Either wire to Firestore or remove the buttons / add a "Coming soon" toast.

### M9. `select`/`<Select>` styling is broken in edit form
**File:** `src/app/(app)/dashboard/campaigns/edit/[id]/page.tsx:245-250` (the audience `Select` with `name="status"`)
A `name` prop on the shadcn `Select` component doesn't translate to a form-control `name` — it only sets a className. So submitting this form (if it were a real form) would not include the `status` field.

**Fix:** Add a hidden `<input type="hidden" name={name} value={value} />` next to the Select or use a controlled `Select` with a `name` you read from a ref. Same issue on the new-campaign page's `audience` select.

### M10. `dotenv` ^16.5.0 is several major versions behind
`dotenv` 17.x is current. Same for `react-day-picker` (8.x → 9.x), `embla-carousel-react` (8.x → 9.x), `lucide-react` (0.475.x → 0.500+), `recharts` (2.15 → 2.16+). None are security-critical, but the project will start hitting peer-dependency conflicts as Node/React versions advance.

**Fix:** Run `npx npm-check-updates` and evaluate diff. Bump in a separate PR.

### M11. `package.json` name is still `"nextn"` (template default)
**File:** `package.json:2`
Cosmetic, but the repo was clearly scaffolded from a Next.js starter. The `README.md` is also a single line and not actually a readme (it just says "Readme" — there is no README content).

**Fix:** Rename to `pollpulse`. Replace the README with a real one that covers: stack, setup, env vars, scripts, deployment, and architecture.

### M12. `AppHeader` shows hardcoded user info
**File:** `src/components/app-header.tsx:43-46`
```
{isConsumer ? "Consumer User" : "Brand User"}
{isConsumer ? "consumer@example.com" : "brand@example.com"}
```
Always shows the same hardcoded identity. Will be confusing for a real user.

**Fix:** Use `useAuthState` and display `user.displayName` / `user.email`.

### M13. Landing page is the only page that should be SSR — it's marked `"use client"`
**File:** `src/components/landing-page.tsx:6`
The entire landing page is a client component, which means no SSR for marketing content. This is bad for SEO (the exact audience for a "pulse check your market" SaaS landing page).

**Fix:** Split into a server `page.tsx` shell + client interactive bits (the mobile `Sheet` nav). Move the static sections to server components.

### M14. `use-mobile.tsx` leaks memory if the hook is used many times
**File:** `src/hooks/use-mobile.tsx:11-18`
Each `useEffect` adds a `change` listener on `window.matchMedia` and removes it. That's correct, but the `setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)` runs on **every** `mql.change` event AND on mount. If the sidebar is hot-mounted, this can cause double renders.

**Fix:** Use the recommended pattern of reading `mql.matches` on mount and relying solely on `change`.

---

## 🟢 LOW

### L1. `src/app/(auth)/page.tsx` returns `null`
**File:** `src/app/(auth)/page.tsx:6`
Returns `null` with a comment. Either redirect to `/login` or remove the route.

**Fix:** `redirect('/login')` from `next/navigation`.

### L2. `(app)/dashboard/campaigns/edit/[id]/page.tsx:172` — `handleSubmit` defaults to no status, but the original `status` is preserved in state, so updating with no `newStatus` will save with the *current* state. This is correct but unintuitive (no `newStatus` means "use whatever the dropdown shows"). Worth a code comment.

### L3. `errorEmitter.ts:2` — uses Node's `events` module in a client component
This works because Next.js ships an `events` polyfill, but it's surprising to a Next.js dev who might think `EventTarget` is sufficient. Either is fine; pick one and document it.

### L4. The `(app)/layout.tsx` and `consumer/layout.tsx` are byte-identical except for the nav import
**Files:** `src/app/(app)/layout.tsx` and `src/app/consumer/layout.tsx`
Both files are 30 lines and only differ in line 8 (`SidebarNav` vs `ConsumerSidebarNav`). This is a small DRY violation.

**Fix:** Extract a generic `<DashboardShell nav={<SidebarNav />}>` component.

### L5. ESLint config is the default Next.js preset
`next lint` runs the default ruleset. For a project at this scale, add `eslint-plugin-tailwindcss` and `@typescript-eslint/no-explicit-any` as errors.

### L6. The `(app)/profile/page.tsx` privacy toggles are decorative
**File:** `src/app/(app)/profile/page.tsx:93, 102`
`<Switch defaultChecked />` and `<Switch />` with no state — toggling does nothing. Same as M8.

### L7. `src/components/ui/calendar.tsx:1` is `"use client"` — entire shadcn `calendar` is client
This is expected but worth knowing: importing `<Calendar>` in a server component forces the whole subtree to be client. For the date pickers in the new-campaign form, this is already in a client component, so no impact.

### L8. `react-hook-form` and `@hookform/resolvers` are in deps but **never imported**
**File:** `package.json:17, 53`
No `useForm` or `Controller` calls anywhere in `src/`. The form fields are all manually managed with `useState` + `FormData`. This is fine for simple forms but means the form-state-management story is ad hoc.

**Fix:** Either start using RHF for the multi-step campaign form, or remove the dependencies.

### L9. `zod` is only used in one file (`generate-questions.ts`)
**File:** `package.json:57`
Could be a transitive dep of `react-hook-form/resolvers` if it ever gets used. Either expand its use to validate campaign form inputs, or move to a transitive dep.

### L10. `Lucide` icons imported in landing-page (`BarChart2, Zap, ...`) are mostly unused
Visual debt; minor bundle size impact. (Hard to verify without running a build audit.)

### L11. No `loading.tsx` / `error.tsx` in any route
Next.js conventions for streaming and error boundaries are absent. The hardcoded `<div>Loading...</div>` blocks are subpar.

**Fix:** Add `app/loading.tsx` and `app/error.tsx` for the global fallback.

### L12. No metadata per route
**File:** `src/app/layout.tsx:6-9`
Only root metadata. Each route (consumer dashboard, brand campaigns, etc.) should export its own `metadata` for SEO.

### L13. `app-favicon.ico` exists in `src/app/` but is checked in
Typical Next.js apps don't check this in. 2.7 MB of binary in the repo (the `.idx/icon.png`). Consider gitignoring.

### L14. `(app)/profile/page.tsx:27-32` — `setIsClient(true)` is a hydration-safety hack
Used to dodge SSR/client mismatch. This pattern indicates the inputs should be in a separate child client component instead.

---

## Summary Table

| Severity | Count | Theme |
|----------|-------|-------|
| 🔴 Critical | 5 | Auth/role, Firestore rules, build-config deception, deploy config |
| 🟠 High | 9 | Mock data, no tests, broken scripts, race conditions, error mapping, scaling |
| 🟡 Medium | 14 | UX polish, type tightening, dependency hygiene, brand-color drift |
| 🟢 Low | 14 | DRY, dead code, missing Next.js conventions, decorative UI |

**Total: 42 findings across 8,462 LOC = ~1 issue per 200 LOC.** That's a normal prototype-to-MVP ratio, but the critical-tier items must be closed before any production traffic.

---

## Recommended Refactor Sequence (3 weeks)

**Week 1 — Security & correctness (closes C1, C2, C3, C5, H1):**
1. Rewrite `firestore.rules` with the blocks shown in C1 + C2.
2. Add Firebase Cloud Function for `setCustomUserClaims` triggered on user creation. Update signup flow to call this (or use a callable function).
3. Add `AuthProvider` that reads the custom claim and exposes `useUser()`.
4. Replace the mock data with real Firestore queries (even if they return empty for now).
5. Wire `.env.example` and add the env block to `apphosting.yaml`.

**Week 2 — Quality & UX (closes C4, H3-H8, M1-M3, M5, M8, M9, M11-M12):**
1. Remove `ignoreBuildErrors` and `ignoreDuringBuilds`; fix the resulting type/lint errors.
2. Fix `genkit:dev` and `genkit:watch` scripts; merge `useState` for selected AI questions out of the form-action state.
3. Add `useRequireAuth` hook with stable identity; replace all `useAuthState` + `useEffect` redirect patterns.
4. Replace all `: any` types; fix nested-form HTML; add real `onClick` to profile buttons.
5. Remove `patch-package`, replace `react-firebase-hooks` with custom hook, fix `dotenv` config.
6. Rename package, write a real README, write a STYLEGUIDE.md, fix landing-page SSR.

**Week 3 — Tests & scale (closes H2, H9, L11, L12):**
1. Add Vitest with Firestore emulator — write rule-coverage tests, schema-validation tests, hook tests.
2. Add Playwright — three smoke tests for the critical user journeys.
3. Add `loading.tsx` / `error.tsx` at route-group level; add per-route metadata.
4. Add `limit()` + cursor pagination to all `getDocs` calls; convert consumer-dashboard fetch to `onSnapshot` with `limit(20)`.
5. Dep-bump pass with `npm-check-updates`.

**After that, this is a creditable MVP ready for closed-beta users.**
