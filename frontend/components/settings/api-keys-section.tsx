"use client"

import { useState } from "react"
import {
  Copy, Check, Eye, EyeOff, Trash2,
  Plus, Loader2, Key,
} from "lucide-react"

interface ApiKey {
  id:        string
  name:      string
  keyPrefix: string   // first 8 chars
  lastUsed:  string | null
  createdAt: string
  isNew?:    boolean
  fullKey?:  string   // only shown once at creation
}

const MOCK_KEYS: ApiKey[] = [
  {
    id:        "key_1",
    name:      "Production",
    keyPrefix: "voc_live_",
    lastUsed:  new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id:        "key_2",
    name:      "Development",
    keyPrefix: "voc_test_",
    lastUsed:  null,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
]

function timeAgo(iso: string | null) {
  if (!iso) return "Never"
  const d    = Date.now() - new Date(iso).getTime()
  const days = Math.floor(d / 86400000)
  const hrs  = Math.floor(d / 3600000)
  if (hrs < 1)  return "Just now"
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

function KeyRow({
  apiKey,
  onRevoke,
}: {
  apiKey:   ApiKey
  onRevoke: (id: string) => void
}) {
  const [copied,   setCopied]   = useState(false)
  const [revealed, setRevealed] = useState(!!apiKey.isNew)
  const [revoking, setRevoking] = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  const displayKey = revealed && apiKey.fullKey
    ? apiKey.fullKey
    : `${apiKey.keyPrefix}••••••••••••••••••••`

  async function copy() {
    const text = apiKey.fullKey ?? apiKey.keyPrefix
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function revoke() {
    if (!confirm) { setConfirm(true); return }
    setRevoking(true)
    await fetch(`/api/settings/api-keys/${apiKey.id}`, { method: "DELETE" })
    onRevoke(apiKey.id)
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200
        ${apiKey.isNew
          ? "border-[rgba(120,62,246,0.4)] bg-[rgba(120,62,246,0.06)]"
          : "border-[#282846] bg-[#0F0F1A]"
        }`}
    >
      {/* New key banner */}
      {apiKey.isNew && (
        <div
          className="flex items-center gap-2 text-xs text-[rgb(167,139,250)]
                     mb-3 pb-3 border-b border-[rgba(120,62,246,0.2)]"
        >
          <Key className="w-3.5 h-3.5" />
          Copy your key now — it won&apos;t be shown again after you leave this page.
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium text-white/80">{apiKey.name}</p>
          <p className="text-[11px] text-white/30 mt-0.5">
            Created {timeAgo(apiKey.createdAt)} ·{" "}
            Last used {timeAgo(apiKey.lastUsed)}
          </p>
        </div>

        {/* Revoke */}
        <div className="flex items-center gap-1.5 shrink-0">
          {confirm ? (
            <>
              <button
                onClick={revoke}
                disabled={revoking}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                           text-xs font-medium bg-red-600 text-white
                           hover:bg-red-700 transition-all disabled:opacity-60"
              >
                {revoking
                  ? <Loader2 className="w-3 h-3 animate-spin"/>
                  : "Confirm revoke"
                }
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs text-white/35
                           border border-[#282846] hover:text-white
                           transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={revoke}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400
                         hover:bg-red-500/10 border border-transparent
                         hover:border-red-500/20 transition-all duration-150"
              aria-label="Revoke key"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Key display */}
      <div
        className="flex items-center gap-2 bg-[#141424] border border-[#282846]
                   rounded-lg px-3 py-2"
      >
        <code className="flex-1 text-xs font-mono text-white/50 truncate">
          {displayKey}
        </code>

        {/* Toggle reveal (only if fullKey present) */}
        {apiKey.fullKey && (
          <button
            onClick={() => setRevealed(r => !r)}
            className="text-white/25 hover:text-white/60 transition-colors shrink-0"
            aria-label={revealed ? "Hide key" : "Reveal key"}
          >
            {revealed
              ? <EyeOff className="w-3.5 h-3.5" />
              : <Eye    className="w-3.5 h-3.5" />
            }
          </button>
        )}

        {/* Copy */}
        <button
          onClick={copy}
          className="text-white/25 hover:text-white/60 transition-colors shrink-0"
          aria-label="Copy key"
        >
          {copied
            ? <Check className="w-3.5 h-3.5 text-teal-400" />
            : <Copy  className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  )
}

export function ApiKeysSection({ hasPlan }: { hasPlan: boolean }) {
  const [keys,       setKeys]       = useState<ApiKey[]>(MOCK_KEYS)
  const [newName,    setNewName]    = useState("")
  const [creating,   setCreating]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createErr,  setCreateErr]  = useState<string | null>(null)

  function revoke(id: string) {
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  async function handleCreate() {
    if (!newName.trim() || creating) return
    setCreating(true)
    setCreateErr(null)

    // Simulate API call
    await new Promise(r => setTimeout(r, 800))

    const newKey: ApiKey = {
      id:        `key_${Date.now()}`,
      name:      newName.trim(),
      keyPrefix: "voc_live_",
      lastUsed:  null,
      createdAt: new Date().toISOString(),
      isNew:     true,
      fullKey:   `voc_live_${Math.random().toString(36).slice(2, 18)}`,
    }

    setKeys(prev => [newKey, ...prev])
    setNewName("")
    setShowCreate(false)
    setCreating(false)
  }

  if (!hasPlan) {
    return (
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-8
                      text-center">
        <div
          className="w-12 h-12 rounded-2xl bg-[rgba(120,62,246,0.1)]
                     border border-[rgba(120,62,246,0.2)]
                     flex items-center justify-center mx-auto mb-4"
        >
          <Key className="w-5 h-5 text-[rgb(120,62,246)]" />
        </div>
        <h3 className="text-sm font-medium text-white/70 mb-1">
          API access requires a paid plan
        </h3>
        <p className="text-xs text-white/30 mb-4">
          Upgrade to Pro or Business to access the Vocera AI API.
        </p>
        <a
          href="/billing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-[rgb(120,62,246)] text-white text-sm font-medium
                     hover:bg-[rgba(120,62,246,0.85)] transition-all"
        >
          View plans
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-medium text-white/70">API keys</h2>
            <p className="text-xs text-white/30 mt-1">
              Use these keys to authenticate requests from your applications.
              Keep them secret — never expose in client-side code.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                       text-xs font-medium shrink-0
                       bg-[rgb(120,62,246)] text-white
                       hover:bg-[rgba(120,62,246,0.85)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New key
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div
            className="border border-[rgba(120,62,246,0.25)] rounded-xl
                       bg-[rgba(120,62,246,0.05)] p-4 mb-4 space-y-3"
          >
            <div>
              <label className="text-xs text-white/45 block mb-1.5">
                Key name
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Production, Development"
                autoFocus
                className="w-full bg-[#0F0F1A] border border-[#282846] rounded-lg
                           px-3 py-2.5 text-sm text-white/85
                           placeholder:text-white/20 focus:outline-none
                           focus:border-[rgba(120,62,246,0.5)] transition-colors"
              />
            </div>
            {createErr && (
              <p className="text-xs text-red-400">{createErr}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg
                           text-sm font-medium transition-all
                           ${newName.trim() && !creating
                             ? "bg-[rgb(120,62,246)] text-white hover:bg-[rgba(120,62,246,0.85)]"
                             : "bg-white/5 text-white/25 cursor-not-allowed"
                           }`}
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                {creating ? "Creating…" : "Create key"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName("") }}
                className="px-4 py-2 rounded-lg text-sm text-white/40
                           border border-[#282846] hover:text-white
                           hover:border-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Key list */}
        <div className="space-y-3">
          {keys.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            keys.map(k => (
              <KeyRow key={k.id} apiKey={k} onRevoke={revoke} />
            ))
          )}
        </div>
      </div>

      {/* Usage example */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-5">
        <h3 className="text-xs text-white/35 uppercase tracking-widest mb-4">
          Quick start
        </h3>
        <pre
          className="bg-[#0F0F1A] border border-[#282846] rounded-lg p-4
                     text-xs font-mono text-white/55 overflow-x-auto"
        >{`curl -X POST https://vocera.ai/api/tts \\
  -H "Authorization: Bearer voc_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello from the Vocera API.",
    "voiceModelId": "...",
    "outputFormat": "mp3_44100_128"
  }'`}</pre>
      </div>

    </div>
  )
}