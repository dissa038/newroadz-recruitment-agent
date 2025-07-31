import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountForm from './account-form'

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <AccountForm user={user} />
}