import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { isPro } from '@/lib/premium'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Verify the session belongs to this user (check metadata)
    const sessionUserId = session.metadata?.user_id
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Session missing user_id metadata' }, { status: 400 })
    }
    
    if (sessionUserId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 })
    }

    // If payment is successful and we have a subscription, update the user to Pro
    if (session.payment_status === 'paid' && session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
        
        // Update subscription record
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: periodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_subscription_id',
          })

        // Update profile to Pro
        await supabase
          .from('profiles')
          .update({
            plan_tier: 'pro',
            plan_expires_at: periodEnd,
          })
          .eq('id', user.id)
      }
    }

    // Get updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier, plan_expires_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      isPro: isPro(profile),
      sessionStatus: session.payment_status,
      updated: true
    })
  } catch (error) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}

