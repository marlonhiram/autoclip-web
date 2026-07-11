# PRÓXIMOS PASSOS — Web (Frontend)

> Última atualização: 04/07/2026

## EM ANDAMENTO (retomar aqui na próxima sessão)
N/A — nichos, targets e fila de clipes (com Realtime) estão completos
(criar/listar/remover). Nenhuma tela pela metade no momento.

## PENDÊNCIAS TÉCNICAS (bugs e dúvidas)
- T-WEB-03 (validação de nome vazio na camada de serviço, nichos) não
  foi exercitada manualmente — apenas protegida via `disabled` no botão.
- Fluxo de `clips_queue` + Realtime foi validado apenas parcialmente:
  formulário renderiza e o select de canal popula corretamente, mas a
  criação de um item e a atualização de `status` via SQL Editor (para
  confirmar a atualização em tempo real sem reload) ainda não foram
  confirmadas ponta a ponta.
- Remoção de target e de item da fila (com confirmação via
  `window.confirm`) ainda não foi testada manualmente.

## FUNCIONALIDADES A IMPLEMENTAR
1. Edição (update) de `targets` — hoje só criar/listar/remover.
2. Edição (update) de itens de `clips_queue` — hoje só criar/remover;
   também não há tela para o Worker atualizar `status` (isso é feito
   direto no banco pelo Worker, não pela UI).
3. Redesenho visual do dashboard (paleta, hierarquia, cards) — rascunho
   de prompt já preparado em `.claude/RASCUNHO_PROMPT_UI.md`, pronto
   para uso quando o usuário decidir seguir por essa frente.

## ANTES DO LANÇAMENTO (checklist obrigatório)
N/A — módulo sem lançamento público previsto (ver DEC-SYS-003 em
DECISOES.md).
