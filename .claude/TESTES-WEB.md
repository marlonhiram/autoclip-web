# BATERIA DE TESTES — Web (Frontend)

> Última atualização: 04/07/2026

## Nichos

### T-WEB-01 — Listar nichos
**Pré-condição:** Tabela `niches` acessível via RLS com chave `anon`.
**Ambiente:** Local
- [x] Acessar `/nichos`
- [x] Página exibe "Nenhum nicho cadastrado ainda." quando tabela vazia
**Verificação no banco:** `select * from niches` retorna vazio.
**Resultado:** ✅ OK

### T-WEB-02 — Criar nicho
**Pré-condição:** T-WEB-01 executado.
**Ambiente:** Local
- [x] Preencher campo com nome ("financas")
- [x] Clicar em "Criar nicho"
- [x] Novo item aparece na lista sem reload manual da página
**Verificação no banco:** `select * from niches` retorna a linha criada,
com `created_at` preenchido automaticamente.
**Resultado:** ✅ OK

### T-WEB-03 — Criar nicho com nome vazio
**Pré-condição:** T-WEB-01 executado.
**Ambiente:** Local
- [x] Tentar submeter formulário sem preencher o campo
**Verificação no banco:** nenhuma linha deve ser inserida; erro deve
aparecer na tela (regra de "proibido falhar silenciosamente").
**Resultado:** ✅ OK

---
## Targets

### T-WEB-04 — Criar target
**Pré-condição:** Ao menos um nicho cadastrado (T-WEB-02).
**Ambiente:** Local
- [x] Acessar `/targets`
- [x] Selecionar nicho, preencher nome/URL/plataforma
- [x] Criar canal com plataforma "Twitch" e conferir que o campo de
      tipo de conta Twitch aparece
- [x] Novo item aparece na lista sem reload, com badges de plataforma,
      risco e autorização
**Verificação no banco:** `select * from targets` retorna a linha
criada com `risk_level`/`authorization_status` corretos.
**Resultado:** ✅ OK

### T-WEB-05 — Listar targets com nicho vinculado
**Pré-condição:** T-WEB-04 executado.
**Ambiente:** Local
- [x] Lista exibe nome do nicho ao lado do nome do canal
**Resultado:** ✅ OK

### T-WEB-06 — Remover target
**Pré-condição:** T-WEB-04 executado.
**Ambiente:** Local
- [x] Clicar em "Remover", confirmar diálogo `window.confirm`
- [x] Item some da lista sem reload
**Resultado:** ✅ OK

### T-WEB-06b — Rejeitar URL inválida (`javascript:`/sem protocolo)
**Pré-condição:** T-WEB-01 executado.
**Ambiente:** Local
- [x] Tentar criar target com URL sem `http://`/`https://`
**Verificação:** erro deve aparecer na tela, nenhuma linha inserida.
**Resultado:** ✅ OK

---
## Fila de Clipes (`clips_queue`)

### T-WEB-07 — Criar item na fila
**Pré-condição:** Ao menos um target cadastrado (T-WEB-04).
**Ambiente:** Local
- [x] Acessar `/fila`, select de canal populado corretamente
- [x] Campo "Início do corte" formata `HH:MM:SS` automaticamente
      conforme digitação (máscara com correção de cursor)
- [x] Submeter formulário e confirmar item na lista com badge "Pendente"
**Resultado:** ✅ OK

### T-WEB-08 — Atualização em tempo real (Realtime)
**Pré-condição:** T-WEB-07 com item criado; tabela `clips_queue` na
publicação `supabase_realtime` (confirmado via SQL Editor).
**Ambiente:** Local
- [x] Com `/fila` aberta, rodar `update clips_queue set status =
      'PROCESSING' where id = '...'` no SQL Editor
- [x] Badge muda de "Pendente" para "Processando" sem reload manual
**Resultado:** ✅ OK

### T-WEB-09 — Remover item da fila
**Pré-condição:** T-WEB-07 executado.
**Ambiente:** Local
- [x] Clicar em "Remover", confirmar diálogo
- [x] Item some da lista sem reload
**Resultado:** ✅ OK

---
## RESULTADO FINAL
| Módulo | Total | ✅ | ❌ | ⚠️ | ⏭️ |
|---|---|---|---|---|---|
| Nichos | 3 | 3 | 0 | 0 | 0 |
| Targets | 4 | 4 | 0 | 0 | 0 |
| Fila de Clipes | 3 | 3 | 0 | 0 | 0 |

**Todos os testes do módulo web validados manualmente em 11/07/2026.**
