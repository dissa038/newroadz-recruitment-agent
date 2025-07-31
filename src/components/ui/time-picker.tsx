"use client";

import { useState, useRef, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  selectedTime: string | null;
  onChange: (time: string | null) => void;
  className?: string;
}

// Helper function to round time to nearest 15 minutes
const roundToNearest15Minutes = (time: string | null): string | null => {
  if (!time) return null;

  // Check if the time format is valid HH:MM
  if (!/^\d{2}:\d{2}$/.test(time)) {
    console.warn(`Invalid time format received: ${time}. Skipping rounding.`);
    return time;
  }

  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minuteStr, 10);

  // Ensure hour and minute are within valid ranges
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    console.warn(`Invalid time value received: ${time}. Skipping rounding.`);
    return time;
  }

  const totalMinutes = hour * 60 + minute;
  let roundedTotalMinutes = Math.round(totalMinutes / 15) * 15;

  // Cap at the maximum possible time slot (23:45 = 1425 minutes)
  // If rounding goes to or beyond 24:00 (1440 minutes), cap it at 23:45.
  const maxMinutesInDay = 24 * 60;
  if (roundedTotalMinutes >= maxMinutesInDay) {
    roundedTotalMinutes = 23 * 60 + 45; // Cap at 23:45
  }

  const finalHour = Math.floor(roundedTotalMinutes / 60);
  const finalMinute = roundedTotalMinutes % 60;

  // Format back to HH:MM
  const formattedHour = finalHour.toString().padStart(2, "0");
  const formattedMinute = finalMinute.toString().padStart(2, "0");

  return `${formattedHour}:${formattedMinute}`;
};

// Generate time slots once outside the component to avoid regenerating them
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Time button component that doesn't rerender on parent changes
const TimeButton = memo(function TimeButton({
  time,
  isSelected,
  onClick,
}: {
  time: string;
  isSelected: boolean;
  onClick: (time: string) => void;
}) {
  return (
    <button
      type="button"
      data-time={time}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(time);
      }}
      className={cn("px-3 py-2.5 rounded-[4px] text-sm font-medium relative", {
        "bg-primary text-primary-foreground": isSelected,
        "hover:bg-primary/10 hover:text-primary": !isSelected,
      })}
    >
      {time}
    </button>
  );
});

// Stable selector modal component
const TimeSelectorModal = memo(function TimeSelectorModal({
  onClose,
  onConfirm,
  onReset,
  initialTime,
  scrollToTimeSlot,
}: {
  onClose: (time: string | null) => void;
  onConfirm: (time: string | null) => void;
  onReset: () => void;
  initialTime: string | null;
  scrollToTimeSlot: string;
}) {
  // Local state - not connected to parent rerendering
  const [localSelectedTime, setLocalSelectedTime] = useState<string | null>(initialTime);
  const componentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Set initial scroll position on mount - scroll to specific time slot element
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Find the element for the specified time slot
      const timeElement = scrollContainerRef.current.querySelector(
        `[data-time="${scrollToTimeSlot}"]`
      );

      if (timeElement) {
        // Scroll to the element with some offset to position it nicely
        setTimeout(() => {
          if (scrollContainerRef.current && timeElement) {
            scrollContainerRef.current.scrollTop =
              (timeElement as HTMLElement).offsetTop - 80;
          }
        }, 100); // Small delay to ensure layout is complete
      }
    }
  }, [scrollToTimeSlot]);

  const handleTimeSelect = (time: string) => {
    if (localSelectedTime === time) {
      // Deselect if clicking the same time
      setLocalSelectedTime(null);
    } else {
      setLocalSelectedTime(time);
    }
  };

  const handleScroll = () => {
    // No need to track scroll position
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
        onClick={() => onClose(localSelectedTime)}
      />

      <div
        ref={componentRef}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] rounded-xl border border-input bg-background shadow-lg z-[9999]"
      >
        <div className="p-4 border-b">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocalSelectedTime(null);
                onReset();
              }}
              className="w-full px-3 py-2 rounded-[4px] text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              ✕ Reset
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm(localSelectedTime);
              }}
              className="w-full px-3 py-2 rounded-[4px] text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ✓ Bevestig
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="p-4 max-h-[80dvh] overflow-y-auto overscroll-contain"
          onScroll={handleScroll}
          style={{
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {TIME_SLOTS.map((time) => {
              const isSelected = time === localSelectedTime;

              return (
                <TimeButton
                  key={time}
                  time={time}
                  isSelected={isSelected}
                  onClick={handleTimeSelect}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
});

// Add this function to find a visible time slot
const findInitialScrollTimeSlot = (selectedTime: string | null): string => {
  if (!selectedTime) return "09:00"; // Default to 9:00 AM if no time selected

  // Parse the hour from the selected time
  const hour = parseInt(selectedTime.split(":")[0], 10);

  // Round down to the nearest full hour or provide sensible default
  const scrollToHour = Math.max(0, hour - 1); // Go one hour earlier to show context
  return `${String(scrollToHour).padStart(2, "0")}:00`;
};

export default function TimePicker({
  selectedTime,
  onChange,
  className,
}: TimePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scrollTimeSlot, setScrollTimeSlot] = useState<string>(
    findInitialScrollTimeSlot(selectedTime)
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to round initial values
  useEffect(() => {
    const initialTime = selectedTime;
    const roundedTime = roundToNearest15Minutes(initialTime);

    const timeChanged = roundedTime !== initialTime;

    if (timeChanged) {
      onChange(roundedTime);
    }
  }, [selectedTime, onChange]);

  // Effect to update scroll time slot when selected time changes
  useEffect(() => {
    setScrollTimeSlot(findInitialScrollTimeSlot(selectedTime));
  }, [selectedTime]);

  const formatTime = (time: string | null) => {
    if (!time) return "Selecteer tijd";
    return time;
  };

  const handleOpenSelector = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.overflow = "hidden";
    setIsOpen(true);
  };

  const handleCloseSelector = (newTime: string | null) => {
    document.body.style.overflow = "";
    onChange(newTime);
    setIsOpen(false);
  };

  const handleConfirmSelector = (newTime: string | null) => {
    document.body.style.overflow = "";
    onChange(newTime);
    setIsOpen(false);
  };

  const handleResetSelector = () => {
    // Only reset the internal state, not the parent state yet
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpenSelector}
        className={cn(
          "flex h-10 w-full border-0 border-b border-input bg-background px-3 py-2 text-sm",
          "focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "text-left rounded-none",
          className
        )}
      >
        <span className={selectedTime ? "" : "text-muted-foreground/50"}>
          {formatTime(selectedTime)}
        </span>
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <TimeSelectorModal
            onClose={handleCloseSelector}
            onConfirm={handleConfirmSelector}
            onReset={handleResetSelector}
            initialTime={selectedTime}
            scrollToTimeSlot={scrollTimeSlot}
          />,
          document.body
        )}
    </div>
  );
}

export { TimePicker };