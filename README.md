# Project Tracker

A production-quality project management web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: `v18.18+` (or `v20+` / `v22+` recommended)
- **npm**: `v9+` / `v10+`
- **Docker & Docker Compose**: For running the local PostgreSQL database

---

## 2. Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 3. Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/project_tracker?schema=public"
```

---

## 4. Database Setup

1. **Start PostgreSQL container**:
   ```bash
   docker compose up -d
   ```

2. **Run Prisma Migrations** (creates tables and applies schema updates):
   ```bash
   npx prisma migrate dev
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

---

## 5. Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the local Next.js development server on [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production build server |
| `npm run lint` | Run ESLint static code analysis |
| `npx prisma validate` | Validate the Prisma schema file |
| `npx prisma migrate dev` | Create and apply database migrations |
| `npx prisma studio` | Open Prisma Studio GUI for exploring and editing database records |
| `docker compose down` | Stop the local PostgreSQL container |

---

## 6. Database Models (Phase 1)

- **User**: User entity with relations to owned/created projects and tasks.
- **Project**: Represents a project with status (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`) and owner reference.
- **Task**: Tasks within a project with status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`), priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and optional assignee.
