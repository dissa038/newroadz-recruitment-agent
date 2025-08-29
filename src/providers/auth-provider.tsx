'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { type User, type Session } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'
import { type UserProfile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>
  signUpWithEmail: (email: string, password: string, userData?: { first_name?: string, last_name?: string, phone?: string }) => Promise<{ error?: any }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: any }>
  refreshProfile: () => Promise<void>
  supabase: ReturnType<typeof createClient>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data || null)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting initial session:', error)
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

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

  const mapAuthError = (code?: string, message?: string) => {
    switch (code) {
      case 'invalid_credentials':
      case 'invalid_grant':
      case 'PGRST301':
        return { title: 'Onjuiste inloggegevens', description: 'Controleer je e-mail en wachtwoord.' }
      case 'user_not_found':
        return { title: 'Account niet gevonden', description: 'Er is geen account met dit e-mailadres.' }
      case 'email_not_confirmed':
        return { title: 'Bevestig je e-mail', description: 'Check je inbox om je account te activeren.' }
      case 'rate_limit_exceeded':
        return { title: 'Te veel pogingen', description: 'Probeer het later opnieuw.' }
      case 'user_already_exists':
        return { title: 'Gebruiker bestaat al', description: 'Gebruik een ander e-mailadres of log in.' }
      default:
        return { title: 'Er ging iets mis', description: message || 'Probeer het later opnieuw.' }
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
        const mapped = mapAuthError((error as any)?.code, error.message)
        toast({ ...mapped, variant: "destructive" })
        return { error }
      }
      
      toast({ title: 'Welkom terug!', description: `Ingelogd als ${email}` })
      return {}
    } catch (error) {
      console.error('Error signing in with email:', error)
      toast({ title: 'Er ging iets mis', description: 'Probeer het later opnieuw.', variant: 'destructive' })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, userData?: { first_name?: string, last_name?: string, phone?: string }) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userData || {}
        }
      })

      if (error) {
        const mapped = mapAuthError((error as any)?.code, error.message)
        toast({ ...mapped, variant: "destructive" })
        return { error }
      }

      toast({ title: 'Account aangemaakt', description: 'Check je mail om je account te bevestigen.' })

      return {}
    } catch (error) {
      console.error('Error signing up with email:', error)
      toast({ title: 'Er ging iets mis', description: 'Probeer het later opnieuw.', variant: 'destructive' })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      // Refresh profile data
      await fetchProfile(user.id)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      return {}
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Profile update failed",
        description: "An unknown error occurred",
        variant: "destructive",
      })
      return { error }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signOut,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    updateProfile,
    refreshProfile,
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