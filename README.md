# Project Tracker

A full-stack enterprise project management and task tracking application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. Overview & Architecture

Project Tracker provides multi-tenant project management, collaborative task tracking, interactive Kanban boards with drag-and-drop, full-text database search, and real-time delivery analytics.

### Key Architectural Pillars:
- **Server Components**: Authoritative data fetching directly on the server with zero client bundle overhead.
- **Server Actions**: Secure mutation endpoints verifying user sessions and role-based authorization.
- **Strict Authorization**: Comprehensive workspace isolation guaranteeing that users can only view or mutate projects and tasks they own or belong to as members.
- **Prisma PostgreSQL Engine**: Parameterized queries, composite foreign-key indexes, and atomic sequence generation.

---

## 2. Feature Summary

### Authentication & Application Shell (Phase 2)
- Encrypted HTTP-only JWT sessions using Web Crypto (`jose`).
- Secure registration and login with `bcrypt` password hashing.
- Route protection middleware guarding `/dashboard`, `/projects`, and `/settings`.
- Dark/Light mode theme provider with system preference support.

### Project Management (Phase 3)
- Full Project CRUD (Create, Read, Update, Archive, Delete).
- Role-based membership collaboration (`OWNER`, `MEMBER`, `VIEWER`).
- Member management: invite registered users, update roles, and remove members.
- Multi-field status filtering, sorting, and project metrics.

### Task Management & Kanban Board (Phase 4)
- Task CRUD with priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`).
- Human-readable project-scoped identifiers (e.g. `ARC-1`, `ARC-2`) atomically incremented on the database.
- Interactive Kanban board (`/projects/[projectId]/board`) with native HTML5 drag-and-drop and persistent column ordering.
- Tabular task list view (`/projects/[projectId]/list`) with multi-field filtering and sorting.
- Dedicated task detail page (`/projects/[projectId]/tasks/[taskId]`).

### Search & Analytics (Phase 5)
- **Global Search**: `Cmd+K` / `Ctrl+K` command palette searching accessible projects and tasks across workspaces.
- **Project Search**: Case-insensitive search by project name, key, and description.
- **Task Search**: In-project search by title, description, and task identifier (`KEY-1`).
- **Project Analytics**: Live metrics for completion percentage, overdue tasks, status breakdown, priority distribution, and member workload.
- **Dashboard Analytics**: Real-time cross-workspace metrics, recent projects, and recent deliverables.

### Security Hardening & Polish (Phase 6)
- In-memory rate limiting on authentication and global search actions.
- Strict `AUTH_SECRET` environment validation preventing weak fallback keys in production.
- Global loading skeletons (`loading.tsx`), error boundaries (`error.tsx`), and 404 handler (`not-found.tsx`).
- Full keyboard and screen-reader accessibility for modals and navigation.

---

## 3. Prerequisites

- **Node.js**: `v18.18+` (or `v20+` / `v22+`)
- **npm**: `v9+` / `v10+`
- **Docker & Docker Compose**: For local PostgreSQL database container

---

## 4. Local Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd project-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` has a strong `AUTH_SECRET` (at least 32 characters) and valid `DATABASE_URL`.

4. **Start PostgreSQL database container**:
   ```bash
   docker compose up -d
   ```

5. **Deploy database migrations**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Development & Verification Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Next.js local development server (Turbopack) |
| `npm test` | Run the complete automated Vitest unit and integration test suite |
| `npm run lint` | Run ESLint static code analysis |
| `npx tsc --noEmit` | Run TypeScript strict type-checking |
| `npm run build` | Compile optimized production build |
| `npm run start` | Run production server |
| `npx prisma validate` | Validate the Prisma schema file |
| `npx prisma migrate status` | Check status of applied database migrations |
| `npx prisma studio` | Open Prisma Studio GUI for exploring database records |
| `docker compose down` | Stop the local PostgreSQL container |

---

## 6. Database Schema Overview

- **User**: User credentials, profile, relations to owned projects, memberships, assigned tasks, created tasks.
- **Project**: Workspaces with `name`, `key` (unique per owner), `status`, `startDate`, `targetDate`, `userId`.
- **ProjectMember**: Collaboration memberships linking `Project` and `User` with `role` (`OWNER`, `MEMBER`, `VIEWER`).
- **Task**: Project deliverables with `taskNumber` (unique per project), `title`, `description`, `status`, `priority`, `dueDate`, `order`, `projectId`, `userId` (assignee), `creatorId`.

---

## 7. Security Architecture

- **Password Storage**: Passwords hashed with `bcryptjs` (salt rounds = 10) before database insertion.
- **Session Tokens**: JWTs signed using HS256 and Web Crypto API stored in `HttpOnly`, `SameSite=Lax`, and `Secure` (production) cookies.
- **Authorization**: All mutations and queries verify ownership/membership on the server (`getProjectAccess`). Client UI flags are treated purely as presentation helpers.
- **Environment Isolation**: Database connection strings and token secrets are kept server-side only.
