# SENTINEL — Financial Services Risk & KYC Platform

A modular, event-driven financial services platform for risk classification, KYC (Know Your Customer), onboarding, and audit management.

**Tech Stack:**

- **Backend:** NestJS (modular monolith), TypeORM, PostgreSQL, RabbitMQ
- **Frontend:** React 19, TypeScript, Vite, Zustand, TanStack Query, shadcn/ui, Tailwind CSS v4
- **Architecture:** Domain-Driven Design (DDD), Clean Architecture, Event Sourcing

---

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker & Docker Compose** (for PostgreSQL, RabbitMQ, pgAdmin)

---

## Quick Start (All-in-One)

### 1. Start Docker Services

From the project root, start the backend infrastructure:

```bash
cd sentinel-api
docker compose up -d
```

This starts:

- **PostgreSQL** (port 5432)
- **RabbitMQ** (AMQP: 5672, Management UI: 15672)
- **pgAdmin** (port 5050)

### 2. Backend Setup & Run

```bash
cd sentinel-api
npm install
npm run migration:run
npm run start:dev
```

**Backend available at:** http://localhost:8000

- **Swagger API Docs:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/api/health

### 3. Frontend Setup & Run

In a new terminal:

```bash
cd sentinel-app
npm install
npm run dev
```

**Frontend available at:** http://localhost:3000

---

## Service Endpoints & Credentials

| Service          | URL                        | Default Credentials              |
| ---------------- | -------------------------- | -------------------------------- |
| **Backend API**  | http://localhost:8000      | —                                |
| **Swagger Docs** | http://localhost:8000/docs | —                                |
| **PostgreSQL**   | localhost:5432             | `sentinel` / `sentinel`          |
| **pgAdmin**      | http://localhost:5050      | `admin@sentinel.local` / `admin` |
| **RabbitMQ UI**  | http://localhost:15672     | `sentinel` / `sentinel`          |

---

## Backend Commands

### Development

```bash
cd sentinel-api

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start in watch mode (recommended for development)
npm run start:dev

# Start in debug mode
npm run start:debug

# Production build & start
npm run build
npm run start:prod
```

### Database

```bash
# Generate new migration from entity changes
npm run migration:generate

# Manually create a blank migration
npm run migration:create

# Revert the last migration
npm run migration:revert
```

### Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
npm run test:watch
npm run test:cov

# Run e2e tests
npm run test:e2e

# Check OpenAPI specification drift
npm run spec:check:drift
```

---

## Frontend Commands

### Development

```bash
cd sentinel-app

# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Generate API types from OpenAPI spec
npm run api:generate

# Type check (without emitting)
npm run typecheck
```

### Build & Preview

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format
```

---

## Local Authentication (Development)

In local development, authentication is mocked. Switch user roles per request using headers:

```bash
# Using Authorization header
curl -H "Authorization: Bearer RM" http://localhost:8000/api/audit
curl -H "Authorization: Bearer COMPLIANCE_OFFICER" http://localhost:8000/api/kyc
curl -H "Authorization: Bearer AUDITOR" http://localhost:8000/api/audit

# Or using x-user-role header
curl -H "x-user-role: AUDITOR" http://localhost:8000/api/audit
```

**Available Roles:** `RM`, `COMPLIANCE_OFFICER`, `AUDITOR`

**Optional headers:**

- `x-user-id` — User identifier
- `x-user-name` — User display name

---

## Project Structure

```
sentinel-api/          # NestJS backend (modular monolith)
├── src/
│   ├── audit/        # Audit trail module
│   ├── kyc/          # KYC module
│   ├── onboarding/   # Client onboarding module
│   ├── risk-classification/  # Risk scoring module
│   ├── shared/       # Shared utilities, constants, infrastructure
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
└── package.json

sentinel-app/          # React frontend
├── src/
│   ├── components/   # UI components
│   ├── features/     # Feature modules (audit, kyc, onboarding, etc.)
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities
│   ├── router/       # Route configuration & guards
│   ├── shared/       # API client, types, constants
│   ├── stores/       # Zustand state management
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
└── package.json

docs/                  # Architecture & design decisions
├── adr/              # Architecture Decision Records
├── backend-architecture.md
├── frontend-architecture.md
├── hld.md            # High-level design
└── lld.md            # Low-level design
```

---

## Development Workflow

### 1. **Backend-First Development**

When modifying domain logic:

```bash
cd sentinel-api
npm run start:dev
npm run test:watch
```

Access Swagger UI to test endpoints: http://localhost:8000/docs

### 2. **API-First Development**

After updating backend OpenAPI spec, regenerate frontend types:

```bash
cd sentinel-app
npm run api:generate
```

### 3. **Full Stack Development**

Terminal 1 — Backend:

```bash
cd sentinel-api && npm run start:dev
```

Terminal 2 — Frontend:

```bash
cd sentinel-app && npm run dev
```

Terminal 3 — Monitor (optional):

```bash
# Watch pgAdmin: http://localhost:5050
# Watch RabbitMQ: http://localhost:15672
```

---

## Stopping Services

```bash
# Stop frontend dev server
# Press Ctrl+C in the frontend terminal

# Stop backend dev server
# Press Ctrl+C in the backend terminal

# Stop Docker services
cd sentinel-api
docker compose down

# Stop Docker services and remove volumes (clean slate)
docker compose down -v
```

---

## Environment Variables

### Backend

Create `sentinel-api/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sentinel
DB_PASSWORD=sentinel
DB_NAME=sentinel

RMQ_USER=sentinel
RMQ_PASSWORD=sentinel
RMQ_HOST=localhost
RMQ_PORT=5672

PGADMIN_EMAIL=admin@sentinel.local
PGADMIN_PASSWORD=admin
```

### Frontend

Create `sentinel-app/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Troubleshooting

### Docker containers won't start

```bash
# Check container status
docker compose ps

# View logs
docker compose logs postgres
docker compose logs rabbitmq

# Restart services
docker compose down -v
docker compose up -d
```

### Database migration errors

```bash
# Check current migration status
npm run typeorm -- -d src/shared/infrastructure/typeorm/data-source.ts migration:show

# Revert problematic migration
npm run migration:revert

# Re-run migrations
npm run migration:run
```

### Port already in use

If ports 5432, 5672, 15672, 5050, 3000, or 8000 are in use, update `docker-compose.yml` or kill existing processes:

```bash
# macOS/Linux
lsof -i :5432
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Frontend type generation fails

```bash
cd sentinel-app
npm run api:generate
npm run typecheck
```

---

## Architecture Documentation

- [High-Level Design](docs/hld.md)
- [Low-Level Design](docs/lld.md)
- [Backend Architecture](docs/backend-architecture.md)
- [Frontend Architecture](docs/frontend-architecture.md)
- [Architecture Decision Records](docs/adr/)

---

## Additional Resources

- **NestJS:** https://docs.nestjs.com
- **Vite:** https://vitejs.dev
- **TypeORM:** https://typeorm.io
- **RabbitMQ:** https://www.rabbitmq.com/documentation.html
- **shadcn/ui:** https://ui.shadcn.com
