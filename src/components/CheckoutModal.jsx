/**
 * CheckoutModal — Stripe payment modal using CardElement + confirmCardPayment.
 *
 * Uses the classic CardElement flow (not PaymentElement) to avoid the
 * elements/sessions 401 that PaymentElement triggers on HTTP localhost.
 *
 * Flow:
 *  1. Modal opens → fetch PaymentIntent clientSecret from Supabase edge fn
 *  2. Render <Elements> (no clientSecret in options — avoids session handshake)
 *  3. User fills <CardElement> and clicks Pay
 *  4. stripe.confirmCardPayment(clientSecret, { card }) → success
 *  5. Mark user premium in Supabase → show success screen
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Check, Lock, CreditCard, ShieldCheck } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { supabase, SUPABASE_ENABLED } from "../lib/supabaseClient";

// Loaded once at module level — never inside a component or effect
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color:           "#f1f5f9",
      fontFamily:      "system-ui, -apple-system, sans-serif",
      fontSize:        "16px",
      fontSmoothing:   "antialiased",
      "::placeholder": { color: "#64748b" },
    },
    invalid: {
      color:     "#f87171",
      iconColor: "#f87171",
    },
  },
};

// ── Inner form (must be inside <Elements>) ────────────────────────────────────

function CardForm({ clientSecret, billing, userId, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const label = billing === "annual" ? "Pay $44.99 / year" : "Pay $4.99 / month";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    // confirmCardPayment talks directly to Stripe using the clientSecret.
    // It does NOT call elements/sessions — completely bypasses that 401.
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardElement } }
    );

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Show success immediately — don't block on the Supabase update
      onSuccess();

      // Fire-and-forget profile update in the background
      if (SUPABASE_ENABLED && userId) {
        supabase
          .from("profiles")
          .update({ is_premium: true, updated_at: new Date().toISOString() })
          .eq("id", userId)
          .then(() => {})
          .catch((err) => console.warn("[SKY] profile update failed:", err));
      }
    } else {
      setError("Payment did not complete. Status: " + paymentIntent?.status);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card input */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <><Lock className="h-4 w-4" /><span>{label}</span></>
        }
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        256-bit SSL · Secured by Stripe · Cancel anytime
      </p>
    </form>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

export default function CheckoutModal({ billing, user, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [fetchError,   setFetchError]   = useState(null);
  const [succeeded,    setSucceeded]    = useState(false);

  const userId   = user?.id ?? null;
  const perMonth = billing === "annual" ? "$3.75/mo" : "$4.99/mo";
  const total    = billing === "annual" ? "$44.99 / year" : "$4.99 / month";

  // Fetch PaymentIntent once when modal mounts
  useEffect(() => {
    let active = true;

    const url    = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apikey}`,
        "apikey":        apikey,
      },
      body: JSON.stringify({ plan: billing, userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setFetchError(data?.error ?? "No clientSecret in response.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setFetchError(err.message ?? "Network error — could not reach payment server.");
      });

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSuccess() {
    setSucceeded(true);
    setTimeout(() => { onSuccess(); onClose(); }, 2400);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !succeeded && onClose()}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.96, y: 8  }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl border border-slate-700/50 bg-slate-900 p-8 shadow-2xl"
      >
        {succeeded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20"
            >
              <Check className="h-8 w-8 text-emerald-400" strokeWidth={2.5} />
            </motion.div>
            <h2 className="text-xl font-bold text-white">You&rsquo;re all set!</h2>
            <p className="mt-2 text-sm text-slate-400">SkyDocket Pro is now active.</p>
          </motion.div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Upgrade to Pro</h2>
                <p className="text-xs text-slate-400">Peace of Mind Plan</p>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-white">
                  {billing === "annual" ? "Annual plan" : "Monthly plan"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {perMonth} · billed {billing === "annual" ? "annually" : "monthly"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-white">{total}</p>
                {billing === "annual" && (
                  <p className="text-xs font-medium text-emerald-400">Save 25%</p>
                )}
              </div>
            </div>

            {!clientSecret && !fetchError && (
              <div className="flex items-center justify-center gap-3 py-10">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-sm text-slate-400">Setting up secure payment…</span>
              </div>
            )}

            {fetchError && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4">
                <p className="text-sm font-semibold text-amber-300">Payment not available</p>
                <p className="mt-1 text-xs leading-5 text-amber-400/80">{fetchError}</p>
              </div>
            )}

            {/* <Elements> has NO clientSecret option — prevents elements/sessions call */}
            {clientSecret && (
              <Elements stripe={stripePromise}>
                <CardForm
                  clientSecret={clientSecret}
                  billing={billing}
                  userId={userId}
                  onSuccess={handleSuccess}
                />
              </Elements>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
