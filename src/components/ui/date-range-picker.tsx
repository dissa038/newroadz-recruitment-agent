"use client";

import { useState, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DAYS = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export default function DateRangePicker({
  dateRange,
  onChange,
  className,
}: DateRangePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    dateRange.startDate ? new Date(dateRange.startDate) : new Date()
  );
  const [isOpen, setIsOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<DateRange>({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync local state with props
  useEffect(() => {
    setLocalDateRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Vorige maand dagen
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonthDays = getDaysInMonth(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
      );
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          prevMonthDays - i
        ),
      });
    }

    // Huidige maand dagen
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
      });
    }

    // Volgende maand dagen
    const remainingDays = 42 - days.length; // 6 rijen van 7 dagen
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          i
        ),
      });
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDateInRange = (date: Date) => {
    if (!localDateRange.startDate || !localDateRange.endDate) return false;

    const startDate = new Date(localDateRange.startDate);
    const endDate = new Date(localDateRange.endDate);
    return date >= startDate && date <= endDate;
  };

  const isStartDate = (date: Date) => {
    if (!localDateRange.startDate) return false;
    return (
      date.toDateString() === new Date(localDateRange.startDate).toDateString()
    );
  };

  const isEndDate = (date: Date) => {
    if (!localDateRange.endDate) return false;
    return (
      date.toDateString() === new Date(localDateRange.endDate).toDateString()
    );
  };

  const isPastDate = () => {
    return false;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.startDate) return "Kies datums";
    if (!range.endDate) return `Vanaf ${formatDate(new Date(range.startDate))}`;
    return `${formatDate(new Date(range.startDate))} - ${formatDate(
      new Date(range.endDate)
    )}`;
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = formatDateString(date);

    if (
      !localDateRange.startDate ||
      (localDateRange.startDate && localDateRange.endDate)
    ) {
      // If no start date or both dates are set, set new start date and clear end date
      setLocalDateRange({
        startDate: formattedDate,
        endDate: null,
      });
    } else {
      // If only start date is set, set end date based on comparison
      const startDate = new Date(localDateRange.startDate);

      if (date < startDate) {
        // If selected date is before start date, swap them
        setLocalDateRange({
          startDate: formattedDate,
          endDate: localDateRange.startDate,
        });
      } else {
        // Otherwise set as end date
        setLocalDateRange({
          startDate: localDateRange.startDate,
          endDate: formattedDate,
        });
      }
    }
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + direction,
      1
    );
    setCurrentDate(newDate);
  };

  const canNavigatePrevious = () => {
    return true;
  };

  const handleConfirm = () => {
    onChange(localDateRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalDateRange({ startDate: null, endDate: null });
  };

  // Calendar modal component
  const CalendarModal = () => {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
          onClick={() => setIsOpen(false)}
        />

        {/* Centered Calendar */}
        <div
          ref={calendarRef}
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[90vw] max-w-[500px] p-5 md:p-7",
            "rounded-xl border border-input bg-background shadow-lg",
            "z-[9999]" // Extremely high z-index
          )}
        >
          {/* Header with month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              disabled={!canNavigatePrevious()}
              className={`w-8 h-8 flex items-center justify-center rounded-[4px] transition-colors
                ${
                  canNavigatePrevious()
                    ? "hover:bg-muted"
                    : "opacity-50 cursor-not-allowed"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h3 className="font-medium text-base md:text-lg text-foreground">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Weekdagen header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Kalender dagen */}
          <div className="grid grid-cols-7 gap-1 md:gap-1.5">
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                type="button"
                disabled={isPastDate()}
                onClick={() => handleDateSelect(day.date)}
                className={`
                  aspect-square flex items-center justify-center rounded-[4px] text-sm
                  transition-all duration-200 relative
                  ${!day.isCurrentMonth ? "text-muted-foreground/50" : ""}
                  ${
                    isPastDate()
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary hover:text-primary-foreground"
                  }
                  ${
                    isStartDate(day.date) || isEndDate(day.date)
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                  ${
                    isDateInRange(day.date) &&
                    !isStartDate(day.date) &&
                    !isEndDate(day.date)
                      ? "bg-primary/10 text-primary"
                      : ""
                  }
                  ${
                    isToday(day.date) &&
                    !isStartDate(day.date) &&
                    !isEndDate(day.date) &&
                    !isDateInRange(day.date)
                      ? "ring-[1px] ring-primary"
                      : ""
                  }
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            <button
              type="button"
              onClick={handleReset}
              className="w-full px-3 py-2 rounded-[4px] text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              ✕ Reset
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full px-3 py-2 rounded-[4px] text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ✓ Bevestig
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full border-0 border-b border-input bg-background px-3 py-2",
          "text-sm transition-colors file:border-0 file:bg-transparent",
          "file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50 items-center rounded-none",
          className
        )}
      >
        <span
          className={cn(
            "flex-grow text-left",
            !dateRange.startDate && "text-muted-foreground/50"
          )}
        >
          {mounted ? formatDateRange(dateRange) : "Kies datums"}
        </span>
      </button>

      {isOpen && mounted && createPortal(<CalendarModal />, document.body)}
    </div>
  );
}

export { DateRangePicker };
