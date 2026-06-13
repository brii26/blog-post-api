# blog-post-api

A simple blog post REST API built with NestJS, TypeScript, Prisma, and PostgreSQL, with JWT authentication, and end-to-end testing.

---

## Tech Stack

| Technology | Version |
|---|---|
| NestJS | ^11.0.1 |
| TypeScript | ^5.7.3 |
| Prisma | ^6.19.3 |
| PostgreSQL | ^16.0 |
| JWT (`@nestjs/jwt`) | ^11.0.2 |
| Jest + Supertest | ^30.0.0 |

---

## Data Model

Two related entities with a one-to-many relationship:

```
User (1) ---< (*) Post
```

**User**
Stores account credentials and profile.

**Post**
Belongs to a User via `authorId` (foreign key). Only the author can update or delete their own posts.

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login and get JWT token |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/posts` | Required | Create a new post |
| GET | `/posts` | Required | Get all posts (with author) |
| GET | `/posts/:id` | Required | Get post detail |
| PATCH | `/posts/:id` | Required + Owner | Update own post |
| DELETE | `/posts/:id` | Required + Owner | Delete own post |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/:id` | Required | Get user profile |
| PATCH | `/users/:id` | Required + Owner | Update own profile |

> Full interactive API documentation available at `http://localhost:3000/api` (Swagger UI) when the app is running.

---

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── auth/
│   ├── dto/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── posts/
│   ├── dto/
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── posts.repository.ts
│   └── posts.module.ts
├── users/
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── users.module.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── common/
    ├── decorators/
    │   ├── current-user.decorator.ts
    │   └── public.decorator.ts
    └── guards/
        └── jwt-auth.guard.ts
```

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| ORM | Prisma over TypeORM | Better DX, type-safe queries, cleaner schema management |
| Auth | JWT over Session | Stateless, fits REST principles, scalable |
| Validation | class-validator | Declarative, integrates natively with NestJS pipes |
| Testing | Jest + Supertest | Built-in to NestJS, industry standard for e2e |
| Pattern | Repository Pattern | Separates business logic from data access, making each layer independently testable |
| Auth Strategy | Global Guard + `@Public()` | Secure by default, all routes protected unless explicitly marked public, reduces risk of accidentally exposing endpoints |
| API Docs | Swagger (OpenAPI) | Auto-generated from code, interactive UI, always in sync with implementation |

### Why Repository Pattern?

The Repository Pattern adds an abstraction layer between the service (business logic) and the database (Prisma). This means:

- **Testability**: Services can be unit tested by mocking the repository, without touching the real database
- **Single Responsibility**: Services contain only business logic; repositories contain only database queries
- **Maintainability**: If the ORM changes in the future, only the repository layer needs to be updated, services remain untouched

```
Controller -> Service (business logic) -> Repository (Prisma queries) -> Database
```

---

## How to Run

### Prerequisites
- Node.js >= 18
- pnpm
- Docker (for PostgreSQL)

### Setup

**1. Clone the repository**
```bash
git clone https://github.com/brii26/blog-post-api.git
cd blog-post-api
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Setup environment**
```bash
cp .env.example .env
```
Open `docker-compose.yml` to find DB credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`), then fill in `.env`:
```dotenv
DATABASE_URL="postgresql://postgres:password@localhost:5432/blog_post_db"
JWT_SECRET="secret"
JWT_EXPIRES_IN="1h"
```

**4. Start PostgreSQL**
```bash
docker compose up -d
```

**5. Run database migrations**
```bash
pnpm prisma migrate deploy
```

**6. Start the server**
```bash
pnpm run start:dev
```

App runs at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api`

### Run E2E Tests

Make sure the database container is running using `docker compose up -d`, then:

```bash
pnpm run test:e2e
```

---

## E2E Test Coverage

Tests are located in `test/` and cover:

**`auth.e2e-spec.ts`**
- Register, login
- Duplicate email (409)
- Invalid email format (400)
- Wrong password (401)
- Valid/invalid JWT token (200/401)

**`posts.e2e-spec.ts`**
- Create post (201), 401 without token, 400 missing title
- Get all posts (200)
- Get post detail with author info, 404 not found
- Update own post (200), 403 if not owner
- Delete own post (200), 403 if not owner, 404 after deleted

---

## Author

Brian Ricardo Tamin
