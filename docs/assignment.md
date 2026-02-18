## Task Management Assessment Project

Document Version: 1.0  
Evaluation Period: 1 Week  
Technical Stack: Java 17+ (Spring Boot) OR Python 3.11+ (FastAPI/Django)

### 1. Project Overview
- **Objective:** Assess coding skills through a practical 1-week project.
- **Core Evaluation Areas:**
  - Workflow/state management implementation
  - Role-based authorization logic
  - Audit trail system design
  - Modern language feature usage
- **Success Criteria:** Working system with all core features implemented.

### 2. Business Requirements
- **Must Have** - Task Management: Create, read, update tasks with status flow.
- **Must Have** - Role-Based Access: Different permissions per user role.
- **Must Have** - Audit Trail: Log all changes to tasks.
- **Should Have** - Simple UI: Basic interface to test functionality.
- **Could Have** - Docker Setup: Containerized deployment.
- **Won't Have** - Email Notifications: Out of scope for this assessment.

### 3. User Roles and Permissions
- **Admin:** Full task operations, can change user roles, full audit access.
- **Manager:** Create/assign/update tasks, view users, audit access only for own actions.
- **Member:** Update only assigned tasks, view own profile, audit access only for own actions.
- **Viewer:** Read-only task access, no user or audit access.

### 4. Technical Requirements

#### 4.1 Database Schema
Minimal tables:
- `users` (id, email, password_hash, role, created_at)
- `tasks` (id, title, description, status, assignee_id, created_by, created_at)
- `audit_logs` (id, user_id, action, entity, entity_id, old_data, new_data, timestamp)

#### 4.2 API Endpoints (Minimum)
Authentication:
- `POST /api/auth/register`
- `POST /api/auth/login`

Users:
- `GET /api/users/me`
- `GET /api/users` (Admin only)

Tasks:
- `GET /api/tasks`
- `POST /api/tasks` (Manager/Admin)
- `PUT /api/tasks/{id}` (Role-based)
- `DELETE /api/tasks/{id}` (Admin only)

Audit:
- `GET /api/audit` (Admin only)

#### 4.3 Task Workflow
Todo -> Doing -> Done

- Members: Can move own tasks Todo -> Doing -> Done
- Managers: Can move any task through any state
- Admin: All permissions

### 5. Acceptance Criteria

#### Must Be Complete
- User registration and login works
- JWT authentication implemented
- Role-based API access control
- Task CRUD operations functional
- Status transitions enforce role rules
- Audit logs record all changes
- Admin can view audit logs
- Code runs without errors

#### Technical Quality
- Uses modern language features
- Clean, readable code structure
- Basic error handling
- README with setup instructions
- Can be tested with Postman/curl
