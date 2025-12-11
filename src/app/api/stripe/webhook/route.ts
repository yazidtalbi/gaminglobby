import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Use service role key for webhooks (bypasses RLS)
// Fallback to anon key if service role not available (for development)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          // Get user_id from session metadata (set during checkout creation)
          const userId = session.metadata?.user_id
          if (userId) {
            // Add user_id to subscription metadata if not present
            if (!subscription.metadata.user_id) {
              await stripe.subscriptions.update(subscription.id, {
                metadata: { user_id: userId },
              })
              subscription.metadata.user_id = userId
            }
            
            // Immediately update profile to pro when checkout completes
            const isActive = subscription.status === 'active' || subscription.status === 'trialing'
            const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
            
            await supabase
              .from('profiles')
              .update({
                plan_tier: isActive ? 'pro' : 'free',
                plan_expires_at: isActive ? periodEnd : null,
              })
              .eq('id', userId)
          }
          
          await handleSubscriptionUpdate(subscription)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Try to get user_id from subscription metadata, or from customer metadata
  let userId = subscription.metadata.user_id
  
  if (!userId && subscription.customer) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      if (typeof customer !== 'deleted' && customer.metadata.supabase_user_id) {
        userId = customer.metadata.supabase_user_id
        // Update subscription metadata for future reference
        await stripe.subscriptions.update(subscription.id, {
          metadata: { user_id: userId },
        })
      }
    } catch (error) {
      console.error('Error retrieving customer:', error)
    }
  }
  
  if (!userId) {
    console.error('No user_id found in subscription or customer metadata')
    return
  }

  // Upsert subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    })

  if (subError) {
    console.error('Error upserting subscription:', subError)
    return
  }

  // Update profile plan_tier
  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan_tier: isActive ? 'pro' : 'free',
      plan_expires_at: isActive ? periodEnd : null,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Try to get user_id from subscription metadata, or from customer metadata
  let userId = subscription.metadata.user_id
  
  if (!userId && subscription.customer) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      if (typeof customer !== 'deleted' && customer.metadata.supabase_user_id) {
        userId = customer.metadata.supabase_user_id
      }
    } catch (error) {
      console.error('Error retrieving customer:', error)
    }
  }
  
  if (!userId) {
    console.error('No user_id found in subscription or customer metadata')
    return
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Update profile to free
  await supabase
    .from('profiles')
    .update({
      plan_tier: 'free',
      plan_expires_at: null,
    })
    .eq('id', userId)
}

// Disable body parsing for webhook route
export const runtime = 'nodejs'

