# Waterfall Web Application

[![Tests](https://img.shields.io/badge/tests-176%2F177%20passing-green.svg)](https://github.com/bengeek06/web-waterfall)
[![License: AGPL v3 / Commercial](https://img.shields.io/badge/license-AGPLv3%20%2F%20Commercial-blue)](LICENSE.md)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/badge/coverage-88.67%25-green.svg)](./coverage)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](./Dockerfile)

---

## Overview

**Waterfall Web Application** is a modern, production-ready frontend for project management built with Next.js 15 and the App Router. It provides a comprehensive interface for managing projects, milestones, deliverables, users, companies, and organizational structures through a unified proxy architecture.

**Key Capabilities:**
- **🎯 Unified Proxy System**: Centralized backend communication with automatic mock mode
- **🔐 JWT Authentication**: Secure cookie-based auth with multi-tenant isolation
- **🛡️ Role-Based Access**: Integration with Guardian service for fine-grained permissions
- **🏢 Multi-tenant Architecture**: Company-based data isolation across all services
- **📊 Modern UI/UX**: Radix UI components with Tailwind CSS for responsive design
- **🧪 Comprehensive Testing**: 176+ unit tests + integration test suite
- **🐳 Docker Ready**: Full containerization with microservices orchestration

**Microservices Integration:**
The application acts as a unified frontend gateway to three backend microservices:
- **Auth Service** (port 5001): JWT authentication and token management
- **Identity Service** (port 5002): Users, companies, organizations, positions
- **Guardian Service** (port 5003): RBAC with roles, policies, and permissions

**Technical Stack:**
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Language**: TypeScript 5.6 with strict type checking
- **Styling**: Tailwind CSS 4 + Radix UI component library
- **State**: React Hook Form + Zod validation
- **Data Tables**: TanStack Table v8 with sorting and filtering
- **Testing**: Jest 29 + Testing Library with 88.67% coverage
- **Logging**: Pino structured logging
- **Build**: Docker multi-stage builds for production optimization

---

## Project Structure

```
.
├── app/
│   ├── api/                        # Backend proxy routes
│   │   ├── auth/                   # Auth service endpoints
│   │   ├── guardian/               # Guardian service endpoints
│   │   └── identity/               # Identity service endpoints
│   ├── init-app/                   # Application initialization
│   ├── login/                      # Public login page
│   ├── welcome/                    # Protected dashboard
│   │   ├── admin/                  # Admin section
│   │   │   ├── roles/
│   │   │   └── users/
│   │   ├── company/
│   │   ├── profile/
│   │   └── projects/
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page
├── components/                     # React components
│   ├── ui/                         # Radix UI primitives
│   ├── initApp.tsx                 # App initialization component
│   ├── login.tsx                   # Login form component
│   ├── policies.tsx                # Policies management
│   └── TopBar.tsx                  # Navigation bar
├── lib/                            # Utility libraries
│   ├── proxy/                      # Backend proxy system
│   │   ├── index.ts                # Main proxy logic
│   │   ├── mocks.ts                # Mock responses (42 mocks)
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── README.md               # Proxy documentation
│   ├── dictionaries.ts             # i18n support
│   ├── logger.ts                   # Pino logging
│   ├── sessionFetch.client.ts      # Client-side fetch
│   ├── sessionFetch.server.ts      # Server-side fetch
│   ├── user.ts                     # User utilities
│   └── utils.ts                    # General utilities
├── scripts/                        # Test and utility scripts
├── docs/                           # Additional documentation
├── dictionaries/                   # Translation files
│   ├── en.json                     # English translations
│   └── fr.json                     # French translations
├── public/                         # Static assets
│   ├── site.webmanifest
│   └── fonts/                      # Custom fonts
├── components.json                 # shadcn/ui config
├── docker-compose.yml              # Service orchestration
├── Dockerfile                      # Production image
├── env.example                     # Environment template
├── jest.config.js                  # Jest configuration
├── jest.setup.js                   # Jest setup
├── next.config.ts                  # Next.js config
├── package.json                    # Dependencies
├── postcss.config.mjs              # PostCSS config
├── tailwind.config.ts              # Tailwind config
├── tsconfig.json                   # TypeScript config
└── README.md                       # This file
```

---

## Environments

The application supports multiple environments:

- **Development**: Local development with hot reload. Uses Turbopack for fast builds.
- **Testing**: Automated testing with Jest. Mock mode enabled by default.
- **Staging**: Pre-production validation. Connected to staging backend services.
- **Production**: Optimized build with Docker. All security features enabled.

Set the environment with the `NODE_ENV` environment variable.  
Backend service URLs and secrets are configured via environment variables (see `env.example`).

---

## Environment Variables

The application reads the following variables (see `env.example`):

| Variable                | Description | Default |
|-------------------------|-------------|---------|
| NODE_ENV                | Environment (development, production) | development |
| LOG_LEVEL               | Logging level (debug, info, warn, error) | info |
| AUTH_SERVICE_URL        | Auth service base URL | http://auth_service:5001 |
| IDENTITY_SERVICE_URL    | Identity service base URL | http://identity_service:5002 |
| GUARDIAN_SERVICE_URL    | Guardian service base URL | http://guardian_service:5003 |
| MOCK_API                | Enable mock mode (true/false) | false |
| LOGIN                   | Test login email (for integration tests) | - |
| PASSWORD                | Test login password (for integration tests) | - |
| NEXT_PUBLIC_APP_URL     | Public application URL | http://localhost:3000 |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ci` | Run tests in CI mode (no watch) |
| `npm run test:integration` | Run integration tests (Docker) |
| `npm run test:integration:local` | Run integration tests (local) |

---

## Features

### 🎯 **Unified Proxy Architecture**
- **Generic Proxy Function**: Single `proxyRequest()` handles all backend calls
- **Automatic Cookie Forwarding**: JWT tokens forwarded to all microservices
- **Centralized Mocks**: 42 mock responses for offline development
- **Error Handling**: Consistent error formatting and logging
- **Type Safety**: Full TypeScript interfaces for all endpoints

### 🔐 **Authentication & Security**
- **JWT Cookie-Based Auth**: Secure HTTP-only cookies for token storage
- **Multi-tenant Isolation**: Company-based data separation
- **CSRF Protection**: Built into Next.js App Router
- **Secure Headers**: Security headers configured in Next.js config
- **Session Management**: Automatic token refresh and validation

### 🛡️ **Role-Based Access Control**
- **Guardian Integration**: Real-time permission checks via Guardian service
- **Route Protection**: Server-side authentication guards
- **Fine-grained Permissions**: Resource-level access control
- **Policy Management**: Admin interface for role/policy configuration

### 📊 **Modern UI Components**
- **Radix UI Primitives**: Accessible, unstyled component library
- **Tailwind CSS 4**: Utility-first styling with custom design system
- **Dark Mode Support**: System-preference based theming
- **Responsive Design**: Mobile-first approach
- **Form Validation**: React Hook Form + Zod schemas

### 🧪 **Testing & Quality**
- **176+ Unit Tests**: Comprehensive Jest test suite (99.4% passing)
- **Integration Tests**: Bash scripts testing real backend interactions
- **88.67% Coverage**: High code coverage with coverage reports
- **TypeScript Strict Mode**: Type safety across the entire codebase
- **ESLint**: Code quality and consistency enforcement

### 🐳 **Docker & DevOps**
- **Multi-stage Builds**: Optimized production images
- **Docker Compose**: Full stack orchestration
- **Health Checks**: Endpoint monitoring for all services
- **Hot Reload**: Fast refresh in development mode
- **Environment Parity**: Consistent config across environments

### 🌍 **Internationalization**
- **Multi-language Support**: English and French translations
- **Dictionary System**: JSON-based translation files
- **Dynamic Language Switching**: Runtime language selection

---

## Quickstart

### Requirements

- Node.js 22+
- npm or pnpm
- Docker (for full stack development)

### Local Development (Frontend Only)

```bash
# Clone the repository
git clone https://github.com/bengeek06/web-waterfall.git
cd web-waterfall

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Enable mock mode for offline development
echo "MOCK_API=true" >> .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

### Running with Real Backend Services

```bash
# Copy environment template
cp env.example .env.local

# Configure backend URLs
cat > .env.local << EOF
NODE_ENV=development
MOCK_API=false
AUTH_SERVICE_URL=http://localhost:5001
IDENTITY_SERVICE_URL=http://localhost:5002
GUARDIAN_SERVICE_URL=http://localhost:5003
LOG_LEVEL=debug
EOF

# Start backend services first
docker-compose up -d auth_service identity_service guardian_service

# Then start Next.js
npm run dev
```

---

## API Documentation

The application acts as a proxy to three backend microservices. Each service has its own OpenAPI 3.0 specification:

- **[Auth Service API](/.spec/auth_api.yml)** - Authentication and token management
  - Visualize: [Redoc](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/bengeek06/web-waterfall/refs/heads/guardian_staging/.spec/auth_api.yml)
  
- **[Guardian Service API](/.spec/guardian_api.yml)** - RBAC authorization
  - Visualize: [Redoc](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/bengeek06/web-waterfall/refs/heads/guardian_staging/.spec/guardian_api.yml)

- **[Identity Service API](/.spec/identity_api.yml)** - User and organization management
  - Visualize: [Redoc](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/bengeek06/web-waterfall/refs/heads/guardian_staging/.spec/identity_api.yml)

**Proxy Documentation:**
- [Proxy System Guide](./lib/proxy/README.md) - How the unified proxy works
- [Mock Mode Guide](./docs/MOCK_MODE_GUIDE.md) - Using mocks during development
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Migrating endpoints to proxy system

---

## Endpoints

All API routes are proxied through Next.js App Router to backend microservices:

### 🔐 **Auth Service Endpoints** (`/api/auth/*`)
| Method | Path | Description | Mock Available |
|--------|------|-------------|----------------|
| POST | `/api/auth/login` | User login, returns JWT cookies | ✅ |
| POST | `/api/auth/logout` | User logout, revokes tokens | ✅ |
| POST | `/api/auth/refresh` | Refresh access token | ✅ |
| GET | `/api/auth/verify` | Verify access token | ✅ |
| GET | `/api/auth/health` | Auth service health | ✅ |
| GET | `/api/auth/version` | Auth service version | ✅ |
| GET | `/api/auth/config` | Auth service config | ✅ |

### 🛡️ **Guardian Service Endpoints** (`/api/guardian/*`)
| Method | Path | Description | Mock Available |
|--------|------|-------------|----------------|
| POST | `/api/guardian/check-access` | Verify user permissions | ✅ |
| GET | `/api/guardian/roles` | List all roles | ✅ |
| POST | `/api/guardian/roles` | Create role | ✅ |
| GET | `/api/guardian/roles/{role_id}` | Get role details | ✅ |
| PUT/PATCH/DELETE | `/api/guardian/roles/{role_id}` | Update/delete role | ✅ |
| GET | `/api/guardian/policies` | List all policies | ✅ |
| POST | `/api/guardian/policies` | Create policy | ✅ |
| GET | `/api/guardian/policies/{policy_id}` | Get policy details | ✅ |
| PUT/PATCH/DELETE | `/api/guardian/policies/{policy_id}` | Update/delete policy | ✅ |
| GET | `/api/guardian/permissions` | List all permissions | ✅ |
| GET | `/api/guardian/permissions/{permission_id}` | Get permission details | ✅ |
| GET | `/api/guardian/user-roles` | List user-role assignments | ✅ |
| POST | `/api/guardian/user-roles` | Assign role to user | ✅ |
| GET/PUT/PATCH/DELETE | `/api/guardian/user-roles/{user_role_id}` | Manage user-role | ✅ |
| GET | `/api/guardian/roles/{role_id}/policies` | List role policies | ✅ |
| POST/DELETE | `/api/guardian/roles/{role_id}/policies/{policy_id}` | Link/unlink policy | ✅ |
| GET | `/api/guardian/policies/{policy_id}/permissions` | List policy permissions | ✅ |
| POST/DELETE | `/api/guardian/policies/{policy_id}/permissions/{permission_id}` | Link/unlink permission | ✅ |
| GET | `/api/guardian/health` | Guardian service health | ✅ |
| GET | `/api/guardian/version` | Guardian service version | ✅ |
| GET | `/api/guardian/config` | Guardian service config | ✅ |
| GET/POST | `/api/guardian/init-db` | Database initialization | ✅ |

### 👥 **Identity Service Endpoints** (`/api/identity/*`)
| Method | Path | Description | Mock Available |
|--------|------|-------------|----------------|
| GET | `/api/identity/users` | List users | ✅ |
| POST | `/api/identity/users` | Create user | ✅ |
| GET | `/api/identity/users/{user_id}` | Get user details | ✅ |
| PUT/PATCH/DELETE | `/api/identity/users/{user_id}` | Update/delete user | ✅ |
| GET | `/api/identity/users/{user_id}/roles` | Get user roles | ✅ |
| POST | `/api/identity/users/{user_id}/roles` | Assign role to user | ✅ |
| GET/DELETE | `/api/identity/users/{user_id}/roles/{role_id}` | Manage user role | ✅ |
| GET | `/api/identity/users/{user_id}/policies` | Get user policies (aggregated) | ✅ |
| GET | `/api/identity/users/{user_id}/permissions` | Get user permissions (aggregated) | ✅ |
| GET | `/api/identity/companies` | List companies | ✅ |
| POST | `/api/identity/companies` | Create company | ✅ |
| GET/PUT/PATCH/DELETE | `/api/identity/companies/{company_id}` | Manage company | ✅ |
| GET | `/api/identity/organization_units` | List organization units | ✅ |
| POST | `/api/identity/organization_units` | Create org unit | ✅ |
| GET/PUT/PATCH/DELETE | `/api/identity/organization_units/{unit_id}` | Manage org unit | ✅ |
| GET | `/api/identity/organization_units/{unit_id}/children` | Get child units | ✅ |
| GET/POST | `/api/identity/organization_units/{unit_id}/positions` | Manage unit positions | ✅ |
| GET | `/api/identity/positions` | List positions | ✅ |
| POST | `/api/identity/positions` | Create position | ✅ |
| GET/PUT/PATCH/DELETE | `/api/identity/positions/{position_id}` | Manage position | ✅ |
| GET | `/api/identity/positions/{position_id}/users` | Get users in position | ✅ |
| GET | `/api/identity/customers` | List customers | ✅ |
| POST | `/api/identity/customers` | Create customer | ✅ |
| GET/PUT/PATCH/DELETE | `/api/identity/customers/{customer_id}` | Manage customer | ✅ |
| GET | `/api/identity/subcontractors` | List subcontractors | ✅ |
| POST | `/api/identity/subcontractors` | Create subcontractor | ✅ |
| GET/PUT/PATCH/DELETE | `/api/identity/subcontractors/{subcontractor_id}` | Manage subcontractor | ✅ |
| POST | `/api/identity/verify_password` | Verify user password | ✅ |
| GET | `/api/identity/health` | Identity service health | ✅ |
| GET | `/api/identity/version` | Identity service version | ✅ |
| GET | `/api/identity/config` | Identity service config | ✅ |
| GET/POST | `/api/identity/init-db` | Database initialization | ✅ |

**Total: 90+ proxied endpoints with full mock support**

---

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode (no watch, coverage)
npm run test:ci
```

**Current Coverage: 88.67%**
- 176 tests passing (99.4% success rate)
- Proxy system: 92.18% coverage
- API routes: 83.33% coverage

### Integration Tests

```bash
# Full integration test suite (Docker)
npm run test:integration

# Individual service tests
./scripts/test-integration-auth.sh
./scripts/test-integration-guardian.sh
./scripts/test-integration-identity.sh

# Local environment (requires services running)
npm run test:integration:local
```

**Integration Test Results:**
- **Auth Service**: 8/8 tests passing (100%)
- **Guardian Service**: 66/66 tests passing (100%)  
- **Identity Service**: 30/30 tests passing (100%)

> 📖 See [scripts/README.md](./scripts/README.md) for detailed testing documentation

---

## Docker Usage

### Production Image

```bash
# Build production image
docker build -t waterfall-web:prod --target production .

# Run production container
docker run -d \
  --name waterfall_web \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e AUTH_SERVICE_URL=http://auth_service:5001 \
  -e IDENTITY_SERVICE_URL=http://identity_service:5002 \
  -e GUARDIAN_SERVICE_URL=http://guardian_service:5003 \
  waterfall-web:prod
```

### Docker Compose (Full Stack)

```yaml
version: "3.9"

services:
  web_service:
    build:
      context: .
      target: production
    container_name: waterfall_web
    restart: unless-stopped
    environment:
      NODE_ENV: production
      AUTH_SERVICE_URL: http://auth_service:5001
      IDENTITY_SERVICE_URL: http://identity_service:5002
      GUARDIAN_SERVICE_URL: http://guardian_service:5003
      MOCK_API: "false"
      LOG_LEVEL: info
    depends_on:
      - auth_service
      - identity_service
      - guardian_service
    ports:
      - "3000:3000"

  auth_service:
    image: ghcr.io/bengeek06/pm-auth-api:latest
    environment:
      FLASK_ENV: production
      DATABASE_URL: postgresql://auth:pass@auth_db:5432/auth
      JWT_SECRET: ${JWT_SECRET:-change-me}
    ports:
      - "5001:5000"

  identity_service:
    image: ghcr.io/bengeek06/pm-identity-api:latest
    environment:
      FLASK_ENV: production
      DATABASE_URL: postgresql://identity:pass@identity_db:5432/identity
      GUARDIAN_SERVICE_URL: http://guardian_service:5000
      JWT_SECRET: ${JWT_SECRET:-change-me}
    ports:
      - "5002:5000"

  guardian_service:
    image: ghcr.io/bengeek06/pm-guardian-api:latest
    environment:
      FLASK_ENV: production
      DATABASE_URL: postgresql://guardian:pass@guardian_db:5432/guardian
      JWT_SECRET: ${JWT_SECRET:-change-me}
    ports:
      - "5003:5000"

  auth_db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: auth
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: auth
    volumes:
      - auth_data:/var/lib/postgresql/data

  identity_db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: identity
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: identity
    volumes:
      - identity_data:/var/lib/postgresql/data

  guardian_db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: guardian
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: guardian
    volumes:
      - guardian_data:/var/lib/postgresql/data

volumes:
  auth_data:
  identity_data:
  guardian_data:
```

Create `.env` file:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Start stack:
```bash
docker compose up -d
```

Health check:
```bash
curl http://localhost:3000
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
```

---

## License

This project is dual-licensed:

- **Community version**: [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html)
- **Commercial license**: See [LICENSE.md](LICENSE.md) and [COMMERCIAL-LICENCE.txt](COMMERCIAL-LICENCE.txt) for commercial licensing options

For commercial use or support, contact: **bengeek06@gmail.com**

---

## Contributing

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for guidelines.

**Before submitting a pull request:**
1. ✅ All unit tests pass (`npm test`)
2. ✅ Integration tests pass (`npm run test:integration`)
3. ✅ No linting errors (`npm run lint`)
4. ✅ TypeScript compiles without errors (`npm run build`)
5. ✅ Documentation is updated
6. ✅ Commit messages follow conventional commits format

**Development Workflow:**
1. Create a feature branch from `guardian_staging`
2. Make your changes with tests
3. Run full test suite
4. Submit pull request with detailed description

---

## Learn More

### Project Documentation
- **[Proxy System](./lib/proxy/README.md)** - Unified proxy architecture
- **[Testing Scripts](./scripts/README.md)** - Integration test documentation
- **[Mock Mode Guide](./docs/MOCK_MODE_GUIDE.md)** - Development with mocks
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Endpoint migration guide
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Complete overview
- **[Guardian Test Report](./GUARDIAN_TEST_REPORT.md)** - Guardian service validation
- **[Identity Test Report](./IDENTITY_TEST_REPORT.md)** - Identity service validation

---

## Deployment

### Vercel Deployment (Recommended for Frontend)

The easiest way to deploy the Next.js frontend is using the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables:
   - `AUTH_SERVICE_URL`
   - `IDENTITY_SERVICE_URL`
   - `GUARDIAN_SERVICE_URL`
4. Deploy!

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Docker Deployment (Full Stack)

```bash
# Clone and navigate
git clone https://github.com/bengeek06/web-waterfall.git
cd web-waterfall

# Configure environment
cp env.example .env
# Edit .env with your production values

# Start all services
docker compose up -d --build

# Monitor logs
docker compose logs -f

# Scale services if needed
docker compose up -d --scale web_service=3
```

### Production Checklist

- [ ] Environment variables configured (no defaults)
- [ ] JWT_SECRET is strong and unique
- [ ] Database backups configured
- [ ] HTTPS/TLS certificates configured
- [ ] Log aggregation set up
- [ ] Monitoring and alerting enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers validated
- [ ] Database migrations tested

---

**Version:** 0.1.0  
**Node:** >=22.0.0  
**License:** AGPL v3 / Commercial
