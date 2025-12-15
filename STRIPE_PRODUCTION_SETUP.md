# Stripe Production Setup Guide

## Switching from Test to Production Keys

Once you've tested your Stripe integration with test keys (`sk_test_` and `pk_test_`), you'll need to switch to production keys for live payments.

## Required Environment Variables

Update your `.env.local` file (or production environment variables) with the following:

### 1. Stripe Secret Key
```env
# Replace test key (sk_test_...) with production key (sk_live_...)
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
```

**Where to find it:**
- Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- Make sure you're in **Live mode** (toggle in top right)
- Copy your **Secret key** (starts with `sk_live_`)

### 2. Stripe Publishable Key (if needed)
```env
# Only needed if you use client-side Stripe.js
# Currently not used in this codebase (using server-side checkout)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
```

**Where to find it:**
- Same Stripe Dashboard page
- Copy your **Publishable key** (starts with `pk_live_`)

### 3. Stripe Webhook Secret
```env
# Replace test webhook secret with production webhook secret
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```

**Where to find it:**
- Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
- Make sure you're in **Live mode**
- Create a new webhook endpoint (or use existing):
  - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
  - Events to listen to:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
- Click on the webhook endpoint
- Copy the **Signing secret** (starts with `whsec_`)

### 4. Stripe Price ID
```env
# Replace test price ID with production price ID
STRIPE_PRO_PRICE_ID=price_YOUR_PRODUCTION_PRICE_ID
```

**Where to find it:**
- Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
- Make sure you're in **Live mode**
- Find your Pro subscription product
- Copy the **Price ID** (starts with `price_`)

**Note:** You'll need to create the product/price in Live mode if you haven't already. It should match your test product structure.

## Complete .env.local Example

```env
# Supabase (keep existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# Other existing variables...
```

## Important Steps

1. **Create Production Product in Stripe:**
   - Go to Stripe Dashboard (Live mode)
   - Create a product for "Apex" subscription
   - Set price to $4.99/month (or your desired price)
   - Copy the Price ID

2. **Set Up Production Webhook:**
   - Create webhook endpoint pointing to your production URL
   - Select required events
   - Copy the webhook signing secret

3. **Update Environment Variables:**
   - Update `.env.local` for local testing (optional, can keep test keys)
   - Update production environment variables (Vercel, etc.)
   - **Never commit production keys to git!**

4. **Test in Production:**
   - Use Stripe's test card numbers in test mode first
   - Then test with real card in live mode (small amount recommended)
   - Monitor webhook events in Stripe Dashboard

## Security Notes

- ✅ **Never commit** `.env.local` or production keys to git
- ✅ Use environment variables in your hosting platform (Vercel, etc.)
- ✅ Keep test and production keys separate
- ✅ Rotate keys if compromised
- ✅ Use Stripe's test mode for development

## Verification Checklist

- [ ] Production secret key starts with `sk_live_`
- [ ] Production webhook secret starts with `whsec_`
- [ ] Production price ID starts with `price_`
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook events selected: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Production environment variables set in hosting platform
- [ ] Tested checkout flow in production mode

## Troubleshooting

### Webhook not receiving events?
- Check webhook URL is accessible (not localhost)
- Verify webhook secret matches
- Check Stripe Dashboard > Webhooks for delivery logs
- Ensure webhook endpoint returns 200 status

### Checkout not working?
- Verify `STRIPE_SECRET_KEY` is production key
- Check `STRIPE_PRO_PRICE_ID` exists in live mode
- Ensure API version matches (currently `2025-11-17.clover`)

### Subscription not activating?
- Check webhook is receiving events
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (for webhook to update database)
- Check database logs for errors
