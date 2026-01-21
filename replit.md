# FakeBank - Classroom Banking Simulation

## Overview

FakeBank is a kid-friendly classroom banking simulation application designed for educational purposes. It allows students to experience basic financial concepts like transfers, loans, credit scores, and account management in a safe, gamified environment. The application features a playful UI with bright colors, rounded corners, and large text to appeal to younger users. Administrators (teachers) can manage student accounts and issue fines for disciplinary purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom kid-friendly theme (Fredoka for headings, Nunito for body text)
- **Forms**: React Hook Form with Zod validation

The frontend follows a page-based architecture with protected routes. Authentication state is managed through React Query, and the Layout component provides consistent navigation across all authenticated pages.

### Backend Architecture
- **Framework**: Express.js 5 running on Node.js
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for type-safe request/response validation
- **Session Management**: Express-session with MemoryStore (development) or connect-pg-simple (production)
- **Build Process**: Custom build script using esbuild for server bundling and Vite for client bundling

The server uses a storage abstraction layer (`IStorage` interface) that enables swapping between different database implementations.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit handles schema migrations (`npm run db:push`)

Core entities:
- **Users**: Student/admin accounts with balance and credit score
- **Transactions**: Money transfers, fines, loans, repayments, salary
- **Loans**: Active loans with interest rates and remaining amounts

### Authentication
- Session-based authentication using cookies
- Simple password comparison (simulation purposes, not production-ready)
- Admin flag on user accounts for elevated privileges
- Protected routes redirect unauthenticated users to login

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for database operations and schema management

### UI/Component Libraries
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component collection
- Lucide React for icons
- date-fns for date formatting

### Development Tools
- Vite with React plugin for HMR and development server
- Replit-specific plugins for error overlays and development banners
- TypeScript for type checking across client, server, and shared code

### Session Storage
- MemoryStore for development sessions
- connect-pg-simple available for production PostgreSQL session storage