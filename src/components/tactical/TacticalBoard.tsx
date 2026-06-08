import { useEffect, useRef, useState } from "react";
import { Court } from "./Court";
import { PlayerToken } from "./PlayerToken";
import { Toolbar } from "./Toolbar";
import { CountrySelect } from "./CountrySelect";
import { DrawingCanvas, type DrawingCanvasHandle } from "./DrawingCanvas";
import { PlayerEditModal } from "./PlayerEditModal";
import { Maximize2, Minimize2, LogOut, Menu, X, Users } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import {
  useTacticalBoard,
  toDisplay,
  fromDisplay,
  type Player,
} from "@/hooks/useTacticalBoard";

interface DragState {
  playerId: string;
  pointerId: number;
  moved: boolean;
}

export function TacticalBoard({ onLogout, embedded = false }: { onLogout?: () => void; embedded?: boolean } = {}) {
  const board = useTacticalBoard();
  const rootRef = useRef<HTMLDivElement>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const benchRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isPhone = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;
  const isDesktop = vw >= 1024;
  const TOKEN_SIZE = isPhone ? 30 : isTablet ? 40 : 52;
  const BENCH_TOKEN_SIZE = isPhone ? 32 : isTablet ? 38 : 46;

  const courtPlayers = board.players.filter((p) => p.role !== "bench");
  const benchPlayers = board.players.filter((p) => p.role === "bench");
  const editingPlayer = editingId
    ? board.players.find((p) => p.id === editingId) ?? null
    : null;

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!pseudoFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPseudoFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pseudoFullscreen]);

  const fullscreenActive = isFullscreen || pseudoFullscreen;

  const toggleFullscreen = async () => {
    if (fullscreenActive) {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch { /* ignore */ }
      setPseudoFullscreen(false);
      return;
    }
    const el = rootRef.current;
    const req = el && (el.requestFullscreen as (() => Promise<void>) | undefined);
    if (req) {
      try { await req.call(el); return; } catch { /* fall through */ }
    }
    setPseudoFullscreen(true);
  };

  const handleResetFormation = () => {
    board.resetPlayers();
    canvasRef.current?.clear();
  };

  const handleTokenPointerDown = (player: Player) => (e: React.PointerEvent) => {
    if (board.tool !== "hand") return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDrag({ playerId: player.id, pointerId: e.pointerId, moved: false });
    setGhostPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    setGhostPos({ x: e.clientX, y: e.clientY });
    if (!drag.moved) setDrag({ ...drag, moved: true });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dropX = e.clientX;
    const dropY = e.clientY;
    const dragged = board.players.find((p) => p.id === drag.playerId);

    const benchRect = benchRef.current?.getBoundingClientRect();
    const courtRect = courtRef.current?.getBoundingClientRect();

    const inBench =
      benchRect &&
      dropX >= benchRect.left && dropX <= benchRect.right &&
      dropY >= benchRect.top && dropY <= benchRect.bottom;

    if (drag.moved) {
      if (inBench && dragged?.team === "home") {
        board.sendPlayerToBench(drag.playerId);
      } else if (courtRect) {
        const left = ((dropX - courtRect.left) / courtRect.width) * 100;
        const top = ((dropY - courtRect.top) / courtRect.height) * 100;
        const { x, y } = fromDisplay(left, top, board.rotation);
        board.movePlayerToCourt(drag.playerId, x, y);
      }
    }

    setDrag(null);
    setGhostPos(null);
  };

  const draggedPlayer = drag ? board.players.find((p) => p.id === drag.playerId) : null;
  const isVertical = board.orientation === "vertical";

  /* ------------------ FULLSCREEN MODE ------------------ */
  if (fullscreenActive) {
    return (
      <div
        ref={rootRef}
        className="fixed inset-0 z-50 flex flex-col gap-2 overflow-auto bg-background p-2"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <CourtStage
          ref={(node) => { courtRef.current = node; }}
          isVertical={isVertical}
          maxH="calc(100dvh - 16px)"
          board={board}
          canvasRef={canvasRef}
          courtPlayers={courtPlayers}
          drag={drag}
          handleTokenPointerDown={handleTokenPointerDown}
          setEditingId={setEditingId}
          tokenSize={TOKEN_SIZE}
        />

        <div
          className="fixed right-3 top-3 z-40 flex items-center gap-1.5"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Abrir editor"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-[var(--shadow-md)] backdrop-blur"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label="Sair da tela cheia"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-[var(--shadow-md)] backdrop-blur"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-x-2 bottom-2 z-40 overflow-x-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="mx-auto w-fit max-w-full">
              <Toolbar
                variant="row"
                tool={board.tool}
                setTool={board.setTool}
                penColor={board.penColor}
                setPenColor={board.setPenColor}
                penStyle={board.penStyle}
                setPenStyle={board.setPenStyle}
                onClear={() => canvasRef.current?.clear()}
                rotation={board.rotation}
                onRotate={board.rotate}
                isFullscreen
                onToggleFullscreen={toggleFullscreen}
                onResetFormation={handleResetFormation}
                onApplyFormation={board.applyFormation}
              />
            </div>
          </div>
        )}

        {drag && draggedPlayer && ghostPos && (
          <DragGhost player={draggedPlayer} size={TOKEN_SIZE} pos={ghostPos} awayCountry={board.awayCountry} />
        )}

        <PlayerEditModal
          player={editingPlayer}
          onClose={() => setEditingId(null)}
          onSave={(patch) => editingId && board.updatePlayerDetails(editingId, patch)}
          onClear={() => editingId && board.clearPlayer(editingId)}
        />
      </div>
    );
  }

  /* ------------------ NORMAL MODE ------------------ */
  return (
    <div
      ref={rootRef}
      className={embedded ? "flex flex-col" : "app-shell-bg flex min-h-[100dvh] flex-col"}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Top app bar — hidden when embedded inside another shell */}
      {!embedded && (
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
          <div className="brand-stripe rounded-none">
            <span /><span /><span /><span /><span />
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size={36} withWordmark />
            <p className="hidden text-[11px] text-muted-foreground lg:block">
              1 clique: selecionar · 2 cliques: editar · 3 cliques: limpar
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {!isDesktop && (
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Ferramentas"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="hidden xs:inline">Editor</span>
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              aria-label="Tela cheia"
              title="Tela cheia"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-accent"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                aria-label="Sair"
                title="Sair"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
          </div>
        </header>
      )}

      {/* Floating controls when embedded (no header) */}
      {embedded && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="hidden text-[11px] text-muted-foreground lg:block">
            1 clique: selecionar · 2 cliques: editar · 3 cliques: limpar
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            {!isDesktop && (
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Ferramentas"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="hidden xs:inline">Editor</span>
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              aria-label="Tela cheia"
              title="Tela cheia"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-accent"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main split layout */}
      <div className={embedded ? "flex flex-1 gap-4 lg:gap-6" : "flex flex-1 gap-4 p-3 sm:p-5 lg:gap-6 lg:p-6"}>

        {/* Sidebar (desktop) */}
        {isDesktop && (
          <aside className="flex w-[280px] shrink-0 flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <CountrySelect variant="bare" value={board.awayCountry} onChange={board.setAwayCountry} />
            <div className="h-px bg-border" />
            <Toolbar
              variant="stack"
              tool={board.tool}
              setTool={board.setTool}
              penColor={board.penColor}
              setPenColor={board.setPenColor}
              penStyle={board.penStyle}
              setPenStyle={board.setPenStyle}
              onClear={() => canvasRef.current?.clear()}
              rotation={board.rotation}
              onRotate={board.rotate}
              isFullscreen={false}
              onToggleFullscreen={toggleFullscreen}
              onResetFormation={handleResetFormation}
              onApplyFormation={board.applyFormation}
            />
          </aside>
        )}

        {/* Court + bench column */}
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-sm)] sm:p-5">
            <CourtStage
              ref={(node) => { courtRef.current = node; }}
              isVertical={isVertical}
              maxH={
                isVertical
                  ? isPhone ? "calc(100dvh - 300px)" : isDesktop ? "calc(100dvh - 220px)" : "calc(100dvh - 240px)"
                  : isPhone ? "calc(100dvh - 260px)" : isDesktop ? "calc(100dvh - 220px)" : "calc(100dvh - 220px)"
              }
              board={board}
              canvasRef={canvasRef}
              courtPlayers={courtPlayers}
              drag={drag}
              handleTokenPointerDown={handleTokenPointerDown}
              setEditingId={setEditingId}
              tokenSize={TOKEN_SIZE}
            />
          </div>

          {/* Bench */}
          <div
            ref={benchRef}
            className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-sm)] sm:p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Banco de Reservas
                </h2>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {benchPlayers.length}
              </span>
            </div>
            <div className="flex items-start gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2.5 sm:overflow-visible">
              {benchPlayers.map((p) => {
                const isDragged = drag?.playerId === p.id;
                return (
                  <div key={p.id} className="shrink-0" style={{ opacity: isDragged ? 0.35 : 1 }}>
                    <PlayerToken
                      player={p}
                      size={BENCH_TOKEN_SIZE}
                      draggable={board.tool === "hand"}
                      onPointerDown={handleTokenPointerDown(p)}
                      onEdit={() => setEditingId(p.id)}
                      onClear={() => board.clearPlayer(p.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile/tablet bottom sheet — sidebar contents */}
      {!isDesktop && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 shadow-[var(--shadow-lg)]"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex flex-col gap-5">
              <CountrySelect variant="bare" value={board.awayCountry} onChange={board.setAwayCountry} />
              <div className="h-px bg-border" />
              <Toolbar
                variant="stack"
                tool={board.tool}
                setTool={board.setTool}
                penColor={board.penColor}
                setPenColor={board.setPenColor}
                penStyle={board.penStyle}
                setPenStyle={board.setPenStyle}
                onClear={() => canvasRef.current?.clear()}
                rotation={board.rotation}
                onRotate={board.rotate}
                isFullscreen={false}
                onToggleFullscreen={toggleFullscreen}
                onResetFormation={handleResetFormation}
                onApplyFormation={board.applyFormation}
              />
            </div>
          </div>
        </>
      )}

      {drag && draggedPlayer && ghostPos && (
        <DragGhost player={draggedPlayer} size={TOKEN_SIZE} pos={ghostPos} awayCountry={board.awayCountry} />
      )}

      <PlayerEditModal
        player={editingPlayer}
        onClose={() => setEditingId(null)}
        onSave={(patch) => editingId && board.updatePlayerDetails(editingId, patch)}
        onClear={() => editingId && board.clearPlayer(editingId)}
      />
    </div>
  );
}

/* ---------- helper components ---------- */

interface CourtStageProps {
  isVertical: boolean;
  maxH: string;
  board: ReturnType<typeof useTacticalBoard>;
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  courtPlayers: Player[];
  drag: DragState | null;
  handleTokenPointerDown: (player: Player) => (e: React.PointerEvent) => void;
  setEditingId: (id: string) => void;
  tokenSize: number;
}

const CourtStage = (() => {
  const Inner = (
    {
      isVertical, maxH, board, canvasRef, courtPlayers, drag,
      handleTokenPointerDown, setEditingId, tokenSize,
    }: CourtStageProps,
    ref: React.Ref<HTMLDivElement>,
  ) => (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl ring-1 ring-border shadow-[var(--shadow-md)] sm:rounded-2xl"
      style={{
        aspectRatio: isVertical ? "1 / 2" : "2 / 1",
        width: isVertical ? "min(100%, 60dvh)" : "min(100%, 180dvh)",
        maxHeight: maxH,
      }}
    >
      <Court rotation={board.rotation} />
      <DrawingCanvas
        ref={canvasRef}
        active={board.tool === "pen"}
        color={board.penColor}
        style={board.penStyle}
        rotation={board.rotation}
      />
      <div
        className="absolute inset-0"
        style={{ pointerEvents: board.tool === "pen" ? "none" : "auto", zIndex: 20 }}
      >
        {courtPlayers.map((p) => {
          const isDragged = drag?.playerId === p.id;
          const disp = toDisplay(p.x, p.y, board.rotation);
          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${disp.left}%`,
                top: `${disp.top}%`,
                transform: "translate(-50%, -50%)",
                opacity: isDragged ? 0.35 : 1,
                transition: drag ? "none" : "left 0.2s, top 0.2s",
              }}
            >
              <PlayerToken
                player={p}
                size={tokenSize}
                draggable={board.tool === "hand"}
                awayCountry={board.awayCountry}
                onPointerDown={handleTokenPointerDown(p)}
                onEdit={() => setEditingId(p.id)}
                onClear={() => board.clearPlayer(p.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
  // forwardRef-equivalent without React.forwardRef noise
  return Object.assign(
    (props: CourtStageProps & { ref?: React.Ref<HTMLDivElement> }) => Inner(props, props.ref ?? null),
    { displayName: "CourtStage" },
  );
})();

function DragGhost({
  player, size, pos, awayCountry,
}: {
  player: Player; size: number; pos: { x: number; y: number };
  awayCountry: ReturnType<typeof useTacticalBoard>["awayCountry"];
}) {
  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
    >
      <PlayerToken player={player} size={size} draggable={false} awayCountry={awayCountry} />
    </div>
  );
}
