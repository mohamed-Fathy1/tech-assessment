# Blurr HR Portal - Project Architecture

## Overview

This document outlines the architecture and technical implementation plan for the Blurr HR Portal, a full-stack React application for managing employees and their projects.

## Tech Stack

- **Frontend**: React, TailwindCSS, shadcn/ui
- **Backend**: Next.js (App Router) with Server Actions
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js

## Directory Structure

```
/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes
│   │   ├── dashboard/             # Dashboard routes
│   │   │   ├── employees/         # Employee management
│   │   │   │   ├── [id]/          # Single employee view
│   │   │   │   └── salary-table/  # Salary table view
│   │   │   ├── projects/          # Project management
│   │   │   │   ├── [id]/          # Single project view
│   │   │   │   ├── tasks/         # Task management
│   │   │   │   │   ├── [id]/      # Single task view
│   │   │   │   │   ├── kanban/    # Kanban board view
│   │   │   │   │   └── backlog/   # Backlog view
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   └── ...
│   ├── components/                # Reusable components
│   │   ├── ui/                    # UI components (shadcn/ui)
│   │   ├── forms/                 # Form components
│   │   │   ├── employee-form.tsx  # Employee form
│   │   │   ├── project-form.tsx   # Project form
│   │   │   └── task-form.tsx      # Task form
│   │   ├── tables/                # Table components
│   │   │   ├── employees-table.tsx
│   │   │   ├── salary-table.tsx
│   │   │   └── tasks-table.tsx
│   │   ├── kanban/                # Kanban board components
│   │   └── ...
│   ├── lib/                       # Utility functions and services
│   │   ├── prisma.ts              # Prisma client
│   │   ├── utils.ts               # Helper functions
│   │   └── ...
│   ├── hooks/                     # Custom hooks
│   └── ...
├── prisma/                        # Prisma schema and migrations
│   ├── schema.prisma              # Database schema
│   └── ...
└── ...
```

## Database Schema

### User

```prisma
model User {
  id            String      @id @default(cuid())
  name          String?
  email         String?     @unique
  emailVerified DateTime?
  password      String?
  image         String?
  accounts      Account[]
  sessions      Session[]
  employees     Employee[]
  projects      Project[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

### Employee

```prisma
model Employee {
  id          String    @id @default(cuid())
  employeeId  String    @unique
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

### Salary

```prisma
model Salary {
  id         String    @id @default(cuid())
  month      DateTime
  bonus      Float     @default(0)
  deduction  Float     @default(0)
  employee   Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Project

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

### Task

```prisma
model Task {
  id          String      @id @default(cuid())
  title       String
  description String?
  priority    Priority    @default(MEDIUM)
  status      TaskStatus  @default(BACKLOG)
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employeeId  String?
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

## Authentication Flow

1. Users register/login via NextAuth.js
2. Session management handled by NextAuth with JWT strategy
3. Route protection via middleware for authenticated routes

## Feature Implementation Strategy

### Employee Management

1. Create Prisma models for Employee and Salary
2. Implement server actions for CRUD operations
3. Create UI components for employee management
4. Implement salary table with month selection
5. Add bonus and deduction calculations

### Project & Task Management

1. Create Prisma models for Project and Task
2. Implement server actions for CRUD operations
3. Create UI components for project management
4. Implement task assignment to employees
5. Create Kanban board view for tasks by status
6. Implement backlog view for all tasks

### AI Chatbot (Bonus Feature)

1. Implement a chat interface
2. Create API route for chatbot interaction
3. Implement natural language processing for query understanding
4. Write query handlers for specific question types

## Implementation Approach

1. First phase: Set up database schema and authentication
2. Second phase: Implement employee management features
3. Third phase: Implement project and task management
4. Final phase: Implement AI chatbot (if time permits)

Each feature will follow this development flow:

1. Schema design
2. Server actions implementation
3. UI component development
4. Integration and testing
