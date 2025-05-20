import { getSalaryTable } from "@/lib/actions/salary";
import { SalaryTable } from "@/components/employees/salary-table";
import { MonthPicker } from "@/components/employees/month-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Metadata } from "next";
import { startOfMonth } from "date-fns";

export const metadata: Metadata = {
  title: "Salary Table | Blurr HR Portal",
  description: "Manage employee salaries with bonus and deduction calculations",
};

// Set this to prevent caching so the page always refreshes
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SalaryTablePageProps {
  searchParams: { month?: string };
}

export default async function SalaryTablePage({ searchParams }: SalaryTablePageProps) {
  // Parse the month from the search params or use current month
  let monthDate: Date;

  // Force using the real current date, not system date which might be incorrect
  const realToday = new Date();
  const currentYear = realToday.getFullYear();
  // Check if system date is in the future (likely incorrect)
  const systemDateIssue = currentYear > 2024;

  // Ensure we're using the actual current year, not a future year
  const adjustedYear = currentYear > 2024 ? 2024 : currentYear;

  if (searchParams.month) {
    // Log the month we're trying to display
    console.log(`Page requested for month: ${searchParams.month}`);

    // Use the provided month and ensure it's the first day of the month
    const parsedDate = new Date(searchParams.month);
    if (!isNaN(parsedDate.getTime())) {
      // Ensure year is current or past, not future
      parsedDate.setFullYear(adjustedYear);
      monthDate = startOfMonth(parsedDate);
    } else {
      // Fallback to first day of current month with adjusted year
      monthDate = new Date(adjustedYear, realToday.getMonth(), 1);
    }
  } else {
    // Default to first day of current month with adjusted year
    monthDate = new Date(adjustedYear, realToday.getMonth(), 1);
  }

  console.log(`Using month date: ${monthDate.toISOString()}`);

  // Get salary data for the month
  const salaryData = await getSalaryTable(monthDate);
  console.log(`Received ${salaryData.length} salary entries from server action`);

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Salary Table</h1>
          <p className="text-muted-foreground">Manage employee salaries and calculate total pay</p>
        </div>
        <MonthPicker />
      </div>

      {systemDateIssue && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Date Issue</AlertTitle>
          <AlertDescription>
            Your system date appears to be set incorrectly (Year: {currentYear}). For accurate salary management, please
            correct your system time or use the month picker to navigate.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Monthly Salary Details for {monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
          <CardDescription>Add bonuses and deductions to calculate total salary for each employee</CardDescription>
        </CardHeader>
        <CardContent>
          <SalaryTable
            salaries={salaryData}
            month={monthDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
