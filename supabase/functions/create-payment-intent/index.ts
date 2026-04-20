/**
 * create-payment-intent — Supabase Edge Function
 *
 * Creates a Stripe PaymentIntent server-side so the secret key never
 * touches the browser. Returns only the client_secret, which the
 * frontend uses to confirm the payment via Stripe Elements.
 *
 * Deploy:
 *   supabase functions deploy create-payment-intent
 *
 * Set secret (once):
 *   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
 *
 * Body: { plan: "monthly" | "annual", userId: string | null }
 * Response: { clientSecret: string }
 */

import Stripe from "https://esm.sh/stripe@14?target=deno";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICES: Record<string, number> = {
  monthly: 499,   // $4.99  in cents
  annual:  4499,  // $44.99 in cents
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // Read the secret key inside the handler so Supabase secrets set takes
    // effect on the next request without requiring a full redeployment.
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");

    // Log the key prefix so we can confirm which account is active in function logs.
    // Only the first 20 chars are logged — safe to log (just the pk/sk prefix).
    console.log("[SKY] STRIPE_SECRET_KEY prefix:", secretKey?.slice(0, 20) ?? "NOT SET");

    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY is not set. Run: supabase secrets set STRIPE_SECRET_KEY=sk_test_..." }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore — Deno-compatible fetch client required
    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: "2024-04-10",
    });

    const { plan = "monthly", userId = null } = await req.json();
    const amount = PRICES[plan] ?? PRICES.monthly;

    console.log("[SKY] Creating PaymentIntent — plan:", plan, "amount:", amount, "userId:", userId);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        plan,
        userId: userId ?? "guest",
        app: "skydocket",
      },
    });

    console.log("[SKY] PaymentIntent created:", intent.id, "| client_secret prefix:", intent.client_secret?.slice(0, 25));

    return new Response(
      JSON.stringify({ clientSecret: intent.client_secret }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SKY] create-payment-intent error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
