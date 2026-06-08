import { useCallback, useEffect, useState } from "react";

export type Role = "goalkeeper" | "field" | "bench";
export type Team = "home" | "away";
export type Tool = "hand" | "pen";
export type PenStyle = "solid" | "dashed";
export type CountryCode = "BR" | "EN" | "FR" | "AR" | "NL" | "PT";
export type Rotation = 0 | 90 | 180 | 270;
/** Legacy alias — derived from rotation. */
export type Orientation = "horizontal" | "vertical";

export interface Player {
  id: string;
  number: number;
  role: Role;
  team: Team;
  /** Stored in horizontal frame (x: 0-100 along long axis, y: 0-100 along short axis) */
  x: number;
  y: number;
  photoUrl?: string;
  name?: string;
}

const STORAGE_KEY = "futsal-tactical-board-v5";

export type FormationName = "1-2-1" | "2-2" | "3-1" | "4-0";

/** Field positions for the HOME team (left side, attacking right) in horizontal frame.
 *  Order: [Fixo/back-center spots first, then wings, then pivot]. Always 4 field players. */
const FORMATIONS: Record<FormationName, Array<{ x: number; y: number }>> = {
  // Losango: fixo, ala E, ala D, pivô
  "1-2-1": [
    { x: 25, y: 50 }, // Fixo
    { x: 40, y: 22 }, // Ala Esquerda
    { x: 40, y: 78 }, // Ala Direita
    { x: 58, y: 50 }, // Pivô
  ],
  // Quadrado: 2 fixos + 2 pivôs
  "2-2": [
    { x: 26, y: 28 },
    { x: 26, y: 72 },
    { x: 50, y: 28 },
    { x: 50, y: 72 },
  ],
  // Y / pirâmide: 3 atrás + 1 pivô
  "3-1": [
    { x: 30, y: 22 },
    { x: 30, y: 50 },
    { x: 30, y: 78 },
    { x: 58, y: 50 },
  ],
  // Linha: 4 jogadores em linha, sem pivô fixo
  "4-0": [
    { x: 35, y: 18 },
    { x: 35, y: 42 },
    { x: 35, y: 60 },
    { x: 35, y: 82 },
  ],
};

const mirror = (p: { x: number; y: number }) => ({ x: 100 - p.x, y: p.y });

const buildPlayers = (formation: FormationName): Player[] => {
  const home = FORMATIONS[formation];
  const away = home.map(mirror);
  return [
    { id: "h1", number: 1, role: "goalkeeper", team: "home", x: 8, y: 50 },
    { id: "h2", number: 2, role: "field", team: "home", ...home[0] },
    { id: "h3", number: 3, role: "field", team: "home", ...home[1] },
    { id: "h4", number: 4, role: "field", team: "home", ...home[2] },
    { id: "h5", number: 5, role: "field", team: "home", ...home[3] },
    { id: "h6", number: 6, role: "bench", team: "home", x: 0, y: 0 },
    { id: "h7", number: 7, role: "bench", team: "home", x: 0, y: 0 },
    { id: "h8", number: 8, role: "bench", team: "home", x: 0, y: 0 },
    { id: "h9", number: 9, role: "bench", team: "home", x: 0, y: 0 },
    { id: "h10", number: 10, role: "bench", team: "home", x: 0, y: 0 },
    { id: "a1", number: 1, role: "goalkeeper", team: "away", x: 92, y: 50 },
    { id: "a2", number: 2, role: "field", team: "away", ...away[0] },
    { id: "a3", number: 3, role: "field", team: "away", ...away[1] },
    { id: "a4", number: 4, role: "field", team: "away", ...away[2] },
    { id: "a5", number: 5, role: "field", team: "away", ...away[3] },
  ];
};

const initialPlayers = (): Player[] => buildPlayers("1-2-1");

interface PersistedState {
  players: Player[];
  awayCountry: CountryCode;
  rotation: Rotation;
}

export function useTacticalBoard() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [awayCountry, setAwayCountry] = useState<CountryCode>("AR");
  const [rotation, setRotation] = useState<Rotation>(0);
  const [tool, setTool] = useState<Tool>("hand");
  const [penColor, setPenColor] = useState<string>("#ef4444");
  const [penStyle, setPenStyle] = useState<PenStyle>("solid");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed?.players?.length) setPlayers(parsed.players);
        if (parsed?.awayCountry) setAwayCountry(parsed.awayCountry);
        if (parsed?.rotation === 0 || parsed?.rotation === 90 || parsed?.rotation === 180 || parsed?.rotation === 270) {
          setRotation(parsed.rotation);
        }
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const data: PersistedState = { players, awayCountry, rotation };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [players, awayCountry, rotation, loaded]);

  const movePlayerToCourt = useCallback((id: string, x: number, y: number) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              role: p.role === "goalkeeper" ? "goalkeeper" : "field",
              x: Math.max(2, Math.min(98, x)),
              y: Math.max(3, Math.min(97, y)),
            }
          : p,
      ),
    );
  }, []);

  const sendPlayerToBench = useCallback((id: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id && p.team === "home" ? { ...p, role: "bench", x: 0, y: 0 } : p,
      ),
    );
  }, []);

  const updatePlayerDetails = useCallback(
    (id: string, patch: { number?: number; name?: string; photoUrl?: string | undefined }) => {
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [],
  );

  const clearPlayer = useCallback((id: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, photoUrl: undefined, name: undefined, number: 0 } : p,
      ),
    );
  }, []);

  const rotate = useCallback(() => {
    setRotation((r) => (((r + 90) % 360) as Rotation));
  }, []);

  const resetPlayers = useCallback(() => {
    setPlayers(initialPlayers());
  }, []);

  const applyFormation = useCallback((name: FormationName) => {
    setPlayers((prev) => {
      const next = buildPlayers(name);
      // Preserve user customizations (name/number/photo) by id
      return next.map((np) => {
        const existing = prev.find((p) => p.id === np.id);
        if (!existing) return np;
        return {
          ...np,
          number: existing.number,
          name: existing.name,
          photoUrl: existing.photoUrl,
        };
      });
    });
  }, []);

  const orientation: Orientation = rotation % 180 === 0 ? "horizontal" : "vertical";

  return {
    players,
    awayCountry,
    setAwayCountry,
    rotation,
    setRotation,
    rotate,
    orientation,
    tool,
    setTool,
    penColor,
    setPenColor,
    penStyle,
    setPenStyle,
    movePlayerToCourt,
    sendPlayerToBench,
    updatePlayerDetails,
    clearPlayer,
    resetPlayers,
    applyFormation,
  };
}

/** Convert stored (horizontal-frame) coords to display percentages for current rotation. */
export function toDisplay(
  x: number,
  y: number,
  rotation: Rotation,
): { left: number; top: number } {
  switch (rotation) {
    case 90:
      return { left: 100 - y, top: x };
    case 180:
      return { left: 100 - x, top: 100 - y };
    case 270:
      return { left: y, top: 100 - x };
    case 0:
    default:
      return { left: x, top: y };
  }
}

/** Convert display percentages back to stored (horizontal-frame) coords. */
export function fromDisplay(
  left: number,
  top: number,
  rotation: Rotation,
): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: top, y: 100 - left };
    case 180:
      return { x: 100 - left, y: 100 - top };
    case 270:
      return { x: 100 - top, y: left };
    case 0:
    default:
      return { x: left, y: top };
  }
}
