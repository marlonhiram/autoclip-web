# DECISÕES TÉCNICAS — AutoClip

> Última atualização: 04/07/2026

## Prefixos de Escopo
| Prefixo | Escopo | Quando usar |
|---------|--------|-------------|
| DEC-SYS | Transversal | Afeta mais de um módulo ou define contrato entre serviços |
| DEC-DB  | Banco de dados | Schema, migrations, persistência |
| DEC-WEB | Web (frontend) | Decisões internas ao módulo web |
| DEC-WORKER | Worker (Python) | Decisões internas ao módulo worker |

---

## [DEC-SYS-001] — Estratégia de mitigação de risco de copyright
**Data:** 02/07/2026
**Status:** Ativa
**Contexto:** Sistema baixa e reprocessa vídeo de terceiros. Uso é pessoal, sem redistribuição pública.
**Decisão:** Nicho agnóstico por design; watermark/reenquadramento nunca tratados como mitigação legal (não afetam Content ID); evasão de detecção descartada como estratégia; uso permanece privado até ADR explícito em contrário; publicação futura exige autorização do canal ou transformação real (comentário/análise).
**Consequências:** Reduz risco de strike desde a concepção. Exige decisão humana explícita antes de qualquer publicação — sem modo automático.

---

## [DEC-SYS-002] — Identificação de clipes: manual antes de automática
**Data:** 02/07/2026
**Status:** Ativa
**Contexto:** Identificação automática de momento viral mistura risco de engenharia (conhecido) com risco de pesquisa/IA (incerto).
**Decisão:** V1 usa apenas timestamp manual (`source_type = 'manual'`). Identificação automática (`auto`) fica para módulo futuro isolado, plugável na mesma fila.
**Consequências:** V1 mais rápida e testável. Falha do módulo automático futuro fica isolada, não contamina o pipeline base.

---

## [DEC-SYS-003] — Adiamento de monetização e publicação
**Data:** 02/07/2026
**Status:** Ativa
**Contexto:** Objetivo real do projeto é aprendizado técnico e portfólio, não retorno financeiro imediato.
**Decisão:** Projeto tratado exclusivamente como uso pessoal nesta fase. Monetização/publicação fora de escopo até novo ADR.
**Consequências:** Simplifica escopo (sem billing, sem storage de distribuição pública). Adia infraestrutura que ainda não foi validada como necessária.

---

## [DEC-SYS-004] — Storage de entrega via Google Drive (OAuth, refresh token)
**Data:** 02/07/2026
**Status:** Ativa
**Contexto:** Armazenar vídeo binário no Supabase é caro; prioridade é custo zero de operação.
**Decisão:** Upload resumível via Drive API v3, autenticado com OAuth de conta pessoal (não Service Account). Supabase guarda apenas metadado (`external_file_id`, `external_url`).
**Consequências:** Custo de storage zero. Introduz gargalo potencial de upload residencial e exige tratamento de erro dedicado (token expirado, cota excedida).

---

## [DEC-SYS-005] — Corte apenas via VOD, sem captura ao vivo
**Data:** 02/07/2026
**Status:** Ativa
**Contexto:** Uso real do usuário tem folga de até 2 dias entre a live e o corte. Janela de retenção de VOD na Twitch: 7 dias (regular), 14 (affiliate), 60 (partner).
**Decisão:** Worker processa exclusivamente VOD finalizado — nunca stream em andamento.
**Consequências:** Elimina complexidade de janela de tempo instável. Único caso não coberto: canal sem "Store past broadcasts" ativado (sem VOD algum).

---

## [DEC-DB-001] — Rastreio de risco e autorização por Target
**Data:** 02/07/2026
**Status:** Ativa
**Contexto:** Sistema precisa ser agnóstico a nicho, mas sem perder rastreabilidade de risco por canal (complementa DEC-SYS-001).
**Decisão:** Tabela `targets` ganha `risk_level`, `authorization_status` e `authorization_note`. Campos informativos, não bloqueantes — cadastro nunca é restringido por risco.
**Consequências:** Custo de implementação mínimo. Cria rastro auditável para decisão futura de publicação.

---

## [DEC-WEB-001] — Inscrição Realtime encapsulada na camada de serviço
**Data:** 04/07/2026
**Status:** Ativa
**Contexto:** O dashboard de `clips_queue` precisa refletir mudanças de `status` feitas pelo Worker (processo externo, outra máquina) sem polling manual — exige assinatura Supabase Realtime via WebSocket (`postgres_changes`).
**Decisão:** A inscrição (`supabase.channel().on('postgres_changes', ...)`) e sua limpeza (`removeChannel`) ficam dentro de `services/clipsQueue.ts`, na função `subscribeToClipsQueue`, que retorna uma função de unsubscribe para o componente usar no `return` do `useEffect`. Nenhum componente de UI chama `supabase.channel()` diretamente.
**Consequências:** Mantém a regra "nenhum componente chama Supabase diretamente" também para Realtime, não só para queries. Estabelece o padrão a seguir em qualquer feature futura de Realtime (ex: dashboard de progresso do Worker).

---

## [DEC-SYS-006] — Repositório Git único (monorepo) com worker/ dentro de autoclip-web
**Data:** 11/07/2026
**Status:** Ativa
**Contexto:** Repositório Git do projeto estava inicializado incorretamente na raiz do disco (`C:\.git`, `worktree = C:/`), sem commits nem remoto — nenhum histórico foi perdido na correção. Era necessário decidir a raiz correta antes de começar o módulo worker, especialmente considerando que o worker roda em uma máquina física diferente (PC do irmão do usuário) e precisará ser sincronizado via Git.
**Decisão:** Repositório Git reinicializado com raiz em `autoclip-web/` (branch `main`). O módulo worker (Python) vive em `autoclip-web/worker/`, no mesmo repositório do módulo web — não em repositório separado. Sincronização com a máquina de destino do worker será via repositório remoto privado (GitHub/GitLab), com `git pull` na outra máquina.
**Consequências:** Um único repositório para clonar/sincronizar em qualquer máquina, incluindo a de destino do worker. Estrutura de pastas documentada em CONTEXTO.md §9 fica desatualizada (mencionava `autoclip-project/` como raiz com `autoclip-web/` como subpasta) — corrigida para refletir `autoclip-web/` como raiz real do repositório, contendo `worker/` como subpasta irmã de `src/`.
