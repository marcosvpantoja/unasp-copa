import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Trophy, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import heroBg from "@/assets/hero-bg.png";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "COPA DO MUNDO UNASP 2026 — Campeonato Universitário de Futsal" },
      {
        name: "description",
        content:
          "Plataforma oficial do campeonato universitário de futsal UNASP 2026. Acompanhe jogos, classificação, artilharia e estatísticas em tempo real.",
      },
      { property: "og:title", content: "COPA DO MUNDO UNASP 2026" },
      {
        property: "og:description",
        content: "Campeonato universitário de futsal — temporada 2026.",
      },
    ],
  }),
});

function Home() {
  const { login, isAuthenticated, role, loaded } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (loaded && isAuthenticated && role) {
      navigate({ to: role === "admin" ? "/admin" : "/presidente", replace: true });
    }
  }, [loaded, isAuthenticated, role, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    const r = await login(code);
    setSubmitting(false);
    if (!r.ok) {
      setError("Chave inválida. Verifique e tente novamente.");
      return;
    }
    navigate({ to: r.role === "admin" ? "/admin" : "/presidente" });
  };

  return (
    <main className="app-shell-bg min-h-[100dvh]">
      {/* Faixa da marca */}
      <div className="brand-stripe rounded-none">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 md:grid-cols-2 md:gap-12 md:px-8 md:py-16">
        {/* Destaque */}
        <section
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl p-8 text-white shadow-[var(--shadow-lg)] md:p-12"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <img
            src="/brand/logo-unasp.png"
            alt="Copa do Mundo UNASP 2026"
            width={720}
            height={720}
            fetchPriority="high"
            className="h-auto w-full max-w-[360px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            draggable={false}
          />

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/publico"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-foreground shadow-lg transition hover:bg-white/90"
            >
              <Eye className="h-4 w-4" />
              Ver campeonato
            </Link>
            <a
              href="#login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              <ShieldCheck className="h-4 w-4" />
              Área restrita
            </a>
          </div>
        </section>

        {/* Acesso */}
        <section id="login" className="flex items-center">
          <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-lg)] md:p-10">
            <div className="brand-stripe mb-4 max-w-[120px]">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <h2 className="font-condensed text-2xl font-extrabold tracking-tight sm:text-3xl">
              Acessar plataforma
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use a chave de administrador ou do presidente do seu time.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-code">Chave de acesso</Label>
                <div className="relative">
                  <Input
                    id="access-code"
                    type={showCode ? "text" : "password"}
                    autoComplete="off"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (error) setError(null);
                    }}
                    placeholder=""
                    className="h-12 pr-12 text-base font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showCode ? "Ocultar chave" : "Mostrar chave"}
                  >
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full text-base font-semibold"
              >
                {submitting ? "Entrando..." : "Entrar"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <Trophy className="mr-2 inline h-3.5 w-3.5 text-[var(--brand-amber)]" />A chave do
              presidente é gerada pelo administrador ao cadastrar o time.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
