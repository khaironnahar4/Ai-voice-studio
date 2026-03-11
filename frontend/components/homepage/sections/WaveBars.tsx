export default function WaveBars({ count = 12 }: { count?: number }) {
  return (
    <div className="flex items-end gap-0.75 h-10" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="wave-bar w-0.75"
          style={{
            height: `${25 + Math.abs(Math.sin(i * 0.9)) * 75}%`,
            animationDelay: `${(i * 0.07).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}