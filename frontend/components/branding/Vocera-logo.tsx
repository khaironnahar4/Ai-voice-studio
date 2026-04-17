// ── Logo mark ─────────────────────────────────────────────────────────────
export default function VoceraLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 7C2 4 4 2 7 2C10 2 12 4 12 7"
        stroke="rgb(var(--accent-light))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 7C2 10 4 12 7 12"
        stroke="rgb(var(--cyan))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="1.5" fill="rgb(var(--accent))" />
    </svg>
  )
}