# Employee Management Implementation

## Overview

This document outlines the implementation plan for the employee management feature of the Blurr HR Portal, which includes:

1. CRUD operations for employee records
2. Monthly salary table generation with bonus and deductions
3. Total salary calculation

## Technical Implementation

### 1. Update Prisma Schema

First, we need to update the Prisma schema to include Employee and Salary models as described in the database schema design document.

### 2. Server Actions Implementation

We will create the following server actions for employee management:

#### `createEmployee.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const employeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  joiningDate: z.date(),
  basicSalary: z.number().positive("Salary must be positive"),
});

export async function createEmployee(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = employeeSchema.safeParse({
    employeeId: formData.get("employeeId"),
    name: formData.get("name"),
    joiningDate: new Date(formData.get("joiningDate") as string),
    basicSalary: parseFloat(formData.get("basicSalary") as string),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  try {
    await prisma.employee.create({
      data: {
        ...validatedFields.data,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    if (error.code === "P2002") {
      return { error: { employeeId: ["Employee ID already exists"] } };
    }
    return { error: { _form: ["Failed to create employee"] } };
  }
}
```

#### `updateEmployee.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const employeeSchema = z.object({
  id: z.string(),
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  joiningDate: z.date(),
  basicSalary: z.number().positive("Salary must be positive"),
});

export async function updateEmployee(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = employeeSchema.safeParse({
    id: formData.get("id"),
    employeeId: formData.get("employeeId"),
    name: formData.get("name"),
    joiningDate: new Date(formData.get("joiningDate") as string),
    basicSalary: parseFloat(formData.get("basicSalary") as string),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { id, ...data } = validatedFields.data;

  try {
    // Verify that the employee belongs to the current user
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee || employee.userId !== session.user.id) {
      return { error: { _form: ["Unauthorized"] } };
    }

    await prisma.employee.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    if (error.code === "P2002") {
      return { error: { employeeId: ["Employee ID already exists"] } };
    }
    return { error: { _form: ["Failed to update employee"] } };
  }
}
```

#### `deleteEmployee.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteEmployee(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify that the employee belongs to the current user
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee || employee.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await prisma.employee.delete({
      where: { id },
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete employee" };
  }
}
```

#### `getEmployees.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getEmployees() {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  return prisma.employee.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
```

#### `getSalaryTable.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { format } from "date-fns";

export async function getSalaryTable(month: Date) {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  // Get all employees
  const employees = await prisma.employee.findMany({
    where: {
      userId: session.user.id,
    },
  });

  // Get salary records for the specified month
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const salaries = await prisma.salary.findMany({
    where: {
      employee: {
        userId: session.user.id,
      },
      month: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // Create the salary table by combining employee data with salary data
  return employees.map((employee) => {
    const salary = salaries.find((s) => s.employeeId === employee.id);

    return {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      basicSalary: employee.basicSalary,
      bonus: salary?.bonus || 0,
      deduction: salary?.deduction || 0,
      total: employee.basicSalary + (salary?.bonus || 0) - (salary?.deduction || 0),
      salaryId: salary?.id,
    };
  });
}
```

#### `updateSalary.ts`

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const salarySchema = z.object({
  employeeId: z.string(),
  month: z.date(),
  bonus: z.number().min(0),
  deduction: z.number().min(0),
});

export async function updateSalary(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validatedFields = salarySchema.safeParse({
    employeeId: formData.get("employeeId"),
    month: new Date(formData.get("month") as string),
    bonus: parseFloat((formData.get("bonus") as string) || "0"),
    deduction: parseFloat((formData.get("deduction") as string) || "0"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  try {
    // Verify that the employee belongs to the current user
    const employee = await prisma.employee.findUnique({
      where: { id: validatedFields.data.employeeId },
      select: { userId: true },
    });

    if (!employee || employee.userId !== session.user.id) {
      return { error: { _form: ["Unauthorized"] } };
    }

    const { employeeId, month, ...data } = validatedFields.data;
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    // Check if a salary record exists for this month and employee
    const existingSalary = await prisma.salary.findFirst({
      where: {
        employeeId,
        month: {
          gte: new Date(month.getFullYear(), month.getMonth(), 1),
          lt: new Date(month.getFullYear(), month.getMonth() + 1, 1),
        },
      },
    });

    if (existingSalary) {
      // Update existing record
      await prisma.salary.update({
        where: { id: existingSalary.id },
        data,
      });
    } else {
      // Create new record
      await prisma.salary.create({
        data: {
          ...data,
          employeeId,
          month: startOfMonth,
        },
      });
    }

    revalidatePath("/dashboard/employees/salary-table");
    return { success: true };
  } catch (error) {
    return { error: { _form: ["Failed to update salary"] } };
  }
}
```

### 3. UI Components

#### `EmployeeForm.tsx`

A form component for creating and updating employees.

#### `EmployeeTable.tsx`

A component for displaying a table of employees with edit and delete options.

#### `SalaryTable.tsx`

A component for displaying and editing the salary table for a selected month.

#### `MonthPicker.tsx`

A component for selecting the month to display in the salary table.

### 4. Pages

#### `app/dashboard/employees/page.tsx`

The main employees page displaying the list of employees.

#### `app/dashboard/employees/new/page.tsx`

Page for adding a new employee.

#### `app/dashboard/employees/[id]/edit/page.tsx`

Page for editing an existing employee.

#### `app/dashboard/employees/salary-table/page.tsx`

Page for displaying and managing the salary table.

### 5. Integration Tests

- Test CRUD operations for employee management
- Test salary calculations
- Test authorization (users should only access their own employees)

## Implementation Steps

1. Update the Prisma schema
2. Generate Prisma client
3. Implement server actions
4. Create UI components
5. Create pages
6. Test functionality
7. Add error handling and validation
8. Optimize performance
