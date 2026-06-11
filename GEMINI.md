# Gallero Project Instructions

## Architecture Overview
- **Monorepo:** Backend (apps/api) and Frontend (Next.js App Router).
- **Backend:** Fastify with a modular service-oriented architecture.
- **Database:** Prisma (PostgreSQL).
- **Messaging:** Evolution API (WhatsApp) integration via `apps/api/src/lib/evolution.client.ts`.
- **Infrastructure:** Managed via Docker Compose (PostgreSQL on 5440, Redis on 6380 to avoid conflicts with Nexus Platform).

## Module-Specific Rules

### 1. Betting & Fights (Core)
- Handles matchmaker, order expiry, and settlement via worker patterns and BullMQ.

### 2. Live Events & Ponencias (New)
- **Styling:** STRICTLY NO TAILWIND CSS. Use Custom CSS Modules for all components to ensure a brutalist aesthetic and surgical layout control.
- **Design Philosophy:** Mobile-First, dark theme (#000 background), red accents (#A61717).
- **Video:** HLS streaming powered by Cloudflare Stream and `hls.js`.
- **UX:** Always implement Screen Wake Lock API during video playback to prevent screen timeout.
- **Storage:** Use `StorageService` for all file uploads (Cloudflare R2). Never store files on local disk.
- **Security:** 
    - Frontend: Use `middleware.ts` with `jose` for route protection.
    - Backend: Use `requireAdmin` hook for sensitive endpoints.
    - Auth: Store JWT in cookies via `js-cookie`.

## Development Workflow
- **Migrations:** Always use `npm run db:migrate --prefix apps/api`.
- **Styling:** For the Live module, use `.module.css` files.
- **Notifications:** Confirmations are sent automatically via Evolution API upon ticket approval.
