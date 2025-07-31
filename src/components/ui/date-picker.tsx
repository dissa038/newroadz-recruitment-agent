"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

interface DatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  className?: string;
}

export default function DatePicker({
  selectedDate,
  onChange,
  className,
}: DatePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(
    selectedDate
  );
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update temp selected date when selectedDate prop changes
  useEffect(() => {
    setTempSelectedDate(selectedDate);
  }, [selectedDate]);

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

  const isSelected = (date: Date) => {
    return (
      tempSelectedDate &&
      date.toDateString() === new Date(tempSelectedDate).toDateString()
    );
  };

  const isPastDate = (date: Date) => {
    // Verwijder deze functie of maak hem altijd false
    return false;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date) => {
    // Only update the temporary selection
    setTempSelectedDate(formatDateString(date));
  };

  const confirmSelection = () => {
    // Apply the temporary selection to the actual onChange
    // Now we pass the tempSelectedDate even if it's null
    onChange(tempSelectedDate || "");
    setIsOpen(false);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + direction,
      1
    );
    // Verwijder de controle op verleden maanden
    setCurrentDate(newDate);
  };

  const canNavigatePrevious = () => {
    // Altijd true retourneren om navigatie naar het verleden toe te staan
    return true;
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setTempSelectedDate(formatDateString(today));
  };

  const resetDate = () => {
    setTempSelectedDate(null);
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
          {/* Header met maand navigatie */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              disabled={!canNavigatePrevious()}
              className={`w-8 h-8 flex items-center justify-center rounded-[4px] transition-colors
                ${canNavigatePrevious()
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
                disabled={isPastDate(day.date)}
                onClick={() => handleDateSelect(day.date)}
                className={`
                  aspect-square flex items-center justify-center rounded-[4px] text-sm
                  transition-all duration-200 relative
                  ${!day.isCurrentMonth ? "text-muted-foreground/50" : ""}
                  ${isPastDate(day.date)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary hover:text-primary-foreground"
                  }
                  ${isSelected(day.date)
                    ? "bg-primary text-primary-foreground"
                    : ""
                  }
                  ${isToday(day.date) && !isSelected(day.date)
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
            <div className="grid grid-cols-2 gap-2 col-span-2">
              <button
                type="button"
                onClick={resetDate}
                className="w-full px-3 py-2 rounded-[4px] text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="w-full px-3 py-2 rounded-[4px] text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20"
              >
                Vandaag
              </button>
            </div>
            <button
              type="button"
              onClick={confirmSelection}
              className="w-full px-3 py-2 rounded-[4px] text-sm font-medium col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ✓ Bevestigen
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
            !selectedDate && "text-muted-foreground/50"
          )}
        >
          {mounted && selectedDate
            ? formatDate(new Date(selectedDate))
            : "Kies een datum"}
        </span>
      </button>

      {isOpen && mounted && createPortal(<CalendarModal />, document.body)}
    </div>
  );
}

export { DatePicker };
