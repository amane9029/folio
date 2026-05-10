# Folio

Folio is an internal EPUB library manager built for teams and studios. It provides a clean, invite-only interface for uploading, organising, and browsing EPUB books — with role-based access control separating regular readers from administrators.

## What it does

- **Login** — Invite-only authentication powered by InsForge Auth. Users sign in with credentials provisioned by an administrator.
- **User Dashboard (My Desk)** — Readers can upload EPUB files (individually or as a folder batch), browse their personal library, filter by subfolder or sort by title/date/size, and view detailed book metadata in a side drawer.
- **Admin Panel** — Administrators have full visibility into the entire library across all contributors. The panel includes a library browser, bulk delete operations, and an invite management system for onboarding new readers.
- **EPUB Cover Extraction** — Automatically extracts cover art from uploaded EPUB files using a 5-step fallback chain that handles OPF manifests, SVG-embedded covers, and non-standard archive structures.
- **AI Translation** — Translates non-English book titles (e.g. Japanese) into English and Romaji using InsForge AI integration.

## Tech stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS with a custom warm-gray design system
- **Fonts** — Inter (UI) and Lora (headings/titles) via Google Fonts
- **Backend** — [InsForge](https://insforge.dev) (PostgreSQL database, file storage, authentication, AI)
- **EPUB Parsing** — JSZip for client-side binary processing
- **Route protection** — Proxy middleware checks a `role` cookie and guards `/dashboard` and `/admin` routes accordingly

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Login page
│   ├── dashboard/
│   │   └── page.tsx          # User dashboard + EPUB upload logic
│   ├── admin/
│   │   └── page.tsx          # Admin panel
│   ├── api/
│   │   ├── upload/route.ts   # Book upload + cover storage API
│   │   ├── books/route.ts    # Book listing API
│   │   ├── books/[id]/route.ts # Book deletion API
│   │   └── auth/login/route.ts # Authentication API
│   ├── layout.tsx            # Root layout with font configuration
│   └── globals.css           # Global styles and design tokens
├── components/
│   ├── shared.tsx            # Reusable UI primitives (Button, Input, Modal, TopNav, etc.)
│   ├── icons.tsx             # SVG icon components
│   └── data.ts               # Type definitions and utility helpers
├── lib/
│   └── insforge.ts           # InsForge SDK client configuration
└── proxy.ts                  # Route protection middleware
```

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your InsForge credentials:

```env
NEXT_PUBLIC_INSFORGE_URL=https://your-app.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
```

3. Start the development server:

```bash
npm run dev
```

## Notes

- This is an internal tool — there is no public registration flow.
- All data is persisted on InsForge (PostgreSQL for book records, object storage for cover images).
- Cover images are extracted client-side from EPUB files and uploaded to a public `covers` storage bucket.
- The EPUB cover extraction uses a 5-step fallback: OPF `cover-image` property → OPF `<meta name="cover">` → manifest ID/href matching → `cover.xhtml` regex parsing → first image in `Images/` folder.
