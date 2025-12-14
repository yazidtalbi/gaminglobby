import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/matches/[matchId]/upload-proof - Upload match proof screenshot
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const tournamentId = params.id
    const matchId = params.matchId

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a participant in this match
    const { data: match } = await supabase
      .from('tournament_matches')
      .select('participant1_id, participant2_id')
      .eq('id', matchId)
      .eq('tournament_id', tournamentId)
      .single()

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const { data: participant } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .single()

    if (!participant || (participant.id !== match.participant1_id && participant.id !== match.participant2_id)) {
      return NextResponse.json(
        { error: 'Not a participant in this match' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Generate file path: tournaments/{tournamentId}/matches/{matchId}/{userId}/{timestamp}.{ext}
    const fileExt = file.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const fileName = `tournaments/${tournamentId}/matches/${matchId}/${user.id}/${timestamp}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage (tournament-proofs bucket, private)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tournament-proofs')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload proof' },
        { status: 500 }
      )
    }

    // Return the path (not public URL, as bucket is private)
    // The path will be used in proof_paths array
    return NextResponse.json({
      path: uploadData.path,
      message: 'Proof uploaded successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
