"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import Link from "next/link";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  userId: string;
  joiningDate: string;
}

export default function ResetPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/debug/employees-data");
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setStatus(`Found ${data.employeeCount} employees`);
      } else {
        setStatus("Error fetching employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setStatus("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const refreshData = async () => {
    try {
      await fetch("/api/debug/verify-db", { method: "POST" });
      await fetch("/api/seed", { method: "POST" });
      await fetchEmployees();
      setStatus("Data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      setStatus("Error refreshing data");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Status</h1>

      <div className="mb-8">
        <Button
          onClick={refreshData}
          className="mb-4"
        >
          Refresh Data
        </Button>

        <p className="text-sm text-gray-600 mb-4">{status}</p>

        <div className="space-y-2">
          <Link
            href="/dashboard/employees"
            className="text-blue-600 hover:underline block"
          >
            Back to Employees Page
          </Link>
          <Link
            href="/seed"
            className="text-blue-600 hover:underline block"
          >
            Go to Seed Page
          </Link>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length > 0 ? (
              employees.map((emp: any) => (
                <tr key={emp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.employeeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(emp.joiningDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {loading ? "Loading..." : "No employees found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
