"use client";

import { useCallback } from 'react';
import { Swiper as SwiperType } from 'swiper';

interface SwiperAutoHeightConfig {
  /** Debug mode - logs height changes (default: false) */
  debug?: boolean;
  /** Delay before calculating height on init (default: 100ms) */
  initDelay?: number;
}

interface SwiperAutoHeightReturn {
  /** Handler for Swiper onSlideChange event with auto-height */
  handleSlideChangeWithAutoHeight: (swiper: SwiperType) => void;
  /** Handler for Swiper onInit event with auto-height */
  handleInitWithAutoHeight: (swiper: SwiperType) => void;
  /** Manually calculate and apply auto-height */
  calculateAutoHeight: (swiper: SwiperType) => void;
}

/**
 * Calculates and applies auto-height to all swiper slides
 * @param swiper - Swiper instance
 * @param debug - Enable debug logging
 */
const applyAutoHeight = (swiper: SwiperType, debug = false) => {
  if (!swiper?.slides?.length) {
    if (debug) console.log('useSwiperAutoHeight: No slides found');
    return;
  }

  const slides = Array.from(swiper.slides) as HTMLElement[];
  if (!slides.length) {
    if (debug) console.log('useSwiperAutoHeight: No valid slides found');
    return;
  }

  // Reset all slide heights to auto first
  slides.forEach((slide) => {
    if (slide) {
      slide.style.height = "auto";
    }
  });

  // Calculate maximum height
  let maxHeight = 0;
  slides.forEach((slide) => {
    if (slide) {
      maxHeight = Math.max(maxHeight, slide.offsetHeight);
    }
  });

  if (debug) {
    console.log(`useSwiperAutoHeight: Calculated max height: ${maxHeight}px for ${slides.length} slides`);
  }

  // Apply maximum height to all slides
  slides.forEach((slide) => {
    if (slide) {
      slide.style.height = `${maxHeight}px`;
    }
  });
};

/**
 * Hook for managing Swiper auto-height functionality
 * Ensures all slides have the same height based on the tallest slide
 * 
 * @param config - Configuration object
 * @returns Object with auto-height handlers
 * 
 * @example
 * ```tsx
 * const { handleSlideChangeWithAutoHeight, handleInitWithAutoHeight } = useSwiperAutoHeight({
 *   debug: true
 * });
 * 
 * <Swiper
 *   onInit={handleInitWithAutoHeight}
 *   onSlideChange={handleSlideChangeWithAutoHeight}
 *   // ... other props
 * >
 * ```
 */
export const useSwiperAutoHeight = (
  config: SwiperAutoHeightConfig = {}
): SwiperAutoHeightReturn => {
  const {
    debug = false,
    initDelay = 100,
  } = config;

  // Handle slide change with auto-height
  const handleSlideChangeWithAutoHeight = useCallback((swiper: SwiperType) => {
    applyAutoHeight(swiper, debug);
  }, [debug]);

  // Handle init with auto-height (with delay)
  const handleInitWithAutoHeight = useCallback((swiper: SwiperType) => {
    setTimeout(() => {
      applyAutoHeight(swiper, debug);
    }, initDelay);
  }, [debug, initDelay]);

  // Manual calculation function
  const calculateAutoHeight = useCallback((swiper: SwiperType) => {
    applyAutoHeight(swiper, debug);
  }, [debug]);

  return {
    handleSlideChangeWithAutoHeight,
    handleInitWithAutoHeight,
    calculateAutoHeight,
  };
};

export default useSwiperAutoHeight;
