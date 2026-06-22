// app/(auth)/sign-in/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/auth-client";
import VoceraName from "@/components/branding/vocera-name";


export function SignInForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  //   const [oauthLoading, setOauthLoading] = useState<"google"|"github"|null>(null)
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn.email(
        {
          email: email,
          password: password,
          callbackURL: callbackUrl,
        },
        // {
        //   onSuccess: async () => {
        //     const { error } = await twoFactor.sendOtp({});

        //     if (error) {
        //       toast.error(error.message);
        //     }

        //     router.push("/two-factor");
        //   },
        //   onError: (ctx) => {
        //     toast.error(ctx.error.message);
        //   },
        // }
      );

      setLoading(false);
      if (error) setError(error.message ?? "Invalid email or password.");
    } catch {
      throw new Error("Something went wrong");
    }
  }
  //   async function handleOAuth(provider: "google" | "github") {
  //     setOauthLoading(provider)
  //     await signIn.social({ provider, callbackURL: callbackUrl })
  //   }

  return (
    <div
      className="min-h-screen bg-[#0F0F1A] flex items-center justify-center
                    px-4 py-12"
    >
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-125 h-75 rounded-full
                      bg-[rgba(120,62,246,0.07)] blur-[100px] pointer-events-none"
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-6">
            <VoceraName />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-white/40 mt-1.5">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#282846] bg-[#141424] p-6">
          {/* OAuth buttons */}
          {/* <div className="flex flex-col gap-2.5 mb-5">
            {[
              { provider: "google" as const, label: "Continue with Google",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.51-1.4 2.4-3.45 2.4-5.88z" fill="#4285F4"/>
                    <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2a4.77 4.77 0 0 1-7.1-2.5H1.01v2.07A8 8 0 0 0 8 16z" fill="#34A853"/>
                    <path d="M3.61 9.56A4.8 4.8 0 0 1 3.36 8c0-.54.1-1.07.25-1.56V4.37H1.01A8 8 0 0 0 0 8c0 1.29.3 2.51.01 3.63l2.6-2.07z" fill="#FBBC05"/>
                    <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A8 8 0 0 0 1.01 4.37L3.6 6.44A4.77 4.77 0 0 1 8 3.18z" fill="#EA4335"/>
                  </svg>
                )
              },
              { provider: "github" as const, label: "Continue with GitHub",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                )
              },
            ].map(({ provider, label, icon }) => (
              <button
                key={provider}
                onClick={() => handleOAuth(provider)}
                disabled={oauthLoading !== null || loading}
                className="flex items-center justify-center gap-2.5 w-full
                           h-11 rounded-xl border border-[#282846]
                           bg-[#0F0F1A] text-white/65 text-sm font-medium
                           hover:text-white hover:border-white/20 hover:bg-white/4
                           transition-all duration-150 disabled:opacity-50
                           disabled:cursor-not-allowed"
              >
                {oauthLoading === provider ? (
                  <span className="w-4 h-4 border border-white/20
                                   border-t-white/70 rounded-full animate-spin"/>
                ) : icon}
                {label}
              </button>
            ))}
          </div> */}

          {/* Divider */}
          {/* <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#282846]"/>
            <span className="text-xs text-white/25">or</span>
            <div className="flex-1 h-px bg-[#282846]"/>
          </div> */}

          {/* Email form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs text-white/45 block mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-11 bg-[#0F0F1A] border border-[#282846]
                           rounded-xl px-3 text-sm text-white/85
                           placeholder:text-white/20
                           focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                           transition-colors duration-150"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label htmlFor="password" className="text-xs text-white/45">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[rgb(167,139,250)]
                                 hover:text-[rgb(120,62,246)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 bg-[#0F0F1A] border border-[#282846]
                             rounded-xl px-3 pr-10 text-sm text-white/85
                             placeholder:text-white/20
                             focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                             transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-white/25 hover:text-white/60 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" />
                      <circle cx="8" cy="8" r="2" />
                      <path d="M2 2l12 12" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" />
                      <circle cx="8" cy="8" r="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                             bg-red-500/10 border border-red-500/20"
              >
                <svg
                  className="w-3.5 h-3.5 text-red-400 shrink-0"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                >
                  <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zm0 4a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 7 5zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                </svg>
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={`w-full h-11 rounded-xl text-sm font-medium
                         transition-all duration-150 flex items-center justify-center gap-2
                         ${
                           loading || !email || !password
                             ? "bg-white/5 text-white/25 cursor-not-allowed"
                             : "bg-[rgb(120,62,246)] text-white hover:bg-[rgba(120,62,246,0.85)] hover:scale-[1.01] active:scale-[0.99]"
                         }`}
            >
              {loading && (
                <span
                  className="w-4 h-4 border border-white/30
                                 border-t-white rounded-full animate-spin"
                />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-white/35 mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-[rgb(167,139,250)] hover:text-[rgb(120,62,246)]
                           transition-colors font-medium"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
