'use client'

import { useAuth } from '@/providers/auth-provider'
import { type User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LogOut, Loader2, User as UserIcon } from 'lucide-react'

export default function AccountForm({ user }: { user: User | null }) {
  const { signOut, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No user found</h2>
          <p className="text-muted-foreground">There was a problem loading your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-md py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <div className="text-sm font-medium">
                  {user.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  User ID
                </label>
                <div className="text-xs font-mono text-muted-foreground break-all">
                  {user.id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Created
                </label>
                <div className="text-sm text-muted-foreground">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}