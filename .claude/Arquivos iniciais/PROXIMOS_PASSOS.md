# PROXIMOS_PASSOS.md — Backlog Priorizado

> Última atualização: 02/07/2026
> Convenção: cada item marcado com o RF/RNF/DEC relacionado, quando aplicável.

## Fase 0 — Fundação de dados (fazer antes de qualquer linha de UI)

- [ ] Criar projeto Supabase.
- [ ] Criar tabela `niches` (RF01).
  ```sql
  CREATE TABLE niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- [ ] Criar tabela `targets` já com os campos de risco (RF02, DEC-001b).
  ```sql
  CREATE TABLE targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche_id UUID NOT NULL REFERENCES niches(id),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'medium'
      CHECK (risk_level IN ('low','medium','high')),
    authorization_status TEXT NOT NULL DEFAULT 'not_requested'
      CHECK (authorization_status IN ('not_requested','requested','authorized','denied')),
    authorization_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- [ ] Criar tabela `clips_queue` já com `source_type` (RF04, DEC-002) e
      campos de storage externo (DEC-004).
  ```sql
  CREATE TABLE clips_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES targets(id),
    source_url TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (status IN ('PENDING','PROCESSING','DONE','FAILED')),
    source_type TEXT NOT NULL DEFAULT 'manual'
      CHECK (source_type IN ('manual','auto')),
    local_path TEXT,
    storage_provider TEXT NOT NULL DEFAULT 'google_drive'
      CHECK (storage_provider IN ('google_drive','local')),
    external_file_id TEXT,
    external_url TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- [ ] Habilitar Row Level Security (RLS) nas três tabelas — pendência de
      segurança sinalizada em CONTEXTO.md, item 8. Sem isso, qualquer
      chave anon exposta no frontend lê/escreve a tabela toda.
- [ ] Habilitar Realtime na tabela `clips_queue`.

## Fase 1 — Worker local (esqueleto)

- [ ] Script Python de polling/subscribe via Supabase Realtime, captando
      novos registros `PENDING` em `clips_queue`.
- [ ] Integração yt-dlp: download do trecho via `start_time` + `duration`.
- [ ] Integração FFmpeg com `h264_amf`: corte vertical 9:16 (RF05).
- [ ] Integração faster-whisper: transcrição + geração de legenda (RF06).
- [ ] Try/catch em cada etapa do pipeline, com atualização de
      `status = 'FAILED'` e `error_message` preenchido em caso de erro —
      não falhar silenciosamente (regra de qualidade de código).
- [ ] Configurar projeto no Google Cloud Console + credenciais OAuth
      (client_id/client_secret) para acesso à Drive API (DEC-004).
- [ ] Gerar refresh token via fluxo OAuth (uma vez, manualmente) e
      armazenar em variável de ambiente do Worker — nunca no repositório.
- [ ] Implementar upload resumível para o Drive, com criação automática
      de subpasta por nicho/target.
- [ ] Tratamento de erro específico para falha de upload (token expirado,
      cota excedida, conexão perdida) — distinto do try/catch genérico
      das outras etapas (DEC-004).
- [ ] Ao concluir upload, gravar `external_file_id`, `external_url` e
      `storage_provider` em `clips_queue`, e só então marcar `DONE`.
- [ ] Medir tempo real de upload em teste prático — validar se vira
      gargalo da fila antes de considerar a etapa resolvida (risco
      sinalizado em DEC-004).

## Fase 2 — Interface Web (dashboard)

- [ ] Tela de CRUD de Nichos (RF01).
- [ ] Tela de CRUD de Targets, incluindo campos de risco/autorização
      (RF02, DEC-001b).
- [ ] Dashboard de fila com status em tempo real via Supabase Realtime
      (RF03).
- [ ] Formulário de criação de clipe (URL + timestamp + duração) → insere
      em `clips_queue` (RF04).
- [ ] Feedback visual de erro em toda chamada de API (regra de qualidade
      de código — proibido falha silenciosa).

## Fase 3 — Resiliência

- [ ] Rotina de retomada: ao Worker subir, fazer polling de tarefas
      travadas em `PROCESSING` há mais de X minutos (risco de "queda de
      força do Worker" mapeado no doc original).
- [ ] Garbage collector de arquivos `.mp4` brutos após render concluído
      (risco de sobrecarga de armazenamento mapeado no doc original).

## Fase 4 — Evolução (pós-v1, não iniciar antes da Fase 0-3 estarem validadas)

- [ ] RF08 — módulo de identificação automática de momento viral
      (DEC-002). Ainda sem decisão de abordagem (heurística de chat vs.
      pico de áudio vs. outro método) — exige nova sessão de análise
      técnica antes de iniciar.
- [ ] Caso decisão de publicação pública seja tomada no futuro: revisitar
      DEC-001 e desenhar storage de distribuição + billing (hoje fora de
      escopo, ver DEC-003).

## Não iniciar sem decisão prévia registrada em DECISOES.md

- Qualquer publicação pública de conteúdo.
- Qualquer forma de monetização.
- Qualquer alteração de `risk_level` que vire regra de bloqueio (hoje é
  só informativo, por design — DEC-001b).
