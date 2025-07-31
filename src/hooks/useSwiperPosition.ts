"use client";

import { useEffect, useState, useCallback } from 'react';
import { Swiper as SwiperType } from 'swiper';

interface SwiperPositionConfig {
  /** Unique identifier for this swiper instance */
  id: string;
  /** Auto-restore position on mount (default: true) */
  autoRestore?: boolean;
  /** Auto-save position on slide change (default: true) */
  autoSave?: boolean;
  /** Debug mode - logs position changes (default: false) */
  debug?: boolean;
  /** Maximum age in days before cleanup (default: 30) */
  maxAge?: number;
}

interface SwiperPositionReturn {
  /** Current active slide index */
  activeIndex: number;
  /** Set active index manually */
  setActiveIndex: (index: number) => void;
  /** Handler for Swiper onSlideChange event */
  handleSlideChange: (swiper: SwiperType) => void;
  /** Handler for Swiper onSwiper event */
  initializeSwiper: (swiper: SwiperType) => void;
  /** Manually save current position */
  savePosition: () => void;
  /** Manually restore saved position */
  restorePosition: () => void;
  /** Clear saved position */
  clearPosition: () => void;
}

// Storage key prefix
const STORAGE_PREFIX = 'swiper-position-';

// Utility functions for localStorage management
const getSavedPosition = (id: string): { index: number; timestamp: number } | null => {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error(`Error loading swiper position for ${id}:`, error);
  }
  return null;
};

const savePosition = (id: string, index: number, debug = false): void => {
  try {
    const data = {
      index,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(data));
    if (debug) {
      console.log(`Swiper position saved for ${id}:`, data);
    }
  } catch (error) {
    console.error(`Error saving swiper position for ${id}:`, error);
  }
};

const clearPosition = (id: string, debug = false): void => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    if (debug) {
      console.log(`Swiper position cleared for ${id}`);
    }
  } catch (error) {
    console.error(`Error clearing swiper position for ${id}:`, error);
  }
};

// Cleanup old positions
const cleanupOldPositions = (maxAge: number): void => {
  try {
    const cutoffTime = Date.now() - (maxAge * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && data.timestamp < cutoffTime) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid data, mark for removal
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old swiper positions`);
    }
  } catch (error) {
    console.error('Error cleaning up old swiper positions:', error);
  }
};

/**
 * Hook for managing Swiper position persistence with localStorage
 * 
 * @param config - Configuration object or string ID
 * @returns Object with position state and handlers
 * 
 * @example
 * ```tsx
 * const { activeIndex, handleSlideChange, initializeSwiper } = useSwiperPosition('features-mobile');
 * 
 * <Swiper
 *   onSwiper={initializeSwiper}
 *   onSlideChange={handleSlideChange}
 *   // ... other props
 * >
 * ```
 */
export const useSwiperPosition = (
  config: string | SwiperPositionConfig
): SwiperPositionReturn => {
  // Normalize config
  const normalizedConfig: SwiperPositionConfig = typeof config === 'string' 
    ? { id: config }
    : config;

  const {
    id,
    autoRestore = true,
    autoSave = true,
    debug = false,
    maxAge = 30,
  } = normalizedConfig;

  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize and restore position
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cleanup old positions on first load
    cleanupOldPositions(maxAge);

    if (autoRestore) {
      const saved = getSavedPosition(id);
      if (saved) {
        setActiveIndex(saved.index);
        if (debug) {
          console.log(`Swiper position restored for ${id}:`, saved);
        }
      }
    }

    setIsInitialized(true);
  }, [id, autoRestore, debug, maxAge]);

  // Restore position when swiper is ready
  useEffect(() => {
    if (swiperInstance && isInitialized && activeIndex > 0) {
      // Use setTimeout to ensure swiper is fully initialized
      setTimeout(() => {
        swiperInstance.slideTo(activeIndex, 0, false);
        if (debug) {
          console.log(`Swiper slid to restored position ${activeIndex} for ${id}`);
        }
      }, 100);
    }
  }, [swiperInstance, activeIndex, isInitialized, debug, id]);

  // Handle slide change
  const handleSlideChange = useCallback((swiper: SwiperType) => {
    const newIndex = swiper.activeIndex;
    setActiveIndex(newIndex);
    
    if (autoSave) {
      savePosition(id, newIndex, debug);
    }
  }, [id, autoSave, debug]);

  // Initialize swiper
  const initializeSwiper = useCallback((swiper: SwiperType) => {
    setSwiperInstance(swiper);
    if (debug) {
      console.log(`Swiper initialized for ${id}`);
    }
  }, [id, debug]);

  // Manual save function
  const savePositionManually = useCallback(() => {
    savePosition(id, activeIndex, debug);
  }, [id, activeIndex, debug]);

  // Manual restore function
  const restorePositionManually = useCallback(() => {
    const saved = getSavedPosition(id);
    if (saved) {
      setActiveIndex(saved.index);
      if (swiperInstance) {
        swiperInstance.slideTo(saved.index, 0, false);
      }
      if (debug) {
        console.log(`Swiper position manually restored for ${id}:`, saved);
      }
    }
  }, [id, swiperInstance, debug]);

  // Clear position function
  const clearPositionManually = useCallback(() => {
    clearPosition(id, debug);
    setActiveIndex(0);
    if (swiperInstance) {
      swiperInstance.slideTo(0, 0, false);
    }
  }, [id, swiperInstance, debug]);

  return {
    activeIndex,
    setActiveIndex,
    handleSlideChange,
    initializeSwiper,
    savePosition: savePositionManually,
    restorePosition: restorePositionManually,
    clearPosition: clearPositionManually,
  };
};

export default useSwiperPosition;
