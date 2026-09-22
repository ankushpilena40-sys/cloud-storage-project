"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        }
      );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Password reset link has been sent to your email."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 px-4 py-10">

      <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center">

        <div className="w-full rounded-3xl border border-cyan-400/20 bg-white/[0.07] p-7 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-9">

          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl shadow-[0_0_30px_rgba(34,211,238,0.18)]">
            🔐
          </div>

          {/* Heading */}
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold text-white">
              Forgot Password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter your registered email address and
              we'll send you a secure password reset link.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300">
                {message}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(14,165,233,0.25)] transition hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(14,165,233,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending Reset Link..."
                : "Send Reset Link"}
            </button>
          </form>

          {/* Back */}
          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/login";
              }}
              className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to Login
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}