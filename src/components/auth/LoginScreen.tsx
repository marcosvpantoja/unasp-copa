import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";

interface Props {
  onSubmit: (code: string) => Promise<{ ok: boolean }>;
}

export function LoginScreen({ onSubmit }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await onSubmit(code);
      if (!result.ok) setError("Código inválido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell-bg flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-lg)] md:grid-cols-2">
        {/* Painel da marca */}
        <aside className="brand-arches-panel relative hidden flex-col items-center justify-center p-10 text-white md:flex">
          <div className="flex flex-col items-center text-center">
            <img
              src="/brand/trophy.png"
              alt="Copa do Mundo UNASP 2026"
              className="h-56 w-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
              draggable={false}
            />
            <div className="mt-6 leading-[0.95]">
              <div className="font-condensed text-xl font-bold uppercase tracking-[0.18em]">
                Copa do Mundo
              </div>
              <div className="font-display mt-1 flex items-baseline justify-center gap-3">
                <span className="text-6xl font-extrabold uppercase tracking-tight">UNASP</span>
                <span className="font-numeric text-6xl font-extrabold">2026</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Painel do formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-4 p-8 sm:p-12">
          <div className="md:hidden flex justify-center">
            <BrandMark size={48} withWordmark />
          </div>

          <div className="relative">
            <Input
              id="access-code"
              type={showCode ? "text" : "password"}
              autoFocus
              autoComplete="off"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••••••••"
              className="h-12 pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShowCode((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full text-base font-semibold"
          >
            {submitting ? "Entrando..." : "Entrar"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>
      </div>
    </main>
  );
}
