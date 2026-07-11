# CONTEXTO DO PROJETO — AutoClip

> Última atualização: 04/07/2026

## 1. Visão Geral

Sistema pessoal para identificação, download cirúrgico, edição e formatação
automática de clipes de transmissões ao vivo (Twitch, YouTube, Kick), com
arquitetura híbrida: interface web em nuvem + processamento de vídeo local
em hardware dedicado. Objetivo primário: aprendizado técnico e portfólio.
Uso estritamente pessoal — sem publicação pública ou monetização no escopo
atual (ver DEC-SYS-003).

## 2. Contas e Serviços

- Supabase: projeto `autoclip`, região São Paulo.
- Google: conta pessoal do usuário, destino do storage via Drive API
  (ver DEC-SYS-004). OAuth ainda não configurado.
- Hardware do Worker: PC de terceiro (irmão do usuário), GPU AMD RX 7600.
  Máquina de desenvolvimento do usuário não possui GPU AMD — testes de
  encoding (`h264_amf`) só são possíveis na máquina de destino.

## 3. Stack Técnica

| Camada | Tecnologia | Status |
|---|---|---|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS | Fixo, em uso |
| Backend/Banco | Supabase (PostgreSQL) + Realtime | Fixo, em uso |
| Worker (local) | Python, yt-dlp, FFmpeg (`h264_amf`), faster-whisper | Fixo, não iniciado |
| Storage de entrega | Google Drive API v3, OAuth com refresh token | Fixo, não iniciado |

Todas as escolhas acima são fixas para este projeto — não sugerir
alternativas sem solicitação explícita do usuário.

## 4. Variáveis de Ambiente

| Variável | Módulo | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | web | Configurada |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | Configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | worker | Pendente (módulo não iniciado) |
| Refresh token OAuth Google | worker | Pendente (módulo não iniciado) |

## 5. Arquitetura e Design de Sistema

Arquitetura desacoplada, orientada a eventos: frontend e Worker não se
comunicam diretamente, apenas via banco de dados compartilhado (Supabase),
usando a tabela `clips_queue` como fila assíncrona. Realtime via WebSockets
notifica o frontend de mudanças feitas pelo Worker sem polling (ver
DEC-WEB-001 para o padrão de implementação no lado web). Falha de um lado
não derruba o outro, mas o Worker depende fisicamente de hardware
específico ligado manualmente (sem alta disponibilidade real — aceitável
para uso pessoal).

## 6. Banco de Dados

### Tabela `niches`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | Nome do nicho |
| `created_at` | TIMESTAMPTZ | Data de criação |

### Tabela `targets`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `niche_id` | UUID (FK) | Referência a `niches.id` |
| `name` | TEXT | Nome do canal/streamer |
| `url` | TEXT | URL do canal |
| `platform` | TEXT | Twitch, YouTube, Kick, etc. |
| `risk_level` | TEXT (enum) | `low`/`medium`/`high` — ver DEC-DB-001 |
| `authorization_status` | TEXT (enum) | `not_requested`/`requested`/`authorized`/`denied` |
| `authorization_note` | TEXT (opcional) | Evidência de autorização |
| `twitch_account_type` | TEXT (enum, opcional) | `regular`/`affiliate`/`partner` — ver DEC-SYS-005 |
| `created_at` | TIMESTAMPTZ | Data de criação |

### Tabela `clips_queue`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `target_id` | UUID (FK) | Referência a `targets.id` |
| `source_url` | TEXT | URL do VOD de origem |
| `start_time` | TEXT | Timestamp de início do corte |
| `duration` | INT | Duração em segundos |
| `status` | TEXT (enum) | `PENDING`/`PROCESSING`/`DONE`/`FAILED` |
| `source_type` | TEXT (enum) | `manual`/`auto` — ver DEC-SYS-002 |
| `local_path` | TEXT (opcional) | Caminho temporário no disco do Worker |
| `storage_provider` | TEXT (enum) | `google_drive`/`local` |
| `external_file_id` | TEXT (opcional) | ID do arquivo no Google Drive |
| `external_url` | TEXT (opcional) | Link de visualização no Drive |
| `error_message` | TEXT (opcional) | Obrigatório quando `status = FAILED` |
| `created_at` | TIMESTAMPTZ | Data de criação |

Índices: `targets(niche_id)`, `clips_queue(target_id)`, `clips_queue(status)`.
Realtime habilitado para `clips_queue` via publicação `supabase_realtime`.
Migração de referência: `supabase/migrations/001_initial_schema.sql` — ver
§14 (não encontrada no repositório local).

## 7. Autenticação e Permissões

Sem autenticação de usuário implementada — sistema single-user. RLS
habilitado nas três tabelas, com policies permissivas (leitura e escrita
via chave `anon` liberadas sem restrição). Aceitável apenas enquanto o
sistema não for exposto publicamente sem autenticação — ver Riscos (§14).

## 8. Integrações Externas

| Serviço | Finalidade | Forma de acesso | Status |
|---|---|---|---|
| Supabase | Banco + Realtime | SDK `@supabase/supabase-js` | Ativo |
| Google Drive API v3 | Storage de entrega dos clipes | REST, OAuth refresh token | Não iniciado |
| Twitch/YouTube (via yt-dlp) | Download de VOD | CLI/lib Python | Não iniciado |

## 9. Estrutura de Pastas

`autoclip-web/` é a raiz real do repositório Git (`git init` em
11/07/2026 — ver DEC-SYS-006; antes disso o repositório estava
incorretamente inicializado na raiz do disco, sem commits nem remoto,
já corrigido).

```
autoclip-web/                    → raiz do repositório Git (branch main)
├── .claude/                     → esta documentação
├── worker/                      → módulo worker (Python), estrutura inicial criada,
│                                   implementação ainda não iniciada (ver §15)
└── src/                         → módulo web (ver CONTEXTO-WEB.md)
    ├── app/
    │   ├── nichos/
    │   ├── targets/
    │   └── fila/
    ├── components/ui/           → Button, Input, Select, Badge
    ├── lib/
    ├── types/
    └── services/
```

`supabase/migrations/001_initial_schema.sql` referenciado ao longo desta
documentação ainda não existe fisicamente (ver §14) — quando criado, vai
em `autoclip-web/supabase/migrations/`.

## 10. Fluxos Implementados

- **Nichos:** criar e listar, validado fim a fim (ver CONTEXTO-WEB.md).
- **Targets:** criar, listar e remover (com confirmação), incluindo
  `risk_level` e `authorization_status` (ver CONTEXTO-WEB.md, DEC-DB-001).
- **Fila de clipes (`clips_queue`):** criar e remover pedido de corte
  manual; dashboard com atualização em tempo real via Supabase Realtime
  (ver DEC-WEB-001).

Processamento de fato (download, corte, upload) depende do módulo worker,
ainda não iniciado. Edição (update) de targets e itens da fila ainda não
implementada em nenhum módulo.

## 11. Contratos de Interface

Ver CONTEXTO-WEB.md §7 para os contratos do módulo web (`niches.ts`,
`targets.ts`, `clipsQueue.ts`). Nenhum contrato de API externa (worker,
Drive) definido ainda.

## 12. Ambiente, Deploy e CI/CD

N/A — projeto em desenvolvimento local, sem deploy realizado. Vercel
planejado como destino futuro do módulo web (ver DEC-SYS-003 — decisão
de manter escopo pessoal adia essa necessidade).

## 13. Middleware e Interceptors

N/A.

## 14. Riscos e Limitações Conhecidas

- Policies de RLS atuais liberam escrita irrestrita via chave `anon` —
  aceitável apenas com o dashboard não exposto publicamente.
- Worker depende fisicamente de hardware específico (PC do irmão do
  usuário) ligado manualmente — sem redundância.
- Risco de copyright (Content ID, DMCA) mitigado por estratégia
  documentada em DEC-SYS-001, não eliminado.
- VOD de origem tem janela de retenção limitada por tipo de conta do
  streamer (7/14/60 dias) — ver DEC-SYS-005.
- Usuário de desenvolvimento não possui GPU AMD — validação de
  `h264_amf` só é possível na máquina de destino do Worker.
- Schema de `targets` e `clips_queue` existe e está ativo no Supabase,
  mas o arquivo `supabase/migrations/001_initial_schema.sql` referenciado
  nesta documentação não existe no repositório — schema foi aplicado
  diretamente no banco, sem script SQL versionado.

## 15. Pendências Abertas

- Restringir policies de RLS antes de qualquer exposição pública.
- Iniciar módulo worker (Python) — nenhum código criado ainda. Próxima
  prioridade de desenvolvimento (ver PROXIMOS_PASSOS.md).
- Recriar e versionar `supabase/migrations/001_initial_schema.sql` com o
  schema real de `targets` e `clips_queue` (ver §14).
- Configurar OAuth do Google Drive (refresh token) — depende da máquina
  final do Worker.
- Definir alerta de esgotamento de cota do Google Drive (não desenhado).

## 16. Mapa de Contexto por Módulo

| Módulo | Arquivo em `.claude/` | Prefixo DEC | Prefixo Teste |
|--------|----------------------------------|-------------|---------------|
| Sistema (transversal) | CONTEXTO.md | DEC-SYS | T-INT |
| Banco de dados | CONTEXTO.md (seção 6) | DEC-DB | — |
| Web (frontend) | CONTEXTO-WEB.md | DEC-WEB | T-WEB |
| Worker (não iniciado) | — | DEC-WORKER | T-WORKER |
