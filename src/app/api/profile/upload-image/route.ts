import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null // 'avatar' or 'cover'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!type || (type !== 'avatar' && type !== 'cover')) {
      return NextResponse.json({ error: 'Invalid type. Must be "avatar" or "cover"' }, { status: 400 })
    }
    
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Validate file size
    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size must be less than ${maxSize / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Generate file path: {userId}/{type}-{timestamp}.{ext}
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`
    
    console.log('Uploading file:', { fileName, size: file.size, type: file.type, userId: user.id })
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('Buffer created, size:', buffer.length)

    // Upload to storage (using authenticated user's session)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Provide helpful error messages
      if (uploadError.message.includes('new row violates row-level security')) {
        return NextResponse.json({ 
          error: 'Storage bucket not configured. Please set up storage policies in Supabase Dashboard.' 
        }, { status: 403 })
      }
      
      if (uploadError.message.includes('Bucket not found')) {
        return NextResponse.json({ 
          error: 'Storage bucket "avatars" not found. Please create it in Supabase Dashboard.' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: uploadError.message || 'Failed to upload image' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

