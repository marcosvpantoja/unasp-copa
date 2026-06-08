/**
 * BrandMark — championship trophy logo.
 */
const trophyLogo = "/brand/trophy.png";

interface Props {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  tone?: "light" | "dark";
}

export function BrandMark({
  size = 36,
  className = "",
  withWordmark = false,
  tone = "dark",
}: Props) {
  const ink = tone === "light" ? "#ffffff" : "var(--foreground)";
  const accent = tone === "light" ? "#ffffff" : "var(--brand-red)";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        aria-hidden
        className="relative shrink-0 overflow-hidden rounded-[28%] ring-1 ring-white/10 bg-black flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src={trophyLogo}
          alt=""
          className="h-[82%] w-[82%] object-contain"
          draggable={false}
        />
      </div>
      {withWordmark && (
        <div className="min-w-0 leading-tight">
          <div
            className="font-display text-[15px] font-extrabold uppercase tracking-[0.04em]"
            style={{ color: ink }}
          >
            Copa do Mundo UNASP
          </div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.32em]"
            style={{ color: accent }}
          >
            Edição 2026
          </div>
        </div>
      )}
    </div>
  );
}
