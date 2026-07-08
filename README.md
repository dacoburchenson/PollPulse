# PollPulse

Real-time consumer engagement and micro-survey platform. Brands create targeted campaigns to collect consumer insights; consumers earn rewards for participating.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Firebase Authentication (Email + Google)
- **Database:** Firestore
- **AI:** Genkit with Google Gemini
- **UI:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

```bash
# Copy env vars
cp .env.example .env.local
# Fill in your Firebase project credentials

# Install
npm install

# Run dev server
npm run dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server (port 9002) |
| `npm run build` | Production build |
| `npm run genkit:dev` | Genkit AI flow development |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

## Project Structure

```
src/
├── app/
│   ├── (app)/dashboard/     # Brand/admin dashboard
│   ├── (auth)/              # Login/Signup
│   └── consumer/            # Consumer survey-taking
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── *.tsx                # App components
├── ai/                      # Genkit AI flows
├── lib/                     # Firebase config
└── hooks/                   # Custom hooks
```

## Environment Variables

See `.env.example` for all required vars.
