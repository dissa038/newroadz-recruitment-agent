# Supabase Setup Guide - 2025 Edition

Deze template is volledig geconfigureerd met de allerlaatste Supabase SSR setup voor Next.js volgens de 2025 standaarden.

## 📁 Bestandsstructuur Uitleg

### Middleware Bestanden (Waarom twee?)

**1. `middleware.ts` (root)**
- Dit is de **Next.js middleware entry point**
- Wordt automatisch uitgevoerd door Next.js
- Roept de Supabase utility functie aan

**2. `src/lib/supabase/middleware.ts`**
- Dit is de **Supabase session management logic**
- Bevat de `updateSession` functie
- Handelt cookie management en user authentication af

**Dit is de CORRECTE moderne manier!** Supabase raadt deze scheiding aan voor betere code organisatie.

### Supabase Client Bestanden

**`src/lib/supabase/client.ts`**
- Browser client voor client-side components
- Gebruikt `createBrowserClient` van `@supabase/ssr`

**`src/lib/supabase/server.ts`**
- Server client voor server components en API routes
- Gebruikt `createServerClient` met Next.js cookies

**`src/lib/supabase/types.ts`**
- TypeScript types voor je database schema
- Gegenereerd met `supabase gen types typescript`

## 🔧 Environment Variables

Voeg deze toe aan je `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Hoe het werkt

### 1. Authentication Flow

```
User → Login Page → Server Action → Supabase Auth → Redirect
```

### 2. Session Management

```
Request → Middleware → Check Auth → Refresh Token → Continue/Redirect
```

### 3. Protected Routes

Alle routes worden automatisch beschermd door de middleware, behalve:
- `/login`
- `/auth/*` (callback routes)
- `/error`
- Static assets

## 📄 Belangrijke Bestanden

### Authentication Pages

- **`/login`** - Login/signup formulier
- **`/account`** - Beschermde account pagina
- **`/auth/callback`** - OAuth callback handler
- **`/auth/confirm`** - Email confirmation handler
- **`/error`** - Error pagina

### Hooks

**`src/hooks/use-supabase.ts`**
- Client-side Supabase hook
- Bevat user state, loading state
- Sign out functionaliteit
- OAuth provider login

## 🔒 Beveiliging Features

1. **Automatische token refresh** via middleware
2. **Route protection** voor alle pagina's
3. **Cookie-based sessions** (veiliger dan localStorage)
4. **CSRF protection** via Supabase SSR
5. **TypeScript type safety** voor database queries

## 📝 Gebruik Voorbeelden

### Server Component (Beschermde Pagina)

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Hello {user.email}</div>
}
```

### Client Component

```tsx
'use client'
import { useSupabase } from '@/hooks/use-supabase'

export default function ClientComponent() {
  const { user, loading, signOut } = useSupabase()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Database Query (Server)

```tsx
const supabase = await createClient()
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

### Database Query (Client)

```tsx
const { supabase } = useSupabase()
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

## 🎯 Volgende Stappen

1. **Database Schema**: Maak je tabellen in Supabase Dashboard
2. **Types Genereren**: Run `supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts`
3. **RLS Policies**: Stel Row Level Security in
4. **OAuth Providers**: Configureer Google, GitHub, etc. in Supabase Dashboard

## ⚠️ Belangrijke Opmerkingen

- **Gebruik ALTIJD `supabase.auth.getUser()`** voor route protection, NOOIT `getSession()`
- **Middleware moet ALTIJD de supabaseResponse returnen** zoals het is
- **Server components kunnen geen cookies setten** - dat doet de middleware
- **Client components hebben de hook nodig** voor real-time auth state

## 🔄 Migration van Oude Setup

Als je van `@supabase/auth-helpers-nextjs` komt:

1. ✅ Vervangen door `@supabase/ssr`
2. ✅ Middleware setup aangepast
3. ✅ Cookie handling geüpdatet
4. ✅ TypeScript types toegevoegd
5. ✅ Modern hook pattern

Deze setup is **production-ready** en volgt alle Supabase best practices voor 2025! 🚀