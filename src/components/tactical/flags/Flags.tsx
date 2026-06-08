import type * as React from "react";
import type { CountryCode } from "@/hooks/useTacticalBoard";


interface FlagProps {
  className?: string;
}

/** Simplified but recognizable SVG flags, viewBox 60x40, fills container. */

function BR({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="60" height="40" fill="#009c3b" />
      <polygon points="30,5 55,20 30,35 5,20" fill="#ffdf00" />
      <circle cx="30" cy="20" r="7" fill="#002776" />
      <path d="M23 19 Q30 15 37 19" stroke="#fff" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function AR({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="60" height="40" fill="#74acdf" />
      <rect y="13.3" width="60" height="13.3" fill="#fff" />
      <circle cx="30" cy="20" r="3" fill="#f6b40e" />
    </svg>
  );
}

function FR({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="20" height="40" fill="#0055a4" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ef4135" />
    </svg>
  );
}

function NL({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="60" height="13.3" fill="#ae1c28" />
      <rect y="13.3" width="60" height="13.3" fill="#fff" />
      <rect y="26.6" width="60" height="13.4" fill="#21468b" />
    </svg>
  );
}

function PT({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="24" height="40" fill="#046a38" />
      <rect x="24" width="36" height="40" fill="#da291c" />
      <circle cx="24" cy="20" r="6" fill="#ffe900" stroke="#fff" strokeWidth="0.8" />
      <circle cx="24" cy="20" r="3" fill="#046a38" />
    </svg>
  );
}

function EN({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="60" height="40" fill="#fff" />
      <rect x="26" width="8" height="40" fill="#ce1124" />
      <rect y="16" width="60" height="8" fill="#ce1124" />
    </svg>
  );
}

const FLAG_MAP: Record<CountryCode, (p: FlagProps) => React.ReactElement> = {
  BR,
  AR,
  FR,
  NL,
  PT,
  EN,
};

export const COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: "BR", name: "Brasil" },
  { code: "EN", name: "Inglaterra" },
  { code: "FR", name: "França" },
  { code: "AR", name: "Argentina" },
  { code: "NL", name: "Holanda" },
  { code: "PT", name: "Portugal" },
];

export function Flag({ code, className }: { code: CountryCode; className?: string }) {
  const Cmp = FLAG_MAP[code];
  return <Cmp className={className} />;
}
