# Framer Motion Animaties

Herbruikbare animaties voor de hele applicatie.

## Gebruik

```tsx
import { motion } from "framer-motion";
import { fadeUp, fadeUpFast, staggerContainer, staggerChild } from "@/lib/animations";

// Basis fade-up animatie
<motion.div
  variants={fadeUp}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content hier
</motion.div>

// Snellere variant
<motion.div
  variants={fadeUpFast}
  initial="initial"
  animate="animate"
>
  Snelle animatie
</motion.div>

// Staggered animaties (meerdere elementen)
<motion.div
  variants={staggerContainer}
  initial="initial"
  animate="animate"
>
  <motion.div variants={staggerChild}>Item 1</motion.div>
  <motion.div variants={staggerChild}>Item 2</motion.div>
  <motion.div variants={staggerChild}>Item 3</motion.div>
</motion.div>
```

## Beschikbare Animaties

- `fadeUp` - Standaard fade-up (0.5s)
- `fadeUpFast` - Snelle fade-up (0.3s)  
- `fadeUpSlow` - Langzame fade-up (0.8s)
- `staggerContainer` - Container voor staggered animaties
- `staggerChild` - Child elementen voor staggered animaties

## Aanpassen

Alle animaties gebruiken:
- **Opacity**: 0 → 1
- **Transform**: translateY(20px) → translateY(0)
- **Easing**: easeOut voor smooth gevoel