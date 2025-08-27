import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Just handle session cookies, let client-side AuthGuard handle auth
  return await updateSession(request)
}

export const config = {
  matcher: '/',
}