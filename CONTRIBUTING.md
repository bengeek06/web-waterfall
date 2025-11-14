# Contributing to Waterfall Web Application

Thank you for your interest in contributing to the **Waterfall Web Application**!

> **Note**: This application is part of the larger [Waterfall](../README.md) project. For the overall development workflow, branch strategy, and contribution guidelines, please refer to the [main CONTRIBUTING.md](../CONTRIBUTING.md) in the root repository.

## Table of Contents

- [Project Overview](#project-overview)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Component Development](#component-development)
- [Proxy System](#proxy-system)
- [Common Tasks](#common-tasks)

## Project Overview

The **Waterfall Web Application** is the Next.js 15 frontend for the Waterfall platform:

- **Technology Stack**: Next.js 15 (App Router), TypeScript 5.6, React, Tailwind CSS 4
- **Port**: 3000
- **Architecture**: Server-side rendering (SSR) with unified proxy to backend microservices
- **Key Features**:
  - JWT cookie-based authentication
  - Role-based access control (RBAC) integration
  - Multi-tenant company isolation
  - Unified backend proxy with mock mode
  - Comprehensive test coverage (176+ tests, 88.67% coverage)

**Backend Integration:**
- Auth Service (port 5001)
- Identity Service (port 5002)
- Guardian Service (port 5003)
- Project Service (port 5006)
- Basic IO Service (port 5004)
- Storage Service (port 5005)

## Development Setup

### Prerequisites

- Node.js 22+
- npm or pnpm
- Backend services running (or mock mode enabled)

### Local Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Copy environment configuration
cp env.example .env.local

# Enable mock mode for offline development (optional)
echo "MOCK_API=true" >> .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Configuration

```bash
# .env.local
NODE_ENV=development
MOCK_API=false  # Set to true for offline development

# Backend service URLs
AUTH_SERVICE_URL=http://localhost:5001
IDENTITY_SERVICE_URL=http://localhost:5002
GUARDIAN_SERVICE_URL=http://localhost:5003

# Logging
LOG_LEVEL=debug

# Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running with Backend Services

```bash
# Terminal 1: Start backend services
cd ..
./scripts/run-backend.sh

# Terminal 2: Start frontend
cd web
npm run dev
```

## Coding Standards

### TypeScript Guidelines

**Type Safety:**
```typescript
// Always use explicit types for function parameters and return values
interface User {
  id: number;
  email: string;
  username: string;
  company_id: number;
}

async function fetchUser(userId: number): Promise<User> {
  const response = await fetch(`/api/identity/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}
```

**Avoid `any`:**
```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
interface DataType {
  value: string;
}

function processData(data: DataType): string {
  return data.value;
}
```

**Use Type Guards:**
```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}
```

### React/Next.js Conventions

**Component Structure:**
```typescript
// components/UserCard.tsx
'use client'; // Only if using hooks/interactivity

import { User } from '@/lib/types';

interface UserCardProps {
  user: User;
  onEdit?: (userId: number) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{user.username}</h3>
      <p className="text-sm text-gray-600">{user.email}</p>
      {onEdit && (
        <button onClick={() => onEdit(user.id)}>
          Edit
        </button>
      )}
    </div>
  );
}
```

**Server Components (default):**
```typescript
// app/users/page.tsx
import { fetchUsers } from '@/lib/api';

export default async function UsersPage() {
  // Fetch data directly in server component
  const users = await fetchUsers();
  
  return (
    <div>
      <h1>Users</h1>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

**Client Components (when needed):**
```typescript
// components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Handle login
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      router.push('/welcome');
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Styling with Tailwind

```typescript
// Use Tailwind utility classes
<div className="flex items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
  <div className="flex-1">
    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
    <p className="text-sm text-gray-600">{user.email}</p>
  </div>
</div>

// For complex/reusable styles, use @apply in CSS modules
// styles/button.module.css
.button {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
```

### File Naming Conventions

```
components/
  ├── UserCard.tsx           # PascalCase for components
  ├── ui/
  │   ├── Button.tsx         # Radix UI components
  │   └── Dialog.tsx
  
lib/
  ├── api.ts                 # camelCase for utilities
  ├── utils.ts
  └── sessionFetch.ts
  
app/
  ├── page.tsx               # Next.js convention
  ├── layout.tsx
  └── welcome/
      └── page.tsx
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

### Test Structure

**Component Tests:**
```typescript
// __tests__/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from '@/components/UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    company_id: 5
  };
  
  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={handleEdit} />);
    
    const editButton = screen.getByText('Edit');
    editButton.click();
    
    expect(handleEdit).toHaveBeenCalledWith(1);
  });
});
```

**API Route Tests:**
```typescript
// __tests__/api/auth/login.test.ts
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

describe('POST /api/auth/login', () => {
  it('returns 200 with valid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('access_token');
  });
});
```

### Integration Tests

```bash
# Run full integration test suite
npm run test:integration

# Or manually with backend services
cd ../
./scripts/run-backend.sh
cd web
./scripts/test-integration-auth.sh
./scripts/test-integration-guardian.sh
./scripts/test-integration-identity.sh
```

## Component Development

### Creating a New Component

1. **Create component file:**

```typescript
// components/ProjectCard.tsx
import { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold">{project.name}</h3>
      <p className="text-sm text-gray-600">{project.description}</p>
      <div className="mt-2">
        <span className={`px-2 py-1 text-xs rounded ${
          project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
        }`}>
          {project.status}
        </span>
      </div>
    </div>
  );
}
```

2. **Add TypeScript types:**

```typescript
// lib/types.ts
export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  company_id: number;
  created_at: string;
  deadline?: string;
}
```

3. **Write tests:**

```typescript
// __tests__/components/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/ProjectCard';

describe('ProjectCard', () => {
  it('renders project information', () => {
    const project = {
      id: 1,
      name: 'Test Project',
      description: 'Description',
      status: 'active' as const,
      company_id: 1,
      created_at: '2024-01-01'
    };
    
    render(<ProjectCard project={project} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });
});
```

## Proxy System

The application uses a unified proxy system to communicate with backend microservices.

### Using the Proxy

```typescript
// lib/proxy/index.ts already handles the routing
import { proxyRequest } from '@/lib/proxy';

// In your API route
export async function GET(request: Request) {
  return proxyRequest({
    request,
    service: 'identity',    // auth, identity, or guardian
    path: '/users',         // Backend endpoint path
    mockKey: 'getUsers'     // Optional: mock response key
  });
}
```

### Adding New Proxy Routes

1. **Create API route:**

```typescript
// app/api/identity/projects/route.ts
import { proxyRequest } from '@/lib/proxy';

export async function GET(request: Request) {
  return proxyRequest({
    request,
    service: 'identity',
    path: '/projects',
    mockKey: 'getProjects'
  });
}

export async function POST(request: Request) {
  return proxyRequest({
    request,
    service: 'identity',
    path: '/projects',
    mockKey: 'createProject'
  });
}
```

2. **Add mock response (optional):**

```typescript
// lib/proxy/mocks.ts
export const mockResponses = {
  // ... existing mocks
  getProjects: {
    status: 200,
    data: [
      { id: 1, name: 'Project 1', status: 'active' },
      { id: 2, name: 'Project 2', status: 'planning' }
    ]
  },
  createProject: {
    status: 201,
    data: { id: 3, name: 'New Project', status: 'planning' }
  }
};
```

3. **Add types:**

```typescript
// lib/proxy/types.ts
export interface ProxyRequestOptions {
  // ... existing
  mockKey?: 'getUsers' | 'createUser' | 'getProjects' | 'createProject';
}
```

See [lib/proxy/README.md](lib/proxy/README.md) for detailed documentation.

## Common Tasks

### Adding a New Page

```bash
# Create page directory
mkdir -p app/projects

# Create page component
cat > app/projects/page.tsx << 'EOF'
import { fetchProjects } from '@/lib/api';

export default async function ProjectsPage() {
  const projects = await fetchProjects();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {/* Render projects */}
    </div>
  );
}
EOF
```

### Formatting Code

```bash
# Format with Prettier (if configured)
npm run format

# Lint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm start
```

## Service-Specific Guidelines

### Authentication

Always check authentication in server components or API routes:

```typescript
// app/welcome/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function WelcomePage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token');
  
  if (!accessToken) {
    redirect('/login');
  }
  
  // Render protected content
}
```

### Error Handling

```typescript
// Consistent error handling in API routes
try {
  const result = await someOperation();
  return Response.json(result);
} catch (error) {
  logger.error('Operation failed', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Getting Help

- **Main Project**: See [root CONTRIBUTING.md](../CONTRIBUTING.md)
- **Issues**: Use GitHub issues with `component:web` label
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Documentation**: 
  - [README.md](README.md)
  - [Proxy System](lib/proxy/README.md)
  - [Testing Scripts](scripts/README.md)

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)

---

**Remember**: Always refer to the [main CONTRIBUTING.md](../CONTRIBUTING.md) for branch strategy, commit conventions, and pull request process!
