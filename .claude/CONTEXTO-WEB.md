# CONTEXTO — Web (Frontend)

> Última atualização: 04/07/2026

## 1. Visão Geral do Módulo
Dashboard Next.js — ponto de entrada do sistema. Onde nichos e canais
são cadastrados e pedidos de corte são criados, consumidos depois pelo
módulo worker via `clips_queue`.

## 2. Stack Técnica
Next.js 16 (App Router), React, TypeScript, Tailwind CSS,
`@supabase/supabase-js`. Criado com `create-next-app`, customizado para
incluir diretório `src/`.

## 3. Variáveis de Ambiente (específicas do módulo)
| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (RLS aplica-se) |

Definidas em `.env.local` (não versionado).

## 4. Arquitetura Interna
Camada de serviço isola toda chamada ao Supabase (`src/services/`) —
nenhum componente de UI chama `supabase` diretamente, nem para queries
nem para inscrições Realtime (ver DEC-WEB-001 em DECISOES.md). Tipos em
`src/types/database.ts` espelham o schema do banco (ver CONTEXTO.md
§6 na raiz). Componentes visuais reutilizáveis (`Button`, `Input`,
`Select`, `Badge`) ficam em `src/components/ui/`, sem lógica de dados.

## 5. Estrutura de Pastas
```
autoclip-web/src/
├── app/
│   ├── page.tsx           → painel de entrada (links para os módulos)
│   ├── nichos/page.tsx    → CRUD de nichos
│   ├── targets/page.tsx   → CRUD de canais (targets)
│   └── fila/page.tsx      → fila de clipes, com Realtime
├── components/ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── Badge.tsx
├── lib/
│   └── supabase.ts        → cliente único do Supabase
├── types/
│   └── database.ts        → tipos espelhando o schema
└── services/
    ├── niches.ts           → CRUD de nichos
    ├── targets.ts          → CRUD de targets
    └── clipsQueue.ts       → CRUD de clips_queue + inscrição Realtime
```

## 6. Fluxos Implementados
- **Nichos:** criar e listar (`/nichos`).
- **Targets:** criar, listar e remover com confirmação (`/targets`).
  Formulário inclui nicho (select dinâmico vindo do banco), plataforma,
  nível de risco e status de autorização (selects estáticos), com
  campo condicional de tipo de conta Twitch quando a plataforma é
  Twitch. Validação de URL (`http://`/`https://`) na camada de serviço.
- **Fila de clipes:** criar e remover pedido de corte manual (`/fila`),
  com select de canal, campo de horário de início com máscara
  automática HH:MM:SS, e duração em segundos. Lista atualiza sozinha
  via Supabase Realtime quando o `status` de um item muda (`PENDING` →
  `PROCESSING` → `DONE`/`FAILED`), sem reload manual.

Edição (update) de targets e itens da fila ainda não implementada —
só criar/listar/remover.

## 7. Contratos de Interface

`src/services/niches.ts`:
- `listNiches(): Promise<Niche[]>`
- `createNiche(name: string): Promise<Niche>` — lança erro se nome vazio.
- `deleteNiche(id: string): Promise<void>` — falha se houver `targets`
  vinculados (sem `ON DELETE CASCADE` proposital).

`src/services/targets.ts`:
- `listTargets(): Promise<Target[]>`
- `createTarget(input: CreateTargetInput): Promise<Target>` — valida
  nome/URL/plataforma/nicho não vazios e URL com `http(s)://`;
  `risk_level` e `authorization_status` têm default (`low` /
  `not_requested`) se omitidos.
- `deleteTarget(id: string): Promise<void>`

`src/services/clipsQueue.ts`:
- `listClipsQueue(): Promise<ClipQueueItem[]>`
- `createClip(input: CreateClipInput): Promise<ClipQueueItem>` — sempre
  cria com `source_type: 'manual'` e `storage_provider: 'google_drive'`
  (ver DEC-SYS-002, DEC-SYS-004); valida URL do VOD, timestamp e
  duração > 0.
- `deleteClip(id: string): Promise<void>`
- `subscribeToClipsQueue(onChange: () => void): () => void` — inscrição
  Realtime; retorna função de limpeza (ver DEC-WEB-001).

## 8. Autenticação e Permissões
Nenhuma autenticação de usuário. Acesso ao banco via chave `anon`,
restrito apenas pelas policies de RLS (ver CONTEXTO.md §7/§14 na raiz).

## 9. Integrações Externas
Supabase, client-side, via `@supabase/supabase-js` — tanto para queries
REST quanto para inscrição Realtime (WebSocket) na tabela `clips_queue`.
Nenhuma outra integração no módulo web até o momento.

## 10. Middleware e Interceptors
N/A.

## 11. Riscos e Limitações Conhecidas
- Nenhuma tela tem edição (update) — só criar/listar/remover. Corrigir
  um cadastro exige apagar e recriar.
- Tipo de conta Twitch (`twitch_account_type`) só aparece no formulário
  de targets quando a plataforma selecionada é "Twitch" — se o usuário
  trocar de plataforma depois de preencher, o valor anterior é
  descartado silenciosamente ao enviar (não há aviso disso na tela).

## 12. Pendências Abertas
- Implementar edição (update) de `targets` e itens de `clips_queue`.
- Validar manualmente o fluxo completo de `clips_queue` + Realtime
  (criar item, e depois atualizar `status` via SQL Editor para
  confirmar que a tela reflete sem reload) — ver TESTES-WEB.md.
- Exercitar T-WEB-03 (nome vazio em nichos) manualmente.
- Redesenho visual do dashboard — aguardando decisão do usuário, com
  rascunho de prompt já preparado em `.claude/RASCUNHO_PROMPT_UI.md`.
