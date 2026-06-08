import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import {
  listTimes,
  listJogos,
  listFases,
  getClassificacao,
  upsertTime,
  deleteTime,
  gerarChavePresidente,
  getChavePresidente,
  listChavesPresidente,
  revogarChavePresidente,
  upsertJogador,
  deleteJogador,
  listJogadoresByTime,
  upsertJogo,
  deleteJogo,
  listEventosJogo,
  setEventosPartida,
  getArtilharia,
  getAssistencias,
  getCartoes,
  uploadJogadorFoto,
} from "@/lib/championship.functions";
import { prepararImagem } from "@/lib/image";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { BrandMark } from "@/components/brand/BrandMark";
import {
  Trophy,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Key,
  Copy,
  Check,
  RefreshCw,
  ShieldOff,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { TeamCrest, PublicoView } from "./publico";
import { Flag, COUNTRIES } from "@/components/tactical/flags/Flags";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CampeonatoTab } from "@/components/admin/CampeonatoTab";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin · COPA DO MUNDO UNASP 2026" }] }),
});

function AdminPage() {
  const { isAuthenticated, role, loaded, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loaded && (!isAuthenticated || role !== "admin")) {
      navigate({ to: "/", replace: true });
    }
  }, [loaded, isAuthenticated, role, navigate]);

  if (!loaded || !isAuthenticated || role !== "admin") {
    return <LoadingScreen />;
  }

  return (
    <main className="app-shell-bg min-h-[100dvh]">
      <div className="brand-stripe rounded-none">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 md:gap-4 md:px-8 md:py-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <BrandMark size={32} withWordmark />
            <span className="hidden rounded-full bg-[var(--brand-red)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-red)] sm:inline">
              Painel do Administrador
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="min-h-10"
            >
              <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          Gestão do campeonato
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Cadastre times, jogadores, jogos e lance resultados.
        </p>

        <Tabs defaultValue="times" className="mt-5 md:mt-6">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex h-auto w-max gap-1 p-1 md:grid md:w-full md:max-w-4xl md:grid-cols-6 md:gap-0">
              <TabsTrigger
                value="times"
                className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm md:px-2"
              >
                Times
              </TabsTrigger>
              <TabsTrigger
                value="chaves"
                className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm md:px-2"
              >
                Chaves
              </TabsTrigger>
              <TabsTrigger
                value="jogadores"
                className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm md:px-2"
              >
                Jogadores
              </TabsTrigger>
              <TabsTrigger
                value="campeonato"
                className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm md:px-2"
              >
                Campeonato
              </TabsTrigger>
              <TabsTrigger
                value="eventos"
                className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm md:px-2"
              >
                Eventos
              </TabsTrigger>
              <TabsTrigger
                value="publica"
                className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm md:px-2"
              >
                Tela Pública
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="times" className="mt-6">
            <TimesTab />
          </TabsContent>
          <TabsContent value="chaves" className="mt-6">
            <ChavesTab />
          </TabsContent>
          <TabsContent value="jogadores" className="mt-6">
            <JogadoresTab />
          </TabsContent>
          <TabsContent value="campeonato" className="mt-6">
            <CampeonatoTab />
          </TabsContent>
          <TabsContent value="eventos" className="mt-6">
            <EventosTab />
          </TabsContent>
          <TabsContent value="publica" className="mt-6">
            <TelaPublicaTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// ============ TIMES ============
function TimesTab() {
  const listFn = useServerFn(listTimes);
  const upsertFn = useServerFn(upsertTime);
  const delFn = useServerFn(deleteTime);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin", "times"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const onSave = async (payload: any) => {
    try {
      await upsertFn({ data: payload });
      toast.success("Time salvo");
      qc.invalidateQueries({ queryKey: ["admin", "times"] });
      qc.invalidateQueries({ queryKey: ["pub"] });
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card
      title="Times"
      action={
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Novo time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar time" : "Novo time"}</DialogTitle>
              <DialogDescription>Cadastre nome, bandeira e presidente do time.</DialogDescription>
            </DialogHeader>
            <TimeForm initial={editing} onSave={onSave} />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <TeamCrest url={t.escudo_url} nome={t.nome} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{t.nome}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.presidente_nome ?? "Sem presidente"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(t);
                  setOpen(true);
                }}
              >
                <Edit className="mr-1 h-3 w-3" />
                Editar
              </Button>
              <KeyButton timeId={t.id} />
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Excluir time?")) return;
                  try {
                    await delFn({ data: { id: t.id } });
                    toast.success("Excluído");
                    qc.invalidateQueries({ queryKey: ["admin", "times"] });
                    qc.invalidateQueries({ queryKey: ["admin", "chaves"] });
                    qc.invalidateQueries({ queryKey: ["pub"] });
                  } catch (e: any) {
                    toast.error(e?.message ?? "Erro ao excluir");
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">Nenhum time cadastrado.</p>
        )}
      </div>
    </Card>
  );
}

function TimeForm({ initial, onSave }: { initial: any; onSave: (p: any) => void }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [escudo, setEscudo] = useState(initial?.escudo_url ?? "");
  const [pres, setPres] = useState(initial?.presidente_nome ?? "");
  const currentFlag = escudo?.startsWith("flag:") ? escudo.slice(5) : "";
  const onPickCountry = (code: string) => {
    setEscudo(`flag:${code}`);
    const country = COUNTRIES.find((c) => c.code === code);
    if (country && !nome.trim()) setNome(country.name);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: initial?.id,
          nome,
          escudo_url: escudo || null,
          presidente_nome: pres || null,
        });
      }}
      className="space-y-3"
    >
      <div>
        <Label>Seleção (bandeira)</Label>
        <Select value={currentFlag} onValueChange={onPickCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha uma seleção">
              {currentFlag && (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-6 overflow-hidden rounded-sm ring-1 ring-border">
                    <Flag code={currentFlag as any} className="h-full w-full" />
                  </span>
                  {COUNTRIES.find((c) => c.code === currentFlag)?.name}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-6 overflow-hidden rounded-sm ring-1 ring-border">
                    <Flag code={c.code} className="h-full w-full" />
                  </span>
                  {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Nome do time</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div>
        <Label>Escudo personalizado (URL, opcional)</Label>
        <Input
          value={escudo?.startsWith("flag:") ? "" : escudo}
          onChange={(e) => setEscudo(e.target.value)}
          placeholder="https://... (substitui a bandeira)"
        />
      </div>
      <div>
        <Label>Nome do presidente</Label>
        <Input value={pres} onChange={(e) => setPres(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}

function KeyButton({ timeId }: { timeId: string }) {
  const getFn = useServerFn(getChavePresidente);
  const genFn = useServerFn(gerarChavePresidente);
  const [chave, setChave] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [showChave, setShowChave] = useState(false);

  const load = async () => {
    const r = await getFn({ data: { timeId } });
    setChave(r.chave);
    setShowChave(false);
  };
  const gerar = async () => {
    const r = await genFn({ data: { timeId } });
    setChave(r.chave);
    setShowChave(true);
    toast.success("Chave gerada");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) load();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Key className="mr-1 h-3 w-3" />
          Chave
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chave do presidente</DialogTitle>
        </DialogHeader>
        {chave ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm">
              <span className="flex-1 truncate select-all">
                {showChave ? chave : "•".repeat(chave.length)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setShowChave((s) => !s)}>
                {showChave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(chave);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--brand-green)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button variant="outline" onClick={gerar} className="w-full">
              Gerar nova chave
            </Button>
          </div>
        ) : (
          <Button onClick={gerar} className="w-full">
            Gerar chave de acesso
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============ JOGADORES ============
function JogadoresTab() {
  const timesFn = useServerFn(listTimes);
  const jogFn = useServerFn(listJogadoresByTime);
  const upsertFn = useServerFn(upsertJogador);
  const delFn = useServerFn(deleteJogador);
  const qc = useQueryClient();
  const { data: times = [] } = useQuery({ queryKey: ["admin", "times"], queryFn: () => timesFn() });
  const [timeId, setTimeId] = useState<string>("");
  const { data: jogs = [] } = useQuery({
    queryKey: ["admin", "jogadores", timeId],
    queryFn: () => jogFn({ data: { timeId } }),
    enabled: !!timeId,
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Card
      title="Jogadores"
      action={
        timeId && (
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Novo jogador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar jogador" : "Novo jogador"}</DialogTitle>
              </DialogHeader>
              <JogadorForm
                initial={editing}
                timeId={timeId}
                onSave={async (p: any) => {
                  try {
                    await upsertFn({ data: p });
                    toast.success("Jogador salvo");
                    qc.invalidateQueries({ queryKey: ["admin", "jogadores", timeId] });
                    qc.invalidateQueries({ queryKey: ["pub"] });
                    setOpen(false);
                    setEditing(null);
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        )
      }
    >
      <div className="mb-4 max-w-xs">
        <Label>Time</Label>
        <Select value={timeId} onValueChange={setTimeId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um time" />
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
      {timeId && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jogs.map((j: any) => (
            <div
              key={j.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 sm:gap-3"
            >
              {j.foto_url ? (
                <img
                  src={j.foto_url}
                  alt={j.nome}
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">
                  {j.numero ?? "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {j.numero ? `#${j.numero} ` : ""}
                  {j.nome}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {j.posicao ?? "—"} · {j.idade ?? "?"} anos
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(j);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Excluir?")) return;
                    try {
                      await delFn({ data: { id: j.id } });
                      toast.success("Excluído");
                      qc.invalidateQueries({ queryKey: ["admin", "jogadores", timeId] });
                      qc.invalidateQueries({ queryKey: ["pub"] });
                    } catch (e: any) {
                      toast.error(e?.message ?? "Erro ao excluir");
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {jogs.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">Nenhum jogador.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function JogadorForm({ initial, timeId, onSave }: any) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [fotoUrl, setFotoUrl] = useState(initial?.foto_url ?? "");
  const [idade, setIdade] = useState(initial?.idade ?? "");
  const [posicao, setPosicao] = useState(initial?.posicao ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const POSICOES = [
    { value: "Goleiro", label: "Goleiro" },
    { value: "Fixo", label: "Fixo" },
    { value: "Ala", label: "Ala" },
    { value: "Pivô", label: "Pivô" },
  ];

  const uploadFoto = useServerFn(uploadJogadorFoto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalFotoUrl = fotoUrl;
    if (file) {
      setUploading(true);
      try {
        if (file.size > 15 * 1024 * 1024) throw new Error("Imagem deve ter no máximo 15MB");
        const imagem = await prepararImagem(file, { maxLado: 1024, qualidade: 0.85 });
        const res = await uploadFoto({
          data: {
            timeId,
            fileName: imagem.fileName,
            contentType: imagem.contentType,
            base64: imagem.base64,
          },
        });
        finalFotoUrl = res.url;
      } catch (err: any) {
        toast.error("Erro ao enviar foto: " + err.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onSave({
      id: initial?.id,
      time_id: timeId,
      nome,
      foto_url: finalFotoUrl || null,
      idade: idade ? +idade : null,
      numero: initial?.numero ?? null,
      posicao: posicao || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Nome</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div>
        <Label>Idade</Label>
        <Input
          type="number"
          min={0}
          max={99}
          value={idade}
          onChange={(e) => setIdade(e.target.value)}
        />
      </div>
      <div>
        <Label>Posição</Label>
        <Select value={posicao} onValueChange={setPosicao}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a posição" />
          </SelectTrigger>
          <SelectContent>
            {POSICOES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Foto</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {fotoUrl && !file && (
            <img
              src={fotoUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
            />
          )}
          {file && <span className="text-xs text-muted-foreground">{file.name}</span>}
        </div>
        {fotoUrl && !file && (
          <p className="text-xs text-muted-foreground">
            Foto atual salva. Escolha um novo arquivo para substituir.
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        O número da camisa é definido pelo presidente do time.
      </p>
      <DialogFooter>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Enviando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============ JOGOS ============
function JogosTab() {
  const timesFn = useServerFn(listTimes);
  const fasesFn = useServerFn(listFases);
  const jogosFn = useServerFn(listJogos);
  const upsertFn = useServerFn(upsertJogo);
  const delFn = useServerFn(deleteJogo);
  const qc = useQueryClient();
  const { data: times = [] } = useQuery({ queryKey: ["admin", "times"], queryFn: () => timesFn() });
  const { data: fases = [] } = useQuery({ queryKey: ["admin", "fases"], queryFn: () => fasesFn() });
  const { data: jogos = [] } = useQuery({ queryKey: ["admin", "jogos"], queryFn: () => jogosFn() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Card
      title="Jogos"
      action={
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Novo jogo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar jogo" : "Novo jogo"}</DialogTitle>
            </DialogHeader>
            <JogoForm
              initial={editing}
              times={times}
              fases={fases}
              onSave={async (p: any) => {
                try {
                  await upsertFn({ data: p });
                  toast.success("Jogo salvo");
                  qc.invalidateQueries({ queryKey: ["admin", "jogos"] });
                  qc.invalidateQueries({ queryKey: ["pub"] });
                  setOpen(false);
                  setEditing(null);
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-2">
        {jogos.map((j: any) => (
          <div
            key={j.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 sm:flex-nowrap sm:gap-3"
          >
            <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold uppercase">
              {j.fase?.nome ?? "—"}
            </span>
            <div className="order-3 flex w-full min-w-0 flex-1 items-center gap-2 text-sm sm:order-none sm:w-auto">
              <span className="min-w-0 flex-1 truncate text-right font-semibold">
                {j.time_casa?.nome}
              </span>
              <span className="shrink-0 font-mono font-bold">
                {j.status === "encerrado" ? `${j.gols_time_casa}×${j.gols_time_fora}` : "vs"}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">{j.time_fora?.nome}</span>
            </div>
            <span className="ml-auto text-[11px] text-muted-foreground sm:ml-0 sm:text-xs">
              {new Date(j.data_hora).toLocaleString("pt-BR")}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(j);
                  setOpen(true);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Excluir jogo?")) return;
                  try {
                    await delFn({ data: { id: j.id } });
                    toast.success("Excluído");
                    qc.invalidateQueries({ queryKey: ["admin", "jogos"] });
                    qc.invalidateQueries({ queryKey: ["pub"] });
                  } catch (e: any) {
                    toast.error(e?.message ?? "Erro ao excluir");
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {jogos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum jogo cadastrado.</p>
        )}
      </div>
    </Card>
  );
}

function JogoForm({ initial, times, fases, onSave }: any) {
  const [fase, setFase] = useState(initial?.fase_id ?? "");
  const [casa, setCasa] = useState(initial?.time_casa_id ?? "");
  const [fora, setFora] = useState(initial?.time_fora_id ?? "");
  const [data, setData] = useState(
    initial?.data_hora ? new Date(initial.data_hora).toISOString().slice(0, 16) : "",
  );
  const [local, setLocal] = useState(initial?.local ?? "");
  const [status, setStatus] = useState(initial?.status ?? "agendado");
  const [gc, setGc] = useState(initial?.gols_time_casa ?? 0);
  const [gf, setGf] = useState(initial?.gols_time_fora ?? 0);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: initial?.id,
          fase_id: fase || null,
          time_casa_id: casa,
          time_fora_id: fora,
          data_hora: new Date(data).toISOString(),
          local: local || null,
          status,
          gols_time_casa: +gc,
          gols_time_fora: +gf,
        });
      }}
      className="space-y-3"
    >
      <div>
        <Label>Fase</Label>
        <Select value={fase} onValueChange={setFase}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {fases.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Time da casa</Label>
          <Select value={casa} onValueChange={setCasa}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
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
        <div>
          <Label>Time visitante</Label>
          <Select value={fora} onValueChange={setFora}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
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
      </div>
      <div>
        <Label>Data e hora</Label>
        <Input
          type="datetime-local"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Local</Label>
        <Input value={local} onChange={(e) => setLocal(e.target.value)} />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {status === "encerrado" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Gols casa</Label>
            <Input type="number" value={gc} onChange={(e) => setGc(+e.target.value)} />
          </div>
          <div>
            <Label>Gols fora</Label>
            <Input type="number" value={gf} onChange={(e) => setGf(+e.target.value)} />
          </div>
        </div>
      )}
      <DialogFooter>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}

// ============ EVENTOS ============
function EventosTab() {
  const jogosFn = useServerFn(listJogos);
  const fasesFn = useServerFn(listFases);
  const artFn = useServerFn(getArtilharia);
  const assFn = useServerFn(getAssistencias);
  const cartoesFn = useServerFn(getCartoes);
  const { data: jogos = [] } = useQuery({ queryKey: ["admin", "jogos"], queryFn: () => jogosFn() });
  const { data: fases = [] } = useQuery({ queryKey: ["admin", "fases"], queryFn: () => fasesFn() });
  const { data: art = [] } = useQuery({ queryKey: ["pub", "art"], queryFn: () => artFn() });
  const { data: ass = [] } = useQuery({ queryKey: ["pub", "ass"], queryFn: () => assFn() });
  const { data: cartoes = [] } = useQuery({
    queryKey: ["admin", "cartoes"],
    queryFn: () => cartoesFn(),
  });

  const finalizadas = (jogos as any[]).filter((j) => j.status === "encerrado");
  const porFase = new Map<string, any[]>();
  for (const j of finalizadas) {
    const key = j.fase_id ?? "__sem_fase__";
    if (!porFase.has(key)) porFase.set(key, []);
    porFase.get(key)!.push(j);
  }
  const faseOrder = (fases as any[]).map((f) => f.id);
  const sortedKeys = [...porFase.keys()].sort((a, b) => {
    const ai = faseOrder.indexOf(a);
    const bi = faseOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <RankingBox title="Artilharia" rows={art as any[]} valueKey="gols" valueLabel="Gols" />
        <RankingBox
          title="Assistências"
          rows={ass as any[]}
          valueKey="assistencias"
          valueLabel="Assist."
        />
      </div>

      <CartoesPorTime rows={cartoes as CartaoAdmin[]} />

      <Card title="Eventos por partida">
        {finalizadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma partida finalizada ainda. Lance um placar na aba Campeonato.
          </p>
        ) : (
          <div className="space-y-5">
            {sortedKeys.map((faseId) => {
              const faseNome = (fases as any[]).find((f) => f.id === faseId)?.nome ?? "Sem fase";
              return (
                <div key={faseId}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {faseNome}
                  </h4>
                  <div className="space-y-2">
                    {porFase.get(faseId)!.map((j) => (
                      <PartidaEventoBlock
                        key={j.id}
                        jogo={j}
                        open={openId === j.id}
                        onToggle={() => setOpenId(openId === j.id ? null : j.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

type CartaoAdmin = {
  time_id: string | null;
  time_nome: string | null;
  jogador_id: string;
  jogador_nome: string;
  numero: number | null;
  amarelos: number;
  vermelhos: number;
};

function CartoesPorTime({ rows }: { rows: CartaoAdmin[] }) {
  const linhas = rows.filter((r) => (r.amarelos ?? 0) > 0 || (r.vermelhos ?? 0) > 0);
  const porTime = new Map<string, any[]>();

  for (const linha of linhas) {
    const chave = linha.time_id ?? linha.time_nome ?? "sem-time";
    if (!porTime.has(chave)) porTime.set(chave, []);
    porTime.get(chave)!.push(linha);
  }

  const grupos = [...porTime.entries()]
    .map(([timeId, jogadores]) => ({
      timeId,
      timeNome: jogadores[0]?.time_nome ?? "Sem time",
      amarelos: jogadores.reduce((total, jogador) => total + (jogador.amarelos ?? 0), 0),
      vermelhos: jogadores.reduce((total, jogador) => total + (jogador.vermelhos ?? 0), 0),
      jogadores: jogadores.sort((a, b) => a.jogador_nome.localeCompare(b.jogador_nome, "pt-BR")),
    }))
    .sort((a, b) => a.timeNome.localeCompare(b.timeNome, "pt-BR"));

  return (
    <Card title="Cartões por time">
      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cartão aplicado até agora.</p>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => (
            <div key={grupo.timeId} className="overflow-hidden rounded-xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/35 px-4 py-3">
                <h4 className="font-condensed text-base font-extrabold tracking-tight">
                  {grupo.timeNome}
                </h4>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[var(--brand-amber)]/20 px-2 py-1 text-[var(--brand-amber)]">
                    {grupo.amarelos} amarelo{grupo.amarelos === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full bg-[var(--brand-red)]/15 px-2 py-1 text-[var(--brand-red)]">
                    {grupo.vermelhos} vermelho{grupo.vermelhos === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Jogador</th>
                      <th className="px-3 py-2 text-center">Amarelos</th>
                      <th className="px-3 py-2 text-center">Vermelhos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.jogadores.map((jogador) => (
                      <tr key={jogador.jogador_id} className="border-t border-border">
                        <td className="px-4 py-2 font-semibold">
                          {jogador.numero ? `#${jogador.numero} ` : ""}
                          {jogador.jogador_nome}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-[var(--brand-amber)]">
                          {jogador.amarelos}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-[var(--brand-red)]">
                          {jogador.vermelhos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RankingBox({
  title,
  rows,
  valueKey,
  valueLabel,
}: {
  title: string;
  rows: any[];
  valueKey: string;
  valueLabel: string;
}) {
  const filtered = rows.filter((r) => (r[valueKey] ?? 0) > 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]">
      <div className="border-b border-border bg-muted/40 px-4 py-2">
        <h3 className="font-condensed text-lg font-extrabold tracking-tight">{title}</h3>
      </div>
      {filtered.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Pos</th>
              <th className="px-3 py-2 text-left">Jogador</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.jogador_id} className="border-t border-border">
                <td className="px-3 py-2 font-bold">{i + 1}º</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {r.foto_url ? (
                      <img
                        src={r.foto_url}
                        alt={r.jogador_nome ?? ""}
                        loading="lazy"
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-bold">
                        {r.jogador_nome?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold">{r.jogador_nome}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.time_nome}</td>
                <td className="px-3 py-2 text-right font-extrabold text-[var(--brand-red)]">
                  {r[valueKey]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PartidaEventoBlock({
  jogo,
  open,
  onToggle,
}: {
  jogo: any;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 p-3 sm:flex-nowrap sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamCrest url={jogo.time_casa?.escudo_url} nome={jogo.time_casa?.nome ?? ""} size={28} />
          <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold">
            {jogo.time_casa?.nome}
          </span>
          <span className="shrink-0 font-mono text-base font-extrabold">
            {jogo.gols_time_casa} × {jogo.gols_time_fora}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {jogo.time_fora?.nome}
          </span>
          <TeamCrest url={jogo.time_fora?.escudo_url} nome={jogo.time_fora?.nome ?? ""} size={28} />
        </div>
        <Button
          size="sm"
          variant={open ? "default" : "outline"}
          onClick={onToggle}
          className="w-full sm:w-auto"
        >
          {open ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
          Editar Eventos
        </Button>
      </div>
      {open && <PartidaEventoPainel jogo={jogo} onClose={onToggle} />}
    </div>
  );
}

function PartidaEventoPainel({ jogo, onClose }: { jogo: any; onClose: () => void }) {
  const jogFn = useServerFn(listJogadoresByTime);
  const evFn = useServerFn(listEventosJogo);
  const saveFn = useServerFn(setEventosPartida);
  const qc = useQueryClient();
  const { data: jogCasa = [] } = useQuery({
    queryKey: ["jog", jogo.time_casa_id],
    queryFn: () => jogFn({ data: { timeId: jogo.time_casa_id } }),
  });
  const { data: jogFora = [] } = useQuery({
    queryKey: ["jog", jogo.time_fora_id],
    queryFn: () => jogFn({ data: { timeId: jogo.time_fora_id } }),
  });
  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", jogo.id],
    queryFn: () => evFn({ data: { jogoId: jogo.id } }),
  });

  // Estado de contagem por jogador: gols, assistencias e cartoes.
  type Counts = {
    gols: number;
    assistencias: number;
    cartoes_amarelos: number;
    cartoes_vermelhos: number;
  };
  const empty: Counts = { gols: 0, assistencias: 0, cartoes_amarelos: 0, cartoes_vermelhos: 0 };
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const init: Record<string, Counts> = {};
    for (const j of [...(jogCasa as any[]), ...(jogFora as any[])]) {
      init[j.id] = { ...empty };
    }
    for (const e of eventos as any[]) {
      if (!init[e.jogador_id]) init[e.jogador_id] = { ...empty };
      if (e.tipo_evento === "gol") init[e.jogador_id].gols += 1;
      if (e.tipo_evento === "assistencia") init[e.jogador_id].assistencias += 1;
      if (e.tipo_evento === "cartao_amarelo") init[e.jogador_id].cartoes_amarelos += 1;
      if (e.tipo_evento === "cartao_vermelho") init[e.jogador_id].cartoes_vermelhos += 1;
    }
    setCounts(init);
    setHydrated(true);
  }, [jogCasa, jogFora, eventos, hydrated]);

  const setVal = (id: string, field: keyof Counts, v: number) => {
    setCounts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? empty), [field]: Math.max(0, v) } }));
  };

  const salvar = async (close: boolean) => {
    const payload = [
      ...(jogCasa as any[]).map((j) => ({
        jogador_id: j.id,
        time_id: jogo.time_casa_id,
        gols: counts[j.id]?.gols ?? 0,
        assistencias: counts[j.id]?.assistencias ?? 0,
        cartoes_amarelos: counts[j.id]?.cartoes_amarelos ?? 0,
        cartoes_vermelhos: counts[j.id]?.cartoes_vermelhos ?? 0,
      })),
      ...(jogFora as any[]).map((j) => ({
        jogador_id: j.id,
        time_id: jogo.time_fora_id,
        gols: counts[j.id]?.gols ?? 0,
        assistencias: counts[j.id]?.assistencias ?? 0,
        cartoes_amarelos: counts[j.id]?.cartoes_amarelos ?? 0,
        cartoes_vermelhos: counts[j.id]?.cartoes_vermelhos ?? 0,
      })),
    ];
    try {
      await saveFn({ data: { jogoId: jogo.id, jogadores: payload } });
      toast.success("Eventos salvos");
      qc.invalidateQueries({ queryKey: ["eventos", jogo.id] });
      qc.invalidateQueries({ queryKey: ["pub", "art"] });
      qc.invalidateQueries({ queryKey: ["pub", "ass"] });
      qc.invalidateQueries({ queryKey: ["admin", "cartoes"] });
      qc.invalidateQueries({ queryKey: ["pub"] });
      if (close) onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="border-t border-border p-3 sm:p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <TimeEventosBloco
          titulo={jogo.time_casa?.nome ?? "Casa"}
          jogadores={jogCasa as any[]}
          counts={counts}
          setVal={setVal}
        />
        <TimeEventosBloco
          titulo={jogo.time_fora?.nome ?? "Fora"}
          jogadores={jogFora as any[]}
          counts={counts}
          setVal={setVal}
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
          Fechar
        </Button>
        <Button variant="outline" onClick={() => salvar(false)} className="flex-1 sm:flex-none">
          Salvar
        </Button>
        <Button onClick={() => salvar(true)} className="flex-1 sm:flex-none">
          Salvar e Fechar
        </Button>
      </div>
    </div>
  );
}

type EventoCounts = {
  gols: number;
  assistencias: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
};

function TimeEventosBloco({
  titulo,
  jogadores,
  counts,
  setVal,
}: {
  titulo: string;
  jogadores: any[];
  counts: Record<string, EventoCounts>;
  setVal: (id: string, f: keyof EventoCounts, v: number) => void;
}) {
  const emptyC: EventoCounts = {
    gols: 0,
    assistencias: 0,
    cartoes_amarelos: 0,
    cartoes_vermelhos: 0,
  };
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <h5 className="mb-2 font-condensed text-base font-extrabold tracking-tight">{titulo}</h5>
      {jogadores.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem jogadores cadastrados.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto px-3">
          <div className="min-w-[440px] space-y-2 sm:min-w-0">
            <div className="grid grid-cols-[1fr_48px_48px_48px_48px] items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid-cols-[1fr_56px_56px_56px_56px] sm:gap-2">
              <span>Jogador</span>
              <span className="text-center">Gols</span>
              <span className="text-center">Assist.</span>
              <span className="text-center" title="Cartões amarelos">
                🟨
              </span>
              <span className="text-center" title="Cartões vermelhos">
                🟥
              </span>
            </div>
            {jogadores.map((j) => {
              const c = counts[j.id] ?? emptyC;
              return (
                <div
                  key={j.id}
                  className="grid grid-cols-[1fr_48px_48px_48px_48px] items-center gap-1.5 sm:grid-cols-[1fr_56px_56px_56px_56px] sm:gap-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {j.foto_url ? (
                      <img
                        src={j.foto_url}
                        alt={j.nome}
                        loading="lazy"
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-[10px] font-bold">
                        {j.numero ?? "?"}
                      </div>
                    )}
                    <span className="truncate text-sm font-semibold">
                      {j.numero ? `#${j.numero} ` : ""}
                      {j.nome}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={c.gols}
                    onChange={(e) => setVal(j.id, "gols", parseInt(e.target.value || "0", 10))}
                    className="h-9 px-1 text-center"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={c.assistencias}
                    onChange={(e) =>
                      setVal(j.id, "assistencias", parseInt(e.target.value || "0", 10))
                    }
                    className="h-9 px-1 text-center"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={c.cartoes_amarelos}
                    onChange={(e) =>
                      setVal(j.id, "cartoes_amarelos", parseInt(e.target.value || "0", 10))
                    }
                    className="h-9 px-1 text-center"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={c.cartoes_vermelhos}
                    onChange={(e) =>
                      setVal(j.id, "cartoes_vermelhos", parseInt(e.target.value || "0", 10))
                    }
                    className="h-9 px-1 text-center"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ TELA PÚBLICA ============
function TelaPublicaTab() {
  const url = typeof window !== "undefined" ? `${window.location.origin}/publico` : "/publico";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };
  return (
    <Card title="Tela pública do campeonato">
      <p className="mb-4 text-sm text-muted-foreground">
        Compartilhe o link abaixo para que qualquer pessoa acompanhe o campeonato em tempo real —
        classificação, próximos jogos, resultados, artilharia e assistências.
      </p>
      <div className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <Label>Link público</Label>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-sm">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate select-all">{url}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? "Link copiado!" : "Copiar link"}
          </Button>
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-4 w-4" /> Abrir em nova aba
            </a>
          </Button>
        </div>
      </div>
      <div className="mt-6 -mx-4 -mb-4 overflow-hidden rounded-b-2xl border-t border-border sm:-mx-6 sm:-mb-6">
        <PublicoView embedded />
      </div>
    </Card>
  );
}

// ============ CHAVES DOS PRESIDENTES ============
function ChavesTab() {
  const listFn = useServerFn(listChavesPresidente);
  const genFn = useServerFn(gerarChavePresidente);
  const revFn = useServerFn(revogarChavePresidente);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "chaves"],
    queryFn: () => listFn(),
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const toggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copy = async (id: string, chave: string) => {
    await navigator.clipboard.writeText(chave);
    setCopiedId(id);
    toast.success("Chave copiada");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const generate = async (timeId: string, regenerate: boolean) => {
    if (regenerate && !confirm("Gerar nova chave invalida a anterior. Continuar?")) return;
    setBusyId(timeId);
    try {
      await genFn({ data: { timeId } });
      toast.success(regenerate ? "Nova chave gerada" : "Chave criada");
      qc.invalidateQueries({ queryKey: ["admin", "chaves"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (timeId: string) => {
    if (!confirm("Revogar a chave? O presidente perderá o acesso.")) return;
    setBusyId(timeId);
    try {
      await revFn({ data: { timeId } });
      toast.success("Chave revogada");
      qc.invalidateQueries({ queryKey: ["admin", "chaves"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card title="Chaves de acesso dos presidentes">
      <p className="mb-4 text-sm text-muted-foreground">
        Cada presidente acessa o sistema exclusivamente por esta chave. Gere ou regenere quando
        necessário e compartilhe com segurança.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum time cadastrado. Crie times na aba "Times" antes de gerar chaves.
        </p>
      ) : (
        <div className="space-y-3">
          {(data as any[]).map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <TeamCrest url={t.escudo_url} nome={t.nome} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{t.nome}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.presidente_nome ?? "Sem presidente"}
                    {t.chave_created_at && (
                      <> · gerada em {new Date(t.chave_created_at).toLocaleDateString("pt-BR")}</>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-1 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                {t.chave ? (
                  <>
                    <div className="flex w-full flex-1 items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-sm sm:w-auto">
                      <span className="flex-1 truncate select-all">
                        {visibleIds.has(t.id) ? t.chave : "••••••••••••••"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleVisible(t.id)}
                        tabIndex={-1}
                      >
                        {visibleIds.has(t.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copy(t.id, t.chave)}>
                        {copiedId === t.id ? (
                          <Check className="h-4 w-4 text-[var(--brand-green)]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === t.id}
                      onClick={() => generate(t.id, true)}
                      className="flex-1 sm:flex-none"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Regenerar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === t.id}
                      onClick={() => revoke(t.id)}
                    >
                      <ShieldOff className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                      Sem chave gerada
                    </span>
                    <Button
                      size="sm"
                      disabled={busyId === t.id}
                      onClick={() => generate(t.id, false)}
                    >
                      <Key className="mr-1 h-3 w-3" />
                      Gerar chave
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-md)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-condensed text-lg font-extrabold tracking-tight sm:text-xl">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
