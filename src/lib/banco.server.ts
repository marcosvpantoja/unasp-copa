import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import "./ambiente.server";

export const CAMPEONATO_ID = "00000000-0000-0000-0000-000000000001";

let instancia: Database.Database | undefined;

export function novoId() {
  return randomUUID();
}

export function agora() {
  return new Date().toISOString();
}

export function caminhoLocal(...partes: string[]) {
  return path.join(process.cwd(), ...partes);
}

export function banco() {
  if (!instancia) {
    const caminho = process.env.SQLITE_PATH
      ? path.resolve(process.cwd(), process.env.SQLITE_PATH)
      : caminhoLocal("data", "copa.sqlite");
    mkdirSync(path.dirname(caminho), { recursive: true });
    instancia = new Database(caminho);
    instancia.pragma("foreign_keys = ON");
    instancia.pragma("journal_mode = WAL");
    prepararBanco(instancia);
  }
  return instancia;
}

function prepararBanco(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campeonatos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      temporada TEXT NOT NULL,
      descricao TEXT,
      capa_url TEXT,
      logo_url TEXT,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fases (
      id TEXT PRIMARY KEY,
      campeonato_id TEXT NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'outra',
      ordem INTEGER NOT NULL DEFAULT 0,
      descricao TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS times (
      id TEXT PRIMARY KEY,
      campeonato_id TEXT NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      escudo_url TEXT,
      presidente_nome TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_keys (
      id TEXT PRIMARY KEY,
      chave TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'presidente')),
      time_id TEXT REFERENCES times(id) ON DELETE CASCADE,
      label TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jogadores (
      id TEXT PRIMARY KEY,
      time_id TEXT NOT NULL REFERENCES times(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      foto_url TEXT,
      idade INTEGER,
      numero INTEGER,
      posicao TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jogos (
      id TEXT PRIMARY KEY,
      campeonato_id TEXT NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
      fase_id TEXT REFERENCES fases(id) ON DELETE SET NULL,
      time_casa_id TEXT NOT NULL REFERENCES times(id) ON DELETE CASCADE,
      time_fora_id TEXT NOT NULL REFERENCES times(id) ON DELETE CASCADE,
      data_hora TEXT,
      local TEXT,
      status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'encerrado', 'cancelado')),
      gols_time_casa INTEGER NOT NULL DEFAULT 0,
      gols_time_fora INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS eventos_jogo (
      id TEXT PRIMARY KEY,
      jogo_id TEXT NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
      jogador_id TEXT NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
      time_id TEXT NOT NULL REFERENCES times(id) ON DELETE CASCADE,
      tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('gol', 'assistencia', 'cartao_amarelo', 'cartao_vermelho')),
      minuto INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fase_times (
      fase_id TEXT NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
      time_id TEXT NOT NULL REFERENCES times(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (fase_id, time_id)
    );
  `);

  criarViews(db);
  criarDadosIniciais(db);
}

function criarViews(db: Database.Database) {
  db.exec(`
    DROP VIEW IF EXISTS v_classificacao;
    CREATE VIEW v_classificacao AS
    WITH partidas AS (
      SELECT campeonato_id, time_casa_id AS time_id, gols_time_casa AS gp, gols_time_fora AS gc,
        CASE WHEN gols_time_casa > gols_time_fora THEN 3
             WHEN gols_time_casa = gols_time_fora THEN 1 ELSE 0 END AS pts,
        CASE WHEN gols_time_casa > gols_time_fora THEN 1 ELSE 0 END AS v,
        CASE WHEN gols_time_casa = gols_time_fora THEN 1 ELSE 0 END AS e,
        CASE WHEN gols_time_casa < gols_time_fora THEN 1 ELSE 0 END AS d
      FROM jogos WHERE status = 'encerrado'
      UNION ALL
      SELECT campeonato_id, time_fora_id, gols_time_fora, gols_time_casa,
        CASE WHEN gols_time_fora > gols_time_casa THEN 3
             WHEN gols_time_fora = gols_time_casa THEN 1 ELSE 0 END,
        CASE WHEN gols_time_fora > gols_time_casa THEN 1 ELSE 0 END,
        CASE WHEN gols_time_fora = gols_time_casa THEN 1 ELSE 0 END,
        CASE WHEN gols_time_fora < gols_time_casa THEN 1 ELSE 0 END
      FROM jogos WHERE status = 'encerrado'
    )
    SELECT
      t.id AS time_id, t.campeonato_id, t.nome AS time_nome, t.escudo_url,
      COALESCE(COUNT(p.time_id), 0) AS jogos,
      COALESCE(SUM(p.v), 0) AS vitorias,
      COALESCE(SUM(p.e), 0) AS empates,
      COALESCE(SUM(p.d), 0) AS derrotas,
      COALESCE(SUM(p.gp), 0) AS gols_pro,
      COALESCE(SUM(p.gc), 0) AS gols_contra,
      COALESCE(SUM(p.gp), 0) - COALESCE(SUM(p.gc), 0) AS saldo,
      COALESCE(SUM(p.pts), 0) AS pontos
    FROM times t
    LEFT JOIN partidas p ON p.time_id = t.id AND p.campeonato_id = t.campeonato_id
    GROUP BY t.id, t.campeonato_id, t.nome, t.escudo_url;

    DROP VIEW IF EXISTS v_artilharia;
    CREATE VIEW v_artilharia AS
    SELECT j.id AS jogador_id, j.nome AS jogador_nome, j.foto_url, j.numero,
      t.id AS time_id, t.nome AS time_nome, t.escudo_url, t.campeonato_id,
      COUNT(*) AS gols
    FROM eventos_jogo e
    JOIN jogadores j ON j.id = e.jogador_id
    JOIN times t ON t.id = j.time_id
    WHERE e.tipo_evento = 'gol'
    GROUP BY j.id, j.nome, j.foto_url, j.numero, t.id, t.nome, t.escudo_url, t.campeonato_id;

    DROP VIEW IF EXISTS v_assistencias;
    CREATE VIEW v_assistencias AS
    SELECT j.id AS jogador_id, j.nome AS jogador_nome, j.foto_url, j.numero,
      t.id AS time_id, t.nome AS time_nome, t.escudo_url, t.campeonato_id,
      COUNT(*) AS assistencias
    FROM eventos_jogo e
    JOIN jogadores j ON j.id = e.jogador_id
    JOIN times t ON t.id = j.time_id
    WHERE e.tipo_evento = 'assistencia'
    GROUP BY j.id, j.nome, j.foto_url, j.numero, t.id, t.nome, t.escudo_url, t.campeonato_id;

    DROP VIEW IF EXISTS v_cartoes;
    CREATE VIEW v_cartoes AS
    SELECT j.id AS jogador_id, j.nome AS jogador_nome, j.numero,
      t.id AS time_id, t.nome AS time_nome, t.campeonato_id,
      SUM(CASE WHEN e.tipo_evento = 'cartao_amarelo' THEN 1 ELSE 0 END) AS amarelos,
      SUM(CASE WHEN e.tipo_evento = 'cartao_vermelho' THEN 1 ELSE 0 END) AS vermelhos
    FROM eventos_jogo e
    JOIN jogadores j ON j.id = e.jogador_id
    JOIN times t ON t.id = j.time_id
    WHERE e.tipo_evento IN ('cartao_amarelo', 'cartao_vermelho')
    GROUP BY j.id, j.nome, j.numero, t.id, t.nome, t.campeonato_id;

    DROP VIEW IF EXISTS v_classificacao_fase;
    CREATE VIEW v_classificacao_fase AS
    WITH partidas AS (
      SELECT fase_id, time_casa_id AS time_id, gols_time_casa AS gp, gols_time_fora AS gc,
        CASE WHEN gols_time_casa > gols_time_fora THEN 3
             WHEN gols_time_casa = gols_time_fora THEN 1 ELSE 0 END AS pts,
        CASE WHEN gols_time_casa > gols_time_fora THEN 1 ELSE 0 END AS v,
        CASE WHEN gols_time_casa = gols_time_fora THEN 1 ELSE 0 END AS e,
        CASE WHEN gols_time_casa < gols_time_fora THEN 1 ELSE 0 END AS d
      FROM jogos WHERE status = 'encerrado' AND fase_id IS NOT NULL
      UNION ALL
      SELECT fase_id, time_fora_id, gols_time_fora, gols_time_casa,
        CASE WHEN gols_time_fora > gols_time_casa THEN 3
             WHEN gols_time_fora = gols_time_casa THEN 1 ELSE 0 END,
        CASE WHEN gols_time_fora > gols_time_casa THEN 1 ELSE 0 END,
        CASE WHEN gols_time_fora = gols_time_casa THEN 1 ELSE 0 END,
        CASE WHEN gols_time_fora < gols_time_casa THEN 1 ELSE 0 END
      FROM jogos WHERE status = 'encerrado' AND fase_id IS NOT NULL
    )
    SELECT
      ft.fase_id,
      t.id AS time_id,
      t.nome AS time_nome,
      t.escudo_url,
      COALESCE(COUNT(p.time_id), 0) AS jogos,
      COALESCE(SUM(p.v), 0) AS vitorias,
      COALESCE(SUM(p.e), 0) AS empates,
      COALESCE(SUM(p.d), 0) AS derrotas,
      COALESCE(SUM(p.gp), 0) AS gols_pro,
      COALESCE(SUM(p.gc), 0) AS gols_contra,
      COALESCE(SUM(p.gp), 0) - COALESCE(SUM(p.gc), 0) AS saldo,
      COALESCE(SUM(p.pts), 0) AS pontos
    FROM fase_times ft
    JOIN times t ON t.id = ft.time_id
    LEFT JOIN partidas p ON p.time_id = ft.time_id AND p.fase_id = ft.fase_id
    GROUP BY ft.fase_id, t.id, t.nome, t.escudo_url;
  `);
}

function criarDadosIniciais(db: Database.Database) {
  const data = agora();
  db.prepare(
    `
    INSERT OR IGNORE INTO campeonatos (id, nome, temporada, descricao, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    CAMPEONATO_ID,
    "COPA DO MUNDO UNASP 2026",
    "2026",
    "Campeonato universitário de futsal UNASP 2026",
    "ativo",
    data,
    data,
  );

  const total = db.prepare("SELECT COUNT(*) AS total FROM access_keys").get() as { total: number };
  if (total.total === 0) {
    const chave = process.env.ACCESS_CODE?.trim() || "UNASP-ADMIN-2026";
    db.prepare(
      `
      INSERT INTO access_keys (id, chave, role, time_id, label, created_at)
      VALUES (?, ?, 'admin', NULL, ?, ?)
    `,
    ).run(novoId(), chave, "Administrador local", data);
  }
}
