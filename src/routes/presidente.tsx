import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { getMeuTime, updateJogadorNumeroPresidente } from "@/lib/championship.functions";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamCrest } from "./publico";
import { LogOut, Trophy } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { toast } from "sonner";

const TacticalBoard = lazy(() =>
  import("@/components/tactical/TacticalBoard").then((m) => ({ default: m.TacticalBoard }))
);


export const Route = createFileRoute("/presidente")({
  component: PresidentePage,
  head: () => ({ meta: [{ title: "Presidente · COPA DO MUNDO UNASP 2026" }] }),
});

function PresidentePage() {
  const { isAuthenticated, role, loaded, logout } = useAuth();
  const navigate = useNavigate();
  const fn = useServerFn(getMeuTime);
  const { data } = useQuery({
    queryKey: ["meu-time"],
    queryFn: () => fn(),
    enabled: isAuthenticated && role === "presidente",
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (loaded && (!isAuthenticated || role !== "presidente")) {
      navigate({ to: "/", replace: true });
    }
  }, [loaded, isAuthenticated, role, navigate]);

  if (!loaded || !isAuthenticated || role !== "presidente") {
    return <LoadingScreen />;
  }
  if (!data) {
    return <div className="grid min-h-[100dvh] place-items-center text-muted-foreground">Sem time vinculado a esta chave.</div>;
  }

  const { time, jogadores, jogos, cartoes } = data;
  const proximos = jogos.filter((j: any) => j.status === "agendado").slice(0, 5);
  const ultimos = jogos.filter((j: any) => j.status === "encerrado").slice(-5).reverse();

  return (
    <main className="app-shell-bg min-h-[100dvh]">
      <div className="brand-stripe rounded-none"><span /><span /><span /><span /><span /></div>
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 md:gap-4 md:px-8 md:py-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <BrandMark size={32} withWordmark />
            <span className="hidden rounded-full bg-[var(--brand-blue)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-blue)] sm:inline">
              Painel do Presidente
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Link to="/publico" className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground sm:inline">Área pública</Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate({ to: "/" }); }} className="min-h-10">
              <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <TeamCrest url={time.escudo_url} nome={time.nome} size={56} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{time.nome}</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{time.presidente_nome ?? "Presidente do time"}</p>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="mt-5 md:mt-6">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex h-auto w-max gap-1 p-1 md:grid md:w-full md:max-w-2xl md:grid-cols-4 md:gap-0">
              <TabsTrigger value="resumo" className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm">Resumo</TabsTrigger>
              <TabsTrigger value="elenco" className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm">Elenco</TabsTrigger>
              <TabsTrigger value="cartoes" className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm">Cartões</TabsTrigger>
              <TabsTrigger value="tatico" className="min-h-10 whitespace-nowrap px-3 text-xs sm:text-sm">Quadro Tático</TabsTrigger>
            </TabsList>
          </div>


          <TabsContent value="resumo" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Próximos jogos">
                {proximos.length === 0 ? <Empty /> : proximos.map((j: any) => <MatchRow key={j.id} j={j} />)}
              </Panel>
              <Panel title="Últimos resultados">
                {ultimos.length === 0 ? <Empty /> : ultimos.map((j: any) => <MatchRow key={j.id} j={j} />)}
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="elenco" className="mt-6">
            <p className="mb-3 text-xs text-muted-foreground">O administrador cadastra nome, foto, idade e posição. Defina aqui o número da camisa de cada jogador.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {jogadores.map((j: any) => (
                <JogadorCard key={j.id} j={j} />
              ))}
              {jogadores.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Elenco vazio. Peça ao administrador para cadastrar seus jogadores.</p>}
            </div>
          </TabsContent>

          <TabsContent value="cartoes" className="mt-6">
            <Panel title="Cartões por jogador">
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead className="text-xs uppercase text-muted-foreground"><tr><th className="text-left py-2 px-2">Jogador</th><th className="text-center px-2">Amarelos</th><th className="text-center px-2">Vermelhos</th></tr></thead>
                  <tbody>
                    {cartoes.map((c: any) => (
                      <tr key={c.jogador_id} className="border-t border-border"><td className="py-2 px-2 font-semibold">{c.jogador_nome}</td><td className="px-2 text-center text-[var(--brand-amber)] font-bold">{c.amarelos}</td><td className="px-2 text-center text-[var(--brand-red)] font-bold">{c.vermelhos}</td></tr>
                    ))}
                    {cartoes.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Sem cartões.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>
          </TabsContent>


          <TabsContent value="tatico" className="mt-6">
            <Suspense fallback={<LoadingScreen />}>
              <TacticalBoard embedded />
            </Suspense>
          </TabsContent>


        </Tabs>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-md)]">
      <h3 className="mb-3 font-condensed text-lg font-extrabold tracking-tight">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Empty() { return <p className="text-sm text-muted-foreground">Sem dados.</p>; }

function JogadorCard({ j }: { j: any }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateJogadorNumeroPresidente);
  const [num, setNum] = useState<string>(j.numero != null ? String(j.numero) : "");
  const [saving, setSaving] = useState(false);
  const initial = j.numero != null ? String(j.numero) : "";
  const dirty = num !== initial;

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({ data: { id: j.id, numero: num.trim() === "" ? null : Number(num) } });
      toast.success("Número atualizado");
      qc.invalidateQueries({ queryKey: ["meu-time"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      {j.foto_url ? <img src={j.foto_url} alt={j.nome} loading="lazy" className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-border" /> : <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-muted font-bold">{j.numero ?? "?"}</div>}
      <div className="mt-3 text-sm font-bold">{j.nome}</div>
      <div className="text-xs text-muted-foreground">{j.posicao ?? "—"} · {j.idade ?? "?"} anos</div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Nº</span>
        <Input
          type="number"
          min={0}
          max={999}
          value={num}
          onChange={(e) => setNum(e.target.value)}
          className="h-8 w-20 text-center text-sm"
          placeholder="—"
        />
        <Button size="sm" disabled={!dirty || saving} onClick={save} className="h-8">
          {saving ? "…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
function MatchRow({ j }: { j: any }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
      <TeamCrest url={j.time_casa?.escudo_url} nome={j.time_casa?.nome ?? ""} size={24} />
      <span className="flex-1 truncate font-semibold">{j.time_casa?.nome}</span>
      <span className="font-mono font-bold">{j.status === "encerrado" ? `${j.gols_time_casa}×${j.gols_time_fora}` : "vs"}</span>
      <span className="flex-1 truncate text-right font-semibold">{j.time_fora?.nome}</span>
      <TeamCrest url={j.time_fora?.escudo_url} nome={j.time_fora?.nome ?? ""} size={24} />
    </div>
  );
}
