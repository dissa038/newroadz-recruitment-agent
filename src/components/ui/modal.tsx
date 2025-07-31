"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RemoveScroll } from "react-remove-scroll";
import { createPortal } from "react-dom";

// Modal stack management
let modalStack: string[] = [];
let modalCounter = 0;

const addToModalStack = (id: string) => {
  modalStack.push(id);
};

const removeFromModalStack = (id: string) => {
  modalStack = modalStack.filter(stackId => stackId !== id);
};

const isTopModal = (id: string) => {
  return modalStack.length > 0 && modalStack[modalStack.length - 1] === id;
};

const getModalZIndex = (id: string) => {
  const index = modalStack.indexOf(id);
  if (index === -1) return 150;
  return 150 + (index * 10);
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const desktopContentRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const isClosing = useRef<boolean>(false);

  // Unique modal ID for stack management
  const modalId = useRef<string>(`modal-${++modalCounter}`);

  // Use state instead of ref for mobile detection to trigger re-renders
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [zIndex, setZIndex] = useState<number>(150);

  // Modal stack management
  useEffect(() => {
    if (isOpen) {
      addToModalStack(modalId.current);
      setZIndex(getModalZIndex(modalId.current));
    } else {
      removeFromModalStack(modalId.current);
    }

    return () => {
      if (isOpen) {
        removeFromModalStack(modalId.current);
      }
    };
  }, [isOpen]);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
    };

    // Check immediately
    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Effect voor de opening animatie op mobiel
  useEffect(() => {
    if (!isMobile || !isOpen || isClosing.current) return;

    const modal = modalRef.current;
    const overlay = overlayRef.current;
    if (!modal || !overlay) return;

    // Reset closing state
    isClosing.current = false;

    requestAnimationFrame(() => {
      // Start positie
      modal.style.transform = "translateY(100%)";
      overlay.style.backgroundColor = "rgba(21, 21, 21, 0)";

      // Force reflow
      modal.getBoundingClientRect();

      // Animatie starten
      modal.style.transition = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      overlay.style.transition =
        "background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      modal.style.transform = "translateY(0)";
      overlay.style.backgroundColor = "rgba(21, 21, 21, 0.8)";
    });
  }, [isOpen, isMobile]);

  const closeModal = () => {
    if (!isMobile || !modalRef.current || isClosing.current) return;

    const modal = modalRef.current;
    const overlay = overlayRef.current;

    isClosing.current = true;

    // Maak scrollen direct mogelijk
    document.body.style.overflow = "unset";
    document.body.style.touchAction = "unset";

    modal.style.transition = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
    modal.style.transform = `translateY(${window.innerHeight}px)`;

    if (overlay) {
      overlay.style.transition =
        "background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
    }

    // Wacht tot de modal bijna uit beeld is
    setTimeout(() => {
      onClose();
      isClosing.current = false;
    }, 200);
  };

  const updateOverlayOpacity = (translateY: number): void => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const maxTranslate = window.innerHeight;
    const progress = 1 - translateY / maxTranslate;
    const opacity = Math.max(0, progress * 0.8);
    overlay.style.backgroundColor = `rgba(21, 21, 21, ${opacity})`;
  };

  // Mobile swipe functionality - only for top modal
  useEffect(() => {
    const modal = modalRef.current;
    const content = contentRef.current;
    if (!modal || !content || !isMobile || !isTopModal(modalId.current)) return;

    const handleTouchStart = (e: TouchEvent): void => {
      // Only handle touch events if this is the top modal
      if (!isTopModal(modalId.current)) return;

      const target = e.target as Element;
      const handle = modal.querySelector(".modal-handle");

      // If clicking on handle, always enable dragging mode
      if (handle?.contains(target)) {
        isDragging.current = true;
        startY.current = e.touches[0].clientY;
        currentY.current = 0;
        modal.style.transition = "none";
        return;
      }

      // Check if the target is a scrollable element itself (textarea, input, etc.)
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        // Don't enable modal dragging when interacting with form elements
        isDragging.current = false;
        startY.current = 0;
        return;
      }

      // Check if the target is within a scrollable container
      let scrollableParent = target.closest('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto, textarea, input');

      // If we're in a scrollable container, check if it can scroll up
      if (scrollableParent) {
        const canScrollUp = scrollableParent.scrollTop > 0;
        if (canScrollUp) {
          // Don't enable modal dragging if the scrollable container can still scroll up
          isDragging.current = false;
          startY.current = 0;
          return;
        }
      }

      // For content area: only enable dragging mode if at start of scroll
      if (content.scrollTop <= 0) {
        const touchY = e.touches[0].clientY;
        startY.current = touchY;
        currentY.current = 0;
        isDragging.current = true;
        modal.style.transition = "none";
      } else {
        isDragging.current = false;
        startY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (!isDragging.current || !isTopModal(modalId.current)) return;

      const deltaY = e.touches[0].clientY - startY.current;
      const target = e.target as Element;

      // Check if the target is a scrollable element itself (textarea, input, etc.)
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        // Stop modal dragging when interacting with form elements
        isDragging.current = false;
        modal.style.transform = "translateY(0)";
        return;
      }

      // Check if we're still in a scrollable container that can scroll
      let scrollableParent = target.closest('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto, textarea, input');

      if (scrollableParent && deltaY < 0) {
        // If trying to scroll up and we're in a scrollable container,
        // check if the container can still scroll up
        const canScrollUp = scrollableParent.scrollTop > 0;
        if (canScrollUp) {
          // Let the container handle the scroll, stop modal dragging
          isDragging.current = false;
          modal.style.transform = "translateY(0)";
          return;
        }
      }

      // Only preventDefault if actually dragging downward
      if (deltaY > 0) {
        e.preventDefault();
        currentY.current = deltaY;
        modal.style.transform = `translateY(${deltaY}px)`;
        updateOverlayOpacity(deltaY);
      } else {
        // If trying to drag upward, stop dragging
        isDragging.current = false;
        modal.style.transform = "translateY(0)";
      }
    };

    const handleTouchEnd = (): void => {
      if (!isDragging.current || !isTopModal(modalId.current)) return;

      const modal = modalRef.current;
      const overlay = overlayRef.current;
      if (!modal || !overlay) return;

      modal.style.transition = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      overlay.style.transition =
        "background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1)";

      if (currentY.current > 100) {
        modal.style.transform = `translateY(${window.innerHeight}px)`;
        overlay.style.backgroundColor = "rgba(21, 21, 21, 0)";
        setTimeout(onClose, 200);
      } else {
        modal.style.transform = "translateY(0)";
        overlay.style.backgroundColor = "rgba(21, 21, 21, 0.8)";
      }

      isDragging.current = false;
      startY.current = 0;
    };

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent): void => {
      // Only handle mouse events if this is the top modal
      if (!isTopModal(modalId.current)) return;

      const target = e.target as Element;
      const handle = modal.querySelector(".modal-handle");

      if (handle?.contains(target)) {
        isDragging.current = true;
        startY.current = e.clientY;
        currentY.current = 0;
        modal.style.transition = "none";
        return;
      }

      // Check if the target is a scrollable element itself (textarea, input, etc.)
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        // Don't enable modal dragging when interacting with form elements
        isDragging.current = false;
        startY.current = 0;
        return;
      }

      // Check if the target is within a scrollable container
      let scrollableParent = target.closest('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto, textarea, input');

      // If we're in a scrollable container, check if it can scroll up
      if (scrollableParent) {
        const canScrollUp = scrollableParent.scrollTop > 0;
        if (canScrollUp) {
          // Don't enable modal dragging if the scrollable container can still scroll up
          isDragging.current = false;
          startY.current = 0;
          return;
        }
      }

      if (content.scrollTop <= 0) {
        startY.current = e.clientY;
        currentY.current = 0;
        isDragging.current = true;
        modal.style.transition = "none";
      }
    };

    const handleMouseMove = (e: MouseEvent): void => {
      if (!isDragging.current || !isTopModal(modalId.current)) return;

      const deltaY = e.clientY - startY.current;
      const target = e.target as Element;

      // Check if the target is a scrollable element itself (textarea, input, etc.)
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        // Stop modal dragging when interacting with form elements
        isDragging.current = false;
        modal.style.transform = "translateY(0)";
        return;
      }

      // Check if we're still in a scrollable container that can scroll
      let scrollableParent = target.closest('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto, textarea, input');

      if (scrollableParent && deltaY < 0) {
        // If trying to scroll up and we're in a scrollable container,
        // check if the container can still scroll up
        const canScrollUp = scrollableParent.scrollTop > 0;
        if (canScrollUp) {
          // Let the container handle the scroll, stop modal dragging
          isDragging.current = false;
          modal.style.transform = "translateY(0)";
          return;
        }
      }

      if (deltaY > 0) {
        e.preventDefault();
        currentY.current = deltaY;
        modal.style.transform = `translateY(${deltaY}px)`;
        updateOverlayOpacity(deltaY);
      } else {
        isDragging.current = false;
        modal.style.transform = "translateY(0)";
      }
    };

    const handleMouseUp = (): void => {
      if (!isDragging.current || !isTopModal(modalId.current)) return;

      const modal = modalRef.current;
      const overlay = overlayRef.current;
      if (!modal || !overlay) return;

      modal.style.transition = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      overlay.style.transition =
        "background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1)";

      if (currentY.current > 100) {
        modal.style.transform = `translateY(${window.innerHeight}px)`;
        overlay.style.backgroundColor = "rgba(21, 21, 21, 0)";
        setTimeout(onClose, 200);
      } else {
        modal.style.transform = "translateY(0)";
        overlay.style.backgroundColor = "rgba(21, 21, 21, 0.8)";
      }

      isDragging.current = false;
      startY.current = 0;
    };

    // Event listeners
    modal.addEventListener("touchstart", handleTouchStart, { passive: true });
    modal.addEventListener("touchmove", handleTouchMove, { passive: false });
    modal.addEventListener("touchend", handleTouchEnd);

    // Mouse event listeners
    modal.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      modal.removeEventListener("touchstart", handleTouchStart);
      modal.removeEventListener("touchmove", handleTouchMove);
      modal.removeEventListener("touchend", handleTouchEnd);

      modal.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onClose, isMobile, modalId]);

  // Effect for opening animation
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const modal = modalRef.current;
    const overlay = overlayRef.current;
    if (!modal || !overlay) return;

    modal.style.transform = "translateY(100%)";
    overlay.style.backgroundColor = "rgba(21, 21, 21, 0)";

    // Force reflow
    modal.getBoundingClientRect();

    modal.style.transition = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
    overlay.style.transition =
      "background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1)";

    modal.style.transform = "translateY(0)";
    overlay.style.backgroundColor = "rgba(21, 21, 21, 0.8)";
  }, [isOpen, isMobile]);

  // Handle body scroll lock - only for top modal
  useEffect(() => {
    if (isOpen && !isClosing.current && isTopModal(modalId.current)) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      // Add ESC listener - only for top modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isTopModal(modalId.current)) onClose();
      };
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else if (!isOpen || !isTopModal(modalId.current)) {
      // Only restore body scroll if this was the top modal or if no modals are open
      if (modalStack.length === 0) {
        document.body.style.overflow = "unset";
        document.body.style.touchAction = "unset";
      }
    }

    return () => {
      // Only restore body scroll if no modals are open
      if (modalStack.length === 0) {
        document.body.style.overflow = "unset";
        document.body.style.touchAction = "unset";
      }
    };
  }, [isOpen, onClose, modalId]);

  // Cleanup effect to prevent portal errors
  useEffect(() => {
    return () => {
      // Cleanup modal stack on unmount
      removeFromModalStack(modalId.current);
      // Restore body styles if this was the last modal
      if (modalStack.length === 0) {
        document.body.style.overflow = "unset";
        document.body.style.touchAction = "unset";
      }
    };
  }, []);

  const handleBackdropClick = () => {
    if (!isOpen || isClosing.current || !isTopModal(modalId.current)) return;
    if (isMobile) {
      closeModal();
    } else {
      onClose();
    }
  };

  // Mobile version
  if (isMobile) {
    if (!isOpen) return null;
    const mobileModal = (
      <RemoveScroll enabled={isOpen}>
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-[rgba(21,21,21,0.8)] !mt-0"
          style={{ zIndex }}
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className={cn(
              "fixed bottom-0 left-0 right-0",
              "h-auto max-h-[97dvh] w-full max-w-3xl mx-auto",
              "rounded-t-3xl bg-background overflow-hidden",
              className
            )}
            style={{ zIndex: zIndex + 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Handle */}
            <div className="absolute left-0 right-0 top-0 h-14 cursor-grab active:cursor-grabbing modal-handle z-[9999]">
              <div className="absolute left-1/2 -translate-x-1/2 top-[5px] h-1.5 w-16 rounded-full bg-gray-300 dark:bg-gray-600 z-[9999999999]" />
            </div>

            {/* Scrollable Content */}
            <div
              ref={contentRef}
              className="max-h-[calc(100dvh-1rem)] overflow-y-auto"
            >
              {children}
            </div>
          </div>
        </div>
      </RemoveScroll>
    );
    return typeof window !== 'undefined' && document.body ? createPortal(mobileModal, document.body) : null;
  }

  // Desktop version
  const desktopModal = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <RemoveScroll enabled={isOpen}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 !mt-0"
            style={{ zIndex }}
            onClick={handleBackdropClick}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Modal Container */}
            <div
              className={cn(
                "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
                "w-full sm:max-w-[900px]",
                "h-auto max-h-[calc(100vh-5rem)]",
                "flex flex-col items-center mx-auto px-6"
              )}
            >
              {/* Modal Content */}
              <motion.div
                className={cn(
                  "relative w-full bg-background rounded-lg shadow-lg",
                  "border border-border flex flex-col overflow-hidden",
                  "my-5",
                  className
                )}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.32, 0.72, 0, 1],
                }}
              >
                {/* Close Button */}
                <button
                  onClick={handleBackdropClick}
                  className={cn(
                    "absolute right-4 top-4 p-2 rounded-lg z-50",
                    "hover:bg-muted transition-colors",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Scrollable Content */}
                <div
                  ref={desktopContentRef}
                  className="flex-1 overflow-y-auto min-h-0"
                >
                  {children}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
  return typeof window !== 'undefined' && document.body ? createPortal(desktopModal, document.body) : null;
}