import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = '/account'

  // Create redirect link without the secret token
  const redirectTo = new URL(next, origin)
  // No need to delete search params since we're creating a clean URL

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page with some instructions
  const errorUrl = new URL('/error', origin)
  return NextResponse.redirect(errorUrl)
}