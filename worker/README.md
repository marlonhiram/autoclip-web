# Worker — AutoClip

Módulo de processamento local (download, corte, transcrição e upload dos
clipes). Ainda não iniciado — ver `.claude/PROXIMOS_PASSOS.md` na raiz do
projeto.

## Stack planejada
- Python
- `yt-dlp` (download de VOD)
- FFmpeg (`h264_amf` na máquina final com GPU AMD RX 7600; `libx264` como
  substituto de desenvolvimento em máquinas sem essa GPU — encoder deve
  ser configurável via variável de ambiente, nunca hardcoded)
- `faster-whisper` (transcrição, roda em CPU)
- Google Drive API v3 (upload, OAuth com refresh token)
- `@supabase/supabase-js` equivalente em Python (`supabase-py`) para
  consumir a fila `clips_queue`

## Desenvolvimento

A maior parte da lógica (poll da fila, download, transcrição, upload) não
depende da GPU AMD e pode ser desenvolvida em qualquer máquina. Apenas a
validação final do encoder `h264_amf` exige a máquina de destino
(ver DEC-SYS-005 e CONTEXTO.md §14 na raiz do projeto).
