interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  accent2?: boolean;
}

export default function StatCard({ label, value, sub, accent, accent2 }: StatCardProps) {
  return (
    <div className="
      bg-surface border border-theme rounded-2xl
      p-4 md:p-5
      flex flex-col gap-1
    ">
      <p className="text-[10px] md:text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className={`
        font-display font-bold text-2xl md:text-3xl leading-none
        ${accent  ? "text-[rgb(var(--accent))]"  : ""}
        ${accent2 ? "text-[rgb(var(--accent2))]" : ""}
        ${!accent && !accent2 ? "text-gray-900 dark:text-gray-100" : ""}
      `}>
        {value}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">{sub}</p>
    </div>
  );
}
