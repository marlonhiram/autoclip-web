# DECISOES.md — Registro de Decisões Técnicas (ADR)

> Última atualização: 02/07/2026

---

## [DEC-001] — Estratégia de mitigação de risco de copyright

**Contexto:**
O sistema realiza download e reprocessamento de trechos de vídeo de
terceiros (streams). Uso inicial é pessoal, sem redistribuição pública.
Existe intenção futura de eventual expansão de escopo, ainda não decidida.

**Decisão:**
1. Nicho não é restringido por design — sistema é agnóstico a nicho.
   Classificação de risco (ver DEC-001b) é informativa, não bloqueante.
2. Watermark/reenquadramento/legenda são tratados como melhoria de
   produto, **nunca** como mitigação de risco legal — Content ID não é
   afetado por essas alterações.
3. Técnicas de evasão de detecção (mascarar/trocar áudio para burlar
   Content ID) foram explicitamente descartadas como estratégia do
   projeto — evadem o alarme, não resolvem a questão de fundo de
   redistribuição não autorizada.
4. Uso permanece estritamente pessoal (sem upload público) até decisão
   explícita em contrário, documentada em novo ADR.
5. Caso decisão futura seja publicar: exigir (a) permissão explícita
   do canal de origem OU (b) formato com transformação real
   (comentário/análise agregando substância), antes do primeiro upload.

**Consequências:**
- Reduz drasticamente risco de strike/Content ID desde a concepção.
- Cria dependência de decisão humana explícita antes de qualquer
  exposição pública — não há "modo automático" de publicação.

---

## [DEC-001b] — Complemento: rastreio de risco por Target

**Contexto:**
DEC-001 definiu estratégia geral de mitigação, mas o sistema precisa
tratar nichos e canais de forma agnóstica (qualquer nicho viralizado
pode ser adicionado), sem perder rastreabilidade de risco por fonte.

**Decisão:**
Tabela `Targets` ganha os campos `risk_level` (`low`/`medium`/`high`) e
`authorization_status` (`not_requested`/`requested`/`authorized`/`denied`),
mais `authorization_note` para registro livre (print de DM, data de
contato, etc). O sistema não impõe restrição de cadastro por nível de
risco — a decisão de o que publicar continua sendo humana e explícita.

**Consequências:**
- Custo de implementação mínimo (3 colunas).
- Nenhum nicho fica bloqueado por design.
- Cria rastro auditável: no dia em que decidir publicar algo, há
  histórico de se autorização foi buscada/obtida por aquele Target.

---

## [DEC-002] — Priorização de identificação de clipes: manual antes de automática

**Contexto:**
Visão do projeto prevê identificação automática de momentos virais
(RF08), mas construir isso junto com a infraestrutura base mistura
risco de engenharia (conhecido) com risco de pesquisa/IA (incerto),
comprometendo a previsibilidade do ciclo de desenvolvimento.

**Decisão:**
V1 implementa apenas corte manual por timestamp (RF04). Identificação
automática fica registrada como evolução planejada (RF08), a ser
desenvolvida como módulo isolado, plugável na mesma fila (`Clips_Queue`),
após o pipeline base estar validado fim-a-fim.

**Consequências:**
- V1 entrega mais rápido e testável.
- Quando o módulo automático for desenvolvido, qualquer falha é isolável
  a ele, não ao sistema todo.
- Exige que `Clips_Queue` já preveja campo `source_type`
  (`manual`/`auto`) desde a v1, para não quebrar compatibilidade quando
  o módulo automático chegar.

---

## [DEC-003] — Adiamento de decisão de monetização

**Contexto:**
Discussão sobre transformar o projeto em fonte de renda foi levantada,
mas concluiu-se que o objetivo real e imediato do projeto é aprendizado
técnico e portfólio, não retorno financeiro.

**Decisão:**
O projeto é tratado exclusivamente como uso pessoal / portfólio /
aprendizado nesta fase. Qualquer decisão de monetização ou publicação
é tratada como fora de escopo até haver ADR explícito abrindo essa
frente — o que implicaria revisitar DEC-001 (autorização, formato de
transformação) e desenhar infraestrutura de entrega/billing ainda
inexistente.

**Consequências:**
- Simplifica escopo técnico atual (sem necessidade de billing, multi-
  tenant, storage externo de distribuição).
- Evita otimização prematura para um modelo de negócio ainda não
  validado.

---

## [DEC-004] — Storage de entrega: Google Drive via OAuth com refresh token

**Contexto:**
Seção 6 do documento original descrevia o destino do arquivo processado
apenas como "diretório de entregas compartilhadas", sem definição
técnica. Armazenar vídeo binário no Supabase tem custo elevado e não é
necessário para uso pessoal. Prioridade explícita do projeto é custo
zero de operação e aprendizado técnico (Drive API é valor agregado de
portfólio).

**Decisão:**
1. Arquivo final renderizado é enviado ao Google Drive via API v3,
   usando OAuth com refresh token da conta pessoal do usuário (não
   Service Account) — menor complexidade de setup, adequado para
   usuário único.
2. Supabase armazena apenas metadado do arquivo (`external_file_id`,
   `external_url`, `storage_provider`), nunca o binário.
3. Upload usa modo resumível da Drive API, por se tratar de arquivo de
   vídeo (maior e mais sujeito a falha de conexão que upload simples).
4. Refresh token é mantido em variável de ambiente na máquina do Worker,
   nunca commitado no repositório.
5. Estrutura de pastas no Drive organizada por nicho/target, para
   navegação manual.

**Consequências:**
- Custo de storage zero (usa cota já existente do Google One do
  usuário) — mas introduz dependência de cota disponível, sem alerta
  automático de esgotamento ainda desenhado.
- Introduz novo gargalo potencial: velocidade de upload residencial
  (tipicamente assimétrica no Brasil) pode ser mais lenta que o próprio
  processamento de vídeo — a medir na prática antes de considerar
  resolvido.
- Exige tratamento de erro dedicado para falha de upload (token expirado,
  cota excedida, conexão perdida) — não pode reaproveitar apenas o
  try/catch genérico do restante do pipeline, precisa de mensagens de
  erro específicas para cada causa.
- Adiciona Drive API ao escopo de aprendizado do projeto (OAuth flow,
  refresh token, upload resumível).
