# Waterfall Web Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Getting Started

### Development with Docker (Recommended)

1. **Start all services**
   ```bash
   docker-compose up -d web_service auth_service identity_service guardian_service
   ```

2. **Access the application**
   - Web: http://localhost:3000
   - Auth Service: http://localhost:5001
   - Identity Service: http://localhost:5002
   - Guardian Service: http://localhost:5003

3. **Run integration tests**
   ```bash
   npm run test:integration
   ```

### Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 🧪 Testing

### Unit Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # CI mode (no watch)
```

### Integration Tests
```bash
npm run test:integration          # Docker environment
npm run test:integration:local    # Local environment
```

> 📖 See [scripts/README.md](./scripts/README.md) for detailed testing documentation

## 📁 Project Structure

```
app/
  ├── api/                    # API routes (Auth, Guardian, Identity)
  ├── welcome/                # Protected pages
  └── login/                  # Public pages
components/                   # React components
lib/
  └── proxy/                  # Backend proxy system
scripts/                      # Test scripts
docs/                         # Additional documentation
```

## 🔌 API Proxy System

This project uses a centralized proxy system to communicate with backend microservices.

**Key Features:**
- 🎯 Generic `proxyRequest()` function
- 🧪 Mock mode for development (`MOCK_API=true`)
- 🍪 Automatic cookie forwarding
- 🛡️ Error handling and logging
- 📝 TypeScript interfaces

> 📖 Read the [Proxy Documentation](./lib/proxy/README.md) for details

## 📚 Documentation

- **[Proxy System](./lib/proxy/README.md)** - How the API proxy works
- **[Testing Scripts](./scripts/README.md)** - Integration test documentation
- **[Mock Mode Guide](./docs/MOCK_MODE_GUIDE.md)** - Using mocks during development
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Migrating endpoints to the new system
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Complete overview

## 🔧 Environment Variables

Create a `.env.local` file:

```bash
# Backend Services
AUTH_SERVICE_URL=http://auth_service:5000
IDENTITY_SERVICE_URL=http://identity_service:5000
GUARDIAN_SERVICE_URL=http://guardian_service:5000

# Development Settings
MOCK_API=false              # Enable mock mode (true/false)
LOG_LEVEL=info              # Logging level (debug, info, warn, error)
NODE_ENV=development

# Test Credentials
LOGIN=testuser@example.com
PASSWORD=securepassword
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (with Turbopack) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:integration` | Run integration tests (Docker) |
| `npm run test:integration:local` | Run integration tests (local) |

## 📊 Code Coverage

Current coverage: **88.67%**

- Proxy system: 92.18%
- API routes: 83.33%

## 🎨 Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS 4 + Radix UI
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Icons:** Lucide React
- **Testing:** Jest + Testing Library
- **Logging:** Pino

## 🐳 Docker Support

The project runs in a Docker Compose environment with multiple microservices:

- `web_service` - Next.js frontend (port 3000)
- `auth_service` - Authentication API (port 5001)
- `identity_service` - Identity management API (port 5002)
- `guardian_service` - Authorization API (port 5003)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run `npm run test:integration` to validate
5. Submit a pull request

**Before committing:**
- ✅ All tests pass (`npm test`)
- ✅ Integration tests pass (`npm run test:integration`)
- ✅ No linting errors (`npm run lint`)
- ✅ Documentation is updated

## 📝 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Feedback and contributions welcome

## 🚢 Deployment

This application can be deployed using Docker Compose or platforms like Vercel.

### Docker Deployment
```bash
docker-compose up -d --build
```

### Vercel Deployment
The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Version:** 0.1.0  
**Node:** >=22.0.0  
**License:** Private
