'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus, CheckCircle2, XCircle, Copy, Check, Trash2, Users } from 'lucide-react'

interface SeedResult {
  success: boolean
  message: string
  user?: {
    id: string
    username: string
    email: string
    password: string
    gamesCount: number
  }
  error?: string
}

interface GeneratedUser {
  id: string
  username: string
  display_name: string
  email: string
  created_at?: string
}

interface StoredUserPassword {
  userId: string
  password: string
  timestamp: number
}

export default function SeedUsersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [generatedUsers, setGeneratedUsers] = useState<GeneratedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [generatingFollowsUserId, setGeneratingFollowsUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchGeneratedUsers()
  }, [])

  // Get stored passwords from localStorage
  const getStoredPasswords = (): Record<string, string> => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem('seedUserPasswords')
      if (stored) {
        const passwords: StoredUserPassword[] = JSON.parse(stored)
        // Filter out passwords older than 24 hours
        const validPasswords = passwords.filter(
          (p) => Date.now() - p.timestamp < 24 * 60 * 60 * 1000
        )
        localStorage.setItem('seedUserPasswords', JSON.stringify(validPasswords))
        return Object.fromEntries(validPasswords.map((p) => [p.userId, p.password]))
      }
    } catch (error) {
      console.error('Error reading stored passwords:', error)
    }
    return {}
  }

  // Store password in localStorage
  const storePassword = (userId: string, password: string) => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('seedUserPasswords')
      const passwords: StoredUserPassword[] = stored ? JSON.parse(stored) : []
      // Remove existing entry for this user
      const filtered = passwords.filter((p) => p.userId !== userId)
      // Add new entry
      filtered.push({ userId, password, timestamp: Date.now() })
      localStorage.setItem('seedUserPasswords', JSON.stringify(filtered))
    } catch (error) {
      console.error('Error storing password:', error)
    }
  }

  const fetchGeneratedUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/seed/users/list', {
        cache: 'no-store', // Ensure fresh data
      })
      const data = await response.json()
      if (response.ok) {
        console.log('Fetched users:', data.count, 'total users')
        setGeneratedUsers(data.users || [])
      } else {
        console.error('Error fetching users:', data.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/seed/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'User generated successfully!',
          user: data.user,
        })
        // Store password in localStorage
        if (data.user?.id && data.user?.password) {
          storePassword(data.user.id, data.user.password)
        }
        // Refresh the list
        await fetchGeneratedUsers()
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to generate user',
          error: data.details,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Failed to generate user',
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setDeletingUserId(userId)

    try {
      const response = await fetch(`/api/seed/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        // Remove from list
        setGeneratedUsers((prev) => prev.filter((u) => u.id !== userId))
        // Remove password from localStorage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('seedUserPasswords')
            if (stored) {
              const passwords: StoredUserPassword[] = JSON.parse(stored)
              const filtered = passwords.filter((p) => p.userId !== userId)
              localStorage.setItem('seedUserPasswords', JSON.stringify(filtered))
            }
          } catch (error) {
            console.error('Error removing password from storage:', error)
          }
        }
      } else {
        alert(`Failed to delete user: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Error deleting user: ${error.message}`)
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleGenerateFollows = async (userId: string) => {
    setGeneratingFollowsUserId(userId)

    try {
      const response = await fetch(`/api/seed/users/${userId}/follows`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(
          `Created ${data.created} follow relationships!\n` +
          `- Following: ${data.relationships.following}\n` +
          `- Followers: ${data.relationships.followers}`
        )
      } else {
        alert(`Failed to generate follows: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Error generating follows: ${error.message}`)
    } finally {
      setGeneratingFollowsUserId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
            <h1 className="text-3xl font-title font-bold text-white mb-2">
              Seed Users
            </h1>
            <p className="text-slate-400 mb-8">
              Generate random users with gaming names, bios, and game selections.
              Each user will have avatar and cover images from their selected games.
            </p>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-medium"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Generate User
                </>
              )}
            </Button>

            {result && (
              <div
                className={`mt-6 p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        result.success ? 'text-green-300' : 'text-red-300'
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.user && (
                      <div className="mt-3 space-y-2 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Username:</span>
                          <span>{result.user.username}</span>
                          <button
                            onClick={() => copyToClipboard(result.user!.username, 'username')}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            {copiedId === 'username' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Email:</span>
                          <span>{result.user.email}</span>
                          <button
                            onClick={() => copyToClipboard(result.user!.email, 'email')}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            {copiedId === 'email' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Password:</span>
                          <span className="font-mono">{result.user.password}</span>
                          <button
                            onClick={() => copyToClipboard(result.user!.password || '', 'password')}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            {copiedId === 'password' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p>
                          <span className="text-slate-400">Games:</span>{' '}
                          {result.user.gamesCount}
                        </p>
                      </div>
                    )}
                    {result.error && (
                      <p className="mt-2 text-xs text-red-400">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Users List */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 sticky top-8">
            <h2 className="text-xl font-title font-bold text-white mb-4">
              Generated Users ({generatedUsers.length})
            </h2>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : generatedUsers.length === 0 ? (
              <p className="text-slate-400 text-sm">No users generated yet</p>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {generatedUsers.map((user) => {
                  const storedPasswords = getStoredPasswords()
                  const password = storedPasswords[user.id]
                  const isDeleting = deletingUserId === user.id
                  const isGeneratingFollows = generatingFollowsUserId === user.id
                  
                  return (
                    <div
                      key={user.id}
                      className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">{user.username}</p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                              className="p-1 hover:bg-slate-600 rounded"
                              title="Copy email"
                              disabled={isDeleting || isGeneratingFollows}
                            >
                              {copiedId === `email-${user.id}` ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleGenerateFollows(user.id)}
                              className="p-1 hover:bg-cyan-600/50 rounded text-cyan-400 hover:text-cyan-300 transition-colors"
                              title="Generate follow relationships"
                              disabled={isDeleting || isGeneratingFollows}
                            >
                              {isGeneratingFollows ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Users className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 hover:bg-red-600/50 rounded text-red-400 hover:text-red-300 transition-colors"
                              title="Delete user"
                              disabled={isDeleting || isGeneratingFollows}
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-xs">{user.display_name}</p>
                        <p className="text-slate-400 text-xs font-mono truncate">
                          {user.email}
                        </p>
                        {password && (
                          <div className="flex items-center gap-2 pt-1">
                            <p className="text-slate-400 text-xs">Password:</p>
                            <p className="text-slate-300 text-xs font-mono">{password}</p>
                            <button
                              onClick={() => copyToClipboard(password, `pwd-${user.id}`)}
                              className="p-1 hover:bg-slate-600 rounded"
                              title="Copy password"
                              disabled={isDeleting || isGeneratingFollows}
                            >
                              {copiedId === `pwd-${user.id}` ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
