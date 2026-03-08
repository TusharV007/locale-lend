# Local Share

A hyperlocal neighborhood item sharing platform built with Next.js and Firebase.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Auth & DB**: Firebase (Auth + Firestore)
- **UI**: Radix UI + shadcn/ui components
- **Maps**: Leaflet / react-leaflet
- **Animations**: Framer Motion

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push the `frontend/` folder to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Set the **Root Directory** to `frontend` (if deploying from the monorepo root)
4. Click **Deploy** — Vercel auto-detects Next.js, no extra config needed

Or use the Vercel CLI:

```bash
cd frontend
npx vercel
```

## Environment Variables

Firebase config is currently bundled in the source. For a cleaner setup, move these to environment variables:

| Variable                                   | Description          |
| ------------------------------------------ | -------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase API key     |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID  |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Storage bucket       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID  |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID      |

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm test           # Run unit tests
npm run test:coverage  # Coverage report
```
