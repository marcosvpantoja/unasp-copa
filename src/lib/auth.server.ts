import { useSession } from "@tanstack/react-start/server";
import "./ambiente.server";

export type AppRole = "admin" | "presidente";

export interface SessionData {
  authed?: boolean;
  role?: AppRole;
  timeId?: string | null;
  keyId?: string;
}

export function getSessionConfig() {
  const secret = process.env.SESSION_SECRET ?? "";
  const password = secret.length >= 32 ? secret : (secret + "_").padEnd(32, "x");
  const producao = process.env.NODE_ENV === "production";
  return {
    password,
    name: "unasp-session",
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      secure: producao,
      sameSite: producao ? ("none" as const) : ("lax" as const),
      path: "/",
    },
  };
}

export async function getAppSession() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return await useSession<SessionData>(getSessionConfig());
}

export async function requireSession(): Promise<{
  role: AppRole;
  timeId: string | null;
}> {
  const session = await getAppSession();
  if (!session.data.authed || !session.data.role) {
    throw new Error("Não autorizado");
  }
  return { role: session.data.role, timeId: session.data.timeId ?? null };
}

export async function requireAdmin() {
  const s = await requireSession();
  if (s.role !== "admin") throw new Error("Acesso negado");
  return s;
}
