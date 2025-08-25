'use client'

import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AccountForm from './account-form'
import { Loader2 } from 'lucide-react'

export default function Account() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Laden...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Niet ingelogd</h2>
          <p className="text-muted-foreground mb-4">Je wordt doorgestuurd naar de login pagina...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return <AccountForm user={user} />
}