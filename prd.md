# Folio PRD

## Overview
Folio is a private EPUB library manager for internal teams and studios. It enables readers to upload and organize EPUB collections while giving administrators a shared view of the full library, invite controls, and operational oversight.

## Vision
Build a calm, secure internal library tool that makes EPUB ingestion, browsing, and administration simple, without exposing the system publicly.

## Users
- **Reader**
  Uses Folio to upload, browse, and manage personal books.
- **Administrator**
  Uses Folio to monitor the shared collection, manage invites, and perform moderation or cleanup tasks.

## Problems
- Teams need a private system for collecting and managing EPUB assets.
- Readers need a simple upload-and-browse workflow without access to other users’ records.
- Administrators need shared visibility and control over the combined library.
- EPUB files are structurally inconsistent, so metadata and cover extraction must be resilient.

## Goals
- Provide secure, invite-only access.
- Maintain clear separation between reader and administrator experiences.
- Make EPUB upload and organization straightforward.
- Support reliable email verification and password recovery.
- Give administrators full visibility into the shared library.

## Non-Goals
- Public self-serve registration
- In-browser EPUB reading
- Marketplace or external catalog browsing
- Billing or subscription management
- Advanced reporting beyond current operational views

## Scope

### In Scope
- Email/password login
- Google OAuth continuation
- Registration and email verification
- Forgot-password flow
- Reader dashboard
- Administrator dashboard
- EPUB upload
- Cover extraction and storage
- Book detail viewing
- Book deletion with confirmation
- Shared-library administration
- AI title translation
- Frontend audit-log view

### Out of Scope
- Public onboarding
- Multi-tenant organization management
- Native reading experience
- External integrations beyond current InsForge-backed services

## Functional Requirements

### Authentication
- Users must be able to log in with email/password.
- Users must be able to continue with Google if their account was created through that path.
- Users must be able to register and verify email ownership.
- Users must be able to request and complete password reset.
- Existing sessions should redirect users away from authentication pages.

### Role and Access Control
- Readers must only access their own dashboard data.
- Administrators must be able to access the administrator dashboard and shared library.
- Protected routes must reject unauthorized access.

### Reader Experience
- Readers must be able to upload EPUB files individually or as a folder batch.
- Readers must be able to browse, search, sort, and filter their books.
- Readers must be able to open book details.
- Readers must be able to delete their own books after typed confirmation.

### Administrator Experience
- Administrators must be able to browse the full library across users.
- Administrators must be able to search and sort shared-library records.
- Administrators must be able to delete any book after typed confirmation.
- Administrators must be able to manage invite flows.
- Administrators must be able to review the frontend activity log currently exposed in the audit tab.

### Upload and Metadata
- The application must accept EPUB uploads.
- The application must extract title and other available metadata.
- The application must attempt cover extraction through multiple fallback strategies.
- Uploaded records must be attached to the correct user.

### Translation
- Non-English titles should be translatable on demand.
- The UI should display translated results or handled failure states.

## Non-Functional Requirements
- Authentication and sensitive mutations must be server-validated.
- Reader data isolation must be enforced with backend access controls.
- Security-sensitive RPCs must not be callable by public roles unless explicitly intended.
- The UI must remain usable on desktop and mobile.
- Delete confirmations must be explicit and resistant to accidental clicks.

## Current Screens
- Login
- Register
- Verify
- Forgot password
- Reader dashboard
- Administrator dashboard

## Current Backend Surfaces
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/verify`
- `/api/auth/resend-verification`
- `/api/auth/forgot-password/request`
- `/api/auth/forgot-password/verify`
- `/api/auth/forgot-password/reset`
- `/api/books`
- `/api/books/[id]`
- `/api/books/[id]/cover`
- `/api/books/[id]/translate`
- `/api/upload`
- `/api/storage-stats`

## Key Implementation Areas

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

## Success Metrics
- Verified users can sign in successfully and reach the correct dashboard.
- Readers can upload EPUBs and see them in their own library.
- Administrators can manage the shared library without permission leakage.
- Verification and reset flows complete reliably.
- EPUB cover extraction succeeds for common file structures.

## Risks
- Authentication flows depend on reliable synchronization between InsForge auth users and `public.users`.
- EPUB file structure inconsistencies can cause partial metadata extraction.
- Administrator access paths require continued care so convenience does not weaken security boundaries.
- The current audit log is client-side only and should not be treated as a durable, compliance-grade log.

## Open Questions
- Should the audit log move to a backend-backed persistent event model?
- Should legacy schema fields such as `uploaded_by` be removed after transition?
- Should invite management remain lightweight, or evolve into a fuller onboarding system?
