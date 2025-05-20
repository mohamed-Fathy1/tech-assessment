"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function MonthPicker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper function to ensure correct date (no future dates)
  const getAdjustedDate = (inputDate: Date): Date => {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Ensure year is not in the future
    const adjustedYear = Math.min(inputDate.getFullYear(), currentYear);

    // Create a new date with the adjusted year and same month
    return new Date(adjustedYear, inputDate.getMonth(), 1);
  };

  const [date, setDate] = useState<Date>(() => {
    // If month parameter exists in URL, use it; otherwise use current month
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const parsedDate = new Date(monthParam);
      if (!isNaN(parsedDate.getTime())) {
        // Ensure we're using the first day of the month and not a future date
        return getAdjustedDate(parsedDate);
      }
    }
    // Default to first day of current month
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [open, setOpen] = useState(false);

  // When date changes, update URL and force a hard refresh to fetch new data
  const updateMonth = (newDate: Date) => {
    const formattedDate = newDate.toISOString().split("T")[0];
    // Use window.location instead of router to force a full refresh
    window.location.href = `${pathname}?month=${formattedDate}`;
  };

  // Navigate to previous month
  const prevMonth = () => {
    const newDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    setDate(newDate); // Update local state
    updateMonth(newDate); // Force refresh with new month
  };

  // Navigate to next month
  const nextMonth = () => {
    // Don't navigate past current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const newYear = date.getFullYear();
    const newMonth = date.getMonth() + 1;

    // Only allow next month if it's not in the future
    if (newYear < currentYear || (newYear === currentYear && newMonth <= currentMonth)) {
      const newDate = new Date(newYear, newMonth, 1);
      setDate(newDate); // Update local state
      updateMonth(newDate); // Force refresh with new month
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={prevMonth}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous month</span>
      </Button>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[240px] justify-start text-left font-normal")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "MMMM yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              if (date) {
                // Always set to the first day of the selected month and not in future
                const newDate = getAdjustedDate(date);
                setDate(newDate);
                setOpen(false);
                updateMonth(newDate); // Force refresh with new month
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        onClick={nextMonth}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next month</span>
      </Button>
    </div>
  );
}
