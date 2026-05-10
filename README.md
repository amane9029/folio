# Folio

Folio is an internal EPUB library manager built for teams and studios. It provides a clean, invite-only interface for uploading, organising, and browsing EPUB books — with role-based access control separating regular readers from administrators.

## What it does

- **Login** — Invite-only authentication. Users sign in with credentials provisioned by an administrator.
- **User Dashboard (My Desk)** — Readers can upload EPUB files (individually or as a folder batch), browse their personal library, filter by subfolder or sort by title/date/size, and view detailed book metadata in a side drawer.
- **Admin Panel** — Administrators have full visibility into the entire library across all contributors. The panel includes a library browser, an audit log of all upload and delete activity, and an invite management system for onboarding new readers.

## Tech stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4 with a custom warm-gray design system
- **Fonts** — Inter (UI) and Lora (headings/titles) via Google Fonts
- **Route protection** — Proxy middleware checks a `role` cookie and guards `/dashboard` and `/admin` routes accordingly

## Project structure

```
src/
├── app/
│   ├── page.tsx          # Login page
│   ├── dashboard/
│   │   └── page.tsx      # User dashboard
│   ├── admin/
│   │   └── page.tsx      # Admin panel
│   ├── layout.tsx        # Root layout with font configuration
│   └── globals.css       # Global styles and design tokens
├── components/
│   ├── shared.tsx        # Reusable UI primitives (Button, Input, Modal, TopNav, etc.)
│   ├── icons.tsx         # SVG icon components
│   └── data.ts           # Mock data, type definitions, and utility helpers
└── proxy.ts              # Route protection middleware
```

## Running the project

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Notes

- This is an internal tool — there is no public registration flow.
- All data is currently mocked client-side. The project is structured to be ready for backend integration (database, file storage, auth service) without requiring UI changes.
- The upload flow is simulated; connecting a real file ingestion pipeline is the primary next integration step.
