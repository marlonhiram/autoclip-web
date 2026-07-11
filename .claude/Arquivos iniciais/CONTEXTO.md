# CONTEXTO.md — AutoClip (Sistema de Cortes Automatizados)

> Última atualização: 02/07/2026

## 1. O que é o projeto

Sistema pessoal para identificação, download cirúrgico, edição e formatação
automática de clipes de transmissões ao vivo (Twitch, YouTube, Kick, etc.),
com arquitetura híbrida: interface web em nuvem + processamento de vídeo
local em hardware dedicado (GPU AMD RX 7600).

## 2. Objetivo real do projeto (não confundir com objetivo de negócio)

- **Prioridade 1:** aprendizado técnico — arquitetura distribuída, fila
  assíncrona, processamento de vídeo com GPU, IA local de transcrição.
- **Prioridade 2:** portfólio (GitHub) demonstrando engenharia de sistema
  real, não tutorial.
- **Fora de escopo por ora:** monetização, venda como SaaS, publicação
  pública de conteúdo. Pode vir a existir no futuro, mas não é decisão
  tomada — ver DEC-001 e DEC-001b em DECISOES.md.

## 3. Escopo de uso atual

- **Uso estritamente pessoal.** Nenhum clipe gerado é publicado
  publicamente até decisão explícita em contrário (ver DEC-001).
- Nicho é agnóstico — sistema deve suportar qualquer nicho/streamer,
  sem restrição de cadastro por nível de risco (ver DEC-001b). A decisão
  de o que publicar é sempre humana, nunca automática.

## 4. Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend / Interface Web | Next.js, React, Tailwind CSS (Vercel) |
| Backend / Banco | Supabase (PostgreSQL) + Realtime WebSockets |
| Worker de processamento (local) | Python (orquestração), yt-dlp (download), FFmpeg com `h264_amf` (render via GPU AMD), faster-whisper (transcrição local) |
| Storage de entrega | Google Drive API v3, OAuth com refresh token — ver DEC-004 |

## 5. Arquitetura funcional (fluxo atual — v1, identificação manual)

1. Usuário (admin, único usuário do sistema por ora) autentica na
   interface Next.js e informa: URL do streamer/canal, timestamp de
   início, duração do corte.
2. Requisição insere um registro em `Clips_Queue` no Supabase, status
   `PENDING`, `source_type = 'manual'`.
3. Worker local, monitorando via WebSockets, capta o evento e muda
   status para `PROCESSING`.
4. yt-dlp baixa o trecho definido pelo timestamp.
5. FFmpeg processa corte vertical 9:16, renderização acelerada via AMF.
6. faster-whisper transcreve o áudio e gera legenda.
7. Arquivo final é movido para storage de entrega, status vira `DONE`.
8. Dashboard reflete atualização em tempo real.

## 6. Documentação detalhada do schema

> Para explicação dos termos técnicos usados aqui (UUID, FK, RLS, etc),
> ver `GLOSSARIO_TECNICO.md`.

### Tabela `niches`

Armazena as categorias/nichos de conteúdo cadastrados (ex: "Finanças",
"GTA 6", "Podcasts"). É a entidade "raiz" — todo `target` pertence a um
nicho.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único do nicho, gerado automaticamente. |
| `name` | TEXT | Nome do nicho, exibido na interface (ex: "Finanças"). |
| `created_at` | TIMESTAMPTZ | Data/hora de criação do registro, preenchida automaticamente. |

---

### Tabela `targets`

Armazena os canais/streamers monitorados. Cada target pertence a um
nicho, e carrega as informações de risco de copyright discutidas em
`DEC-001b`.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único do target. |
| `niche_id` | UUID (FK) | Referência ao nicho ao qual esse canal pertence (chave estrangeira para `niches.id`). |
| `name` | TEXT | Nome do canal/streamer, exibido na interface. |
| `url` | TEXT | Endereço do canal na plataforma de origem (ex: link da Twitch). |
| `platform` | TEXT | Nome da plataforma de origem (ex: "Twitch", "YouTube", "Kick"). |
| `risk_level` | TEXT (enum) | Classificação de risco de enforcement de copyright: `low`, `medium` ou `high`. Ver critério de classificação em `DECISOES.md`, DEC-001b. Campo informativo — não bloqueia cadastro. |
| `authorization_status` | TEXT (enum) | Estado da autorização de uso do conteúdo desse canal: `not_requested` (padrão, nada foi pedido ainda), `requested` (pedido enviado, aguardando resposta), `authorized` (canal autorizou o uso), `denied` (canal negou). |
| `authorization_note` | TEXT (opcional) | Campo de texto livre para registrar evidência da autorização (ex: "print da DM de 02/07, autorizado via comentário do vídeo X"). |
| `created_at` | TIMESTAMPTZ | Data/hora de criação do registro. |

---

### Tabela `clips_queue`

O coração operacional do sistema — é a fila assíncrona (ver
`GLOSSARIO_TECNICO.md`) que conecta o pedido feito na interface web ao
processamento executado pelo Worker local.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único do pedido de clipe. |
| `target_id` | UUID (FK) | Referência ao canal de origem do clipe (chave estrangeira para `targets.id`). |
| `source_url` | TEXT | URL do vídeo/live de origem, de onde o trecho será baixado. |
| `start_time` | TEXT | Timestamp de início do trecho a ser cortado (ex: "01:23:45"). Preenchido manualmente na v1 — ver RF04 e DEC-002. |
| `duration` | INT | Duração do corte, em segundos. |
| `status` | TEXT (enum) | Estado atual do processamento: `PENDING` (aguardando o Worker pegar a tarefa), `PROCESSING` (Worker está processando agora), `DONE` (concluído com sucesso), `FAILED` (falhou — ver `error_message`). |
| `source_type` | TEXT (enum) | Como o timestamp foi definido: `manual` (usuário digitou, caso da v1) ou `auto` (identificado automaticamente por um módulo futuro — ver RF08/DEC-002). Existe desde a v1 mesmo sem uso de `auto` ainda, para não exigir migração de schema quando esse módulo for construído. |
| `local_path` | TEXT (opcional) | Caminho temporário do arquivo bruto no disco do Worker, antes do upload para o Drive. Limpo pelo garbage collector após o upload ser concluído (ver Fase 3 em `PROXIMOS_PASSOS.md`). |
| `storage_provider` | TEXT (enum) | Onde o arquivo final está armazenado: `google_drive` (padrão) ou `local` (caso de fallback/depuração). Ver DEC-004. |
| `external_file_id` | TEXT (opcional) | ID do arquivo no Google Drive, usado para referenciar/gerenciar o arquivo via API. Preenchido só após upload concluído. |
| `external_url` | TEXT (opcional) | Link de visualização do arquivo no Google Drive, usado pelo dashboard para o usuário abrir/baixar o clipe pronto. |
| `error_message` | TEXT (opcional) | Mensagem de erro registrada caso `status` seja `FAILED` — obrigatório por regra de qualidade de código (proibido falhar silenciosamente). |
| `created_at` | TIMESTAMPTZ | Data/hora de criação do pedido. |

---

## 7. Requisitos funcionais (RF) — estado atual

| RF | Descrição | Status |
|---|---|---|
| RF01 | CRUD de Nichos | Planejado |
| RF02 | Vincular Targets (streamers/canais) a nichos | Planejado |
| RF03 | Dashboard com fila de status (Aguardando/Processando/Concluído/Falha) | Planejado |
| RF04 | Download cirúrgico via timestamp manual | Planejado — v1 |
| RF05 | Corte 9:16 dinamicamente centralizado | Planejado |
| RF06 | Transcrição local com legenda | Planejado |
| RF07 | Entrega do arquivo + status no dashboard | Planejado |
| RF08 *(novo)* | Identificação automática de momento viral | **Futuro — pós v1, ver DEC-002** |

## 8. Requisitos não funcionais (RNF) — com correção de expectativa

- **RNF01:** renderização via GPU AMD local — válido, sem ressalvas.
- **RNF02 (revisado):** Web e Worker são logicamente desacoplados
  (falha do worker não derruba a interface), **mas o sistema depende
  fisicamente do hardware local estar ligado** para processar a fila.
  Não é alta disponibilidade real — é aceitável para uso pessoal.
- **RNF03 (revisado):** schema permite adicionar nichos/targets sem
  deploy, mas processamento é sequencial em hardware único — não há
  paralelismo real. Aceitável no volume de uso pessoal.

## 9. Pendências de decisão em aberto

- Nenhuma decisão de autenticação/RLS foi implementada ainda no Supabase
  — ver PROXIMOS_PASSOS.md.
- Cota de armazenamento do Google Drive não tem alerta de esgotamento
  desenhado ainda (DEC-004) — monitorar manualmente por ora.

## 10. Referências

Ver `DECISOES.md` para todas as decisões técnicas registradas (ADRs),
`PROXIMOS_PASSOS.md` para o backlog priorizado, e `GLOSSARIO_TECNICO.md`
para explicação de cada tecnologia, biblioteca e termo técnico usado
neste documento.
