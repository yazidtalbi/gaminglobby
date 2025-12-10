'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { ImageCropper } from './ImageCropper'
import { X, Upload, Loader2, Image as ImageIcon, Search, ArrowLeft, Gamepad2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface GameResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
}

interface Hero {
  id: number
  url: string
  thumb: string
  width: number
  height: number
}

interface Cover {
  id: number
  url: string
  thumb: string
  width: number
  height: number
}

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
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [isPrivate, setIsPrivate] = useState(profile.is_private || false)
  const [bio, setBio] = useState(profile.bio || '')
  
  // Cover selection flow states
  const [coverSelectionMode, setCoverSelectionMode] = useState<'upload' | 'game' | null>(null)
  const [gameSearchQuery, setGameSearchQuery] = useState('')
  const [gameSearchResults, setGameSearchResults] = useState<GameResult[]>([])
  const [isSearchingGames, setIsSearchingGames] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null)
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [isLoadingHeroes, setIsLoadingHeroes] = useState(false)
  const [selectedHeroUrl, setSelectedHeroUrl] = useState<string | null>(null)
  const [isLoadingSelectedHero, setIsLoadingSelectedHero] = useState(false)
  
  // Avatar selection flow states
  const [avatarSelectionMode, setAvatarSelectionMode] = useState<'upload' | 'game' | null>(null)
  const [avatarGameSearchQuery, setAvatarGameSearchQuery] = useState('')
  const [avatarGameSearchResults, setAvatarGameSearchResults] = useState<GameResult[]>([])
  const [isSearchingAvatarGames, setIsSearchingAvatarGames] = useState(false)
  const [selectedAvatarGame, setSelectedAvatarGame] = useState<GameResult | null>(null)
  const [avatarCovers, setAvatarCovers] = useState<Cover[]>([])
  const [isLoadingAvatarCovers, setIsLoadingAvatarCovers] = useState(false)
  const [selectedAvatarCoverUrl, setSelectedAvatarCoverUrl] = useState<string | null>(null)
  const [isLoadingSelectedAvatarCover, setIsLoadingSelectedAvatarCover] = useState(false)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const gameSearchInputRef = useRef<HTMLInputElement>(null)
  const avatarGameSearchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const debouncedGameQuery = useDebounce(gameSearchQuery, 300)
  const debouncedAvatarGameQuery = useDebounce(avatarGameSearchQuery, 300)

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

  // Search games for cover hero selection
  useEffect(() => {
    const searchGames = async () => {
      if (debouncedGameQuery.length < 2) {
        setGameSearchResults([])
        return
      }

      setIsSearchingGames(true)
      try {
        const response = await fetch(`/api/steamgriddb/search?query=${encodeURIComponent(debouncedGameQuery)}`)
        const data = await response.json()
        setGameSearchResults(data.results || [])
      } catch (error) {
        console.error('Game search error:', error)
        setGameSearchResults([])
      } finally {
        setIsSearchingGames(false)
      }
    }

    searchGames()
  }, [debouncedGameQuery])

  // Search games for avatar cover selection
  useEffect(() => {
    const searchGames = async () => {
      if (debouncedAvatarGameQuery.length < 2) {
        setAvatarGameSearchResults([])
        return
      }

      setIsSearchingAvatarGames(true)
      try {
        const response = await fetch(`/api/steamgriddb/search?query=${encodeURIComponent(debouncedAvatarGameQuery)}`)
        const data = await response.json()
        setAvatarGameSearchResults(data.results || [])
      } catch (error) {
        console.error('Avatar game search error:', error)
        setAvatarGameSearchResults([])
      } finally {
        setIsSearchingAvatarGames(false)
      }
    }

    searchGames()
  }, [debouncedAvatarGameQuery])

  // Fetch heroes when game is selected for cover
  useEffect(() => {
    const fetchHeroes = async () => {
      if (!selectedGame) return

      setIsLoadingHeroes(true)
      try {
        const response = await fetch(`/api/steamgriddb/grids?gameId=${selectedGame.id}`)
        const data = await response.json()
        setHeroes(data.heroes || [])
      } catch (error) {
        console.error('Heroes fetch error:', error)
        setHeroes([])
      } finally {
        setIsLoadingHeroes(false)
      }
    }

    fetchHeroes()
  }, [selectedGame])

  // Fetch covers when game is selected for avatar
  useEffect(() => {
    const fetchCovers = async () => {
      if (!selectedAvatarGame) return

      setIsLoadingAvatarCovers(true)
      try {
        const response = await fetch(`/api/steamgriddb/covers?gameId=${selectedAvatarGame.id}`)
        const data = await response.json()
        setAvatarCovers(data.covers || [])
      } catch (error) {
        console.error('Avatar covers fetch error:', error)
        setAvatarCovers([])
      } finally {
        setIsLoadingAvatarCovers(false)
      }
    }

    fetchCovers()
  }, [selectedAvatarGame])

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

  const handleHeroSelect = async (heroUrl: string) => {
    setSelectedHeroUrl(heroUrl)
    setError(null)
    setIsLoadingSelectedHero(true)
    
    // Fetch the image through proxy to bypass CORS
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(heroUrl)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
        setIsLoadingSelectedHero(false)
        setShowCoverCropper(true)
      }
      reader.onerror = () => {
        setIsLoadingSelectedHero(false)
        setError('Failed to load hero image. Please try again.')
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Failed to load hero image:', error)
      setIsLoadingSelectedHero(false)
      setError('Failed to load hero image. Please try again.')
    }
  }

  const handleAvatarCoverSelect = async (coverUrl: string) => {
    setSelectedAvatarCoverUrl(coverUrl)
    setError(null)
    setIsLoadingSelectedAvatarCover(true)
    
    // Fetch the image through proxy to bypass CORS
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(coverUrl)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setIsLoadingSelectedAvatarCover(false)
        setShowAvatarCropper(true)
      }
      reader.onerror = () => {
        setIsLoadingSelectedAvatarCover(false)
        setError('Failed to load cover image. Please try again.')
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Failed to load cover image:', error)
      setIsLoadingSelectedAvatarCover(false)
      setError('Failed to load cover image. Please try again.')
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
    // Reset avatar game selection flow
    setAvatarSelectionMode(null)
    setSelectedAvatarGame(null)
    setAvatarCovers([])
    setSelectedAvatarCoverUrl(null)
    setAvatarGameSearchQuery('')
    setIsLoadingSelectedAvatarCover(false)
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
    // Reset game hero selection flow
    setCoverSelectionMode(null)
    setSelectedGame(null)
    setHeroes([])
    setSelectedHeroUrl(null)
    setGameSearchQuery('')
    setIsLoadingSelectedHero(false)
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
    const hasImageChanges = avatarFile || coverFile
    const hasTextChanges = 
      displayName.trim() !== (profile.display_name || '').trim() ||
      isPrivate !== (profile.is_private || false) ||
      bio.trim() !== (profile.bio || '').trim()
    
    if (!hasImageChanges && !hasTextChanges) {
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
        display_name: displayName.trim() || null,
        is_private: isPrivate,
        bio: bio.trim() || null,
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
      setDisplayName(updatedProfile.display_name || '')
      setIsPrivate(updatedProfile.is_private || false)
      setBio(updatedProfile.bio || '')
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
      setDisplayName(profile.display_name || '')
      setIsPrivate(profile.is_private || false)
      setBio(profile.bio || '')
      resetAllFlows()
      onClose()
    }
  }

  // Sync state when profile changes
  useEffect(() => {
    setDisplayName(profile.display_name || '')
    setIsPrivate(profile.is_private || false)
    setBio(profile.bio || '')
  }, [profile])

  const handleCancelAvatarCrop = () => {
    setShowAvatarCropper(false)
    setAvatarFileForCrop(null)
    setAvatarPreview(profile.avatar_url || null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    // Reset avatar game selection flow
    if (avatarSelectionMode === 'game') {
      setAvatarSelectionMode(null)
      setSelectedAvatarGame(null)
      setAvatarCovers([])
      setSelectedAvatarCoverUrl(null)
      setAvatarGameSearchQuery('')
      setIsLoadingSelectedAvatarCover(false)
    }
  }

  const resetAvatarSelectionFlow = () => {
    setAvatarSelectionMode(null)
    setSelectedAvatarGame(null)
    setAvatarCovers([])
    setSelectedAvatarCoverUrl(null)
    setAvatarGameSearchQuery('')
    setAvatarGameSearchResults([])
    setIsLoadingSelectedAvatarCover(false)
  }

  const handleCancelCrop = () => {
    setShowCoverCropper(false)
    setCoverFileForCrop(null)
    setCoverPreview((profile as any).cover_image_url || null)
    if (coverInputRef.current) coverInputRef.current.value = ''
    // Reset game hero selection flow
    if (coverSelectionMode === 'game') {
      setCoverSelectionMode(null)
      setSelectedGame(null)
      setHeroes([])
      setSelectedHeroUrl(null)
      setGameSearchQuery('')
      setIsLoadingSelectedHero(false)
    }
  }

  const resetCoverSelectionFlow = () => {
    setCoverSelectionMode(null)
    setSelectedGame(null)
    setHeroes([])
    setSelectedHeroUrl(null)
    setGameSearchQuery('')
    setGameSearchResults([])
  }

  const resetAllFlows = () => {
    resetCoverSelectionFlow()
    resetAvatarSelectionFlow()
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
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">This is how your name appears to other users</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">A short description about yourself</p>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Privacy
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-white font-title text-sm transition-colors ${
                  !isPrivate ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/50 hover:bg-slate-700 opacity-50'
                }`}
              >
                {/* Corner brackets */}
                <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                <span className="relative z-10">
                  &gt; PUBLIC
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-white font-title text-sm transition-colors ${
                  isPrivate ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/50 hover:bg-slate-700 opacity-50'
                }`}
              >
                {/* Corner brackets */}
                <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                <span className="relative z-10">
                  &gt; PRIVATE
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isPrivate 
                ? 'Your profile is private. Only you can see your profile details.'
                : 'Your profile is public. Anyone can view your profile.'}
            </p>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cover Image
            </label>
            
            {coverSelectionMode === null && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setCoverSelectionMode('upload')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10">
                    &gt; UPLOAD IMAGE
                  </span>
                </button>
                <button
                  onClick={() => setCoverSelectionMode('game')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10">
                    &gt; CHOOSE FROM GAME
                  </span>
                </button>
              </div>
            )}

            {coverSelectionMode === 'upload' && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={resetCoverSelectionFlow}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">Upload from device</span>
                </div>
                <div
                  className="h-32 overflow-hidden bg-slate-700/50 border-2 border-dashed border-slate-600 cursor-pointer hover:border-emerald-500/50 transition-colors"
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
                    className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {coverSelectionMode === 'game' && !selectedGame && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={resetCoverSelectionFlow}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">Search for a game</span>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      ref={gameSearchInputRef}
                      type="text"
                      value={gameSearchQuery}
                      onChange={(e) => setGameSearchQuery(e.target.value)}
                      placeholder="Search for a game..."
                      className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                    />
                    {isSearchingGames && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>
                  {gameSearchResults.length > 0 && (
                    <div className="absolute z-[60] w-full mt-1 bg-slate-800 border border-slate-700 max-h-60 overflow-y-auto">
                      {gameSearchResults.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedGame(game)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                        >
                          {game.coverUrl && (
                            <img
                              src={game.coverUrl}
                              alt={game.name}
                              className="w-12 h-16 object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{game.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {coverSelectionMode === 'game' && selectedGame && heroes.length === 0 && !isLoadingHeroes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">No heroes found for {selectedGame.name}</span>
                </div>
              </div>
            )}

            {coverSelectionMode === 'game' && selectedGame && isLoadingHeroes && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}

            {coverSelectionMode === 'game' && selectedGame && heroes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">Select a hero from {selectedGame.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {heroes.map((hero) => (
                    <button
                      key={hero.id}
                      onClick={() => handleHeroSelect(hero.url)}
                      disabled={isLoadingSelectedHero}
                      className="relative aspect-[16/9] overflow-hidden bg-slate-700/50 border-2 border-slate-600 hover:border-emerald-500/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img
                        src={hero.thumb}
                        alt={`Hero ${hero.id}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {isLoadingSelectedHero && selectedHeroUrl === hero.url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {coverSelectionMode === null && (coverPreview || (profile as any).cover_image_url) && !showCoverCropper && (
              <div className="relative mt-2">
                <div className="h-32 overflow-hidden bg-slate-700/50 border border-slate-600">
                  <img
                    src={coverPreview || (profile as any).cover_image_url || ''}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                {(coverFile || coverFileForCrop) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCoverFile(null)
                      setCoverFileForCrop(null)
                      setCoverPreview((profile as any).cover_image_url || null)
                      if (coverInputRef.current) coverInputRef.current.value = ''
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-1">Recommended: 1200x400px, max 10MB</p>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Picture
            </label>
            
            {avatarSelectionMode === null && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setAvatarSelectionMode('upload')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10">
                    &gt; UPLOAD IMAGE
                  </span>
                </button>
                <button
                  onClick={() => setAvatarSelectionMode('game')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10">
                    &gt; CHOOSE FROM GAME
                  </span>
                </button>
              </div>
            )}

            {avatarSelectionMode === 'upload' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={resetAvatarSelectionFlow}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">Upload from device</span>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-24 h-24 overflow-hidden bg-slate-700/50 border-2 border-dashed border-slate-600 cursor-pointer hover:border-emerald-500/50 transition-colors"
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
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative w-full"
                    >
                      {/* Corner brackets */}
                      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                      <span className="relative z-10">
                        &gt; CHOOSE IMAGE
                      </span>
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
            )}

            {avatarSelectionMode === 'game' && !selectedAvatarGame && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={resetAvatarSelectionFlow}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">Search for a game</span>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      ref={avatarGameSearchInputRef}
                      type="text"
                      value={avatarGameSearchQuery}
                      onChange={(e) => setAvatarGameSearchQuery(e.target.value)}
                      placeholder="Search for a game..."
                      className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                    />
                    {isSearchingAvatarGames && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>
                  {avatarGameSearchResults.length > 0 && (
                    <div className="absolute z-[60] w-full mt-1 bg-slate-800 border border-slate-700 max-h-60 overflow-y-auto">
                      {avatarGameSearchResults.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedAvatarGame(game)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                        >
                          {game.coverUrl && (
                            <img
                              src={game.coverUrl}
                              alt={game.name}
                              className="w-12 h-16 object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{game.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {avatarSelectionMode === 'game' && selectedAvatarGame && avatarCovers.length === 0 && !isLoadingAvatarCovers && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setSelectedAvatarGame(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">No covers found for {selectedAvatarGame.name}</span>
                </div>
              </div>
            )}

            {avatarSelectionMode === 'game' && selectedAvatarGame && isLoadingAvatarCovers && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}

            {avatarSelectionMode === 'game' && selectedAvatarGame && avatarCovers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setSelectedAvatarGame(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">Select a cover from {selectedAvatarGame.name}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {avatarCovers.map((cover) => (
                    <button
                      key={cover.id}
                      onClick={() => handleAvatarCoverSelect(cover.url)}
                      disabled={isLoadingSelectedAvatarCover}
                      className="relative aspect-[3/4] overflow-hidden bg-slate-700/50 border-2 border-slate-600 hover:border-emerald-500/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img
                        src={cover.thumb}
                        alt={`Cover ${cover.id}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {isLoadingSelectedAvatarCover && selectedAvatarCoverUrl === cover.url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {avatarSelectionMode === null && (avatarPreview || profile.avatar_url) && !showAvatarCropper && (
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 overflow-hidden bg-slate-700/50 border border-slate-600">
                  <img
                    src={avatarPreview || profile.avatar_url || ''}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {(avatarFile || avatarFileForCrop) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAvatarFile(null)
                        setAvatarFileForCrop(null)
                        setAvatarPreview(profile.avatar_url || null)
                        if (avatarInputRef.current) avatarInputRef.current.value = ''
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-1">Recommended: 400x400px, max 5MB</p>
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
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 text-white font-title text-sm transition-colors relative"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
              <span className="relative z-10">
                &gt; CANCEL
              </span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isUploading || 
                showCoverCropper || 
                showAvatarCropper || 
                (
                  !avatarFile && 
                  !coverFile && 
                  displayName.trim() === (profile.display_name || '').trim() &&
                  isPrivate === (profile.is_private || false) &&
                  bio.trim() === (profile.bio || '').trim()
                )
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-title text-sm transition-colors relative"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
              <span className="relative z-10 flex items-center gap-2">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    UPLOADING...
                  </>
                ) : (
                  <>&gt; SAVE CHANGES</>
                )}
              </span>
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

