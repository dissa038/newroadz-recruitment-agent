import { useState, useEffect } from 'react';

/**
 * Custom hook that syncs state with localStorage 
 * Automatically saves to localStorage when value changes
 * Restores from localStorage on component mount
 */
export function useLocalStorageState(key: string, defaultValue: string) {
  const [value, setValue] = useState<string>(defaultValue);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        setValue(saved);
      }
    } catch (error) {
      console.warn(`Failed to load from localStorage key "${key}":`, error);
    }
  }, [key]);

  // Save to localStorage when value changes
  const setValueAndSave = (newValue: string) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, newValue);
    } catch (error) {
      console.warn(`Failed to save to localStorage key "${key}":`, error);
      // Still update state even if localStorage fails
      setValue(newValue);
    }
  };

  return [value, setValueAndSave] as const;
}
