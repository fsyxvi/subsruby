import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event, context) => {
  const logPrefix = `[Webhook ${new Date().toISOString()}]`;
  
  console.log(`${logPrefix} Function started.`);
  console.log(`${logPrefix} Method: ${event.httpMethod}`);

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    console.log(`${logPrefix} Method not allowed.`);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error(`${logPrefix} Missing signature or webhook secret.`);
      throw new Error('Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
    }

    console.log(`${logPrefix} Verifying signature...`);
    stripeEvent = stripe.webhooks.constructEvent(event.body || '', sig, webhookSecret);
    console.log(`${logPrefix} Signature verified. Event type: ${stripeEvent.type}`);

  } catch (err: any) {
    console.error(`${logPrefix} Webhook signature verification failed:`, err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    console.log(`${logPrefix} Processing checkout.session.completed`);
    console.log(`${logPrefix} Session ID:`, session.id);
    console.log(`${logPrefix} Customer Email:`, session.customer_email);
    console.log(`${logPrefix} Client Reference ID (User ID):`, session.client_reference_id);
    console.log(`${logPrefix} Metadata:`, JSON.stringify(session.metadata, null, 2));

    const userId = session.client_reference_id;
    const userEmail = session.customer_email;

    if (!userId && !userEmail) {
      console.error(`${logPrefix} No user ID or email found in session.`);
      return { statusCode: 400, body: 'No user identification found' };
    }

    try {
      console.log(`${logPrefix} Preparing Supabase update for table 'profiles'...`);
      
      let query = supabase.from('profiles').update({ 
        has_lifetime_access: true
      });

      if (userId) {
        console.log(`${logPrefix} Searching user by ID: ${userId}`);
        query = query.eq('id', userId);
      } else if (userEmail) {
        console.log(`${logPrefix} Searching user by Email: ${userEmail}`);
        query = query.eq('email', userEmail);
      }

      // Explicitly select and cast to any to avoid deep type instantiation errors
      console.log(`${logPrefix} Executing Supabase query...`);
      const result = await query.select();
      
      // Safe destructuring with type assertion
      const { data, error } = result as { data: any[] | null, error: any };

      if (error) {
        console.error(`${logPrefix} Supabase update ERROR:`, JSON.stringify(error, null, 2));
        throw error;
      }

      console.log(`${logPrefix} Supabase update SUCCESS. Data returned:`, JSON.stringify(data, null, 2));

      // Safe null check
      if (!data || data.length === 0) {
        console.warn(`${logPrefix} WARNING: Update query succeeded but no rows were returned. User might not exist or RLS blocked the update.`);
      } else {
        console.log(`${logPrefix} User successfully updated to Pro (has_lifetime_access: true).`);
      }

    } catch (dbError: any) {
      console.error(`${logPrefix} Database operation failed:`, dbError.message);
      return { statusCode: 500, body: 'Database update failed' };
    }
  } else {
    console.log(`${logPrefix} Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
