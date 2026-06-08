import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  listTimes,
  listFases,
  createFase,
  updateFaseNome,
  deleteFase,
  reorderFases,
  getFaseTimes,
  setFaseTimes,
  listPartidasByFase,
  createPartida,
  setPlacar,
  clearPlacar,
  deletePartida,
  getClassificacaoFase,
  getClassificacao,
} from "@/lib/championship.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Pencil, Check, X, Users } from "lucide-react";
import { toast } from "sonner";
import { TeamCrest } from "@/routes/publico";

export function CampeonatoTab() {
  const listFasesFn = useServerFn(listFases);
  const createFaseFn = useServerFn(createFase);
  const reorderFn = useServerFn(reorderFases);
  const qc = useQueryClient();

  const { data: fases = [] } = useQuery({
    queryKey: ["admin", "fases"],
    queryFn: () => listFasesFn(),
  });

  const [localFases, setLocalFases] = useState<any[]>([]);
  useEffect(() => {
    setLocalFases(fases as any[]);
  }, [fases]);

  const [novaFase, setNovaFase] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFase = async () => {
    const nome = novaFase.trim();
    if (!nome) return;
    try {
      await createFaseFn({ data: { nome } });
      setNovaFase("");
      toast.success("Fase criada");
      qc.invalidateQueries({ queryKey: ["admin", "fases"] });
      qc.invalidateQueries({ queryKey: ["pub"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = localFases.findIndex((f) => f.id === active.id);
    const newIdx = localFases.findIndex((f) => f.id === over.id);
    const next = arrayMove(localFases, oldIdx, newIdx);
    setLocalFases(next);
    try {
      await reorderFn({ data: { orderedIds: next.map((f) => f.id) } });
      qc.invalidateQueries({ queryKey: ["admin", "fases"] });
      qc.invalidateQueries({ queryKey: ["pub"] });
    } catch (err: any) {
      toast.error(err.message);
      setLocalFases(fases as any[]);
    }
  };

  return (
    <div className="space-y-6">
      <ClassificacaoGeral />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-md)]">
        <Label>Nova fase</Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={novaFase}
            onChange={(e) => setNovaFase(e.target.value)}
            placeholder="Ex.: Fase de Grupos, Semifinal, Final…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFase();
              }
            }}
          />
          <Button onClick={addFase}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Arraste as fases pela alça <GripVertical className="inline h-3 w-3" /> para reordená-las.
        </p>
      </div>

      {localFases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma fase criada ainda.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={localFases.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {localFases.map((f) => (
                <FaseBlock key={f.id} fase={f} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function FaseBlock({ fase }: { fase: any }) {
  const updateNomeFn = useServerFn(updateFaseNome);
  const delFaseFn = useServerFn(deleteFase);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(fase.nome);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fase.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const salvarNome = async () => {
    const n = nome.trim();
    if (!n || n === fase.nome) {
      setEditing(false);
      setNome(fase.nome);
      return;
    }
    try {
      await updateNomeFn({ data: { id: fase.id, nome: n } });
      toast.success("Fase atualizada");
      qc.invalidateQueries({ queryKey: ["admin", "fases"] });
      qc.invalidateQueries({ queryKey: ["pub"] });
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remover = async () => {
    if (!confirm(`Remover a fase "${fase.nome}"? Todas as partidas dela serão excluídas.`)) return;
    try {
      await delFaseFn({ data: { id: fase.id } });
      toast.success("Fase removida");
      qc.invalidateQueries({ queryKey: ["admin", "fases"] });
      qc.invalidateQueries({ queryKey: ["pub"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-muted/60 to-transparent px-5 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Reordenar"
          type="button"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {editing ? (
          <>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              className="max-w-sm"
            />
            <Button size="sm" onClick={salvarNome}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setNome(fase.nome);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <h3 className="flex-1 font-condensed text-2xl font-extrabold uppercase tracking-tight">
              {fase.nome}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={remover}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <div className="border-b border-border bg-muted/10 p-5">
        <FaseClassificacao faseId={fase.id} />
      </div>
      <div className="grid gap-0 lg:grid-cols-12">
        <div className="border-b border-border bg-muted/20 p-5 lg:col-span-4 lg:border-b-0 lg:border-r">
          <FaseTimes faseId={fase.id} />
        </div>
        <div className="p-5 lg:col-span-8">
          <FasePartidas faseId={fase.id} />
        </div>
      </div>
    </div>
  );
}

function FaseTimes({ faseId }: { faseId: string }) {
  const listTimesFn = useServerFn(listTimes);
  const getFaseTimesFn = useServerFn(getFaseTimes);
  const setFaseTimesFn = useServerFn(setFaseTimes);
  const qc = useQueryClient();

  const { data: allTimes = [] } = useQuery({
    queryKey: ["admin", "times"],
    queryFn: () => listTimesFn(),
  });
  const { data: faseTimes = [] } = useQuery({
    queryKey: ["fase-times", faseId],
    queryFn: () => getFaseTimesFn({ data: { faseId } }),
  });

  const selectedIds = useMemo(
    () => new Set((faseTimes as any[]).map((ft) => ft.time_id)),
    [faseTimes],
  );

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (open) setDraft(new Set(selectedIds));
  }, [open, selectedIds]);

  const toggle = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const salvar = async () => {
    try {
      await setFaseTimesFn({ data: { faseId, timeIds: Array.from(draft) } });
      toast.success("Times atualizados");
      qc.invalidateQueries({ queryKey: ["fase-times", faseId] });
      qc.invalidateQueries({ queryKey: ["partidas", faseId] });
      qc.invalidateQueries({ queryKey: ["classif", faseId] });
      qc.invalidateQueries({ queryKey: ["pub"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Times participantes
        </h4>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Users className="mr-1 h-3.5 w-3.5" /> Editar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Times desta fase</DialogTitle>
            </DialogHeader>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {(allTimes as any[]).map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={draft.has(t.id)}
                    onChange={() => toggle(t.id)}
                    className="h-4 w-4"
                  />
                  <TeamCrest url={t.escudo_url} nome={t.nome} size={28} />
                  <span className="text-sm font-semibold">{t.nome}</span>
                </label>
              ))}
              {(allTimes as any[]).length === 0 && (
                <p className="p-2 text-sm text-muted-foreground">Nenhum time cadastrado.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={salvar}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {(faseTimes as any[]).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum time selecionado.</p>
      ) : (
        <ul className="space-y-1.5">
          {(faseTimes as any[]).map((ft) => (
            <li
              key={ft.time_id}
              className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-sm"
            >
              <TeamCrest url={ft.time?.escudo_url} nome={ft.time?.nome ?? ""} size={22} />
              <span className="truncate font-medium">{ft.time?.nome}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FasePartidas({ faseId }: { faseId: string }) {
  const getFaseTimesFn = useServerFn(getFaseTimes);
  const listFn = useServerFn(listPartidasByFase);
  const createFn = useServerFn(createPartida);
  const setPlacarFn = useServerFn(setPlacar);
  const clearFn = useServerFn(clearPlacar);
  const delFn = useServerFn(deletePartida);
  const qc = useQueryClient();

  const { data: faseTimes = [] } = useQuery({
    queryKey: ["fase-times", faseId],
    queryFn: () => getFaseTimesFn({ data: { faseId } }),
  });
  const { data: partidas = [] } = useQuery({
    queryKey: ["partidas", faseId],
    queryFn: () => listFn({ data: { faseId } }),
  });

  const times = (faseTimes as any[]).map((ft) => ft.time).filter(Boolean);

  const [casa, setCasa] = useState("");
  const [fora, setFora] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  const adicionar = async () => {
    if (!casa || !fora) return toast.error("Selecione os dois times");
    if (casa === fora) return toast.error("Times devem ser diferentes");
    const dataHora = data ? `${data}T${hora || "00:00"}` : null;
    try {
      await createFn({
        data: { fase_id: faseId, time_casa_id: casa, time_fora_id: fora, data_hora: dataHora },
      });
      toast.success("Partida criada");
      setCasa("");
      setFora("");
      setData("");
      setHora("");
      qc.invalidateQueries({ queryKey: ["partidas", faseId] });
      qc.invalidateQueries({ queryKey: ["pub"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Partidas</h4>
      {times.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Adicione ao menos 2 times para criar partidas.
        </p>
      ) : (
        <div className="mb-4 space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-3">
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <Select value={casa} onValueChange={setCasa}>
              <SelectTrigger>
                <SelectValue placeholder="Casa" />
              </SelectTrigger>
              <SelectContent>
                {times.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fora} onValueChange={setFora}>
              <SelectTrigger>
                <SelectValue placeholder="Visitante" />
              </SelectTrigger>
              <SelectContent>
                {times.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[1fr_120px_auto] gap-2">
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Data"
            />
            <Input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              placeholder="Hora"
            />
            <Button size="sm" onClick={adicionar}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>
      )}

      {(partidas as any[]).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma partida.</p>
      ) : (
        <ul className="space-y-2.5">
          {(partidas as any[]).map((p) => (
            <PartidaRow
              key={p.id}
              partida={p}
              onSetPlacar={async (gc, gf) => {
                try {
                  await setPlacarFn({ data: { id: p.id, gols_casa: gc, gols_fora: gf } });
                  qc.invalidateQueries({ queryKey: ["partidas", faseId] });
                  qc.invalidateQueries({ queryKey: ["classif", faseId] });
                  qc.invalidateQueries({ queryKey: ["admin", "classificacao-geral"] });
                  qc.invalidateQueries({ queryKey: ["pub"] });
                  toast.success("Placar salvo");
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              onClear={async () => {
                try {
                  await clearFn({ data: { id: p.id } });
                  qc.invalidateQueries({ queryKey: ["partidas", faseId] });
                  qc.invalidateQueries({ queryKey: ["classif", faseId] });
                  qc.invalidateQueries({ queryKey: ["admin", "classificacao-geral"] });
                  qc.invalidateQueries({ queryKey: ["pub"] });
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              onDelete={async () => {
                if (!confirm("Excluir partida?")) return;
                try {
                  await delFn({ data: { id: p.id } });
                  qc.invalidateQueries({ queryKey: ["partidas", faseId] });
                  qc.invalidateQueries({ queryKey: ["classif", faseId] });
                  qc.invalidateQueries({ queryKey: ["admin", "classificacao-geral"] });
                  qc.invalidateQueries({ queryKey: ["pub"] });
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PartidaRow({
  partida,
  onSetPlacar,
  onClear,
  onDelete,
}: {
  partida: any;
  onSetPlacar: (gc: number, gf: number) => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  const encerrada = partida.status === "encerrado";
  const [editing, setEditing] = useState(false);
  const [gc, setGc] = useState<number>(partida.gols_time_casa ?? 0);
  const [gf, setGf] = useState<number>(partida.gols_time_fora ?? 0);

  useEffect(() => {
    setGc(partida.gols_time_casa ?? 0);
    setGf(partida.gols_time_fora ?? 0);
  }, [partida.gols_time_casa, partida.gols_time_fora]);

  return (
    <li className="rounded-xl border border-border bg-background p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold">{partida.time_casa?.nome}</span>
          <TeamCrest
            url={partida.time_casa?.escudo_url}
            nome={partida.time_casa?.nome ?? ""}
            size={26}
          />
        </div>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              value={gc}
              onChange={(e) => setGc(+e.target.value)}
              className="h-8 w-12 px-1 text-center text-base font-bold"
            />
            <span className="font-bold text-muted-foreground">×</span>
            <Input
              type="number"
              min={0}
              value={gf}
              onChange={(e) => setGf(+e.target.value)}
              className="h-8 w-12 px-1 text-center text-base font-bold"
            />
          </div>
        ) : (
          <span
            className={`min-w-[64px] text-center font-mono text-lg font-extrabold ${encerrada ? "text-foreground" : "text-muted-foreground"}`}
          >
            {encerrada ? `${partida.gols_time_casa} × ${partida.gols_time_fora}` : "vs"}
          </span>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamCrest
            url={partida.time_fora?.escudo_url}
            nome={partida.time_fora?.nome ?? ""}
            size={26}
          />
          <span className="truncate text-sm font-semibold">{partida.time_fora?.nome}</span>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${encerrada ? "bg-[var(--brand-green)]/15 text-[var(--brand-green)]" : "bg-muted text-muted-foreground"}`}
          >
            {encerrada ? "Finalizada" : "Pendente"}
          </span>
          {partida.data_hora && (
            <span className="text-xs text-muted-foreground">
              {new Date(partida.data_hora).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {editing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => {
                  onSetPlacar(gc, gf);
                  setEditing(false);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => {
                  setEditing(false);
                  setGc(partida.gols_time_casa ?? 0);
                  setGf(partida.gols_time_fora ?? 0);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {encerrada && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={onClear}
                  title="Limpar placar"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function FaseClassificacao({ faseId }: { faseId: string }) {
  const fn = useServerFn(getClassificacaoFase);
  const { data = [] } = useQuery({
    queryKey: ["classif", faseId],
    queryFn: () => fn({ data: { faseId } }),
  });

  return (
    <div>
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
        Classificação
      </h4>
      {(data as any[]).length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Time</th>
                <th className="px-1.5 py-2">J</th>
                <th className="px-1.5 py-2">V</th>
                <th className="px-1.5 py-2">E</th>
                <th className="px-1.5 py-2">D</th>
                <th className="px-1.5 py-2">SG</th>
                <th className="px-2 py-2 text-[var(--brand-red)]">Pts</th>
              </tr>
            </thead>
            <tbody>
              {(data as any[]).map((r, i) => (
                <tr key={r.time_id} className="border-t border-border">
                  <td className="px-2 py-2 font-bold">{i + 1}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <TeamCrest url={r.escudo_url} nome={r.time_nome} size={20} />
                      <span className="truncate font-medium">{r.time_nome}</span>
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center">{r.jogos}</td>
                  <td className="px-1.5 py-2 text-center">{r.vitorias}</td>
                  <td className="px-1.5 py-2 text-center">{r.empates}</td>
                  <td className="px-1.5 py-2 text-center">{r.derrotas}</td>
                  <td className="px-1.5 py-2 text-center">{r.saldo}</td>
                  <td className="px-2 py-2 text-center font-extrabold text-[var(--brand-red)]">
                    {r.pontos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClassificacaoGeral() {
  const fn = useServerFn(getClassificacao);
  const { data = [] } = useQuery({
    queryKey: ["admin", "classificacao-geral"],
    queryFn: () => fn(),
  });
  const rows = data as any[];
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[var(--brand-red)]/40 bg-card shadow-[var(--shadow-lg)]">
      <div className="border-b border-border bg-gradient-to-r from-[var(--brand-red)]/10 to-[var(--brand-blue)]/10 px-5 py-3">
        <h3 className="font-condensed text-lg font-extrabold uppercase tracking-tight">
          Classificação geral
        </h3>
        <p className="text-xs text-muted-foreground">
          Todos os times de todas as fases — atualizada automaticamente.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          Ainda não há partidas finalizadas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Posição</th>
                <th className="px-3 py-3 text-left">Time</th>
                <th className="px-3 py-3 text-center">Jogos</th>
                <th className="px-3 py-3 text-center">Vitórias</th>
                <th className="px-3 py-3 text-center">Empates</th>
                <th className="px-3 py-3 text-center">Derrotas</th>
                <th className="px-3 py-3 text-center">Gols pró</th>
                <th className="px-3 py-3 text-center">Gols contra</th>
                <th className="px-3 py-3 text-center">Saldo</th>
                <th className="px-3 py-3 text-center font-extrabold text-foreground">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.time_id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-bold">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${i < 3 ? "bg-[var(--brand-amber)] text-black" : "bg-muted"}`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <TeamCrest url={r.escudo_url} nome={r.time_nome} size={22} />
                      <span className="font-semibold">{r.time_nome}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">{r.jogos}</td>
                  <td className="px-2 py-2 text-center">{r.vitorias}</td>
                  <td className="px-2 py-2 text-center">{r.empates}</td>
                  <td className="px-2 py-2 text-center">{r.derrotas}</td>
                  <td className="px-2 py-2 text-center">{r.gols_pro}</td>
                  <td className="px-2 py-2 text-center">{r.gols_contra}</td>
                  <td className="px-2 py-2 text-center">{r.saldo}</td>
                  <td className="px-2 py-2 text-center font-extrabold text-[var(--brand-red)]">
                    {r.pontos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
