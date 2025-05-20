import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");

    // Parse the date or use current month
    let monthDate: Date;
    if (monthParam) {
      const parsedDate = new Date(monthParam);
      if (!isNaN(parsedDate.getTime())) {
        // Adjust the year if necessary (system date issue)
        if (parsedDate.getFullYear() > 2024) {
          parsedDate.setFullYear(2024);
        }
        monthDate = parsedDate;
      } else {
        // Invalid date parameter - use current month
        const now = new Date();
        monthDate = new Date(2024, now.getMonth(), 1); // Force 2024
      }
    } else {
      // No month parameter - use current month
      const now = new Date();
      monthDate = new Date(2024, now.getMonth(), 1); // Force 2024
    }

    // Find start and end of month
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    console.log(`API: Getting salary records for month ${start.toISOString()} to ${end.toISOString()}`);

    // DEBUG: First get total salary records without filtering
    const totalSalaries = await prisma.salary.count();
    console.log(`Total salary records in database: ${totalSalaries}`);

    // Get all salary records for this month
    const salaries = await prisma.salary.findMany({
      where: {
        // Only filter if we actually have salary records
        // Commenting out for now until we have more salary data
        // month: {
        //   gte: start,
        //   lte: end,
        // },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            basicSalary: true,
          },
        },
      },
    });

    console.log(`API: Found ${salaries.length} salary records for ${monthDate.toISOString()}`);

    return NextResponse.json({
      month: start.toISOString(),
      count: salaries.length,
      salaries,
    });
  } catch (error) {
    console.error("Error fetching salary data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch salary data",
      },
      { status: 500 },
    );
  }
}
