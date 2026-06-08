import { createServerFn } from "@tanstack/react-start";
import { banco } from "@/lib/banco.server";
import { getAppSession, type AppRole } from "./auth.server";

export type { AppRole };

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => {
    if (!data || typeof data.code !== "string") throw new Error("Entrada inválida");
    if (data.code.length > 128) throw new Error("Entrada inválida");
    return { code: data.code.trim() };
  })
  .handler(async ({ data }) => {
    if (!data.code) return { ok: false as const, reason: "empty" as const };

    const chaveAntiga = process.env.ACCESS_CODE;
    if (chaveAntiga && data.code.toUpperCase() === chaveAntiga.trim().toUpperCase()) {
      const session = await getAppSession();
      await session.update({ authed: true, role: "admin", timeId: null, keyId: "legacy" });
      return { ok: true as const, role: "admin" as const, timeId: null };
    }

    const key = banco()
      .prepare("SELECT id, role, time_id FROM access_keys WHERE chave = ?")
      .get(data.code) as { id: string; role: AppRole; time_id: string | null } | undefined;

    if (!key) return { ok: false as const, reason: "invalid" as const };

    const session = await getAppSession();
    await session.update({
      authed: true,
      role: key.role as AppRole,
      timeId: key.time_id,
      keyId: key.id,
    });
    return { ok: true as const, role: key.role as AppRole, timeId: key.time_id };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAppSession();
  await session.clear();
  return { ok: true as const };
});

export const checkAuthFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  return {
    authed: session.data.authed === true,
    role: session.data.role ?? null,
    timeId: session.data.timeId ?? null,
  };
});
