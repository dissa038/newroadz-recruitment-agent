# 🚀 Next.js Complete Template

Een complete Next.js template met alle moderne tools en componenten die je nodig hebt om snel te starten met je volgende project.

## ✨ Features

- **Next.js 15** met App Router en TypeScript
- **Tailwind CSS 3.3.3** voor styling
- **Alle ShadCN UI componenten** geïnstalleerd
- **Supabase** integratie voor backend
- **Dark/Light mode** met next-themes
- **Zod** voor formulier validatie
- **React Hook Form** voor formulierbeheer
- **Framer Motion** voor animaties
- **React Icons, Lucide React & Heroicons** voor iconen
- **Swiper** voor sliders/carousels

## 🛠️ Geïnstalleerde Packages

### Core
- `next` - Next.js framework
- `react` & `react-dom` - React library
- `typescript` - TypeScript support

### Styling
- `tailwindcss@3.3.3` - Utility-first CSS framework
- `postcss` & `autoprefixer` - CSS processing
- `tailwind-merge` - Merge Tailwind classes
- `clsx` - Conditional class names
- `next-themes` - Dark/light mode

### UI Components
- Alle ShadCN UI componenten
- `lucide-react` - Beautiful icons
- `react-icons` - Popular icon libraries
- `@heroicons/react` - Heroicons

### Forms & Validation
- `zod` - Schema validation
- `react-hook-form` - Form management
- `@hookform/resolvers` - Form resolvers

### Backend & Database
- `@supabase/supabase-js` - Supabase client

### Animations & Interactions
- `framer-motion` - Animation library
- `swiper` - Touch slider

## 🚀 Getting Started

1. **Installeer dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open je browser:**
   Ga naar [http://localhost:3000](http://localhost:3000)

## 📁 Project Structuur

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # ShadCN UI componenten
│   ├── sections/          # Pagina secties
│   ├── layout/            # Layout componenten
│   └── theme-provider.tsx # Theme provider
├── lib/
│   ├── utils.ts           # Utility functies
│   └── validations.ts     # Zod schemas
└── hooks/                 # Custom hooks
```

## 🎨 ShadCN UI Componenten

Alle volgende componenten zijn geïnstalleerd en klaar voor gebruik:

- Accordion, Alert, Alert Dialog
- Aspect Ratio, Avatar, Badge, Button
- Calendar, Card, Checkbox, Collapsible
- Command, Context Menu, Dialog
- Dropdown Menu, Form, Hover Card
- Input, Label, Menubar, Navigation Menu
- Popover, Progress, Radio Group
- Scroll Area, Select, Separator, Sheet
- Skeleton, Slider, Switch, Table
- Tabs, Textarea, Toast, Toggle, Tooltip

## 🔧 Configuratie

### Tailwind CSS
- Geconfigureerd voor dark mode
- Custom kleuren en variabelen
- Optimized voor ShadCN UI

### Next.js
- Image domains geconfigureerd voor Pexels, Unsplash, Pixabay
- TypeScript strict mode
- App Router enabled

### Supabase
- Client geconfigureerd
- Klaar voor database, auth en RLS

## 📝 Gebruik

### Formulieren met Zod
```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### ShadCN UI Componenten
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Theme Switching
```typescript
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
```

## 🎯 Volgende Stappen

1. **Supabase Setup:** Configureer je Supabase project
2. **Environment Variables:** Voeg je API keys toe
3. **Database Schema:** Ontwerp je database structuur
4. **Authentication:** Implementeer user auth
5. **Deploy:** Deploy naar Vercel of je favoriete platform

## 📚 Documentatie

- [Next.js Docs](https://nextjs.org/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase](https://supabase.com/docs)
- [Zod](https://zod.dev/)

## 🤝 Contributing

Voel je vrij om issues te openen of pull requests te maken!

## 📄 License

MIT License - zie [LICENSE](LICENSE) voor details.