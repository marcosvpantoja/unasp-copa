import { useRef } from "react";
import type { Player, CountryCode } from "@/hooks/useTacticalBoard";
import { Flag } from "./flags/Flags";
import { Plus } from "lucide-react";

interface Props {
  player: Player;
  size?: number;
  draggable: boolean;
  awayCountry?: CountryCode;
  onPointerDown?: (e: React.PointerEvent) => void;
  onEdit?: () => void;
  onClear?: () => void;
  style?: React.CSSProperties;
}

const CLICK_WINDOW = 320;
const MOVE_THRESHOLD = 6;

export function PlayerToken({
  player,
  size = 56,
  draggable,
  awayCountry,
  onPointerDown,
  onEdit,
  onClear,
  style,
}: Props) {
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const clickCount = useRef(0);
  const clickTimer = useRef<number | null>(null);

  const isAway = player.team === "away";
  const isGK = player.role === "goalkeeper";
  const isEmpty = !player.photoUrl && !player.name && player.number === 0;
  const ringColor = isAway
    ? "var(--token-away)"
    : isGK
      ? "var(--token-goalkeeper)"
      : "var(--token-home)";

  const resolveClicks = () => {
    const n = clickCount.current;
    clickCount.current = 0;
    clickTimer.current = null;
    if (isAway) return; // away tokens: drag only
    if (n >= 3) onClear?.();
    else if (n === 2) onEdit?.();
    // n === 1: select only (drag enabled inherently)
  };

  const registerClick = () => {
    clickCount.current += 1;
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(resolveClicks, CLICK_WINDOW);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    downPos.current = { x: e.clientX, y: e.clientY };
    if (draggable) onPointerDown?.(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = downPos.current;
    downPos.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > MOVE_THRESHOLD) return;
    registerClick();
  };

  const caption = isAway
    ? `${player.number} - ${awayCountry ?? ""}`
    : player.name
      ? `${player.number} - ${player.name}`
      : player.number > 0
        ? `${player.number}`
        : "";

  return (
    <div
      className="select-none touch-none flex flex-col items-center"
      style={{ width: Math.max(size, size + 12), ...style }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div
        className="relative overflow-hidden rounded-full shadow-lg transition-transform active:scale-110"
        style={{
          width: size,
          height: size,
          boxShadow: `0 0 0 3px ${ringColor}, 0 4px 12px rgba(0,0,0,0.4)`,
          background: "var(--card)",
          cursor: draggable ? "grab" : "pointer",
        }}
      >
        {isAway && awayCountry ? (
          <>
            <Flag code={awayCountry} className="h-full w-full" />
            <div
              className="absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
              style={{ fontSize: size * 0.42 }}
            >
              {player.number}
            </div>
          </>
        ) : player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name ?? `Jogador ${player.number}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : isEmpty ? (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-border text-muted-foreground rounded-full">
            <Plus className="h-5 w-5" />
          </div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-bold text-foreground"
            style={{ fontSize: size * 0.42 }}
          >
            {player.number}
          </div>
        )}
      </div>
      {caption && (
        <div
          className="mt-1 max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white sm:text-[11px] sm:px-2"
          style={{ background: "rgba(15,23,42,0.82)" }}
          title={caption}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
