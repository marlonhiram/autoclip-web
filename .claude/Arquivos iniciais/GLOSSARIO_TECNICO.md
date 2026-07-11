# GLOSSARIO_TECNICO.md — Guia de Tecnologias e Termos do Projeto

> Última atualização: 02/07/2026
> Objetivo deste arquivo: explicar, em linguagem acessível, cada peça
> técnica usada no AutoClip — o quê é, pra que serve aqui especificamente,
> e por que essa escolha foi feita em vez de outra.

---

## 1. Visão geral da arquitetura (o "mapa" antes dos detalhes)

O projeto tem **duas metades que rodam em lugares diferentes**:

1. **A parte que fica na nuvem** (site/dashboard) — onde você vê a lista
   de clipes, cadastra canais, acompanha status. Fica hospedada num
   servidor de terceiro (Vercel), acessível de qualquer lugar.
2. **A parte que roda no seu computador** (Worker) — o "operário" que
   baixa vídeo, corta, transcreve. Roda local porque usa sua GPU (placa
   de vídeo) pra processar rápido e de graça — GPU na nuvem custa caro.

Essas duas metades **não conversam direto uma com a outra**. Elas se
comunicam através de um banco de dados compartilhado (Supabase), que
funciona como uma "caixa de recados": o site escreve um pedido lá, o
Worker lê esse pedido, processa, e escreve de volta o resultado.

Esse modelo — duas partes independentes se comunicando via banco de
dados/fila, em vez de uma chamando a outra diretamente — se chama
**arquitetura desacoplada** ou **orientada a eventos**. É comum em
sistemas reais de produção porque se uma parte cair, a outra continua
funcionando.

---

## 2. Frontend / Interface Web

### Next.js
Framework (conjunto de ferramentas prontas) construído em cima do React,
usado para criar sites/aplicações web. "Framework" aqui significa que ele
já resolve, de fábrica, problemas comuns de construção de site (rotas de
página, otimização de carregamento, renderização) — sem ele, você teria
que resolver tudo isso na mão.

**Por que aqui:** é o padrão de mercado atual para esse tipo de
aplicação, tem ótima integração com a Vercel (empresa que criou o
Next.js), e é uma habilidade extremamente valorizada em vaga de emprego
— reforça o objetivo de portfólio.

### React
Biblioteca JavaScript para construir interfaces através de
**componentes** — pedaços reutilizáveis de tela (um botão, um card, uma
tabela) que você monta como blocos de Lego, em vez de escrever a página
inteira do zero toda vez.

**Por que aqui:** Next.js é construído sobre React — usar um implica
usar o outro.

### Tailwind CSS
Uma forma de estilizar (cores, espaçamento, tamanho) elementos da
página escrevendo classes utilitárias direto no HTML (ex: `bg-blue-500`
= fundo azul), em vez de escrever arquivos de CSS separados e nomear
cada classe manualmente.

**Por que aqui:** acelera muito o desenvolvimento de interface sozinho,
sem precisar ser especialista em design — você aplica classes prontas
que já seguem boas práticas visuais.

### Vercel
Serviço de hospedagem (o lugar onde o site "mora" na internet, acessível
por uma URL) especializado em projetos Next.js — feito pela mesma
empresa que criou o framework.

**Por que aqui:** tem plano gratuito generoso, deploy automático (você
manda o código pro GitHub e ele publica sozinho), e é o padrão de
mercado para esse stack.

---

## 3. Backend / Banco de Dados

### Supabase
Plataforma que fornece, pronto e hospedado, um banco de dados
PostgreSQL, mais uma camada de funcionalidades em cima dele: autenticação
de usuários, API automática para ler/escrever dados, e comunicação em
tempo real (ver Realtime abaixo). É frequentemente descrito como
alternativa open-source ao Firebase (produto do Google com propósito
parecido).

**Por que aqui:** evita que você precise montar servidor de banco de
dados do zero, tem plano gratuito, e o recurso de Realtime é essencial
pra fila do projeto funcionar sem você precisar ficar "perguntando" o
tempo todo se tem tarefa nova (ver WebSockets abaixo).

### PostgreSQL (Postgres)
O banco de dados relacional (organiza informação em tabelas com linhas e
colunas, como uma planilha avançada, com relações entre tabelas) que o
Supabase usa por baixo dos panos. É um dos bancos de dados mais usados e
confiáveis do mundo, gratuito e open-source.

**Por que aqui:** veio junto com a escolha do Supabase — é o motor de
banco de dados dele.

### Realtime / WebSockets
**WebSocket** é uma tecnologia de comunicação que mantém uma "linha
aberta" entre duas partes (nesse caso, o Worker e o banco de dados), 
permitindo que uma avise a outra **instantaneamente** quando algo muda
— diferente do modelo tradicional onde você teria que ficar perguntando
"tem novidade? tem novidade?" de tempos em tempos (isso se chama
*polling*, e é mais lento e desperdiça recursos).

**Realtime** é o recurso do Supabase que usa WebSockets para avisar o
Worker assim que um novo clipe é cadastrado no banco, sem atraso.

**Por que aqui:** é o que permite ao Worker "saber na hora" que tem
trabalho novo, sem ficar checando o banco a cada poucos segundos
desperdiçando processamento.

### Fila assíncrona (fila de tarefas)
Um padrão de arquitetura onde tarefas (nesse caso, pedidos de clipe) são
colocadas numa "lista de espera" (a tabela `clips_queue`) para serem
processadas uma de cada vez, ou em paralelo, por um processo separado
(o Worker) — em vez de a tarefa ser executada imediatamente na hora que
é pedida.

**Por que aqui:** cortar vídeo demora (não é instantâneo), então não dá
pra fazer o usuário esperar parado na tela enquanto isso acontece. A
fila permite que o pedido seja registrado na hora, e processado em
segundo plano, com o status sendo atualizado conforme avança.

---

## 4. Worker de Processamento (a parte que roda no seu PC)

### Python
Linguagem de programação usada para o script do Worker.

**Por que aqui:** tem as melhores bibliotecas prontas do mercado para
tudo que o Worker precisa fazer — baixar vídeo (yt-dlp), rodar IA de
transcrição (faster-whisper) e orquestrar chamadas de sistema (FFmpeg).
Não é a única linguagem possível, mas é a que tem o ecossistema mais
maduro pra esse tipo de tarefa especificamente.

### yt-dlp
Biblioteca/ferramenta de linha de comando para baixar vídeos de
plataformas como YouTube, Twitch, etc. É a sucessora mais ativa e
atualizada de um projeto mais antigo chamado `youtube-dl`.

**Por que aqui:** permite baixar apenas o **trecho** desejado de um
vídeo/live (usando timestamp de início e duração), em vez de baixar a
transmissão inteira — o que economiza tempo e espaço em disco (é o que
o documento original chama de "download cirúrgico").

### FFmpeg
Ferramenta de linha de comando extremamente usada (praticamente o
padrão da indústria) para processar vídeo e áudio: cortar, converter
formato, mudar proporção de tela, juntar arquivos, adicionar legenda,
etc.

**Por que aqui:** é quem efetivamente faz o corte de proporção 9:16
(formato vertical, usado em Reels/Shorts/TikTok) a partir do vídeo
baixado pelo yt-dlp.

#### h264_amf (codec de vídeo)
Um "codec" é o método usado para comprimir/descomprimir vídeo (sem
compressão, um vídeo ocuparia um espaço absurdo). `h264_amf`
especificamente é uma versão do codec H.264 que roda **usando a GPU AMD**
para fazer esse processamento, em vez de usar o processador (CPU).

**Por que aqui:** processar vídeo pela GPU é ordens de magnitude mais
rápido que pela CPU. Como o projeto já tem uma GPU AMD disponível
(RX 7600), usar `h264_amf` aproveita esse hardware em vez de deixá-lo
ocioso e sobrecarregar o processador.

### faster-whisper
Uma versão otimizada (mais rápida, mais leve) do Whisper, o modelo de
IA da OpenAI para transcrição automática de áudio em texto — inclusive
com suporte a múltiplos idiomas.

**Por que aqui:** gera a legenda automática do clipe (RF06) rodando
**localmente**, sem depender de API paga de transcrição (como a própria
API da OpenAI cobraria por minuto de áudio). Isso é decisão direta de
custo zero.

---

## 5. Storage de Entrega

### Google Drive API v3
Interface de programação (API) que permite que um programa (nesse caso,
o Worker em Python) faça upload, organize em pastas, e gere links de
arquivos no Google Drive de forma automática — sem precisar de alguém
arrastando arquivo manualmente pela interface web do Drive.

**Por que aqui:** ver DEC-004 em `DECISOES.md` — decisão de custo zero
de armazenamento, aproveitando cota já existente do usuário.

### OAuth
Protocolo (conjunto de regras) que permite que um programa acesse uma
conta (Google, nesse caso) **sem que você precise digitar sua senha
diretamente nele**. Em vez disso, você autoriza uma vez, numa tela
oficial do Google, e o programa recebe uma "chave" (token) que representa
essa permissão.

### Refresh Token
Um tipo específico de "chave" gerada pelo OAuth que **não expira
rapidamente** (diferente do "access token" comum, que expira em minutos
ou horas). O programa usa o refresh token para pedir automaticamente
novos access tokens, sem exigir que você autorize de novo toda vez.

**Por que aqui:** o Worker roda sozinho, sem você clicando em nada — ele
precisa conseguir se autenticar no Google de forma automática e
duradoura. O refresh token resolve isso, mas por ser sensível
(quem tiver ele, tem acesso à sua conta), precisa ficar guardado com
cuidado (variável de ambiente, nunca no código/GitHub).

### Upload resumível
Modo de envio de arquivo que permite **retomar de onde parou** em caso
de queda de conexão, em vez de reiniciar o upload do zero. Importante
para arquivos grandes (vídeo) em conexões domésticas, que podem cair no
meio do processo.

---

## 6. Conceitos gerais de arquitetura usados no projeto

### API (Application Programming Interface)
De forma simples: é a "porta de entrada" que um sistema oferece para
outro sistema conversar com ele, seguindo regras definidas. Quando
dizemos "Google Drive API", significa "o jeito programável de falar com
o Google Drive", em vez de usar a interface visual normal.

### Schema (de banco de dados)
A estrutura que define quais tabelas existem, quais colunas cada uma
tem, e que tipo de dado cada coluna aceita (texto, número, data, etc).
É a "planta baixa" do banco de dados.

### Migração (de banco de dados)
Um registro formal e versionado de uma mudança feita no schema (ex:
"adicionei a coluna X na tabela Y"). Serve para que qualquer pessoa
(ou você mesmo, no futuro) consiga recriar o banco do zero, no estado
exato atual, rodando os scripts em ordem — em vez de mudanças ficarem
"perdidas", feitas direto na interface visual sem registro.

### RLS (Row Level Security)
Recurso do PostgreSQL/Supabase que restringe **quem pode ler ou escrever
quais linhas** de uma tabela, baseado em regras (ex: "só o dono do
registro pode editar"). Sem RLS habilitado, qualquer chave de acesso
exposta no frontend consegue ler/escrever a tabela inteira, sem
restrição nenhuma — é um risco de segurança, não só um detalhe técnico.

### Try/Catch
Estrutura de código que permite "tentar" executar algo arriscado (como
uma chamada de API, que pode falhar por conexão, permissão, etc) e, caso
dê erro, **capturar esse erro e tratar** (avisar o usuário, registrar o
que aconteceu), em vez de deixar o programa quebrar silenciosamente sem
ninguém saber o motivo.

### ADR (Architecture Decision Record)
Formato de documentação (é o que usamos em `DECISOES.md`) para registrar
decisões técnicas importantes: qual era o problema, o que foi decidido,
e quais são as consequências (positivas e negativas) dessa escolha. Serve
para que, meses depois, você (ou outra pessoa) entenda **por que** uma
decisão foi tomada, não só o que foi feito.

---

## 7. Termos do domínio do próprio projeto (não são tecnologia, são conceito de negócio)

### Content ID
Sistema automatizado do YouTube que compara vídeos enviados contra um
banco de "impressões digitais" (fingerprints) de conteúdo registrado por
donos de direitos autorais, para detectar reuso não autorizado. Discutido
em detalhe na conversa que gerou `DEC-001`.

### Fingerprint (de conteúdo)
A "impressão digital" única gerada a partir do padrão de áudio/vídeo de
um arquivo, usada por sistemas como o Content ID para identificar
duplicatas, mesmo que o arquivo tenha sido levemente alterado.

### DMCA
Lei americana (Digital Millennium Copyright Act) que estabelece o
processo formal pelo qual um dono de direito autoral pode solicitar a
remoção de conteúdo que viola seus direitos, incluindo o mecanismo de
notificação manual usado por plataformas como YouTube.
