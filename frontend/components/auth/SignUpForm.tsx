
"use client"

import { useState }   from "react"
import Link           from "next/link"
import { signUp }     from "@/lib/auth/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import VoceraName from "../branding/vocera-name"


export function SignUpForm() {
  const [name,     setName]     = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  // const [done,     setDone]     = useState(false)
  const [showPass, setShowPass] = useState(false)
  const Router = useRouter()

  // Password strength
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const strengthScore = strength.filter(Boolean).length
  const strengthLabel =
    strengthScore === 0 ? "" :
    strengthScore <= 1  ? "Weak" :
    strengthScore <= 2  ? "Fair" :
    strengthScore <= 3  ? "Good" : "Strong"
  const strengthColor =
    strengthScore <= 1 ? "bg-red-500"    :
    strengthScore <= 2 ? "bg-amber-500"  :
    strengthScore <= 3 ? "bg-blue-500"   : "bg-teal-500"

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setLoading(true)
    setError(null)

    try {
        await signUp.email(
                {
                  name,
                  email,
                  password
                },
                {
                  onSuccess: async () => {
                    setLoading(false);
                    toast.success("Created your account successfully.");
                    Router.push("/");
                    // toast.success("Please see your email to verify your account");
                  },
                  onError: (ctx) => {
                    toast.error(ctx.error.message ?? "Sign up failed.");
                    // console.log(ctx.error);
                  },
                },
            );

    }catch {
        throw new Error("Something went wrong");
    }
    // const { error } = await signUp.email({ name, email, password })
    // setLoading(false)
    // if (error) { setError(error.message ?? "Sign up failed."); return }
    // setDone(true)
  }

//   if (done) {
//     return (
//       <div className="min-h-screen bg-[#0F0F1A] flex items-center
//                       justify-center px-4">
//         <div className="w-full max-w-sm text-center">
//           {/* Success icon */}
//           <div className="w-16 h-16 rounded-2xl bg-teal-500/15
//                          border border-teal-500/25
//                          flex items-center justify-center mx-auto mb-5">
//             <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
//                  stroke="rgb(93,202,165)" strokeWidth="2" strokeLinecap="round">
//               <path d="M5 14l6 6 12-12"/>
//             </svg>
//           </div>
//           <h2 className="text-xl font-semibold text-white mb-2">
//             Check your email
//           </h2>
//           <p className="text-sm text-white/40 mb-6 leading-relaxed">
//             We sent a verification link to{" "}
//             <span className="text-white/70">{email}</span>.
//             Click the link to activate your account.
//           </p>
//           <Link
//             href="/sign-in"
//             className="text-sm text-[rgb(167,139,250)]
//                        hover:text-[rgb(120,62,246)] transition-colors"
//           >
//             ← Back to sign in
//           </Link>
//         </div>
//       </div>
//     )
//   }

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center
                    justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-125 h-75 rounded-full
                      bg-[rgba(120,62,246,0.07)] blur-[100px] pointer-events-none"/>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-6">
            <VoceraName />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-white/40 mt-1.5">
            Start generating natural-sounding speech
          </p>
        </div>

        <div className="rounded-2xl border border-[#282846] bg-[#141424] p-6">
          <form onSubmit={handleSignUp} className="space-y-4">

            {/* Name */}
            <div>
              <label htmlFor="name"
                     className="text-xs text-white/45 block mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your name"
                className="w-full h-11 bg-[#0F0F1A] border border-[#282846]
                           rounded-xl px-3 text-sm text-white/85
                           placeholder:text-white/20
                           focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                           transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email"
                     className="text-xs text-white/45 block mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-11 bg-[#0F0F1A] border border-[#282846]
                           rounded-xl px-3 text-sm text-white/85
                           placeholder:text-white/20
                           focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                           transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password"
                     className="text-xs text-white/45 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="w-full h-11 bg-[#0F0F1A] border border-[#282846]
                             rounded-xl px-3 pr-10 text-sm text-white/85
                             placeholder:text-white/20
                             focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                             transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/>
                      <circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/>
                      <circle cx="8" cy="8" r="2"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(n => (
                      <div key={n}
                           className={`flex-1 h-1 rounded-full transition-colors duration-300
                             ${n <= strengthScore ? strengthColor : "bg-[#282846]"}`}
                      />
                    ))}
                  </div>
                  {strengthLabel && (
                    <p className={`text-[11px] font-medium
                      ${strengthScore <= 1 ? "text-red-400"  :
                        strengthScore <= 2 ? "text-amber-400" :
                        strengthScore <= 3 ? "text-blue-400"  : "text-teal-400"}`}>
                      {strengthLabel}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                             bg-red-500/10 border border-red-500/20">
                <svg className="w-3.5 h-3.5 text-red-400 shrink-0"
                     viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zm0 4a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 7 5zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Terms */}
            <p className="text-[11px] text-white/25 leading-relaxed">
              By creating an account you agree to our{" "}
              <a href="/terms" className="text-white/45 hover:text-white/70
                                          underline underline-offset-2">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-white/45 hover:text-white/70
                                             underline underline-offset-2">
                Privacy Policy
              </a>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !name || !email || !password}
              className={`w-full h-11 rounded-xl text-sm font-medium
                         flex items-center justify-center gap-2
                         transition-all duration-150
                         ${loading || !name || !email || !password
                           ? "bg-white/5 text-white/25 cursor-not-allowed"
                           : "bg-[rgb(120,62,246)] text-white hover:bg-[rgba(120,62,246,0.85)] hover:scale-[1.01] active:scale-[0.99]"
                         }`}
            >
              {loading && (
                <span className="w-4 h-4 border border-white/30
                                 border-t-white rounded-full animate-spin"/>
              )}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/35 mt-5">
          Already have an account?{" "}
          <Link href="/sign-in"
                className="text-[rgb(167,139,250)] hover:text-[rgb(120,62,246)]
                           transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}