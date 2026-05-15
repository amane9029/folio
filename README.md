# Folio

Folio is an internal EPUB library manager built for teams and studios. It provides invite-only access, role-based dashboards, EPUB upload and metadata extraction, AI-assisted translation, and a compact authentication flow for readers and administrators.

## Features
- Invite-only authentication with email/password and Google OAuth
- Email verification and forgot-password recovery
- Reader dashboard for personal EPUB uploads and library browsing
- Administrator dashboard for shared-library visibility and invite management
- EPUB metadata and cover extraction with fallback handling
- AI translation for non-English titles
- Storage usage reporting for uploaded covers

## Current Product Flow
- Users enter the authentication experience and continue through login, registration, verification, or password recovery.
- Readers are redirected to `/dashboard` after sign-in.
- Administrators are redirected to `/admin` after sign-in.
- Readers can upload EPUBs, browse their own books, inspect details, translate titles, and delete owned books.
- Administrators can view the shared library, delete any book, send invites, and review the frontend audit log.

## Tech Stack
- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** InsForge for authentication, database, storage, and AI
- **EPUB Parsing:** JSZip

## Key File Paths

### Frontend
- `src/components/auth-ui.tsx`  
  Authentication pages and shared auth UI
- `src/app/dashboard/client.tsx`  
  Reader dashboard
- `src/app/admin/client.tsx`  
  Administrator dashboard
- `src/components/shared.tsx`  
  Shared modals, buttons, and delete-confirmation UI

### Backend Routes
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verify/route.ts`
- `src/app/api/auth/forgot-password/request/route.ts`
- `src/app/api/auth/forgot-password/verify/route.ts`
- `src/app/api/auth/forgot-password/reset/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/books/route.ts`
- `src/app/api/storage-stats/route.ts`

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` with your InsForge values:

```env
NEXT_PUBLIC_INSFORGE_URL=https://your-app.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
INSFORGE_SERVICE_KEY=your-server-only-key
```

### 3. Start Development
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Hosting Notes

### Required for Hosting
- `src/`
- `public/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `postcss.config.mjs`
- `tsconfig.json`
- Production environment variables

### Not Required as Deployment Artifacts
- `.next/`
- `node_modules/`
- `scratch/`
- Local report files such as `testsprite-mcp-test-report.md`
- Local environment files such as `.env.local`

### Documentation and Workflow Files
Repository helper files such as `prd.md`, `abstract.md`, and similar documentation files are not runtime hosting requirements.

## Notes
- `public.users` is protected with RLS for backend-admin access patterns.
- Sensitive RPCs have been hardened to avoid public execution.
- The current audit log is frontend and local-storage based. It is useful for UI activity review, but it is not a centralized backend audit system.

## Known Follow-Ups
- Replace the frontend audit log with a backend-backed audit trail if cross-user or durable audit history is required.
- Review legacy schema fields such as `uploaded_by` if the data model should be simplified further.
