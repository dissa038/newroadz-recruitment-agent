'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Your Account
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-white p-6 shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <div className="mt-1 text-sm text-gray-500 font-mono">
                  {user?.id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created
                </label>
                <div className="mt-1 text-sm text-gray-500">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}