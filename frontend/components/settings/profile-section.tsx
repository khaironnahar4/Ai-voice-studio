"use client"

import { useState } from "react"
import { Check, Loader2, Mail, Shield } from "lucide-react"

interface User {
  id:            string
  name:          string
  email:         string
  emailVerified: boolean
  image?:        string | null
}

interface ProfileSectionProps {
  user: User
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [name,    setName]    = useState(user.name)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Delete account state
  const [showDel,  setShowDel]  = useState(false)
  const [delInput, setDelInput] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [delError, setDelError] = useState<string | null>(null)

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isDirty = name.trim() !== user.name

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const res  = await fetch("/api/settings/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: name.trim() }),
    })
    const data = await res.json()

    setSaving(false)
    if (!res.ok) { setError(data.error ?? "Failed to save."); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDeleteAccount() {
    if (delInput !== "DELETE" || deleting) return
    setDeleting(true)
    setDelError(null)

    const res  = await fetch("/api/settings/account", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ confirm: "DELETE" }),
    })
    const data = await res.json()

    if (!res.ok) {
      setDeleting(false)
      setDelError(data.error ?? "Failed to delete account.")
      return
    }

    // Sign out and redirect
    window.location.href = "/"
  }

  return (
    <div className="space-y-6">

      {/* ── Avatar + name ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-6">
        <h2 className="text-sm font-medium text-white/70 mb-5">
          Profile information
        </h2>

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl bg-[rgba(120,62,246,0.25)]
                       flex items-center justify-center
                       text-xl font-semibold text-[rgb(167,139,250)]
                       border border-[rgba(120,62,246,0.3)]"
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">{name}</p>
            <p className="text-xs text-white/35 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Name field */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-xs text-white/45 block mb-1.5"
            >
              Display name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              className="w-full bg-[#0F0F1A] border border-[#282846] rounded-lg
                         px-3 py-2.5 text-sm text-white/85
                         placeholder:text-white/20
                         focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                         transition-colors duration-150"
              placeholder="Your name"
              maxLength={80}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-xs text-white/45 block mb-1.5">
              Email address
            </label>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 bg-[#0F0F1A] border border-[#282846] rounded-lg
                           px-3 py-2.5 text-sm text-white/40 flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-white/25 shrink-0" />
                {user.email}
              </div>
              {/* Verified badge */}
              {user.emailVerified ? (
                <span
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                             text-xs font-medium
                             bg-teal-500/10 text-teal-400 border border-teal-500/20
                             shrink-0"
                >
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                             text-xs font-medium
                             bg-amber-500/10 text-amber-400 border border-amber-500/20
                             shrink-0"
                >
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/25 mt-1.5 ml-0.5">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg
                         text-sm font-medium transition-all duration-150
                         ${isDirty && !saving
                           ? "bg-[rgb(120,62,246)] text-white hover:bg-[rgba(120,62,246,0.85)]"
                           : "bg-white/5 text-white/25 cursor-not-allowed"
                         }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5 text-teal-400" />
              ) : null}
              {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Connected accounts ─────────────────────────────────────── */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-6">
        <h2 className="text-sm font-medium text-white/70 mb-4">
          Connected accounts
        </h2>
        <div className="space-y-2">
          {[
            { provider: "Google", icon: "G", connected: false },
            { provider: "GitHub", icon: "GH", connected: false },
          ].map(acc => (
            <div
              key={acc.provider}
              className="flex items-center justify-between py-2.5 px-3
                         rounded-lg border border-[#282846]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg bg-[#0F0F1A] border border-[#282846]
                             flex items-center justify-center
                             text-[10px] font-bold text-white/40"
                >
                  {acc.icon}
                </div>
                <span className="text-sm text-white/60">{acc.provider}</span>
              </div>
              <button
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                  ${acc.connected
                    ? "border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                    : "border-[#282846] text-white/40 hover:text-white hover:border-white/20"
                  }`}
              >
                {acc.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Security ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-white/35" />
          <h2 className="text-sm font-medium text-white/70">Security</h2>
        </div>
        <button
          className="w-full text-left px-4 py-3 rounded-lg border border-[#282846]
                     text-sm text-white/55 hover:text-white hover:border-white/20
                     transition-all duration-150 flex items-center justify-between"
        >
          Change password
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 7h8M8 4l3 3-3 3"/>
          </svg>
        </button>
      </div>

      {/* ── Danger zone ────────────────────────────────────────────── */}
      <div
        className="rounded-xl border border-red-500/20 bg-red-500/5 p-6"
      >
        <h2 className="text-sm font-medium text-red-400 mb-1">
          Danger zone
        </h2>
        <p className="text-xs text-white/30 mb-4">
          Once you delete your account, all your data, audio files, and
          history will be permanently removed. This action cannot be undone.
        </p>

        {!showDel ? (
          <button
            onClick={() => setShowDel(true)}
            className="px-4 py-2 rounded-lg border border-red-500/30
                       text-sm text-red-400 bg-red-500/8
                       hover:bg-red-500/15 transition-all duration-150"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/40">
              Type{" "}
              <code className="font-mono text-red-400 bg-red-500/10
                               px-1.5 py-0.5 rounded">
                DELETE
              </code>{" "}
              to confirm:
            </p>
            <input
              type="text"
              value={delInput}
              onChange={e => setDelInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-[#0F0F1A] border border-red-500/30 rounded-lg
                         px-3 py-2.5 text-sm text-white placeholder:text-white/20
                         focus:outline-none focus:border-red-500/60
                         font-mono transition-colors"
            />
            {delError && (
              <p className="text-xs text-red-400">{delError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={delInput !== "DELETE" || deleting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg
                           text-sm font-medium transition-all duration-150
                           ${delInput === "DELETE" && !deleting
                             ? "bg-red-600 text-white hover:bg-red-700"
                             : "bg-white/5 text-white/25 cursor-not-allowed"
                           }`}
              >
                {deleting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                onClick={() => { setShowDel(false); setDelInput("") }}
                className="px-4 py-2 rounded-lg text-sm text-white/40
                           hover:text-white border border-[#282846]
                           hover:border-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}