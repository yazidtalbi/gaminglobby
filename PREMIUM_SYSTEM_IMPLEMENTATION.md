# Premium System Implementation Guide

## ✅ Completed

### 1. Database Schema (`009_add_premium_system.sql`)
- ✅ Added premium fields to `profiles` table:
  - `plan_tier` ('free' | 'pro')
  - `plan_expires_at`
  - `stripe_customer_id`
  - `banner_url`
  - `custom_tags` (text[])
- ✅ Created `subscriptions` table for Stripe subscription tracking
- ✅ Created `collections` table for user game collections
- ✅ Created `collection_items` table for collection items
- ✅ Enhanced `lobbies` table with premium features:
  - `auto_invite_enabled`
  - `visibility` ('public' | 'followers_only' | 'invite_only')
  - `region`, `language`, `role_tags`
  - `is_boosted`
- ✅ Added RLS policies for all new tables
- ✅ Created helper functions: `is_pro_user()`, `update_subscription_status()`

### 2. Premium Utilities (`src/lib/premium.ts`)
- ✅ `isPro()` function to check active Pro status
- ✅ `requiresPro()` function to check feature requirements

### 3. Premium Components
- ✅ `PremiumLockOverlay` component for gating UI
- ✅ `usePremium` hook for client-side premium checks

### 4. Stripe Integration
- ✅ `POST /api/billing/create-checkout-session` - Creates Stripe checkout
- ✅ `POST /api/stripe/webhook` - Handles subscription events
- ✅ Billing page (`/billing`) with plan comparison

### 5. Collections System
- ✅ `GET /api/collections` - List collections
- ✅ `POST /api/collections` - Create collection (Pro only)
- ✅ `GET /api/collections/[id]` - Get collection details
- ✅ `PATCH /api/collections/[id]` - Update collection
- ✅ `DELETE /api/collections/[id]` - Delete collection
- ✅ `POST /api/collections/[id]/items` - Add item to collection
- ✅ `DELETE /api/collections/[id]/items` - Remove item from collection
- ✅ `CollectionsList` component

### 6. Lobby Premium Features
- ✅ Auto-invite API route (`POST /api/lobbies/auto-invite`)
- ✅ Enhanced quick-create to support `auto_invite_enabled`

## 🚧 Next Steps

### 1. Collections UI
- [ ] Collection creation page (`/u/[id]/collections/new`)
- [ ] Collection detail page (`/u/[id]/collections/[collectionId]`)
- [ ] Add/remove games from collection UI
- [ ] Collection cloning feature
- [ ] Collection merging feature
- [ ] Collection stats (Pro only)

### 2. Lobby Creation Enhancement
- [ ] Full lobby creation page with premium options
- [ ] Auto-invite toggle in lobby creation
- [ ] Visibility settings (public/followers_only/invite_only)
- [ ] Region/language/role tags selection
- [ ] Lobby boost feature

### 3. Profile Premium Features
- [ ] Banner upload/selection UI
- [ ] Custom tags management
- [ ] Premium badge display
- [ ] Profile theme customization

### 4. Events System Enhancement
- [ ] Pro users can create events
- [ ] Featured events for weekly winners
- [ ] Event creation UI with premium gating

### 5. Library Insights (Pro)
- [ ] Stats dashboard component
- [ ] Most played games
- [ ] Playtime tracking (if implemented)
- [ ] Collection completion rates

### 6. Environment Variables
Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (for webhooks)
```

## 📝 Usage Examples

### Check Premium Status
```tsx
import { usePremium } from '@/hooks/usePremium'

function MyComponent() {
  const { isPro } = usePremium()
  
  if (!isPro) {
    return <PremiumLockOverlay feature="collections" />
  }
  
  return <CollectionsList />
}
```

### Create Collection (Pro Only)
```tsx
const response = await fetch('/api/collections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Favorites',
    description: 'Best games',
    is_public: true,
    is_pinned: false,
  }),
})
```

### Enable Auto-Invite on Lobby
```tsx
// When creating lobby
const response = await fetch('/api/lobbies/quick-create', {
  method: 'POST',
  body: JSON.stringify({
    gameId,
    gameName,
    platform,
    userId,
    autoInviteEnabled: true, // Pro only
  }),
})

// Trigger auto-invite
await fetch('/api/lobbies/auto-invite', {
  method: 'POST',
  body: JSON.stringify({
    lobbyId,
    gameId,
    minutesThreshold: 15,
  }),
})
```

## 🔒 Premium Gating Pattern

Always check Pro status before allowing premium features:

```tsx
import { isPro } from '@/lib/premium'

// Server-side
const { data: profile } = await supabase
  .from('profiles')
  .select('plan_tier, plan_expires_at')
  .eq('id', userId)
  .single()

if (!isPro(profile)) {
  return NextResponse.json(
    { error: 'Pro subscription required' },
    { status: 403 }
  )
}
```

## 🎯 Key Features by Tier

### Free Users
- ✅ Unlimited game library
- ✅ Join lobbies & events
- ✅ Follow other players
- ✅ View public collections

### Pro Users
- ✅ Everything in Free
- ✅ Unlimited collections
- ✅ Pin collections
- ✅ Create & feature events
- ✅ Auto-invite system
- ✅ Lobby boosts
- ✅ Profile banners & themes
- ✅ Custom tags
- ✅ Library insights
- ✅ Advanced filters

