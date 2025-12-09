'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { ImageCropper } from './ImageCropper'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onProfileUpdated: (updatedProfile: Profile) => void
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarFileForCrop, setAvatarFileForCrop] = useState<File | null>(null)
  const [coverFileForCrop, setCoverFileForCrop] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [showAvatarCropper, setShowAvatarCropper] = useState(false)
  const [showCoverCropper, setShowCoverCropper] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be less than 5MB')
        return
      }
      // Store file for cropping and show cropper
      setAvatarFileForCrop(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setShowAvatarCropper(true)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Cover image must be less than 10MB')
        return
      }
      // Store file for cropping and show cropper
      setCoverFileForCrop(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
        setShowCoverCropper(true)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleAvatarCropComplete = useCallback((croppedImageBlob: Blob) => {
    // Convert blob to File
    const croppedFile = new File(
      [croppedImageBlob],
      `avatar-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    )
    
    setAvatarFile(croppedFile)
    
    // Update preview with cropped image
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedFile)
    
    setShowAvatarCropper(false)
    setAvatarFileForCrop(null)
  }, [])

  const handleCropComplete = useCallback((croppedImageBlob: Blob) => {
    // Convert blob to File
    const croppedFile = new File(
      [croppedImageBlob],
      `cover-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    )
    
    setCoverFile(croppedFile)
    
    // Update preview with cropped image
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedFile)
    
    setShowCoverCropper(false)
    setCoverFileForCrop(null)
  }, [])

  const uploadImage = async (file: File, type: 'avatar' | 'cover'): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const { url } = await response.json()
      return url
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!avatarFile && !coverFile) {
      onClose()
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      let avatarUrl = profile.avatar_url
      let coverUrl = (profile as any).cover_image_url || null

      // Upload avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'avatar')
      }

      // Upload cover if selected
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'cover')
      }

      // Update profile
      const updateData: any = {
        avatar_url: avatarUrl,
      }
      
      // Only update cover_image_url if it exists in the schema
      if (coverUrl !== null) {
        updateData.cover_image_url = coverUrl
      }
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      onProfileUpdated(updatedProfile)
      onClose()
      
      // Reset state
      setAvatarFile(null)
      setCoverFile(null)
      setAvatarFileForCrop(null)
      setCoverFileForCrop(null)
      setAvatarPreview(null)
      setCoverPreview(null)
      setShowAvatarCropper(false)
      setShowCoverCropper(false)
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading && !showCoverCropper && !showAvatarCropper) {
      setAvatarFile(null)
      setCoverFile(null)
      setAvatarFileForCrop(null)
      setCoverFileForCrop(null)
      setAvatarPreview(null)
      setCoverPreview(null)
      setShowAvatarCropper(false)
      setShowCoverCropper(false)
      setError(null)
      onClose()
    }
  }

  const handleCancelAvatarCrop = () => {
    setShowAvatarCropper(false)
    setAvatarFileForCrop(null)
    setAvatarPreview(profile.avatar_url || null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleCancelCrop = () => {
    setShowCoverCropper(false)
    setCoverFileForCrop(null)
    setCoverPreview((profile as any).cover_image_url || null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cover Image
            </label>
            <div className="relative">
              <div
                className="h-32 rounded-lg overflow-hidden bg-slate-700/50 border-2 border-dashed border-slate-600 cursor-pointer hover:border-emerald-500/50 transition-colors"
                onClick={() => coverInputRef.current?.click()}
              >
                {(coverPreview || (profile as any).cover_image_url) && !showCoverCropper ? (
                  <img
                    src={coverPreview || (profile as any).cover_image_url || ''}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Click to upload cover</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
              {(coverFile || coverFileForCrop) && !showCoverCropper && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCoverFile(null)
                    setCoverFileForCrop(null)
                    setCoverPreview((profile as any).cover_image_url || null)
                    if (coverInputRef.current) coverInputRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Recommended: 1200x400px, max 10MB</p>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div
                className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-700/50 border-2 border-dashed border-slate-600 cursor-pointer hover:border-emerald-500/50 transition-colors"
                onClick={() => avatarInputRef.current?.click()}
              >
                {(avatarPreview || profile.avatar_url) && !showAvatarCropper ? (
                  <img
                    src={avatarPreview || profile.avatar_url || ''}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                {(avatarFile || avatarFileForCrop) && !showAvatarCropper && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAvatarFile(null)
                      setAvatarFileForCrop(null)
                      setAvatarPreview(profile.avatar_url || null)
                      if (avatarInputRef.current) avatarInputRef.current.value = ''
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose Image
                </button>
                <p className="text-xs text-slate-500 mt-1">Recommended: 400x400px, max 5MB</p>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || showCoverCropper || showAvatarCropper || (!avatarFile && !coverFile)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Image Cropper */}
      {showAvatarCropper && avatarPreview && (
        <ImageCropper
          imageSrc={avatarPreview}
          aspect={1}
          title="Crop Profile Picture"
          onCropComplete={handleAvatarCropComplete}
          onCancel={handleCancelAvatarCrop}
        />
      )}

      {/* Cover Image Cropper */}
      {showCoverCropper && coverPreview && (
        <ImageCropper
          imageSrc={coverPreview}
          aspect={3}
          title="Crop Cover Image"
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  )
}

