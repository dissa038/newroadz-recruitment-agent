'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User, type Session } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: any }>
  supabase: ReturnType<typeof createClient>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting initial session:', error)
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            toast({
              title: "Welcome back!",
              description: `Signed in as ${session?.user?.email}`,
            })
            router.refresh()
            break
            
          case 'SIGNED_OUT':
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            })
            router.push('/')
            router.refresh()
            break
            
          case 'USER_UPDATED':
            toast({
              title: "Profile updated",
              description: "Your profile has been updated successfully",
            })
            break
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, toast])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error signing out",
        description: "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error signing in with provider:', error)
      toast({
        title: "Sign in failed",
        description: "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }
      
      return {}
    } catch (error) {
      console.error('Error signing in with email:', error)
      toast({
        title: "Sign in failed",
        description: "An unknown error occurred",
        variant: "destructive",
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }
      
      toast({
        title: "Account created",
        description: "Check your email to confirm your account",
      })
      
      return {}
    } catch (error) {
      console.error('Error signing up with email:', error)
      toast({
        title: "Sign up failed",
        description: "An unknown error occurred",
        variant: "destructive",
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signOut,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    supabase,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}