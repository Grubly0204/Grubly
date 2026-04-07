import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status; // active, trialing, past_due, canceled, etc.

  // Map Stripe status to our subscription_status enum
  let appStatus: string;
  if (status === "active") appStatus = "active";
  else if (status === "trialing") appStatus = "trialing";
  else if (status === "past_due") appStatus = "past_due";
  else appStatus = "canceled";

  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: appStatus,
      stripe_subscription_id: subscription.id,
      subscription_ends_at: currentPeriodEnd,
      ...(trialEnd ? { trial_ends_at: trialEnd } : {}),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscription(subscription);
        }
        break;
      }

      default:
        // Ignore other events
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
