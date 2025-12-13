# Tournaments V1 Implementation Notes

## ✅ Completed

### Database
- ✅ Migration file: `supabase/migrations/013_add_tournaments.sql`
- ✅ All tables created with proper constraints
- ✅ RLS policies configured
- ✅ Triggers for participant count and updated_at

### Types
- ✅ `src/types/tournaments.ts` - All TypeScript interfaces

### Utilities
- ✅ `src/lib/tournaments/bracket.ts` - Single elimination bracket generation
- ✅ `src/lib/tournaments/rewards.ts` - Badge and Pro days granting
- ✅ `src/lib/tournaments/validation.ts` - Zod schemas

### API Routes
- ✅ `GET /api/tournaments` - List tournaments
- ✅ `POST /api/tournaments` - Create tournament (Pro only)
- ✅ `GET /api/tournaments/[id]` - Get tournament details
- ✅ `POST /api/tournaments/[id]/register` - Register
- ✅ `POST /api/tournaments/[id]/withdraw` - Withdraw
- ✅ `POST /api/tournaments/[id]/check-in` - Check in
- ✅ `POST /api/tournaments/[id]/start` - Start tournament (host only)
- ✅ `POST /api/tournaments/[id]/matches/[matchId]/finalize` - Finalize match (host only)
- ✅ `POST /api/tournaments/[id]/matches/[matchId]/report` - Submit match report
- ✅ `GET /api/tournaments/[id]/matches/[matchId]/reports` - Get match reports (host only)

### Frontend
- ✅ `src/app/tournaments/page.tsx` - Tournament listing
- ✅ `src/app/tournaments/[id]/page.tsx` - Tournament detail
- ✅ `src/components/tournaments/TournamentCard.tsx` - Tournament card
- ✅ `src/components/tournaments/TournamentRegistrationPanel.tsx` - Registration UI
- ✅ `src/components/tournaments/TournamentMatchCard.tsx` - Match display

## 🔧 Setup Required

### 1. Supabase Storage Bucket
Create a storage bucket for match proof screenshots:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-proofs', 'tournament-proofs', false);
```

Storage policies:
- Participants can upload to their own match reports
- Hosts can view all reports
- Path format: `tournaments/{tournamentId}/matches/{matchId}/{userId}/{timestamp}.png`

### 2. Pro Entitlement Check
The API checks Pro status using:
```typescript
const isPro = profile.plan_tier === 'pro' || profile.plan_tier === 'founder'
const isProActive = isPro && (
  !profile.plan_expires_at || 
  new Date(profile.plan_expires_at) > new Date()
)
```

Ensure your `profiles` table has:
- `plan_tier` (text)
- `plan_expires_at` (timestamptz)

### 3. Lobby Creation
When a match is created, you may want to auto-create a lobby. This is not implemented yet but can be added in the `/start` route:

```typescript
// In start route, after creating matches
for (const match of matchesToInsert) {
  // Create lobby for match
  const { data: lobby } = await supabase
    .from('lobbies')
    .insert({
      host_id: tournament.host_id,
      game_id: tournament.game_id,
      game_name: tournament.game_name,
      title: `Tournament Match: ${match.round_number}-${match.match_number}`,
      platform: tournament.platform,
      max_players: 2,
      status: 'open',
    })
    .select()
    .single()

  // Link lobby to match
  await supabase
    .from('tournament_matches')
    .update({ lobby_id: lobby.id })
    .eq('tournament_id', tournamentId)
    .eq('round_number', match.round_number)
    .eq('match_number', match.match_number)
}
```

## 📝 Assumptions

1. **Pro Subscription**: Uses existing `plan_tier` and `plan_expires_at` fields in profiles table
2. **UTC Timestamps**: All dates stored and compared in UTC
3. **Lobby Integration**: Matches can link to existing lobbies, but auto-creation not implemented
4. **Storage**: Proof screenshots stored in Supabase Storage (bucket setup required)
5. **Rewards**: Pro days extend existing subscription, badges stored in `profile_badges` table
6. **Real-time**: Light real-time subscriptions for participants/matches (not implemented in frontend yet)

## 🚧 Not Implemented (V1 Scope)

- Match report UI (upload screenshots, submit reports)
- Host finalization UI
- Bracket visualization (complex UI)
- Real-time subscriptions in frontend
- Tournament creation UI/modal
- Storage upload handling
- Auto-lobby creation for matches

## 🎯 Next Steps

1. **Run Migration**: Apply `013_add_tournaments.sql` to Supabase
2. **Create Storage Bucket**: Set up `tournament-proofs` bucket
3. **Test API Routes**: Verify all endpoints work
4. **Add Tournament Creation UI**: Build create tournament form
5. **Add Match Reporting UI**: Upload screenshots, submit reports
6. **Add Host Finalization UI**: Review reports, finalize matches
7. **Add Real-time**: Subscribe to participant/match updates
8. **Add Navigation**: Link tournaments in navbar/menu

## 🔍 Testing Checklist

- [ ] Pro user can create tournament
- [ ] Free user cannot create tournament
- [ ] Users can register for open tournaments
- [ ] Registration closes at deadline
- [ ] Check-in works if required
- [ ] Host can start tournament with 8/16 checked-in participants
- [ ] Bracket generates correctly
- [ ] Participants can submit match reports
- [ ] Host can view reports
- [ ] Host can finalize matches
- [ ] Winners advance to next round
- [ ] Tournament completes when final match done
- [ ] Rewards granted correctly (badges, Pro days)
- [ ] Final placements recorded

## 📦 File Structure

```
supabase/migrations/
  └── 013_add_tournaments.sql

src/types/
  └── tournaments.ts

src/lib/tournaments/
  ├── bracket.ts
  ├── rewards.ts
  └── validation.ts

src/app/api/tournaments/
  ├── route.ts
  └── [id]/
      ├── route.ts
      ├── register/route.ts
      ├── withdraw/route.ts
      ├── check-in/route.ts
      ├── start/route.ts
      └── matches/[matchId]/
          ├── finalize/route.ts
          └── report/route.ts

src/app/tournaments/
  ├── page.tsx
  └── [id]/page.tsx

src/components/tournaments/
  ├── TournamentCard.tsx
  ├── TournamentRegistrationPanel.tsx
  └── TournamentMatchCard.tsx
```

## 🎨 UI Notes

- Status pills use color coding (green=open, blue=in_progress, etc.)
- Matches grouped by round for simple display
- Horizontal scroll on mobile for match cards
- No complex bracket visualization (V1 scope)
- Clear status indicators throughout

## ⚠️ Important Constraints Respected

✅ Single elimination only  
✅ 8 or 16 participants only  
✅ Free to join  
✅ Only Pro users can create  
❌ No money/payouts  
❌ No complex bracket formats  
❌ No heavy polling (mobile-safe)  
