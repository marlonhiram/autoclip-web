# RASCUNHO — Prompt para evolução de UI do AutoClip

> Status: rascunho, não usar ainda. Guardado para quando o CRUD de
> `targets` e `clips_queue` estiver concluído e testado. Não faz parte
> dos arquivos oficiais de contexto (`CONTEXTO.md`, `DECISOES.md` etc.)
> — é só uma nota de trabalho para uma sessão futura, com qualquer
> modelo/agente que for usado para o redesenho visual.

## Objetivo

Evoluir a interface do dashboard AutoClip de "funcional" para
"polida", sem reescrever a arquitetura já validada. Isso é trabalho de
**camada visual**, não de dados — quem for executar isso não deve
tocar em `src/services/`, `src/types/database.ts` nem no schema do
banco.

## Contexto obrigatório a fornecer

- **Stack fixa (não sugerir troca):** Next.js 16 (App Router), React,
  TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`).
- **Camada de serviço já existe e deve ser respeitada:**
  `src/services/*.ts` isola toda chamada ao Supabase. Nenhuma tela
  chama `supabase` diretamente — isso não pode mudar.
- **Componentes de UI já existentes** em `src/components/ui/`:
  `Button` (variants: primary/secondary/danger), `Input`, `Select`,
  `Badge` (variants: neutral/success/warning/danger). Todos aceitam
  `label` opcional e `className` sobrescrevível. Suportam dark mode via
  classes `dark:` do Tailwind, paleta `zinc` como base neutra.
- **Páginas existentes:**
  - `/` — painel de entrada, com links para os módulos
  - `/nichos` — CRUD simples (criar/listar)
  - `/targets` — CRUD com select dinâmico (nicho, vindo do banco) e
    selects estáticos (risco, autorização, tipo de conta Twitch),
    badges coloridos por `risk_level`/`authorization_status`
  - `/clips_queue` — ainda não implementada (próximo passo)
- **Schema do banco:** documentado em `src/types/database.ts` (fonte
  de verdade dos tipos) e em `.claude/CONTEXTO.md` §6 (descrição de
  cada coluna).
- **Regras que não podem ser quebradas:**
  - Todo fetch mantém `try/catch` com erro visível na tela (nunca
    falha silenciosamente).
  - Estados de `loading`/`disabled` durante operações assíncronas são
    obrigatórios.
  - Novo componente de UI vai para `src/components/ui/`, seguindo o
    mesmo padrão de props dos que já existem.
- **Natureza do uso:** sistema pessoal, single-user, sem necessidade
  de responsividade mobile elaborada — uso real é desktop, mas não
  quebrar em telas menores.

## O que pedir explicitamente

- Evoluir a paleta visual (hoje é `zinc` genérico do Tailwind — pode
  ganhar identidade própria/cor de destaque).
- Melhorar hierarquia visual do dashboard (hoje são listas verticais
  simples — pensar em cards, agrupamento por nicho, dashboard de
  status para `clips_queue` com Realtime).
- Não reescrever a lógica de estado (`useState`/`useEffect`) das
  páginas — só a estrutura visual/JSX e classes Tailwind.
- Manter compatibilidade total com os tipos existentes (`Niche`,
  `Target`, `ClipQueueItem`) — nenhum campo novo sem alteração de
  schema versionada (ver regra de migrations do projeto).

## Pendência a resolver antes de usar este prompt

`clips_queue` ainda não tem tela — o ideal é essa tela existir antes
do redesenho, para o redesenho cobrir os 3 módulos de uma vez, não só
2 de 3.
