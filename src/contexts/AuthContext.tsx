'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = useMemo(() => createClient(), [])

  // Fetch profile with retry logic
  const fetchProfile = useCallback(async (userId: string, retries = 2): Promise<Profile | null> => {
    for (let i = 0; i <= retries; i++) {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.warn(`Profile fetch attempt ${i + 1} failed:`, error.message)
          if (i < retries) {
            await new Promise(r => setTimeout(r, 1000))
            continue
          }
        }
        
        return profileData
      } catch (error) {
        console.error(`Profile fetch error attempt ${i + 1}:`, error)
        if (i < retries) {
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }
    return null
  }, [supabase])

  useEffect(() => {
    let mounted = true
    
    const getUser = async () => {
      try {
        // Use getSession instead of getUser - it's faster and uses cached data
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }
        
        if (!mounted) return
        
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false) // Set loading false BEFORE profile fetch
        
        if (currentUser) {
          // Fetch profile in background - don't block UI
          fetchProfile(currentUser.id).then(profileData => {
            if (mounted && profileData) {
              setProfile(profileData)
            }
          })

          // Update last_active_at (non-blocking)
          supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', currentUser.id)
            .then(() => {})
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth state change:', event)
        
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        
        if (currentUser) {
          fetchProfile(currentUser.id).then(profileData => {
            if (mounted && profileData) {
              setProfile(profileData)
            }
          })
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    setUser(null)
    setProfile(null)
  }, [supabase])

  const value = useMemo(() => ({ user, profile, loading, signOut }), [user, profile, loading, signOut])

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
