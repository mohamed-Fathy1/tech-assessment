# Blurr HR Portal - Database Schema Design

## Overview

This document details the database schema design for the Blurr HR Portal. We are using Prisma ORM with SQLite as the database provider.

## Existing Schema

The codebase currently has the following authentication-related models:

- User
- Account
- Session
- VerificationToken

## Schema Extensions

We need to extend the schema to support the following features:

- Employee management with salary calculations
- Project management
- Task management with Kanban board support

### Extended User Model

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  password      String?
  image         String?
  accounts      Account[]
  sessions      Session[]
  employees     Employee[]  // Added relation for employees
  projects      Project[]   // Added relation for projects
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Employee Model

```prisma
model Employee {
  id          String    @id @default(cuid())
  employeeId  String    @unique  // For organization-specific employee IDs
  name        String
  joiningDate DateTime
  basicSalary Float
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]
  salaries    Salary[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Salary Model

```prisma
model Salary {
  id         String    @id @default(cuid())
  month      DateTime  // Stored as a date, will use the month part
  bonus      Float     @default(0)
  deduction  Float     @default(0)
  // Total salary will be calculated: basicSalary + bonus - deduction
  employee   Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@unique([employeeId, month])  // Each employee can have only one salary entry per month
}
```

### Project Model

```prisma
model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Task Model with Enums

```prisma
model Task {
  id          String      @id @default(cuid())
  title       String
  description String?
  priority    Priority    @default(MEDIUM)
  status      TaskStatus  @default(BACKLOG)
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employeeId  String?     // Optional as tasks might not be assigned yet
  employee    Employee?   @relation(fields: [employeeId], references: [id], onDelete: SetNull)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}
```

## Schema Relationships

1. **User to Employee**: One-to-many relationship. A user (company) can have multiple employees.
2. **User to Project**: One-to-many relationship. A user can have multiple projects.
3. **Employee to Task**: One-to-many relationship. An employee can be assigned multiple tasks.
4. **Employee to Salary**: One-to-many relationship. An employee can have multiple salary records (one per month).
5. **Project to Task**: One-to-many relationship. A project can have multiple tasks.

## Database Considerations

### Indexing

- We'll add indexes to frequently queried columns like `employeeId`, `month`, etc.

### Constraints

- Unique constraint on `Employee.employeeId` to ensure each employee has a unique identifier within the organization.
- Unique constraint on `Salary` combining `employeeId` and `month` to ensure only one salary record per employee per month.

### Cascading Deletes

- When a user is deleted, all associated employees and projects will be deleted.
- When an employee is deleted, all associated tasks will have their `employeeId` set to null.
- When a project is deleted, all associated tasks will be deleted.

## Migration Strategy

1. Create the initial migration to add the new models
2. Apply the migration to update the database schema
3. Create seed data if necessary for testing

## Performance Considerations

- Using SQLite for this project which is suitable for smaller deployments
- For larger deployments, consider switching to a more scalable database like PostgreSQL

## Next Steps

1. Implement the schema changes in the Prisma schema file
2. Generate and apply migrations
3. Create server actions for interacting with the database
4. Implement the UI components that will use these models
