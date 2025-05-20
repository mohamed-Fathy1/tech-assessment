"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Form schema without employeeId as it's now auto-generated
const employeeFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  joiningDate: z.date({
    required_error: "Joining date is required",
  }),
  basicSalary: z.coerce.number().positive("Salary must be positive").min(1, "Salary must be at least 1"),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: {
    id: string;
    employeeId: string;
    name: string;
    joiningDate: Date;
    basicSalary: number;
  };
  onSuccess?: () => void;
  onError?: (error: Error | unknown) => void;
  formMode?: "create" | "edit";
}

export function EmployeeForm({ employee, onSuccess, onError, formMode = "create" }: EmployeeFormProps) {
  const [isPending, setIsPending] = useState(false);

  // Default values for the form
  const defaultValues: Partial<EmployeeFormValues> = {
    id: employee?.id || "",
    name: employee?.name || "",
    joiningDate: employee?.joiningDate ? new Date(employee.joiningDate) : undefined,
    basicSalary: employee?.basicSalary || undefined,
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  });

  async function onSubmit(data: EmployeeFormValues) {
    setIsPending(true);
    console.log("Form data being submitted:", data);

    try {
      // Submit the form
      const isEdit = formMode === "edit" || !!employee?.id;
      console.log(`Using ${isEdit ? "update API" : "create API"}`);

      let response;

      if (isEdit && data.id) {
        // Use direct API for updates
        response = await fetch(`/api/employees/${data.id}/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            joiningDate: data.joiningDate.toISOString(),
            basicSalary: data.basicSalary,
          }),
        });
      } else {
        // Use direct API for creating
        response = await fetch("/api/employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            joiningDate: data.joiningDate.toISOString(),
            basicSalary: data.basicSalary,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEdit ? "update" : "create"} employee`);
      }

      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        toast.success(formMode === "create" ? "Employee created successfully" : "Employee updated successfully");

        // Force a full page refresh
        window.location.href = "/dashboard/employees";
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      if (onError) {
        onError(error);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Hidden ID field for updates */}
        {employee?.id && (
          <input
            type="hidden"
            name="id"
            value={employee.id}
          />
        )}

        {/* Display Employee ID as read-only if editing */}
        {employee?.employeeId && (
          <div className="space-y-2">
            <FormLabel>Employee ID</FormLabel>
            <Input
              value={employee.employeeId}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Employee IDs are automatically generated and cannot be changed
            </p>
          </div>
        )}

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Joining Date */}
        <FormField
          control={form.control}
          name="joiningDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Joining Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basic Salary */}
        <FormField
          control={form.control}
          name="basicSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Basic Salary</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5000"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Saving..." : formMode === "edit" ? "Update Employee" : "Create Employee"}
        </Button>
      </form>
    </Form>
  );
}
