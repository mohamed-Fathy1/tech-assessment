"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EmployeeFormDialog } from "./employee-form-dialog";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  joiningDate: Date;
  basicSalary: number;
}

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);

    try {
      // Use direct API endpoint instead of server action
      const response = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete employee");
      }

      toast.success("Employee deleted successfully");

      // Force a hard refresh of the page
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete employee");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle edit click
  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Employees</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No employees found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{format(new Date(employee.joiningDate), "PPP")}</TableCell>
                  <TableCell>{formatCurrency(employee.basicSalary)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(employee)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEmployeeToDelete(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={() => setEmployeeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the employee <span className="font-semibold">{employeeToDelete?.name}</span>{" "}
              and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Employee Modal */}
      <EmployeeFormDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="create"
      />

      {/* Edit Employee Modal */}
      {selectedEmployee && (
        <EmployeeFormDialog
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          mode="edit"
        />
      )}
    </div>
  );
}
