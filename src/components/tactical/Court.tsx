import type { Rotation } from "@/hooks/useTacticalBoard";

/**
 * Futsal court SVG. Renders in any 90° rotation (0/90/180/270).
 * Inner content is authored in 400x200 horizontal frame; rotated via matrix for other angles.
 */
export function Court({ rotation = 0 as Rotation }: { rotation?: Rotation }) {
  const isVert = rotation % 180 !== 0;
  const transform =
    rotation === 90
      ? "matrix(0 1 -1 0 200 0)"
      : rotation === 180
        ? "matrix(-1 0 0 -1 400 200)"
        : rotation === 270
          ? "matrix(0 -1 1 0 0 400)"
          : undefined;
  return (
    <svg
      viewBox={isVert ? "0 0 200 400" : "0 0 400 200"}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <pattern id="grass" width="40" height="200" patternUnits="userSpaceOnUse">
          <rect width="40" height="200" fill="var(--court-green)" />
          <rect x="0" width="20" height="200" fill="var(--court-green-dark)" opacity="0.35" />
        </pattern>
      </defs>
      <g transform={transform}>
        <rect width="400" height="200" fill="url(#grass)" />
        <g fill="none" stroke="var(--court-line)" strokeWidth={1.2}>
          <rect x="4" y="4" width="392" height="192" />
          <line x1="200" y1="4" x2="200" y2="196" />
          <circle cx="200" cy="100" r="30" />
          <circle cx="200" cy="100" r="1.5" fill="var(--court-line)" />
          <path d="M 4 40 A 60 60 0 0 1 4 160" />
          <path d="M 396 40 A 60 60 0 0 0 396 160" />
          <circle cx="64" cy="100" r="1.5" fill="var(--court-line)" />
          <circle cx="336" cy="100" r="1.5" fill="var(--court-line)" />
          <circle cx="104" cy="100" r="1.5" fill="var(--court-line)" />
          <circle cx="296" cy="100" r="1.5" fill="var(--court-line)" />
          <rect x="0" y="85" width="4" height="30" fill="var(--court-line)" opacity="0.9" />
          <rect x="396" y="85" width="4" height="30" fill="var(--court-line)" opacity="0.9" />
          <path d="M 4 8 A 4 4 0 0 1 8 4" />
          <path d="M 392 4 A 4 4 0 0 1 396 8" />
          <path d="M 396 192 A 4 4 0 0 1 392 196" />
          <path d="M 8 196 A 4 4 0 0 1 4 192" />
        </g>
      </g>
    </svg>
  );
}
