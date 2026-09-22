"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "This password reset link is invalid or has expired."
        );
      }

      setChecking(false);
    }

    void checkSession();
  }, [supabase]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Password updated successfully! Redirecting to login..."
    );

    setLoading(false);

    setTimeout(() => {
      window.location.href = "/login";
    }, 1800);
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-4 text-sm text-slate-400">
            Verifying reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] px-5 text-white">

      {/* Background */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="absolute right-[-8%] top-[20%] h-[28rem] w-[28rem] rounded-full bg-blue-600/15 blur-3xl" />

        <div className="absolute bottom-[-15%] left-[35%] h-[30rem] w-[30rem] rounded-full bg-indigo-600/15 blur-3xl" />

      </div>

      {/* Header */}

      <header className="relative z-10 flex items-center justify-between px-1 py-6 sm:px-5">

        <button
          type="button"
          onClick={() => {
            window.location.href = "/login";
          }}
          className="text-sm font-medium text-slate-400 transition hover:text-cyan-400"
        >
          ← Back to Login
        </button>

        <div className="flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-white/10 text-xl">
            ☁️
          </div>

          <span className="font-bold">
            Cloud{" "}
            <span className="text-cyan-400">
              Storage
            </span>
          </span>

        </div>

      </header>

      {/* Main */}

      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center">

        <div className="w-full max-w-md">

          <div className="rounded-[2rem] border border-white/15 bg-white/[0.07] p-7 shadow-[0_0_70px_rgba(0,140,255,0.18)] backdrop-blur-2xl sm:p-9">

            {/* Icon */}

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-3xl shadow-[0_0_35px_rgba(0,217,255,0.25)]">
                🔑
              </div>

              <h1 className="mt-6 text-3xl font-bold">
                Reset{" "}
                <span className="text-cyan-400">
                  Password
                </span>
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Create a new secure password for
                your Cloud Storage account.
              </p>

            </div>

            {/* Invalid link */}

            {error &&
              !password &&
              !confirmPassword && (
                <div className="mt-7 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* New password */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-200">
                  New Password
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-cyan-400">
                    🔒
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />

                </div>

              </div>

              {/* Confirm password */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Confirm Password
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-cyan-400">
                    🔐
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />

                </div>

              </div>

              {/* Error */}

              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Success */}

              {message && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {message}
                </div>
              )}

              {/* Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl border border-cyan-300/40 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(0,217,255,0.25)] transition hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(0,217,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Updating Password..."
                  : "Update Password →"}
              </button>

            </form>

            {/* Footer */}

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

      </div>

    </main>
  );
}