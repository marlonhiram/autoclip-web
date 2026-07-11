# PRÓXIMOS PASSOS — AutoClip

> Última atualização: 04/07/2026

## EM ANDAMENTO (retomar aqui na próxima sessão)
N/A — módulo web V1 completo (nichos, targets, fila de clipes com
Realtime). Nenhuma feature web em progresso no momento do encerramento.

## PENDÊNCIAS TÉCNICAS (bugs e dúvidas)
- Policies de RLS liberam leitura e escrita irrestrita via chave `anon`
  em todas as tabelas — aceitável apenas enquanto o sistema não for
  exposto publicamente. Revisar antes de qualquer deploy acessível.
- `supabase/migrations/001_initial_schema.sql` referenciado no
  CONTEXTO.md não existe no repositório — schema de `targets` e
  `clips_queue` foi aplicado direto no banco, sem script versionado.
  Recriar o arquivo a partir do schema real antes de qualquer nova
  alteração de schema.

## FUNCIONALIDADES A IMPLEMENTAR
1. Iniciar módulo worker (Python) — nenhum código criado ainda. Depende
   de hardware de destino (PC do irmão do usuário, GPU AMD RX 7600).
   Prioridade atual do projeto.
2. Configurar OAuth do Google Drive e obter refresh token — deve ser
   feito na máquina final do Worker.
3. Rotina de retomada de tarefas travadas e garbage collector de
   arquivos temporários (Worker, fase posterior).
4. (Opcional, módulo web) Redesenho visual do dashboard — rascunho de
   prompt de contexto já preparado em
   `autoclip-web/.claude/RASCUNHO_PROMPT_UI.md`, pronto para uso.

## ANTES DO LANÇAMENTO (checklist obrigatório)
N/A — projeto não tem lançamento público previsto no escopo atual
(ver DEC-SYS-003). Reavaliar todos os itens deste checklist caso essa
decisão seja revertida:
- Variáveis de ambiente em produção: N/A
- Políticas de segurança (RLS restritivo): pendente, ver acima
- Rate limiting: N/A
- Logs e monitoramento de erros: N/A
- Backups: N/A
- Domínio e SSL: N/A
- Emails transacionais: N/A
