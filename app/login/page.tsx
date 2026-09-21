"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 8
      ? 35
      : password.length < 12
      ? 70
      : 100;

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    if (isSignup) {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Signup successful! Agar email confirmation enabled hai, apni email check karo."
        );
      }
    } else {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-18px);
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(-12px) rotate(4deg);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(1);
          }

          50% {
            opacity: 0.75;
            transform: scale(1.12);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(120%);
          }
        }

        @keyframes starMove {
          0%,
          100% {
            opacity: 0.25;
          }

          50% {
            opacity: 0.9;
          }
        }

        .float {
          animation: float 4s ease-in-out infinite;
        }

        .float-slow {
          animation: floatSlow 5s ease-in-out infinite;
        }

        .pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .orbit {
          animation: orbit 16s linear infinite;
        }

        .shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }

        .star {
          animation: starMove 3s ease-in-out infinite;
        }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="absolute right-[-8%] top-[15%] h-[28rem] w-[28rem] rounded-full bg-blue-600/15 blur-3xl" />

        <div className="absolute bottom-[-15%] left-[35%] h-[30rem] w-[30rem] rounded-full bg-indigo-600/15 blur-3xl" />

        {/* Stars */}
        <div className="star absolute left-[12%] top-[18%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />

        <div
          className="star absolute left-[28%] top-[12%] h-1 w-1 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.9)]"
          style={{ animationDelay: "0.8s" }}
        />

        <div
          className="star absolute right-[20%] top-[22%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
          style={{ animationDelay: "1.4s" }}
        />

        <div
          className="star absolute right-[35%] bottom-[22%] h-1 w-1 rounded-full bg-purple-300 shadow-[0_0_10px_rgba(216,180,254,0.9)]"
          style={{ animationDelay: "2s" }}
        />

        <div
          className="star absolute left-[8%] bottom-[30%] h-1 w-1 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.9)]"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      {/* Top branding */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-white/10 text-2xl shadow-[0_0_25px_rgba(0,217,255,0.25)] backdrop-blur-xl">
            ☁️
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight">
              Cloud{" "}
              <span className="text-cyan-400">
                Storage
              </span>
            </div>

            <div className="hidden text-[10px] tracking-[0.25em] text-slate-500 sm:block">
              SECURE • FAST • EVERYWHERE
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-5 text-xs tracking-wider text-slate-400 sm:flex">
          <span>Secure</span>
          <span className="text-cyan-400">•</span>
          <span>Fast</span>
          <span className="text-cyan-400">•</span>
          <span>Reliable</span>
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center justify-center px-5 pb-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_430px_1fr]">

          {/* Left information */}
          <section className="hidden lg:block">
            <p className="mb-3 text-sm font-medium tracking-[0.25em] text-cyan-400">
              YOUR FILES
            </p>

            <h2 className="max-w-md text-5xl font-bold leading-tight tracking-tight">
              Always
              <br />
              <span className="text-cyan-400 drop-shadow-[0_0_18px_rgba(0,217,255,0.35)]">
                With You
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-base leading-7 text-slate-400">
              Store, access and share your files
              securely in the cloud, from anywhere
              in the world.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xl shadow-[0_0_20px_rgba(0,217,255,0.15)]">
                  🛡️
                </div>

                <div>
                  <p className="font-semibold">
                    Secure
                  </p>
                  <p className="text-sm text-slate-500">
                    Your data is protected
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  ⚡
                </div>

                <div>
                  <p className="font-semibold">
                    Fast
                  </p>
                  <p className="text-sm text-slate-500">
                    Lightning quick access
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-400/10 text-xl shadow-[0_0_20px_rgba(99,91,255,0.15)]">
                  ☁️
                </div>

                <div>
                  <p className="font-semibold">
                    Anywhere
                  </p>
                  <p className="text-sm text-slate-500">
                    On all your devices
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Login card */}
          <section className="relative">
            {/* Card glow */}
            <div className="pulse-glow absolute -inset-8 rounded-[3rem] bg-cyan-400/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-7 shadow-[0_0_70px_rgba(0,140,255,0.18)] backdrop-blur-2xl sm:p-9">

              {/* Top shine */}
              <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80" />

              <div className="text-center">
                <div className="float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-4xl shadow-[0_0_35px_rgba(0,217,255,0.25)]">
                  ☁️
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight">
                  Cloud{" "}
                  <span className="text-cyan-400">
                    Storage
                  </span>
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  {isSignup
                    ? "Create your account"
                    : "Sign in to your account"}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-4"
              >
                {isSignup && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="Enter your name"
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-white placeholder:text-slate-500 outline-none transition duration-300 focus:border-cyan-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Email
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-cyan-400">
                      ✉
                    </span>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none transition duration-300 focus:border-cyan-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-cyan-400">
                      🔒
                    </span>

                    <input
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      minLength={6}
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none transition duration-300 focus:border-cyan-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800/80">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              passwordStrength <= 35
                                ? "w-1/3 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                                : passwordStrength <= 70
                                ? "w-2/3 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.7)]"
                                : "w-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)]"
                            }`}
                          />
                        </div>

                        <span
                          className={`min-w-[64px] text-right text-xs font-semibold ${
                            passwordStrength <= 35
                              ? "text-red-400"
                              : passwordStrength <= 70
                              ? "text-yellow-300"
                              : "text-green-400"
                          }`}
                        >
                          {passwordStrength <= 35
                            ? "Weak"
                            : passwordStrength <= 70
                            ? "Medium"
                            : "Strong"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {message && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-sm text-slate-300">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 w-full overflow-hidden rounded-xl border border-cyan-300/40 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(0,217,255,0.25)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(0,217,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="shimmer absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-white/20 blur-md" />

                  <span className="relative">
                    {loading
                      ? "Please wait..."
                      : isSignup
                      ? "Create Account →"
                      : "Sign In →"}
                  </span>
                </button>
              </form>

              <div className="mt-7 text-center text-sm">
                <span className="text-slate-500">
                  {isSignup
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setMessage("");
                  }}
                  className="ml-2 font-semibold text-cyan-400 underline decoration-cyan-400/30 underline-offset-4 transition hover:text-cyan-300"
                >
                  {isSignup
                    ? "Sign In"
                    : "Sign Up"}
                </button>
              </div>

              <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-600">
                <span>🔐</span>
                <span>
                  Your files stay private and secure
                </span>
              </div>
            </div>
          </section>

          {/* Right visual */}
          <section className="relative hidden h-[500px] lg:block">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="orbit absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" />

              <div className="pulse-glow absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

              {/* Cloud */}
              <div className="float-slow relative flex h-48 w-64 items-center justify-center">
                <div className="absolute bottom-5 h-24 w-56 rounded-full border border-cyan-200/60 bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-indigo-600/25 shadow-[0_0_55px_rgba(0,217,255,0.4)] backdrop-blur-xl" />

                <div className="absolute left-10 top-14 h-24 w-24 rounded-full border border-cyan-200/50 bg-blue-500/20" />

                <div className="absolute left-24 top-5 h-32 w-32 rounded-full border border-cyan-200/60 bg-cyan-400/15 shadow-[0_0_35px_rgba(0,217,255,0.35)]" />

                <div className="absolute right-8 top-14 h-24 w-24 rounded-full border border-cyan-200/50 bg-blue-500/20" />

                <div className="relative z-10 text-7xl drop-shadow-[0_0_20px_rgba(0,217,255,0.8)]">
                  ↑
                </div>
              </div>

              {/* Floating files */}
              <div className="float-slow absolute -left-16 top-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-white/[0.06] text-2xl shadow-[0_0_25px_rgba(0,217,255,0.2)] backdrop-blur-xl">
                🖼️
              </div>

              <div
                className="float-slow absolute -right-14 top-0 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-300/30 bg-white/[0.06] text-2xl shadow-[0_0_25px_rgba(139,92,246,0.2)] backdrop-blur-xl"
                style={{ animationDelay: "0.7s" }}
              >
                📄
              </div>

              <div
                className="float-slow absolute -right-16 bottom-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300/30 bg-white/[0.06] text-2xl shadow-[0_0_25px_rgba(59,130,246,0.2)] backdrop-blur-xl"
                style={{ animationDelay: "1.2s" }}
              >
                📁
              </div>

              <div
                className="float-slow absolute -left-12 bottom-0 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-white/[0.06] text-2xl shadow-[0_0_25px_rgba(0,217,255,0.2)] backdrop-blur-xl"
                style={{ animationDelay: "1.8s" }}
              >
                📊
              </div>
            </div>

            <div className="absolute bottom-2 left-1/2 w-full -translate-x-1/2 text-center">
              <p className="text-sm text-slate-400">
                More than storage,
              </p>

              <p className="mt-1 text-lg font-semibold text-cyan-400">
                your digital workspace.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-950/40 to-transparent" />
    </main>
  );
}