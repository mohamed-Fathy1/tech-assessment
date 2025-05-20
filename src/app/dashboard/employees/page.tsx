import { getEmployees, getEmployeesForced } from "@/lib/actions/employee";
import { EmployeeTable } from "@/components/employees/employee-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employees | Blurr HR Portal",
  description: "Manage your organization's employees",
};

// Force dynamic rendering to disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeesPage() {
  // Try the normal method first
  let employees = await getEmployees();

  // If no employees found, try the forced method as a fallback
  if (!employees || employees.length === 0) {
    employees = await getEmployeesForced();
  }

  return (
    <div className="container space-y-6">
      <EmployeeTable employees={employees || []} />
    </div>
  );
}
