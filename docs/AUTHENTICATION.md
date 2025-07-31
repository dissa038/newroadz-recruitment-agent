# Authentication Guide - Official Supabase Setup

This template uses the **official Supabase authentication setup** as recommended by Supabase for Next.js applications.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Server Pages   │───▶│  Supabase Server │───▶│   Database      │
│  (Recommended)  │    │     Client       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Client Components│───▶│ Supabase Browser │───▶│   Database      │
│  (When needed)  │    │     Client       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘

┌─────────────────┐    ┌──────────────────┐
│   Middleware    │───▶│ Route Protection │
│  (Automatic)    │    │ Token Refresh    │
└─────────────────┘    └──────────────────┘
```

## 📁 **File Structure**

```
src/
├── lib/supabase/
│   ├── client.ts      # Browser client for client components
│   ├── server.ts      # Server client for server components
│   ├── middleware.ts  # Session management utility
│   └── types.ts       # Database TypeScript types
├── hooks/
│   └── use-auth.ts    # Client-side auth hook (when needed)
├── app/
│   ├── login/         # Authentication pages
│   ├── account/       # Protected pages example
│   └── auth/          # OAuth callback handlers
└── middleware.ts      # Next.js middleware entry point
```

## 🚀 **How to Use Authentication**

### **1. Server Components (Recommended)**

Use server components for protected pages and complex auth logic:

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome {user.email}!</h1>
      {/* Your protected content */}
    </div>
  )
}
```

### **2. Client Components (When Needed)**

Use the `useAuth` hook for client-side interactivity:

```typescript
// components/UserMenu.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'

export function UserMenu() {
  const { user, loading, isAuthenticated, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <a href="/login">Sign In</a>
  }

  return (
    <div>
      <span>Welcome {user?.email}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### **3. Server Actions**

Use server actions for authentication operations:

```typescript
// app/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect('/error')
  }

  redirect('/dashboard')
}
```

## 🔒 **Route Protection**

Routes are automatically protected by middleware. Unauthenticated users are redirected to `/login`.

**Protected by default:** All routes except:
- `/login`
- `/auth/*` (OAuth callbacks)
- `/error`
- Static assets

## 🎯 **Authentication Patterns**

### **Check User in Server Component**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) redirect('/login')
```

### **Check User in Client Component**
```typescript
const { user, isAuthenticated } = useAuth()

if (!isAuthenticated) return <LoginPrompt />
```

### **OAuth Sign In**
```typescript
const { signInWithProvider } = useAuth()

// Sign in with Google
await signInWithProvider('google')
```

## 🔧 **Advanced Usage**

### **Custom Permissions**
```typescript
// lib/auth-utils.ts
export async function checkUserPermissions(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_permissions')
    .select('role, permissions')
    .eq('user_id', userId)
    .single()
    
  return data
}

// In server component:
const permissions = await checkUserPermissions(user.id)
if (permissions.role !== 'admin') redirect('/unauthorized')
```

### **Real-time Auth State**
```typescript
// Custom hook for real-time updates
export function useRealtimeAuth() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  
  useEffect(() => {
    if (!user) return
    
    const supabase = createClient()
    const channel = supabase
      .channel('user-profile')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        setProfile(payload.new)
      })
      .subscribe()
      
    return () => supabase.removeChannel(channel)
  }, [user])
  
  return { user, profile }
}
```

## 📝 **Environment Variables**

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎨 **TypeScript Types**

Generate types from your database:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

## ✅ **Best Practices**

1. **Prefer Server Components** - Better performance and SEO
2. **Use `auth.getUser()`** - Never use `auth.getSession()` for protection
3. **Handle loading states** - Always show loading UI in client components
4. **Validate on server** - Never trust client-side auth checks alone
5. **Use middleware** - Let it handle route protection automatically

## 🚀 **Why This Setup?**

- **Official** - Follows Supabase recommendations exactly
- **Performance** - Server-side rendering where possible
- **Security** - Proper token validation and refresh
- **Scalable** - Works for simple blogs to complex enterprise apps
- **Modern** - Uses latest Next.js App Router patterns

This setup can handle everything from simple authentication to complex multi-tenant applications with role-based access control! 🎯