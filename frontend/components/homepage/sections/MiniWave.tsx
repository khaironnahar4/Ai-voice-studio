export default function MiniWave({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-5" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="wave-bar w-0.5"
          style={{
            height: `${30 + Math.abs(Math.sin(i * 1.1)) * 70}%`,
            animationDelay: `${(i * 0.08).toFixed(2)}s`,
            animationPlayState: playing ? "running" : "paused",
            opacity: playing ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}