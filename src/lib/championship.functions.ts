import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { agora, banco, CAMPEONATO_ID, caminhoLocal, novoId } from "@/lib/banco.server";
import { requireAdmin, requireSession } from "./auth.server";

type Campo = string | number | boolean | null;
type Linha = Record<string, Campo>;

interface Campeonato {
  id: string;
  nome: string;
  temporada: string;
  descricao: string | null;
  capa_url: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TimeResumo {
  id: string;
  nome: string;
  escudo_url: string | null;
  presidente_nome?: string | null;
}

interface Time extends TimeResumo {
  campeonato_id: string;
  created_at: string;
  updated_at: string;
  presidente_nome: string | null;
}

interface Fase {
  id: string;
  campeonato_id: string;
  nome: string;
  tipo: string;
  ordem: number;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

interface Jogador {
  id: string;
  time_id: string;
  nome: string;
  foto_url: string | null;
  idade: number | null;
  numero: number | null;
  posicao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface PartidaRow {
  id: string;
  data_hora: string | null;
  local: string | null;
  status: string;
  gols_time_casa: number;
  gols_time_fora: number;
  fase_id: string | null;
  time_casa_id: string;
  time_fora_id: string;
  casa_id: string;
  casa_nome: string;
  casa_escudo_url: string | null;
  fora_id: string;
  fora_nome: string;
  fora_escudo_url: string | null;
  fase_join_id: string | null;
  fase_nome: string | null;
  fase_tipo: string | null;
}

interface Partida {
  id: string;
  data_hora: string | null;
  local: string | null;
  status: string;
  gols_time_casa: number;
  gols_time_fora: number;
  fase_id: string | null;
  time_casa_id: string;
  time_fora_id: string;
  time_casa: TimeResumo | null;
  time_fora: TimeResumo | null;
  fase: { id: string; nome: string; tipo: string } | null;
}

interface Classificacao {
  time_id: string;
  campeonato_id?: string | null;
  fase_id?: string | null;
  time_nome: string;
  escudo_url: string | null;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo: number;
  pontos: number;
}

interface Ranking {
  jogador_id: string;
  jogador_nome: string;
  foto_url: string | null;
  numero: number | null;
  time_id: string;
  time_nome: string;
  escudo_url: string | null;
  campeonato_id: string;
  gols?: number;
  assistencias?: number;
}

interface Cartoes {
  jogador_id: string;
  jogador_nome: string;
  numero: number | null;
  time_id: string;
  time_nome: string;
  campeonato_id: string;
  amarelos: number;
  vermelhos: number;
}

interface EventoRow {
  id: string;
  jogo_id: string;
  jogador_id: string;
  time_id: string;
  tipo_evento: string;
  minuto: number | null;
  created_at: string;
  jogador_nome: string;
  time_nome: string;
}

interface FaseTimeRow {
  time_id: string;
  id: string;
  nome: string;
  escudo_url: string | null;
}

interface ChavePresidente {
  id: string;
  nome: string;
  escudo_url: string | null;
  presidente_nome: string | null;
  chave: string | null;
  chave_created_at: string | null;
}

interface FasePublica {
  id: string;
  nome: string;
  ordem: number;
}

interface FaseTimePublicoRow extends FaseTimeRow {
  fase_id: string;
}

const arquivoSchema = z.string().min(1).max(2048).nullable().optional();

function lista<T = Linha>(sql: string, ...params: unknown[]) {
  return banco()
    .prepare(sql)
    .all(...params) as T[];
}

function linha<T = Linha>(sql: string, ...params: unknown[]) {
  return banco()
    .prepare(sql)
    .get(...params) as T | undefined;
}

function executar(sql: string, ...params: unknown[]) {
  return banco()
    .prepare(sql)
    .run(...params);
}

function jogador(row: Omit<Jogador, "ativo"> & { ativo: number | boolean }): Jogador {
  return { ...row, ativo: Boolean(row.ativo) };
}

function partida(row: PartidaRow): Partida {
  return {
    id: row.id,
    data_hora: row.data_hora,
    local: row.local,
    status: row.status,
    gols_time_casa: row.gols_time_casa,
    gols_time_fora: row.gols_time_fora,
    fase_id: row.fase_id,
    time_casa_id: row.time_casa_id,
    time_fora_id: row.time_fora_id,
    time_casa: { id: row.casa_id, nome: row.casa_nome, escudo_url: row.casa_escudo_url },
    time_fora: { id: row.fora_id, nome: row.fora_nome, escudo_url: row.fora_escudo_url },
    fase: row.fase_join_id
      ? { id: row.fase_join_id, nome: row.fase_nome ?? "", tipo: row.fase_tipo ?? "outra" }
      : null,
  };
}

function sqlPartidas(camposExtras = "") {
  return `
    SELECT
      j.id, j.data_hora, j.local, j.status, j.gols_time_casa, j.gols_time_fora,
      j.fase_id, j.time_casa_id, j.time_fora_id ${camposExtras},
      tc.id AS casa_id, tc.nome AS casa_nome, tc.escudo_url AS casa_escudo_url,
      tf.id AS fora_id, tf.nome AS fora_nome, tf.escudo_url AS fora_escudo_url,
      f.id AS fase_join_id, f.nome AS fase_nome, f.tipo AS fase_tipo
    FROM jogos j
    JOIN times tc ON tc.id = j.time_casa_id
    JOIN times tf ON tf.id = j.time_fora_id
    LEFT JOIN fases f ON f.id = j.fase_id
  `;
}

export const getCampeonato = createServerFn({ method: "GET" }).handler(async () => {
  return linha<Campeonato>("SELECT * FROM campeonatos WHERE id = ?", CAMPEONATO_ID) ?? null;
});

export const listTimes = createServerFn({ method: "GET" }).handler(async () => {
  return lista<TimeResumo>(
    `SELECT id, nome, escudo_url, presidente_nome
     FROM times
     WHERE campeonato_id = ?
     ORDER BY nome`,
    CAMPEONATO_ID,
  );
});

export const listFases = createServerFn({ method: "GET" }).handler(async () => {
  return lista<Fase>("SELECT * FROM fases WHERE campeonato_id = ? ORDER BY ordem", CAMPEONATO_ID);
});

export const listJogos = createServerFn({ method: "GET" }).handler(async () => {
  const rows = lista<PartidaRow>(
    `${sqlPartidas()}
     WHERE j.campeonato_id = ?
     ORDER BY j.data_hora IS NULL, j.data_hora, j.created_at`,
    CAMPEONATO_ID,
  );
  return rows.map(partida);
});

export const getClassificacao = createServerFn({ method: "GET" }).handler(async () => {
  return lista<Classificacao>(
    `SELECT *
     FROM v_classificacao
     WHERE campeonato_id = ?
     ORDER BY pontos DESC, saldo DESC, gols_pro DESC`,
    CAMPEONATO_ID,
  );
});

export const getArtilharia = createServerFn({ method: "GET" }).handler(async () => {
  return lista<Ranking>(
    `SELECT *
     FROM v_artilharia
     WHERE campeonato_id = ?
     ORDER BY gols DESC
     LIMIT 20`,
    CAMPEONATO_ID,
  );
});

export const getAssistencias = createServerFn({ method: "GET" }).handler(async () => {
  return lista<Ranking>(
    `SELECT *
     FROM v_assistencias
     WHERE campeonato_id = ?
     ORDER BY assistencias DESC
     LIMIT 20`,
    CAMPEONATO_ID,
  );
});

export const getCartoes = createServerFn({ method: "GET" }).handler(async () => {
  return lista<Cartoes>(
    `SELECT *
     FROM v_cartoes
     WHERE campeonato_id = ?
     ORDER BY vermelhos DESC, amarelos DESC`,
    CAMPEONATO_ID,
  );
});

export const listJogadoresByTime = createServerFn({ method: "GET" })
  .inputValidator((d: { timeId: string }) => z.object({ timeId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    return lista<Omit<Jogador, "ativo"> & { ativo: number | boolean }>(
      `SELECT *
       FROM jogadores
       WHERE time_id = ?
       ORDER BY numero IS NULL, numero`,
      data.timeId,
    ).map(jogador);
  });

export const getMeuTime = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  if (s.role !== "presidente" || !s.timeId) return null;

  const time = linha<Time>("SELECT * FROM times WHERE id = ?", s.timeId);
  if (!time) return null;

  const jogadores = lista<Omit<Jogador, "ativo"> & { ativo: number | boolean }>(
    `SELECT *
     FROM jogadores
     WHERE time_id = ?
     ORDER BY numero IS NULL, numero`,
    s.timeId,
  ).map(jogador);

  const jogos = lista<PartidaRow>(
    `${sqlPartidas()}
     WHERE j.time_casa_id = ? OR j.time_fora_id = ?
     ORDER BY j.data_hora IS NULL, j.data_hora, j.created_at`,
    s.timeId,
    s.timeId,
  ).map(partida);

  const cartoes = lista<Cartoes>("SELECT * FROM v_cartoes WHERE time_id = ?", s.timeId);
  return { time, jogadores, jogos, cartoes };
});

export const updateJogadorNumeroPresidente = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        numero: z.number().int().min(0).max(999).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireSession();
    if (s.role !== "presidente" || !s.timeId) {
      throw new Error("Apenas presidentes podem atualizar números.");
    }
    const jog = linha<{ time_id: string }>("SELECT time_id FROM jogadores WHERE id = ?", data.id);
    if (!jog || jog.time_id !== s.timeId) throw new Error("Jogador não pertence ao seu time.");
    executar(
      "UPDATE jogadores SET numero = ?, updated_at = ? WHERE id = ?",
      data.numero,
      agora(),
      data.id,
    );
    return { ok: true };
  });

export const upsertTime = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        nome: z.string().min(1).max(120),
        escudo_url: arquivoSchema,
        presidente_nome: z.string().max(120).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const dataAtual = agora();
    if (data.id) {
      executar(
        `UPDATE times
         SET campeonato_id = ?, nome = ?, escudo_url = ?, presidente_nome = ?, updated_at = ?
         WHERE id = ?`,
        CAMPEONATO_ID,
        data.nome,
        data.escudo_url ?? null,
        data.presidente_nome ?? null,
        dataAtual,
        data.id,
      );
      return { id: data.id };
    }

    const id = novoId();
    executar(
      `INSERT INTO times (id, campeonato_id, nome, escudo_url, presidente_nome, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      CAMPEONATO_ID,
      data.nome,
      data.escudo_url ?? null,
      data.presidente_nome ?? null,
      dataAtual,
      dataAtual,
    );
    return { id };
  });

export const deleteTime = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM times WHERE id = ?", data.id);
    return { ok: true };
  });

function gerarChave(prefixo = "PRES") {
  const bloco = () => randomBytes(2).toString("hex").toUpperCase();
  return `${prefixo}-${bloco()}-${bloco()}`;
}

export const gerarChavePresidente = createServerFn({ method: "POST" })
  .inputValidator((d: { timeId: string }) => z.object({ timeId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM access_keys WHERE time_id = ?", data.timeId);
    const time = linha<{ nome: string }>("SELECT nome FROM times WHERE id = ?", data.timeId);
    const prefixo =
      time?.nome
        ?.slice(0, 4)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || "PRES";
    const chave = gerarChave(prefixo);
    executar(
      `INSERT INTO access_keys (id, chave, role, time_id, label, created_at)
       VALUES (?, ?, 'presidente', ?, ?, ?)`,
      novoId(),
      chave,
      data.timeId,
      `Presidente ${time?.nome ?? ""}`,
      agora(),
    );
    return { chave };
  });

export const getChavePresidente = createServerFn({ method: "POST" })
  .inputValidator((d: { timeId: string }) => z.object({ timeId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const row = linha<{ chave: string }>(
      "SELECT chave FROM access_keys WHERE time_id = ?",
      data.timeId,
    );
    return { chave: row?.chave ?? null };
  });

export const listChavesPresidente = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return lista<ChavePresidente>(
    `SELECT t.id, t.nome, t.escudo_url, t.presidente_nome,
       k.chave, k.created_at AS chave_created_at
     FROM times t
     LEFT JOIN access_keys k ON k.time_id = t.id AND k.role = 'presidente'
     WHERE t.campeonato_id = ?
     ORDER BY t.nome`,
    CAMPEONATO_ID,
  );
});

export const revogarChavePresidente = createServerFn({ method: "POST" })
  .inputValidator((d: { timeId: string }) => z.object({ timeId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM access_keys WHERE time_id = ?", data.timeId);
    return { ok: true };
  });

export const upsertJogador = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        time_id: z.string().uuid(),
        nome: z.string().min(1).max(120),
        foto_url: arquivoSchema,
        idade: z.number().int().min(0).max(99).nullable().optional(),
        numero: z.number().int().min(0).max(999).nullable().optional(),
        posicao: z.string().max(40).nullable().optional(),
        ativo: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const dataAtual = agora();
    const ativo = (data.ativo ?? true) ? 1 : 0;
    if (data.id) {
      executar(
        `UPDATE jogadores
         SET time_id = ?, nome = ?, foto_url = ?, idade = ?, numero = ?, posicao = ?, ativo = ?, updated_at = ?
         WHERE id = ?`,
        data.time_id,
        data.nome,
        data.foto_url ?? null,
        data.idade ?? null,
        data.numero ?? null,
        data.posicao ?? null,
        ativo,
        dataAtual,
        data.id,
      );
      return { id: data.id };
    }

    const id = novoId();
    executar(
      `INSERT INTO jogadores
       (id, time_id, nome, foto_url, idade, numero, posicao, ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.time_id,
      data.nome,
      data.foto_url ?? null,
      data.idade ?? null,
      data.numero ?? null,
      data.posicao ?? null,
      ativo,
      dataAtual,
      dataAtual,
    );
    return { id };
  });

export const deleteJogador = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM jogadores WHERE id = ?", data.id);
    return { ok: true };
  });

export const upsertJogo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        fase_id: z.string().uuid().nullable().optional(),
        time_casa_id: z.string().uuid(),
        time_fora_id: z.string().uuid(),
        data_hora: z.string().nullable().optional(),
        local: z.string().max(200).nullable().optional(),
        status: z.enum(["agendado", "em_andamento", "encerrado", "cancelado"]).optional(),
        gols_time_casa: z.number().int().min(0).max(99).optional(),
        gols_time_fora: z.number().int().min(0).max(99).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.time_casa_id === data.time_fora_id) throw new Error("Times devem ser diferentes");
    const dataAtual = agora();
    if (data.id) {
      executar(
        `UPDATE jogos
         SET campeonato_id = ?, fase_id = ?, time_casa_id = ?, time_fora_id = ?, data_hora = ?,
             local = ?, status = ?, gols_time_casa = ?, gols_time_fora = ?, updated_at = ?
         WHERE id = ?`,
        CAMPEONATO_ID,
        data.fase_id ?? null,
        data.time_casa_id,
        data.time_fora_id,
        data.data_hora ?? null,
        data.local ?? null,
        data.status ?? "agendado",
        data.gols_time_casa ?? 0,
        data.gols_time_fora ?? 0,
        dataAtual,
        data.id,
      );
      return { id: data.id };
    }

    const id = novoId();
    executar(
      `INSERT INTO jogos
       (id, campeonato_id, fase_id, time_casa_id, time_fora_id, data_hora, local, status,
        gols_time_casa, gols_time_fora, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      CAMPEONATO_ID,
      data.fase_id ?? null,
      data.time_casa_id,
      data.time_fora_id,
      data.data_hora ?? null,
      data.local ?? null,
      data.status ?? "agendado",
      data.gols_time_casa ?? 0,
      data.gols_time_fora ?? 0,
      dataAtual,
      dataAtual,
    );
    return { id };
  });

export const deleteJogo = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM jogos WHERE id = ?", data.id);
    return { ok: true };
  });

export const listEventosJogo = createServerFn({ method: "POST" })
  .inputValidator((d: { jogoId: string }) => z.object({ jogoId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = lista<EventoRow>(
      `SELECT e.*, j.nome AS jogador_nome, t.nome AS time_nome
       FROM eventos_jogo e
       JOIN jogadores j ON j.id = e.jogador_id
       JOIN times t ON t.id = e.time_id
       WHERE e.jogo_id = ?
       ORDER BY e.minuto IS NULL, e.minuto`,
      data.jogoId,
    );
    return rows.map((row) => ({
      ...row,
      jogador: { nome: row.jogador_nome },
      time: { nome: row.time_nome },
    }));
  });

export const addEvento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        jogo_id: z.string().uuid(),
        jogador_id: z.string().uuid(),
        time_id: z.string().uuid(),
        tipo_evento: z.enum(["gol", "assistencia", "cartao_amarelo", "cartao_vermelho"]),
        minuto: z.number().int().min(0).max(200).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    executar(
      `INSERT INTO eventos_jogo (id, jogo_id, jogador_id, time_id, tipo_evento, minuto, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      novoId(),
      data.jogo_id,
      data.jogador_id,
      data.time_id,
      data.tipo_evento,
      data.minuto ?? null,
      agora(),
    );
    return { ok: true };
  });

export const deleteEvento = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM eventos_jogo WHERE id = ?", data.id);
    return { ok: true };
  });

export const setEventosPartida = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        jogoId: z.string().uuid(),
        jogadores: z.array(
          z.object({
            jogador_id: z.string().uuid(),
            time_id: z.string().uuid(),
            gols: z.number().int().min(0).max(99),
            assistencias: z.number().int().min(0).max(99),
            cartoes_amarelos: z.number().int().min(0).max(99),
            cartoes_vermelhos: z.number().int().min(0).max(99),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = banco();
    const transacao = db.transaction(() => {
      db.prepare(
        `DELETE FROM eventos_jogo
         WHERE jogo_id = ?
           AND tipo_evento IN ('gol', 'assistencia', 'cartao_amarelo', 'cartao_vermelho')`,
      ).run(data.jogoId);

      const stmt = db.prepare(
        `INSERT INTO eventos_jogo (id, jogo_id, jogador_id, time_id, tipo_evento, minuto, created_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?)`,
      );
      const dataAtual = agora();
      for (const j of data.jogadores) {
        for (let i = 0; i < j.gols; i++) {
          stmt.run(novoId(), data.jogoId, j.jogador_id, j.time_id, "gol", dataAtual);
        }
        for (let i = 0; i < j.assistencias; i++) {
          stmt.run(novoId(), data.jogoId, j.jogador_id, j.time_id, "assistencia", dataAtual);
        }
        for (let i = 0; i < j.cartoes_amarelos; i++) {
          stmt.run(novoId(), data.jogoId, j.jogador_id, j.time_id, "cartao_amarelo", dataAtual);
        }
        for (let i = 0; i < j.cartoes_vermelhos; i++) {
          stmt.run(novoId(), data.jogoId, j.jogador_id, j.time_id, "cartao_vermelho", dataAtual);
        }
      }
    });
    transacao();
    return { ok: true };
  });

export const createFase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ nome: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const maxRow = linha<{ ordem: number }>(
      `SELECT ordem
       FROM fases
       WHERE campeonato_id = ?
       ORDER BY ordem DESC
       LIMIT 1`,
      CAMPEONATO_ID,
    );
    const ordem = (maxRow?.ordem ?? -1) + 1;
    const id = novoId();
    const dataAtual = agora();
    executar(
      `INSERT INTO fases (id, campeonato_id, nome, ordem, tipo, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'outra', ?, ?)`,
      id,
      CAMPEONATO_ID,
      data.nome,
      ordem,
      dataAtual,
      dataAtual,
    );
    return { id };
  });

export const updateFaseNome = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), nome: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("UPDATE fases SET nome = ?, updated_at = ? WHERE id = ?", data.nome, agora(), data.id);
    return { ok: true };
  });

export const deleteFase = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM fases WHERE id = ?", data.id);
    return { ok: true };
  });

export const reorderFases = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ orderedIds: z.array(z.string().uuid()).min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = banco();
    const transacao = db.transaction(() => {
      const stmt = db.prepare("UPDATE fases SET ordem = ?, updated_at = ? WHERE id = ?");
      const dataAtual = agora();
      data.orderedIds.forEach((id, idx) => stmt.run(idx, dataAtual, id));
    });
    transacao();
    return { ok: true };
  });

export const getFaseTimes = createServerFn({ method: "POST" })
  .inputValidator((d: { faseId: string }) => z.object({ faseId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = lista<FaseTimeRow>(
      `SELECT ft.time_id, t.id, t.nome, t.escudo_url
       FROM fase_times ft
       JOIN times t ON t.id = ft.time_id
       WHERE ft.fase_id = ?
       ORDER BY t.nome`,
      data.faseId,
    );
    return rows.map((row) => ({
      time_id: row.time_id,
      time: { id: row.id, nome: row.nome, escudo_url: row.escudo_url },
    }));
  });

export const setFaseTimes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ faseId: z.string().uuid(), timeIds: z.array(z.string().uuid()) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = banco();
    const transacao = db.transaction(() => {
      db.prepare("DELETE FROM fase_times WHERE fase_id = ?").run(data.faseId);
      const stmt = db.prepare(
        "INSERT INTO fase_times (fase_id, time_id, created_at) VALUES (?, ?, ?)",
      );
      const dataAtual = agora();
      data.timeIds.forEach((timeId) => stmt.run(data.faseId, timeId, dataAtual));
    });
    transacao();
    return { ok: true };
  });

export const listPartidasByFase = createServerFn({ method: "POST" })
  .inputValidator((d: { faseId: string }) => z.object({ faseId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = lista<PartidaRow>(
      `${sqlPartidas(", j.created_at")}
       WHERE j.fase_id = ?
       ORDER BY j.data_hora IS NULL, j.data_hora, j.created_at`,
      data.faseId,
    );
    return rows.map(partida);
  });

export const createPartida = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        fase_id: z.string().uuid(),
        time_casa_id: z.string().uuid(),
        time_fora_id: z.string().uuid(),
        data_hora: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.time_casa_id === data.time_fora_id) throw new Error("Os times devem ser diferentes.");
    const id = novoId();
    const dataAtual = agora();
    executar(
      `INSERT INTO jogos
       (id, campeonato_id, fase_id, time_casa_id, time_fora_id, data_hora, status,
        gols_time_casa, gols_time_fora, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'agendado', 0, 0, ?, ?)`,
      id,
      CAMPEONATO_ID,
      data.fase_id,
      data.time_casa_id,
      data.time_fora_id,
      data.data_hora ? new Date(data.data_hora).toISOString() : null,
      dataAtual,
      dataAtual,
    );
    return { id };
  });

export const setPlacar = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        gols_casa: z.number().int().min(0).max(99),
        gols_fora: z.number().int().min(0).max(99),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    executar(
      `UPDATE jogos
       SET gols_time_casa = ?, gols_time_fora = ?, status = 'encerrado', updated_at = ?
       WHERE id = ?`,
      data.gols_casa,
      data.gols_fora,
      agora(),
      data.id,
    );
    return { ok: true };
  });

export const clearPlacar = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar(
      `UPDATE jogos
       SET gols_time_casa = 0, gols_time_fora = 0, status = 'agendado', updated_at = ?
       WHERE id = ?`,
      agora(),
      data.id,
    );
    return { ok: true };
  });

export const deletePartida = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    executar("DELETE FROM jogos WHERE id = ?", data.id);
    return { ok: true };
  });

export const getClassificacaoFase = createServerFn({ method: "POST" })
  .inputValidator((d: { faseId: string }) => z.object({ faseId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    return lista<Classificacao>(
      `SELECT *
       FROM v_classificacao_fase
       WHERE fase_id = ?
       ORDER BY pontos DESC, vitorias DESC, saldo DESC, gols_pro DESC`,
      data.faseId,
    );
  });

export const getCampeonatoPublico = createServerFn({ method: "GET" }).handler(async () => {
  const fases = lista<FasePublica>(
    "SELECT id, nome, ordem FROM fases WHERE campeonato_id = ? ORDER BY ordem",
    CAMPEONATO_ID,
  );
  const faseTimes = lista<FaseTimePublicoRow>(
    `SELECT ft.fase_id, t.id, t.nome, t.escudo_url
     FROM fase_times ft
     JOIN fases f ON f.id = ft.fase_id
     JOIN times t ON t.id = ft.time_id
     WHERE f.campeonato_id = ?
     ORDER BY t.nome`,
    CAMPEONATO_ID,
  ).map((row) => ({
    fase_id: row.fase_id,
    time: { id: row.id, nome: row.nome, escudo_url: row.escudo_url },
  }));
  const jogos = lista<PartidaRow>(
    `${sqlPartidas(", j.created_at")}
     WHERE j.campeonato_id = ? AND j.fase_id IS NOT NULL
     ORDER BY j.data_hora IS NULL, j.data_hora, j.created_at`,
    CAMPEONATO_ID,
  ).map(partida);
  const classificacao = lista<Classificacao>(
    `SELECT *
     FROM v_classificacao_fase
     ORDER BY pontos DESC, vitorias DESC, saldo DESC, gols_pro DESC`,
  );
  return { fases, faseTimes, jogos, classificacao };
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const uploadJogadorFoto = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { timeId: string; fileName: string; contentType: string; base64: string }) =>
      z
        .object({
          timeId: z.string().uuid(),
          fileName: z.string().min(1).max(255),
          contentType: z.enum(ALLOWED_IMAGE_TYPES),
          base64: z.string().min(1).max(10_000_000),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (
      session.role !== "admin" &&
      !(session.role === "presidente" && session.timeId === data.timeId)
    ) {
      throw new Error("Acesso negado");
    }

    const buffer = Buffer.from(data.base64, "base64");
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_PHOTO_BYTES) {
      throw new Error("Arquivo inválido");
    }

    const extensao =
      data.fileName
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 5) || "jpg";
    const nome = `${Date.now()}-${novoId()}.${extensao}`;
    const pasta = caminhoLocal("data", "uploads", "jogadores", data.timeId);
    mkdirSync(pasta, { recursive: true });
    writeFileSync(path.join(pasta, nome), buffer);

    return { url: `/uploads/jogadores/${data.timeId}/${nome}` };
  });
