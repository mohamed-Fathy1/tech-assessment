"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  joiningDate: Date;
  basicSalary: number;
}

interface EmployeeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  mode: "create" | "edit";
}

export function EmployeeFormDialog({ isOpen, onClose, employee, mode }: EmployeeFormDialogProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [dbError, setDbError] = useState(false);

  const handleSuccess = () => {
    setDbError(false);
    onClose();
    toast.success(mode === "create" ? "Employee created successfully" : "Employee updated successfully");

    // Force a full page reload instead of just router.refresh()
    window.location.reload();
  };

  const handleError = async (error: Error | unknown) => {
    console.error("Form submission error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for foreign key constraint violations
    if (errorMessage.includes("Foreign key constraint") || errorMessage.includes("no valid user")) {
      setDbError(true);
      setIsVerifying(true);
      toast.loading("Attempting to fix database relationships...");

      try {
        const repairResult = await fetch("/api/debug/verify-db", {
          method: "POST",
        });

        if (repairResult.ok) {
          toast.success("Auto-repair attempted. Please try again or visit the seed page.");
        } else {
          toast.error("Could not auto-repair database.");
        }
      } catch (repairError) {
        console.error("Failed to repair database:", repairError);
        toast.error("Failed to repair database. Please visit the seed page.");
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDbError(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Employee" : "Edit Employee"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new employee record" : "Update employee information"}
          </DialogDescription>
        </DialogHeader>

        {dbError ? (
          <Alert
            variant="destructive"
            className="my-4"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                There was an error connecting your employee to a valid user account. This is likely due to database
                issues.
              </p>
              <Button asChild>
                <Link href="/seed">Go to Seed Page to Fix</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="py-4">
            <EmployeeForm
              employee={employee}
              onSuccess={handleSuccess}
              onError={handleError}
              formMode={mode}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
