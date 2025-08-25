# 🚀 Next.js Complete Template

Een complete, moderne Next.js template met alles wat je nodig hebt om direct te beginnen met het bouwen van professionele web applicaties.

## ✨ Features

### 🔧 **Core Stack**
- **Next.js 15** - App Router, Server Components, TypeScript
- **React 19** - Nieuwste React features
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Moderne, toegankelijke UI componenten

### 🔐 **Authentication & Database**
- **Supabase** - Database, Authentication, Storage
- **Row Level Security** - Veilige data toegang
- **Real-time subscriptions** - Live data updates

### 🤖 **AI Integration**
- **Google Gemini AI** - Text generatie en AI features
- **Ready-to-use API routes** - Direct te gebruiken AI endpoints

### 📧 **Email & Communication**
- **Brevo** - Transactionele emails
- **Contact formulieren** - Met validatie en error handling

### 🎨 **UI & UX**
- **Dark/Light mode** - Automatische theme switching
- **Responsive design** - Mobile-first approach
- **Loading states** - Skeleton loaders
- **Error handling** - 404 en error pages
- **Toast notifications** - User feedback

### 📝 **Forms & Validation**
- **React Hook Form** - Performante formulieren
- **Zod** - Type-safe validatie
- **Error handling** - Gebruiksvriendelijke foutmeldingen

### 🎭 **Animations**
- **Framer Motion** - Smooth animaties en transities

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd next-js-template
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
```

**Required for Authentication:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Project Settings → API → Copy your:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add these to your `.env.local` file

**Optional services:**
- **Brevo**: [brevo.com](https://brevo.com) for email functionality
- **Google Gemini**: [makersuite.google.com](https://makersuite.google.com) for AI features

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── about/             # Example page with loading
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── sections/          # Page sections
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & configurations
└── providers/             # React context providers
```

## 🔧 Configuration

### Supabase Setup
1. Create project op [supabase.com](https://supabase.com)
2. Kopieer URL en anon key naar `.env.local`
3. Run database migrations (zie `docs/SUPABASE_SETUP.md`)

### Email Setup (Brevo)
1. Account aanmaken op [brevo.com](https://brevo.com)
2. API key genereren
3. Sender email configureren

### AI Setup (Google Gemini)
1. API key krijgen van [makersuite.google.com](https://makersuite.google.com)
2. Key toevoegen aan `.env.local`
3. Test met `/api/ai` endpoint

## 🎨 Customization

### Styling
- **Tailwind config**: `tailwind.config.js`
- **CSS variables**: `src/app/globals.css`
- **shadcn/ui**: `components.json`

### Components
- **UI Components**: `src/components/ui/`
- **Custom Components**: `src/components/`
- **Add new**: `npx shadcn@latest add [component]`

## 📚 Usage Examples

### Metadata per page
```tsx
export const metadata: Metadata = {
  title: 'Page Title | Next.js Template',
  description: 'Page description for SEO',
};
```

### Loading states
```tsx
// loading.tsx in any folder
export default function Loading() {
  return <PageSkeleton />;
}
```

### AI Integration
```tsx
const response = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello AI!' }),
});
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push naar GitHub
2. Connect op [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy! 🎉

### Other Platforms
- **Netlify**: Works out of the box
- **Railway**: Add `railway.toml`
- **Docker**: `Dockerfile` included

## 📖 Documentation

Meer gedetailleerde docs in de `docs/` folder:
- [Supabase Setup](docs/SUPABASE_SETUP.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Project Setup](docs/project-setup-and-rules.md)

## 🤝 Contributing

1. Fork het project
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - zie [LICENSE](LICENSE) file.

## 🙏 Credits

Gebouwd met liefde door [Your Name] met:
- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com)

---

**Happy coding! 🚀**