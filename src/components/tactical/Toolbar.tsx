import { Hand, Pen, Eraser, Minus, Maximize2, Minimize2, RotateCw, RotateCcw, LayoutGrid } from "lucide-react";
import type { PenStyle, Tool, Rotation, FormationName } from "@/hooks/useTacticalBoard";

interface Props {
  tool: Tool;
  setTool: (t: Tool) => void;
  penColor: string;
  setPenColor: (c: string) => void;
  penStyle: PenStyle;
  setPenStyle: (s: PenStyle) => void;
  onClear: () => void;
  rotation: Rotation;
  onRotate: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onResetFormation?: () => void;
  onApplyFormation?: (name: FormationName) => void;
  /** "stack" = vertical sidebar layout, "row" = horizontal compact dock. */
  variant?: "stack" | "row";
}

const FORMATIONS: Array<{ name: FormationName; label: string; hint: string }> = [
  { name: "1-2-1", label: "1-2-1", hint: "Losango • fixo, 2 alas e pivô" },
  { name: "2-2", label: "2-2", hint: "Quadrado • 2 fixos e 2 pivôs" },
  { name: "3-1", label: "3-1", hint: "Pirâmide • 3 atrás e pivô" },
  { name: "4-0", label: "4-0", hint: "Linha • sem pivô fixo" },
];

const COLORS = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#2563eb", label: "Azul" },
  { value: "#f59e0b", label: "Amarelo" },
];

export function Toolbar({
  tool,
  setTool,
  penColor,
  setPenColor,
  penStyle,
  setPenStyle,
  onClear,
  rotation,
  onRotate,
  isFullscreen,
  onToggleFullscreen,
  onResetFormation,
  onApplyFormation,
  variant = "row",
}: Props) {
  if (variant === "stack") {
    return (
      <div className="flex flex-col gap-5">
        <Section title="Ferramentas">
          <div className="grid grid-cols-2 gap-2">
            <BigBtn active={tool === "hand"} onClick={() => setTool("hand")} icon={<Hand className="h-4 w-4" />} label="Mover" />
            <BigBtn active={tool === "pen"} onClick={() => setTool("pen")} icon={<Pen className="h-4 w-4" />} label="Desenhar" />
          </div>
        </Section>

        <Section title="Cor da caneta">
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                aria-label={c.label}
                title={c.label}
                onClick={() => { setPenColor(c.value); setTool("pen"); }}
                className="relative h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110"
                style={{
                  background: c.value,
                  boxShadow: penColor === c.value ? "0 0 0 2px var(--foreground)" : "0 1px 2px rgba(0,0,0,0.15)",
                  // @ts-expect-error custom prop ok
                  "--tw-ring-color": "transparent",
                }}
              />
            ))}
          </div>
        </Section>

        <Section title="Estilo de linha">
          <div className="grid grid-cols-2 gap-2">
            <BigBtn
              active={penStyle === "solid"}
              onClick={() => setPenStyle("solid")}
              icon={<Minus className="h-4 w-4" strokeWidth={3} />}
              label="Contínua"
            />
            <BigBtn
              active={penStyle === "dashed"}
              onClick={() => setPenStyle("dashed")}
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                  <line x1="3" y1="12" x2="7" y2="12" />
                  <line x1="11" y1="12" x2="15" y2="12" />
                  <line x1="19" y1="12" x2="21" y2="12" />
                </svg>
              }
              label="Tracejada"
            />
          </div>
          <button
            onClick={onClear}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
          >
            <Eraser className="h-3.5 w-3.5" /> Limpar desenhos
          </button>
        </Section>

        <Section title="Visualização">
          <div className="grid grid-cols-2 gap-2">
            <BigBtn
              active={false}
              onClick={onRotate}
              icon={<RotateCw className="h-4 w-4 transition-transform" style={{ transform: `rotate(${rotation}deg)` }} />}
              label={`Girar (${rotation}°)`}
            />
            <BigBtn
              active={isFullscreen}
              onClick={onToggleFullscreen}
              icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              label={isFullscreen ? "Sair" : "Tela cheia"}
            />
          </div>
        </Section>

        {onApplyFormation && (
          <Section title="Formações rápidas">
            <div className="grid grid-cols-2 gap-2">
              {FORMATIONS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => onApplyFormation(f.name)}
                  title={f.hint}
                  className="group flex flex-col items-start gap-1 rounded-lg border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-condensed text-sm font-bold leading-none text-foreground">{f.label}</span>
                    <FormationGlyph name={f.name} />
                  </div>
                  <span className="text-[10px] leading-snug text-muted-foreground">{f.hint}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {onResetFormation && (
          <Section title="Esquema">
            <button
              onClick={onResetFormation}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Resetar formação 1-2-1
            </button>
          </Section>
        )}
      </div>
    );
  }

  // row (compact dock)
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-card/95 p-2 shadow-[var(--shadow-md)] backdrop-blur">
      <Group label="Ferramentas">
        <IconBtn active={tool === "hand"} onClick={() => setTool("hand")} label="Mover" icon={<Hand className="h-5 w-5" />} />
        <IconBtn active={tool === "pen"} onClick={() => setTool("pen")} label="Desenhar" icon={<Pen className="h-5 w-5" />} />
      </Group>

      <Group label="Cor">
        {COLORS.map((c) => (
          <button
            key={c.value}
            aria-label={c.label}
            title={c.label}
            onClick={() => { setPenColor(c.value); setTool("pen"); }}
            className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              background: c.value,
              borderColor: penColor === c.value ? "var(--foreground)" : "transparent",
            }}
          />
        ))}
      </Group>

      <Group label="Linha">
        <IconBtn active={penStyle === "solid"} onClick={() => setPenStyle("solid")} label="Contínua" icon={<Minus className="h-5 w-5" strokeWidth={3} />} />
        <IconBtn
          active={penStyle === "dashed"}
          onClick={() => setPenStyle("dashed")}
          label="Tracejada"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
              <line x1="3" y1="12" x2="7" y2="12" />
              <line x1="11" y1="12" x2="15" y2="12" />
              <line x1="19" y1="12" x2="21" y2="12" />
            </svg>
          }
        />
        <button
          onClick={onClear}
          aria-label="Limpar desenhos"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-destructive/90 px-2.5 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive"
        >
          <Eraser className="h-4 w-4" />
          <span className="hidden sm:inline">Limpar</span>
        </button>
      </Group>

      <Group label="Visual">
        <IconBtn
          active={false}
          onClick={onRotate}
          label={`Girar (${rotation}°)`}
          icon={<RotateCw className="h-5 w-5 transition-transform" style={{ transform: `rotate(${rotation}deg)` }} />}
        />
        <IconBtn
          active={isFullscreen}
          onClick={onToggleFullscreen}
          label={isFullscreen ? "Sair" : "Tela cheia"}
          icon={isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        />
      </Group>

      {onApplyFormation && (
        <Group label="Formações">
          <LayoutGrid className="ml-1 mr-0.5 h-4 w-4 text-muted-foreground" />
          {FORMATIONS.map((f) => (
            <button
              key={f.name}
              onClick={() => onApplyFormation(f.name)}
              title={f.hint}
              className="flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-2 font-condensed text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              {f.label}
            </button>
          ))}
        </Group>
      )}

      {onResetFormation && (
        <Group label="Esquema">
          <IconBtn active={false} onClick={onResetFormation} label="Resetar formação" icon={<RotateCcw className="h-5 w-5" />} />
        </Group>
      )}
    </div>
  );
}

function FormationGlyph({ name }: { name: FormationName }) {
  // Mini SVG showing player dots in attacking-half layout (24x16 box).
  const dots: Record<FormationName, Array<[number, number]>> = {
    "1-2-1": [[5, 8], [11, 4], [11, 12], [18, 8]],
    "2-2": [[7, 5], [7, 11], [17, 5], [17, 11]],
    "3-1": [[7, 4], [7, 8], [7, 12], [18, 8]],
    "4-0": [[12, 3], [12, 7], [12, 11], [12, 15]],
  };
  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-5 text-primary/70">
      <rect x="0.5" y="0.5" width="23" height="15" rx="1.5" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      {dots[name].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.4" fill="currentColor" />
      ))}
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface/60 px-1.5 py-1"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

function IconBtn({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
      style={{
        background: active ? "var(--primary)" : "transparent",
        color: active ? "var(--primary-foreground)" : "var(--foreground)",
      }}
    >
      {icon}
    </button>
  );
}

function BigBtn({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-11 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors"
      style={{
        background: active ? "var(--primary)" : "var(--surface)",
        color: active ? "var(--primary-foreground)" : "var(--foreground)",
        borderColor: active ? "transparent" : "var(--border)",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
