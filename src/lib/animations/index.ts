import { Variants } from "framer-motion";

/**
 * Normale fade animatie
 */
export const fadeUp: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};

/**
 * Stagger container - elementen komen na elkaar binnen
 */
export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

/**
 * Stagger child - voor elementen die na elkaar komen
 */
export const staggerChild: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};