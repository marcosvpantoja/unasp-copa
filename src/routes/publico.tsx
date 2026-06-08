import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getCampeonato,
  listJogos,
  getArtilharia,
  getAssistencias,
  getCampeonatoPublico,
} from "@/lib/championship.functions";
import { BrandMark } from "@/components/brand/BrandMark";
import { Trophy, Calendar, MapPin, ArrowLeft } from "lucide-react";
import { Flag } from "@/components/tactical/flags/Flags";

export const Route = createFileRoute("/publico")({
  component: PublicoPage,
  head: () => ({
    meta: [
      { title: "Acompanhe — COPA DO MUNDO UNASP 2026" },
      {
        name: "description",
        content:
          "Próximos jogos, resultados, classificação e artilharia da COPA DO MUNDO UNASP 2026.",
      },
      { property: "og:title", content: "COPA DO MUNDO UNASP 2026 — Acompanhe" },
      {
        property: "og:description",
        content: "Próximos jogos, resultados, classificação e artilharia em tempo real.",
      },
    ],
  }),
});

function PublicoPage() {
  return <PublicoView />;
}

export function PublicoView({ embedded = false }: { embedded?: boolean } = {}) {
  const camp = useServerFn(getCampeonato);
  const jogos = useServerFn(listJogos);
  const pubFn = useServerFn(getCampeonatoPublico);
  const art = useServerFn(getArtilharia);
  const ass = useServerFn(getAssistencias);

  const pollOpts = {
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  } as const;
  const cQ = useQuery({ queryKey: ["pub", "camp"], queryFn: () => camp(), ...pollOpts });
  const jQ = useQuery({ queryKey: ["pub", "jogos"], queryFn: () => jogos(), ...pollOpts });
  const campPubQ = useQuery({
    queryKey: ["pub", "campeonato"],
    queryFn: () => pubFn(),
    ...pollOpts,
  });
  const aQ = useQuery({ queryKey: ["pub", "art"], queryFn: () => art(), ...pollOpts });
  const assQ = useQuery({ queryKey: ["pub", "ass"], queryFn: () => ass(), ...pollOpts });

  const allJogos = jQ.data ?? [];
  const proximos = allJogos.filter((j: any) => j.status === "agendado").slice(0, 6);
  const ultimos = allJogos
    .filter((j: any) => j.status === "encerrado")
    .slice(-6)
    .reverse();

  const fases = campPubQ.data?.fases ?? [];
  const faseTimes = campPubQ.data?.faseTimes ?? [];
  const fasePartidas = campPubQ.data?.jogos ?? [];
  const faseClas = campPubQ.data?.classificacao ?? [];

  return (
    <main className="app-shell-bg min-h-[100dvh] pb-20">
      <div className="brand-stripe rounded-none">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Destaque */}
      <header className="relative overflow-hidden text-white">
        {/* Foto de fundo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/brand/banner-shapes.png')" }}
        />
        {/* Camada clara sem sombra escura */}
        <div aria-hidden className="absolute inset-0 bg-white/10" />

        {!embedded && (
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/80 hover:text-white md:text-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Início
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur ring-1 ring-white/15 md:px-3 md:text-[10px] md:tracking-[0.24em]">
              <Trophy className="h-3 w-3 text-[var(--brand-amber)]" />
              <span className="hidden sm:inline">
                {cQ.data?.temporada ?? "2026"} · Acompanhamento ao vivo
              </span>
              <span className="sm:hidden">{cQ.data?.temporada ?? "2026"} · Ao vivo</span>
            </span>
          </div>
        )}

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-6 md:grid-cols-[auto_1fr] md:items-center md:gap-12 md:px-8 md:pb-16 md:pt-16">
          <div className="flex justify-center md:justify-start">
            <img
              src="/brand/copa-logo.png"
              alt="Copa do Mundo UNASP"
              width={512}
              height={512}
              fetchPriority="high"
              className="h-32 w-auto drop-shadow-[0_12px_30px_rgba(0,0,0,0.25)] sm:h-40 md:h-56 lg:h-64"
              draggable={false}
            />
          </div>
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur ring-1 ring-white/15 md:tracking-[0.28em]">
              Edição {cQ.data?.temporada ?? "2026"}
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:text-4xl md:mt-4 md:text-6xl lg:text-7xl">
              {cQ.data?.nome ?? "COPA DO MUNDO UNASP 2026"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 md:mx-0 md:mt-4 md:text-lg">
              Torneio promovido pelo{" "}
              <a
                href="https://www.instagram.com/unaspht/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline decoration-white/40 underline-offset-4 hover:text-[var(--brand-amber)] hover:decoration-[var(--brand-amber)]"
              >
                UNASP HT
              </a>{" "}
              através da{" "}
              <a
                href="https://www.instagram.com/atleticaunasptigers/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline decoration-white/40 underline-offset-4 hover:text-[var(--brand-amber)] hover:decoration-[var(--brand-amber)]"
              >
                Atlética UNASP Tigers
              </a>{" "}
              em parceria com a{" "}
              <a
                href="https://www.vintenove.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline decoration-white/40 underline-offset-4 hover:text-[var(--brand-amber)] hover:decoration-[var(--brand-amber)]"
              >
                29Tech
              </a>
              . Acompanhe ao vivo os jogos, resultados, classificação e artilharia da Copa do Mundo
              UNASP 2026 de futsal.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:mt-6 md:gap-3 md:justify-start">
              <a
                href="#proximos"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl md:px-5 md:text-sm"
              >
                <Calendar className="h-4 w-4" /> Próximos jogos
              </a>
              <a
                href="#classificacao"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/15 md:px-5 md:text-sm"
              >
                <Trophy className="h-4 w-4 text-[var(--brand-amber)]" /> Classificação
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Conteudo separado com fundo solido */}
      <div className="relative rounded-t-[2rem] bg-[var(--background)] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] mx-auto -mt-6 max-w-7xl space-y-10 px-4 pt-8 pb-16 md:space-y-12 md:px-8 md:pt-14 md:pb-20">
        {/* Próximos jogos */}
        <Section id="proximos" title="Próximos jogos" subtitle="As próximas partidas do campeonato">
          {proximos.length === 0 ? (
            <Empty text="Sem jogos agendados no momento." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proximos.map((j: any) => (
                <MatchCard key={j.id} jogo={j} />
              ))}
            </div>
          )}
        </Section>

        {/* Últimos resultados */}
        <Section title="Últimos resultados" subtitle="Partidas encerradas">
          {ultimos.length === 0 ? (
            <Empty text="Ainda não há resultados." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ultimos.map((j: any) => (
                <MatchCard key={j.id} jogo={j} />
              ))}
            </div>
          )}
        </Section>

        {/* Fases */}
        {fases.map((f: any, fi: number) => {
          const times = faseTimes
            .filter((ft: any) => ft.fase_id === f.id)
            .map((ft: any) => ft.time)
            .filter(Boolean);
          const partidas = fasePartidas.filter((p: any) => p.fase_id === f.id);
          const clas = faseClas.filter((c: any) => c.fase_id === f.id);
          return (
            <Section key={f.id} id={fi === 0 ? "classificacao" : undefined} title={f.nome}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-md)]">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Times participantes
                  </h3>
                  {times.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum time definido.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {times.map((t: any) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-semibold"
                        >
                          <TeamCrest url={t.escudo_url} nome={t.nome} size={20} />
                          {t.nome}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Partidas
                  </h3>
                  {partidas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma partida.</p>
                  ) : (
                    <ul className="space-y-2">
                      {partidas.map((p: any) => {
                        const enc = p.status === "encerrado";
                        return (
                          <li
                            key={p.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            <TeamCrest
                              url={p.time_casa?.escudo_url}
                              nome={p.time_casa?.nome ?? ""}
                              size={20}
                            />
                            <span className="flex-1 truncate font-semibold">
                              {p.time_casa?.nome}
                            </span>
                            <span
                              className={`font-mono font-extrabold ${enc ? "" : "text-muted-foreground"}`}
                            >
                              {enc ? `${p.gols_time_casa} × ${p.gols_time_fora}` : "vs"}
                            </span>
                            <span className="flex-1 truncate text-right font-semibold">
                              {p.time_fora?.nome}
                            </span>
                            <TeamCrest
                              url={p.time_fora?.escudo_url}
                              nome={p.time_fora?.nome ?? ""}
                              size={20}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
                        <tr>
                          <th className="px-2 py-2 text-left sm:px-3">#</th>
                          <th className="px-2 py-2 text-left sm:px-3">Time</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">J</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">V</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">E</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">D</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">GP</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">GC</th>
                          <th className="px-1.5 py-2 text-center sm:px-2">SG</th>
                          <th className="px-1.5 py-2 text-center font-extrabold text-foreground sm:px-2">
                            PTS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {clas.map((r: any, i: number) => (
                          <tr key={r.time_id} className="border-t border-border hover:bg-muted/30">
                            <td className="px-2 py-2 font-bold sm:px-3">
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] sm:h-6 sm:w-6 sm:text-xs ${i < 3 ? "bg-[var(--brand-amber)] text-black" : "bg-muted"}`}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-2 py-2 sm:px-3">
                              <div className="flex items-center gap-2">
                                <TeamCrest url={r.escudo_url} nome={r.time_nome} size={20} />
                                <span className="truncate font-semibold">{r.time_nome}</span>
                              </div>
                            </td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.jogos}</td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.vitorias}</td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.empates}</td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.derrotas}</td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.gols_pro}</td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.gols_contra}</td>
                            <td className="px-1.5 py-2 text-center sm:px-2">{r.saldo}</td>
                            <td className="px-1.5 py-2 text-center font-extrabold text-[var(--brand-red)] sm:px-2">
                              {r.pontos}
                            </td>
                          </tr>
                        ))}
                        {clas.length === 0 && (
                          <tr>
                            <td
                              colSpan={10}
                              className="px-3 py-6 text-center text-muted-foreground"
                            >
                              Sem dados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Section>
          );
        })}

        {/* Artilharia + Assistências */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Ranking title="Artilharia" rows={aQ.data ?? []} valueKey="gols" valueLabel="Gols" />
          <Ranking
            title="Assistências"
            rows={assQ.data ?? []}
            valueKey="assistencias"
            valueLabel="Assistências"
          />
        </div>
      </div>

      {/* Footer discreto com backlinks */}
      <footer className="py-8 text-center">
        <p className="text-xs text-muted-foreground">
          <a
            href="https://www.vintenove.com/desenvolvimento-de-software-sao-paulo"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-transparent underline-offset-4 transition hover:text-foreground hover:decoration-current"
          >
            Desenvolvido
          </a>{" "}
          <a
            href="https://www.vintenove.com/criar-aplicativo-sao-paulo"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-transparent underline-offset-4 transition hover:text-foreground hover:decoration-current"
          >
            por
          </a>{" "}
          <a
            href="https://www.vintenove.com/outsourcing-de-ti-sao-paulo"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-transparent underline-offset-4 transition hover:text-foreground hover:decoration-current font-semibold"
          >
            29Tech
          </a>
        </p>
      </footer>
    </main>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between md:mb-4">
        <div>
          <h2 className="font-condensed text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function TeamCrest({
  url,
  nome,
  size = 32,
}: {
  url?: string | null;
  nome: string;
  size?: number;
}) {
  if (url && url.startsWith("flag:")) {
    const code = url.slice(5) as any;
    return (
      <span
        className="inline-block overflow-hidden rounded-md ring-1 ring-border"
        style={{ width: size, height: size }}
      >
        <Flag code={code} className="h-full w-full" />
      </span>
    );
  }
  if (url) {
    return (
      <img
        src={url}
        alt={nome}
        width={size}
        height={size}
        className="rounded-md object-cover ring-1 ring-border"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = nome
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="grid place-items-center rounded-md bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-red)] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

function MatchCard({ jogo }: { jogo: any }) {
  const encerrado = jogo.status === "encerrado";
  const date = new Date(jogo.data_hora);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]">
      <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5">{jogo.fase?.nome ?? "—"}</span>
        <span
          className={`rounded-full px-2 py-0.5 ${encerrado ? "bg-[var(--brand-lime)]/20 text-[var(--brand-green)]" : "bg-[var(--brand-blue)]/15 text-[var(--brand-blue)]"}`}
        >
          {encerrado ? "Encerrado" : jogo.status === "em_andamento" ? "Ao vivo" : "Agendado"}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <TeamCrest
            url={jogo.time_casa?.escudo_url}
            nome={jogo.time_casa?.nome ?? "Casa"}
            size={48}
          />
          <span className="text-sm font-bold leading-tight">{jogo.time_casa?.nome}</span>
        </div>
        <div className="flex flex-col items-center">
          {encerrado ? (
            <div className="font-numeric text-2xl font-extrabold tabular-nums">
              {jogo.gols_time_casa} <span className="text-muted-foreground">×</span>{" "}
              {jogo.gols_time_fora}
            </div>
          ) : (
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              VS
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <TeamCrest
            url={jogo.time_fora?.escudo_url}
            nome={jogo.time_fora?.nome ?? "Fora"}
            size={48}
          />
          <span className="text-sm font-bold leading-tight">{jogo.time_fora?.nome}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ·{" "}
          {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        {jogo.local && (
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" /> {jogo.local}
          </span>
        )}
      </div>
    </div>
  );
}

function Ranking({
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
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]">
      <div className="border-b border-border bg-muted/40 px-5 py-3">
        <h3 className="font-condensed text-lg font-extrabold tracking-tight">{title}</h3>
      </div>
      <ul className="divide-y divide-border">
        {rows.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">Sem dados ainda.</li>
        )}
        {rows.map((r, i) => (
          <li key={r.jogador_id} className="flex items-center gap-3 px-5 py-3">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${i < 3 ? "bg-[var(--brand-amber)] text-black" : "bg-muted"}`}
            >
              {i + 1}
            </span>
            {r.foto_url ? (
              <img
                src={r.foto_url}
                alt={r.jogador_nome}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold">
                {r.jogador_nome.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{r.jogador_nome}</div>
              <div className="truncate text-xs text-muted-foreground">{r.time_nome}</div>
            </div>
            <div className="text-right">
              <div className="font-numeric text-xl font-extrabold tabular-nums text-[var(--brand-red)]">
                {r[valueKey]}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {valueLabel}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
