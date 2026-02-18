# Task Management

A role-based task workflow application built with Spring Boot 3.5 and Java 17. Supports task lifecycle tracking (`TODO -> DOING -> DONE`), four-tier role authorization, JWT authentication, audit logging, and a server-rendered Thymeleaf UI with a command palette and responsive sidebar.

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Language     | Java 17                                 |
| Framework    | Spring Boot 3.5.10                      |
| Security     | Spring Security + JWT (jjwt 0.11.5)     |
| Persistence  | Spring Data JPA, Hibernate, PostgreSQL   |
| UI           | Thymeleaf, Thymeleaf Extras Spring Security 6 |
| Build        | Maven (wrapper included)                |
| Dev Tools    | Spring Boot DevTools, Docker Compose     |
| API Docs     | SpringDoc OpenAPI 2.8.6 (Swagger UI)    |
| Testing      | JUnit 5, Mockito, H2 (in-memory), Spring Security Test |

## Project Structure

```
src/main/java/com/zendoge/taskmanagement/
├── TaskmanagementApplication.java
├── config/          # Bootstrap data seeding, OpenAPI config
├── domain/          # JPA entities (Task, User, AuditLog, enums)
├── repository/      # Spring Data JPA repositories
├── security/        # JWT filter, JWT service, Security config
├── service/         # Business logic (Auth, Task, User, Audit)
└── web/
    ├── dto/         # Request/response DTOs
    ├── *Controller  # REST + UI controllers
    └── ApiExceptionHandler
```

## Prerequisites

- **Java 17+**
- **Docker** (or a compatible container runtime with `docker compose`)
- Maven wrapper is included (`./mvnw`) -- no global Maven install required

## Getting Started

### Quick Start (recommended)

Spring Boot Docker Compose support auto-starts Postgres:

```bash
./mvnw spring-boot:run
```

The app starts at **http://localhost:8080**.

### Manual Database Start

```bash
docker compose up -d
./mvnw spring-boot:run
```

### IntelliJ IDEA

1. Open the project and set the SDK to Java 17.
2. Run `docker compose up -d` to start Postgres.
3. Run the main class: `com.zendoge.taskmanagement.TaskmanagementApplication`
4. Open **http://localhost:8080**.

## Seeded Users

On startup the app bootstraps four users (non-test profile):

| Email                  | Role      | Password       |
|------------------------|-----------|----------------|
| `admin@task.local`     | ADMIN     | `password123`  |
| `manager@task.local`   | MANAGER   | `password123`  |
| `member@task.local`    | MEMBER    | `password123`  |
| `viewer@task.local`    | VIEWER    | `password123`  |

## Roles & Permissions

| Action             | ADMIN | MANAGER | MEMBER | VIEWER |
|--------------------|:-----:|:-------:|:------:|:------:|
| Create task        |   x   |    x    |        |        |
| Update task        |   x   |    x    |   x*   |        |
| Delete task        |   x   |         |        |        |
| List all tasks     |   x   |    x    |        |        |
| List own tasks     |   x   |    x    |   x    |   x    |
| Manage users       |   x   |         |        |        |
| List assignable    |   x   |    x    |        |        |
| View all audit     |   x   |         |        |        |
| View own audit     |   x   |    x    |   x    |        |

\* Members can only update tasks assigned to them.

## UI Pages

| Route          | Description              |
|----------------|--------------------------|
| `/ui/login`    | Login page               |
| `/ui`          | Dashboard                |
| `/ui/tasks`    | Task board               |
| `/ui/users`    | User management (Admin)  |
| `/ui/audit`    | Audit log viewer         |

The UI includes a responsive sidebar and a command palette for quick navigation.

## API Documentation (Swagger)

Interactive API documentation is available via Swagger UI once the app is running:

| URL | Description |
|-----|-------------|
| `/swagger-ui.html` | Swagger UI — browse and test all endpoints |
| `/v3/api-docs` | OpenAPI 3.0 spec (JSON) |
| `/v3/api-docs.yaml` | OpenAPI 3.0 spec (YAML) |

Use the **Authorize** button in Swagger UI to enter your JWT token (`Bearer <token>`) and test protected endpoints directly from the browser.

## Importing API to Postman

**Note:** Make sure you are logged into your Postman account before importing, so the collection is saved to your workspace.

You can import the full API into Postman using the OpenAPI spec:

1. Start the application (`./mvnw spring-boot:run`)
2. Open Postman and click **Import** (top-left)
3. Select the **Link** tab and paste:
   ```
   http://localhost:8080/v3/api-docs
   ```
4. Click **Continue** → **Import**

Postman will create a collection with all endpoints, request bodies, and authentication setup. To authenticate requests, first call `POST /api/auth/login`, copy the token from the response, and set it in the collection's **Authorization** tab as `Bearer Token`.

Alternatively, you can import the YAML spec (`http://localhost:8080/v3/api-docs.yaml`) or export the JSON from the browser and use **Upload Files** in the import dialog.

## REST API

All API endpoints are prefixed with `/api`. Protected endpoints require an `Authorization: Bearer <token>` header.

### Auth

```
POST /api/auth/register   # Register a new user
POST /api/auth/login      # Login, returns JWT
```

### Tasks

```
GET    /api/tasks          # List tasks (scoped by role)
POST   /api/tasks          # Create task (Admin, Manager)
PUT    /api/tasks/{id}     # Update task (Admin, Manager, Member)
DELETE /api/tasks/{id}     # Delete task (Admin)
```

### Users

```
GET /api/users/me          # Current user info
GET /api/users             # List all users (Admin)
GET /api/users/assignable  # List assignable users (Admin, Manager)
PUT /api/users/{id}/role   # Update role (Admin)
```

### Audit

```
GET /api/audit             # All audit logs (Admin)
GET /api/audit/me          # Own audit logs (Admin, Manager, Member)
```

## Quick cURL Examples

**Login:**

```bash
TOKEN=$(curl -s http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@task.local","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
```

**List tasks:**

```bash
curl -s http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

**Create a task:**

```bash
curl -s -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Sample Task","description":"Created via curl","assigneeId":null}'
```

**View audit logs:**

```bash
curl -s http://localhost:8080/api/audit \
  -H "Authorization: Bearer $TOKEN"
```

## Testing

Tests use an in-memory H2 database and require no external services:

```bash
./mvnw test
```
