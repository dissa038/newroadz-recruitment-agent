"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Voorkom hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Voeg toetsenbordsneltoets toe (Alt+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "t" && e.altKey) {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resolvedTheme, setTheme]);

  // Bepaal of het thema donker is (zowel expliciet dark als system-dark)
  const isDark = resolvedTheme === "dark";

  // Voorkom rendering van theme-specifieke elementen voor hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "flex w-16 h-8 rounded-full cursor-pointer",
          "bg-background border border-border",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 rounded-full cursor-pointer relative p-[3px]",
        "bg-background border border-border",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="button"
      tabIndex={0}
    >
      <div className="relative w-full h-full">
        <motion.div
          className="absolute flex items-center justify-center w-[26px] h-[26px] rounded-full top-[-1px]"
          initial={false}
          animate={{
            left: isDark ? "0" : "auto",
            right: isDark ? "auto" : "0",
            backgroundColor: isDark ? "hsl(var(--accent))" : "hsl(var(--accent))",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-white" strokeWidth={1.5} />
          )}
        </motion.div>
        <motion.div
          className="absolute flex items-center justify-center w-[26px] h-[26px] rounded-full opacity-50 top-[-1px]"
          initial={false}
          animate={{
            left: isDark ? "auto" : "0",
            right: isDark ? "0" : "auto",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          )}
        </motion.div>
      </div>
    </div>
  );
}