"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSalary } from "@/lib/actions/salary";

interface SalaryTableEntry {
  id: string;
  employeeId: string;
  name: string;
  basicSalary: number;
  bonus: number;
  deduction: number;
  total: number;
  salaryId?: string;
}

interface SalaryTableProps {
  salaries: SalaryTableEntry[];
  month: Date;
}

export function SalaryTable({ salaries, month }: SalaryTableProps) {
  const router = useRouter();

  // Track edited rows by employee ID
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});

  // Track bonus and deduction values - use the salary data from props
  const [bonusValues, setBonusValues] = useState<Record<string, number>>(() => {
    const initialValues: Record<string, number> = {};
    salaries.forEach((salary) => {
      initialValues[salary.id] = salary.bonus || 0;
    });
    return initialValues;
  });

  const [deductionValues, setDeductionValues] = useState<Record<string, number>>(() => {
    const initialValues: Record<string, number> = {};
    salaries.forEach((salary) => {
      initialValues[salary.id] = salary.deduction || 0;
    });
    return initialValues;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Enable editing for a row
  const startEditing = (employeeId: string) => {
    setEditingRows({ ...editingRows, [employeeId]: true });
  };

  // Update bonus value
  const updateBonus = (employeeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBonusValues({ ...bonusValues, [employeeId]: numValue });
  };

  // Update deduction value
  const updateDeduction = (employeeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setDeductionValues({ ...deductionValues, [employeeId]: numValue });
  };

  // Calculate total salary
  const calculateTotal = (basicSalary: number, employeeId: string) => {
    const bonus = bonusValues[employeeId] || 0;
    const deduction = deductionValues[employeeId] || 0;
    return basicSalary + bonus - deduction;
  };

  // Save changes for a row
  const saveChanges = async (employee: SalaryTableEntry) => {
    try {
      const formData = new FormData();
      formData.append("employeeId", employee.id);
      formData.append("month", month.toISOString());
      formData.append("bonus", bonusValues[employee.id].toString());
      formData.append("deduction", deductionValues[employee.id].toString());

      const result = await updateSalary(formData);

      if (result.error) {
        if ("_form" in result.error) {
          toast.error(result.error._form[0]);
        } else {
          toast.error("Failed to update salary");
        }
        return;
      }

      toast.success("Salary updated successfully");
      setEditingRows({ ...editingRows, [employee.id]: false });
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  // Cancel editing for a row
  const cancelEditing = (employee: SalaryTableEntry) => {
    // Reset values to original
    setBonusValues({ ...bonusValues, [employee.id]: employee.bonus || 0 });
    setDeductionValues({ ...deductionValues, [employee.id]: employee.deduction || 0 });
    setEditingRows({ ...editingRows, [employee.id]: false });
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Bonus</TableHead>
            <TableHead>Deduction</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salaries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No employees found. Add employees to generate salary records.
              </TableCell>
            </TableRow>
          ) : (
            salaries.map((salary) => (
              <TableRow key={salary.id}>
                <TableCell>{salary.employeeId}</TableCell>
                <TableCell>{salary.name}</TableCell>
                <TableCell>{formatCurrency(salary.basicSalary)}</TableCell>
                <TableCell>
                  {editingRows[salary.id] ? (
                    <Input
                      type="number"
                      min="0"
                      value={bonusValues[salary.id] || 0}
                      onChange={(e) => updateBonus(salary.id, e.target.value)}
                      className="w-24"
                    />
                  ) : (
                    formatCurrency(bonusValues[salary.id] || 0)
                  )}
                </TableCell>
                <TableCell>
                  {editingRows[salary.id] ? (
                    <Input
                      type="number"
                      min="0"
                      value={deductionValues[salary.id] || 0}
                      onChange={(e) => updateDeduction(salary.id, e.target.value)}
                      className="w-24"
                    />
                  ) : (
                    formatCurrency(deductionValues[salary.id] || 0)
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(calculateTotal(salary.basicSalary, salary.id))}
                </TableCell>
                <TableCell className="text-right">
                  {editingRows[salary.id] ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelEditing(salary)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveChanges(salary)}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(salary.id)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
