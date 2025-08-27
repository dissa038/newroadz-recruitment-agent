# 🚀 Newroadz Recruitment Agent

AI-powered recruitment platform for sourcing and managing top talent with advanced search, automated screening, and intelligent matching.

## ✨ Features

### 🤖 **AI-Powered Recruitment**
- **Semantic Search** - Find candidates using natural language queries
- **Intelligent Matching** - AI-driven candidate-to-job matching
- **Automated Screening** - Smart CV analysis and skill extraction
- **Predictive Analytics** - Success probability scoring

### 📊 **Candidate Management**
- **Comprehensive Profiles** - Detailed candidate information
- **Bulk CV Upload** - Process multiple CVs simultaneously
- **Smart Tagging** - Automated skill and experience detection
- **Real-time Updates** - Live candidate status tracking

### 🔗 **Integrations**
- **Apollo.io** - Lead generation and contact scraping
- **Loxo** - ATS synchronization and workflow integration
- **Email Automation** - Outreach and follow-up campaigns
- **Calendar Integration** - Interview scheduling

### 🔧 **Core Stack**
- **Next.js 15** - App Router, Server Components, TypeScript
- **React 19** - Latest React features
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern, accessible UI components

### 🔐 **Authentication & Database**
- **Supabase** - Database, Authentication, Storage
- **Row Level Security** - Secure data access
- **Real-time subscriptions** - Live data updates
- **Multi-tenant Architecture** - Organization-based access control

### 🤖 **AI Integration**
- **Google Gemini AI** - Advanced language processing
- **Semantic Search** - Natural language candidate queries
- **Skill Extraction** - Automated CV parsing and analysis
- **Match Scoring** - AI-powered candidate ranking

### 📧 **Communication & Automation**
- **Brevo** - Transactional and marketing emails
- **Contact Forms** - Candidate and client inquiries
- **Email Templates** - Customizable outreach campaigns
- **Automated Workflows** - Streamlined recruitment processes

### 🎨 **UI & UX**
- **Dark/Light mode** - Automatic theme switching
- **Responsive design** - Mobile-first approach
- **Loading states** - Skeleton loaders
- **Error handling** - 404 and error pages
- **Toast notifications** - User feedback

### 📝 **Forms & Validation**
- **React Hook Form** - High-performance forms
- **Zod** - Type-safe validation
- **Error handling** - User-friendly error messages

### 🎭 **Animations**
- **Framer Motion** - Smooth animations and transitions

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/newroadz/recruitment-agent
cd newroadz-recruitment-agent
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
```

**Required for Core Functionality:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Project Settings → API → Copy your:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add these to your `.env.local` file

**Required for AI Features:**
- **Google Gemini**: [makersuite.google.com](https://makersuite.google.com) for AI-powered search and matching

**Optional Integrations:**
- **Brevo**: [brevo.com](https://brevo.com) for email automation
- **Apollo.io**: API key for candidate sourcing
- **Loxo**: Integration for ATS synchronization

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