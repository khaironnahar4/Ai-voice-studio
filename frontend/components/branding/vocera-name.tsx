import Link from "next/link";
import VoceraLogo from "./Vocera-logo";

export default function VoceraName() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* Icon */}
      <div
        className="flex h-8 w-8 items-center justify-center
                                     rounded-lg bg-[rgba(120,62,246,0.2)] shrink-0"
      >
        <VoceraLogo />
      </div>
      {/* Text — hidden when collapsed */}
      <span className="font-display font-bold text-xl tracking-tight text-white">
        Voce<span className="text-gradient">ra</span>
      </span>
    </Link>
  );
}
