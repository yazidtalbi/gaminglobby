'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Settings, Bell, UserPlus, Users, Lock, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [allowInvites, setAllowInvites] = useState(true)
  const [invitesFromFollowersOnly, setInvitesFromFollowersOnly] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [floatingChatHidden, setFloatingChatHidden] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings from profile and localStorage
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (profile) {
      setAllowInvites((profile as any).allow_invites ?? true)
      setInvitesFromFollowersOnly((profile as any).invites_from_followers_only ?? false)
      setIsPrivate((profile as any).is_private ?? false)
    }

    // Load notification preference from localStorage
    const storedNotifications = localStorage.getItem('notifications_enabled')
    if (storedNotifications !== null) {
      setNotificationsEnabled(storedNotifications === 'true')
    }

    // Load floating chat hidden preference from localStorage
    const storedFloatingChatHidden = localStorage.getItem('floating_lobby_chat_hidden')
    if (storedFloatingChatHidden !== null) {
      setFloatingChatHidden(storedFloatingChatHidden === 'true')
    }
  }, [profile, authLoading, user, router])

  const handleSave = async () => {
    if (!user || !profile) return

    setIsSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          allow_invites: allowInvites,
          invites_from_followers_only: invitesFromFollowersOnly,
          is_private: isPrivate,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Save notification preference to localStorage
      localStorage.setItem('notifications_enabled', notificationsEnabled.toString())

      // Save floating chat hidden preference to localStorage
      localStorage.setItem('floating_lobby_chat_hidden', floatingChatHidden.toString())

      // Refresh the page to update profile data
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      setError(err.message || 'Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setIsDeleting(true)
    setError(null)

    try {
      // Call API route to delete account
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      console.error('Failed to delete account:', err)
      setError(err.message || 'Failed to delete account. Please try again.')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-emerald-400" />
            Settings
          </h1>
          <p className="text-slate-400 mt-2">Manage your account preferences and privacy settings</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Privacy Settings */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            Privacy
          </h2>

          <div className="space-y-6">
            {/* Make Profile Private */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-white block mb-1">
                  Make Profile Private
                </label>
                <p className="text-xs text-slate-400">
                  When enabled, your profile will only be visible to users you follow
                </p>
              </div>
              <ToggleSwitch
                enabled={isPrivate}
                onChange={setIsPrivate}
              />
            </div>
          </div>
        </div>

        {/* Invite Settings */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-400" />
            Invite Settings
          </h2>

          <div className="space-y-6">
            {/* Allow Invites */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-white block mb-1">
                  Allow Invites
                </label>
                <p className="text-xs text-slate-400">
                  Allow other users to invite you to lobbies
                </p>
              </div>
              <ToggleSwitch
                enabled={allowInvites}
                onChange={setAllowInvites}
                disabled={false}
              />
            </div>

            {/* Invites from Followers Only */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-white block mb-1">
                  Invites from Followers Only
                </label>
                <p className="text-xs text-slate-400">
                  Only allow invites from users you follow
                </p>
              </div>
              <ToggleSwitch
                enabled={invitesFromFollowersOnly}
                onChange={setInvitesFromFollowersOnly}
                disabled={!allowInvites}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Notifications
          </h2>

          <div className="space-y-6">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-white block mb-1">
                  Enable Toast Notifications
                </label>
                <p className="text-xs text-slate-400">
                  Show toast notifications for invites and lobby updates
                </p>
              </div>
              <ToggleSwitch
                enabled={notificationsEnabled}
                onChange={setNotificationsEnabled}
              />
            </div>

            {/* Hide Floating Lobby Chat */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-white block mb-1">
                  Hide Floating Lobby Chat
                </label>
                <p className="text-xs text-slate-400">
                  Hide the floating lobby chat widget when you're in a lobby
                </p>
              </div>
              <ToggleSwitch
                enabled={floatingChatHidden}
                onChange={setFloatingChatHidden}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Delete Account</h3>
              <p className="text-xs text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-800 border border-red-500/20 rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Delete Account</h3>
              </div>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete your account? This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm mb-6 space-y-1">
                <li>Your profile and all personal information</li>
                <li>Your game library</li>
                <li>All lobbies you've created</li>
                <li>All messages and activity</li>
              </ul>
              <p className="text-red-400 font-medium mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-emerald-600' : 'bg-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}

