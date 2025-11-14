/**
 * STRIPE CONFIGURATION
 * 
 * Product and pricing configuration for Stripe integration.
 * Maps tier system to Stripe product IDs and pricing.
 * 
 * Setup Instructions:
 * 1. Create these products in Stripe dashboard
 * 2. Copy product IDs to this file
 * 3. Environment variables for sensitive data: STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY
 * 
 * Tiers:
 * - Starter: Free (no Stripe product)
 * - Professional: $19/mo or $180/yr
 * - Premium: $49/mo or $399/yr
 * - Enterprise: Custom pricing (contact sales)
 * 
 * Add-ons:
 * - Extra analysis: $2-3 each
 * - Interview coaching: $15-25 per session
 * - Export pack: $5
 */

// ============================================
// TIER PRODUCTS
// ============================================

export const STRIPE_TIER_PRODUCTS = {
  starter: {
    name: 'Relevnt Starter',
    description: 'Free tier - 5 analyses per month',
    priceId: null, // No payment needed
  },
  
  pro_monthly: {
    name: 'Relevnt Professional - Monthly',
    description: 'Professional - $19/month - 50 analyses per month',
    productId: 'prod_professional_monthly', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_professional_monthly', // UPDATE: Replace with actual Stripe price ID
    amount: 1900, // $19.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '50 analyses per month',
      'Resume optimizer',
      'Interview prep',
      'Skill gap analysis',
      'Application tracking',
      '48h priority support',
    ],
  },
  
  pro_annual: {
    name: 'Relevnt Professional - Annual',
    description: 'Professional - $180/year - 50 analyses per month',
    productId: 'prod_professional_annual', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_professional_annual', // UPDATE: Replace with actual Stripe price ID
    amount: 18000, // $180.00 in cents
    currency: 'usd',
    interval: 'year',
    features: [
      '50 analyses per month',
      'Resume optimizer',
      'Interview prep',
      'Skill gap analysis',
      'Application tracking',
      '48h priority support',
      'Save $48 vs monthly',
    ],
  },
  
  premium_monthly: {
    name: 'Relevnt Premium - Monthly',
    description: 'Premium - $49/month - Unlimited analyses',
    productId: 'prod_premium_monthly', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_premium_monthly', // UPDATE: Replace with actual Stripe price ID
    amount: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited analyses',
      'All Pro features',
      'Analytics dashboard',
      'Narrative coaching',
      '24h priority support',
      'Early access to new features',
    ],
  },
  
  premium_annual: {
    name: 'Relevnt Premium - Annual',
    description: 'Premium - $399/year - Unlimited analyses',
    productId: 'prod_premium_annual', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_premium_annual', // UPDATE: Replace with actual Stripe price ID
    amount: 39900, // $399.00 in cents
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited analyses',
      'All Pro features',
      'Analytics dashboard',
      'Narrative coaching',
      '24h priority support',
      'Early access to new features',
      'Save $588 vs monthly',
    ],
  },
  
  enterprise: {
    name: 'Relevnt Enterprise',
    description: 'Enterprise - Custom pricing - White-label + API',
    productId: 'prod_enterprise', // UPDATE: Replace with actual Stripe product ID
    contact: true,
    features: [
      'Custom pricing',
      'White-label options',
      'API access',
      'Bulk user licenses',
      'Dedicated support',
      'Custom integrations',
    ],
  },
} as const;

// ============================================
// ADD-ON PRODUCTS
// ============================================

export const STRIPE_ADD_ON_PRODUCTS = {
  extra_analysis: {
    name: 'Extra Analysis',
    description: 'One additional job/resume analysis',
    productId: 'prod_extra_analysis', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_extra_analysis', // UPDATE: Replace with actual Stripe price ID
    amount: 200, // $2.00 in cents
    currency: 'usd',
    tier: 'starter',
    maxPerMonth: 100,
  },
  
  interview_coaching: {
    name: 'Interview Coaching Session',
    description: '30-minute interview prep session with AI coach',
    productId: 'prod_interview_coaching', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_interview_coaching', // UPDATE: Replace with actual Stripe price ID
    amount: 1500, // $15.00 in cents
    currency: 'usd',
    tier: 'pro',
  },
  
  export_pack: {
    name: 'Export Pack',
    description: 'Export analyses to PDF, ATS formats, and more',
    productId: 'prod_export_pack', // UPDATE: Replace with actual Stripe product ID
    priceId: 'price_export_pack', // UPDATE: Replace with actual Stripe price ID
    amount: 500, // $5.00 in cents
    currency: 'usd',
    tier: 'starter',
  },
} as const;

// ============================================
// COUPONS & PROMOS
// ============================================

export const STRIPE_COUPONS = {
  edu_promo_6mo: {
    name: 'EDUPROMO6MO',
    description: '6 months free Professional tier for .edu emails',
    couponId: 'EDUPROMO6MO', // UPDATE: Create in Stripe dashboard
    percentOff: 100,
    durationMonths: 6,
  },
  
  early_adopter: {
    name: 'EARLYBIRD',
    description: 'Early adopter 30% discount (one-time)',
    couponId: 'EARLYBIRD', // UPDATE: Create in Stripe dashboard
    percentOff: 30,
    maxRedemptions: 100,
  },
} as const;

// ============================================
// WEBHOOK EVENTS TO LISTEN FOR
// ============================================

export const STRIPE_WEBHOOK_EVENTS = [
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.created',
  'invoice.finalized',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'charge.succeeded',
  'charge.failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'coupon.created',
  'coupon.updated',
  'coupon.deleted',
] as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get tier details by tier name
 */
export function getTierProduct(tier: 'pro' | 'premium', interval: 'month' | 'year' = 'month') {
  const key = `${tier}_${interval}` as keyof typeof STRIPE_TIER_PRODUCTS;
  return STRIPE_TIER_PRODUCTS[key];
}

/**
 * Get total price for a tier (accounting for annual discount)
 */
export function getTierPrice(tier: 'pro' | 'premium', interval: 'month' | 'year' = 'month') {
  const product = getTierProduct(tier, interval);
  if (!product || !('amount' in product)) return null;
  return product.amount / 100; // Convert cents to dollars
}

/**
 * Get annual savings compared to monthly
 */
export function getAnnualSavings(tier: 'pro' | 'premium'): number {
  const monthly = getTierPrice(tier, 'month');
  const annual = getTierPrice(tier, 'year');
  if (!monthly || !annual) return 0;
  return Math.round((monthly * 12 - annual) * 100) / 100;
}

/**
 * Format price for display
 */
export function formatPrice(
  amount: number,
  currency: string = 'usd',
  interval?: 'month' | 'year'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  });

  const intervalStr = interval ? `/${interval === 'year' ? 'year' : 'month'}` : '';
  return `${formatter.format(amount / 100)}${intervalStr}`;
}

/**
 * Check if product ID is valid (not placeholder)
 */
export function isProductIdValid(productId: string | null): boolean {
  if (!productId) return false;
  return !productId.includes('prod_') && productId.startsWith('prod_');
}

// ============================================
// CONFIGURATION CHECKLIST
// ============================================

export const STRIPE_SETUP_CHECKLIST = [
  '[ ] Create Starter tier product (free, no price)',
  '[ ] Create Professional Monthly product ($19/mo)',
  '[ ] Create Professional Annual product ($180/yr)',
  '[ ] Create Premium Monthly product ($49/mo)',
  '[ ] Create Premium Annual product ($399/yr)',
  '[ ] Create Enterprise product (contact sales)',
  '[ ] Create Extra Analysis add-on ($2 each)',
  '[ ] Create Interview Coaching add-on ($15)',
  '[ ] Create Export Pack add-on ($5)',
  '[ ] Create EDU promo coupon (100% off 6 months)',
  '[ ] Create Early Adopter coupon (30% off)',
  '[ ] Set up webhook endpoint (/api/webhooks/stripe)',
  '[ ] Add all product IDs to this config file',
  '[ ] Add all price IDs to this config file',
  '[ ] Test subscription flow in Stripe test mode',
  '[ ] Verify webhooks are firing correctly',
  '[ ] Set Stripe API keys in environment variables',
] as const;
