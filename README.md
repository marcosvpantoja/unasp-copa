# Copa do Mundo UNASP 2026

Sistema completo para organizar e acompanhar um campeonato de futebol universitário: cadastro de times e jogadores, tabela de jogos, súmula com eventos da partida, estatísticas e uma tela pública para a torcida acompanhar tudo.

## Funcionalidades

**Tela pública**
- Próximos jogos, últimos resultados e partidas encerradas
- Classificação por fase e página de cada time com o elenco
- Artilharia, assistências e cartões (por jogador e por time)

**Administração**
- Cadastro de campeonatos, fases, times e jogadores, com upload de escudos e fotos
- Registro de eventos por partida: gols, assistências, cartões amarelos e vermelhos
- Geração das chaves de acesso dos presidentes de time

**Área do presidente**
- Cada time entra com a própria chave de acesso
- Mantém o elenco, os números das camisas e o **quadro tático** com arrastar e soltar

## Stack

TanStack Start (React 19, SSR) · TypeScript · Tailwind CSS v4 · shadcn/ui · SQLite (better-sqlite3) · dnd-kit · Recharts

Autenticação por sessão assinada no servidor, sem dependência de serviços externos: o banco é um arquivo SQLite local.

## Como rodar

```sh
cp .env.example .env   # defina SESSION_SECRET, ACCESS_CODE (chave do admin) e SQLITE_PATH
npm install
npm run dev
```

As tabelas são criadas automaticamente na primeira execução.

---

Desenvolvido por **Marcos Pantoja** · [29Tech](https://www.vintenove.com)
