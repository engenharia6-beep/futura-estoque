# Controle de Estoque — Futura

PWA mobile-first para controle de insumos e produtos acabados.
Backend: Google Apps Script | Frontend: GitHub Pages

**URL:** `https://engenharia6-beep.github.io/futura-estoque/`
**GAS Script ID:** `1z_ahZGWewRAuxHVbPLgwfqbhBegzhrQbrvsVgdsRB795LVoSrxrPO976`
**Deployment ID:** `AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg`
**GAS ativo: @63 | Frontend: `af93151`+**

> O número de versão exibido no rodapé do app (`APP_VERSION` em `index.html`) é
> o hash do **último commit do frontend antes dele** — não o commit que fez o
> próprio bump. Ao publicar mudanças no frontend, atualize essa constante
> (e a linha acima) para o hash do commit que acabou de subir.

---

### 🚨 Regra obrigatória antes de QUALQUER deploy do backend

O sistema está **em produção**. Antes de rodar `clasp push` + `clasp deploy`,
SEMPRE confirme que a cópia local que vai ser publicada bate com o que está
**realmente ativo no Apps Script agora** — não confie cegamente em nenhuma
cópia local (nem `futura-estoque-gas`, nem `Codigo.txt` deste repo), porque
elas podem estar desatualizadas em relação ao deploy vigente.

```bash
# Puxa o conteúdo AO VIVO para uma pasta separada e compara antes de mexer
cd "C:\Users\Delmer Pereira\Documents\GitHub\futura-estoque-gas"
clasp pull   # traz o HEAD atual do Apps Script para cá
git diff     # (se este diretório virar um repo git — ver "Assuntos em aberto")
# ou, sem git: diff manual contra a cópia que você está prestes a editar/publicar
```

E depois de publicar, **sempre valide de volta**: `clasp pull` numa pasta
limpa e `diff` contra o que foi enviado, pra confirmar que o push chegou
inteiro e sem regressão — não basta o comando "ter dado certo".

**Por que essa regra existe:** em 2026-08-04 a `@25` foi publicada usando
`futura-estoque-gas` como base sem essa checagem, e essa cópia estava
desatualizada — removeu sem querer 3 proteções que já estavam em produção
desde @20-@24 (bloqueio de pagamento duplicado de OP e fim da baixa dupla de
insumo no Triangular). Corrigido na `@26` no mesmo dia. Ver histórico de
deploys no fim deste arquivo.

---

## Estado atual — 2026-09-29

### ✅ Funcionando

**🔄 onEdit — Cadastro_Resumo/Cadastro_PA_Resumo sincronizam sozinhas em edição manual (2026-10-01, deploy @63)**
- Reportado: produto novo cadastrado direto na planilha não aparecia no
  Resumo. Depois, usuário esclareceu que a correção de **quantidade** não
  é feita editando `Cadastro` — é feita adicionando/editando/excluindo uma
  linha direto em `Movimento`/`Movimento_PA`, e a fórmula `ESTOQUE_ATUAL`
  do Cadastro reage sozinha a isso. O Resumo só era atualizado quando a
  gravação passava pelo app (`gravarMovimento` etc.); nenhuma dessas duas
  formas de edição manual tinha como avisar o app de que algo mudou
- Fix: gatilho simples `onEdit(e)` (reconhecido automaticamente pelo Apps
  Script, sem instalação manual) vigia **duas situações**: (1) edição humana
  em `Cadastro`/`Cadastro_PA` — filtra por coluna, só reage se for uma das
  ~19/13 que alimentam o Resumo (ex: editar `ZPL`, `QRCODE`, `SUFRAMA_NCM`
  não dispara nada); (2) edição humana em `Movimento`/`Movimento_PA` — filtra
  pelas 3 colunas que podem mudar o saldo calculado (`Codigo`, `Tipo`,
  `Qtde`; editar `OBS`/`Usuario`/`IP` não dispara nada). Cobre cadastrar item
  novo, corrigir um valor no Cadastro, e adicionar/editar uma linha de
  movimento direto na planilha
- De brinde: como o `onEdit` já sabe a linha exata editada, não precisa mais
  escanear a aba inteira pra achar o código — `_sincronizarResumoInsumo`/`PA`
  ganharam um parâmetro opcional `linhaConhecida` pra esse caso, e o caminho
  "sem linha conhecida" (usado pelas outras ~10 chamadas, ex: `gravarMovimento`)
  também passou a buscar só a coluna CÓDIGO em vez da aba inteira com fórmula
  — mesma técnica da Fase 1c, agora aplicada aqui também
- **Limitação conhecida**: não cobre exclusão de linha em nenhuma das duas
  abas (apagar uma linha inteira — de `Cadastro`/`PA` ou de `Movimento`/`PA`
  — não dá informação confiável pro `onEdit` saber qual código sumiu, já que
  o dado não existe mais quando o evento dispara). Rede de segurança
  continua sendo `popularResumoInsumo`/`popularResumoPA` periódico — hoje
  isso ainda é manual (rota HTTP), não tem gatilho automático instalado;
  considerar automatizar (ex: diário) se exclusão de linha for algo
  frequente na prática
- Gatilho simples roda só com edição feita por humano na UI — edição
  programática via script (ex: `mudarEndereco` escrevendo o endereço) não
  dispara o `onEdit`, então não há dupla-sincronização

**⚡ Fase 1b de performance — caminho de GRAVAÇÃO também lendo do Resumo (2026-09-29, deploy @59)**
- Reportado: tela de Ajuste de Inventário (Insumo) levou 65s pra carregar o
  saldo ao abrir + 60s pra gravar ao confirmar. Usuário confirmou que o
  mesmo acontece em "todas as funções (troca de insumo, entrada, saída,
  inventário, etc)"
- Causa raiz: a Fase 1 só acelerou as telas de **listagem**
  (`listarCadastro`/`listarCadastroPA`). O caminho de **gravação/validação**
  continuava lendo `Cadastro`/`Cadastro_PA` (com fórmula) inteiros a cada
  chamada — `_mapaCadastroInfo()` (usada em 8 pontos: `gravarMovimento`,
  `gravarMovimentoPA`, `gravarMovimentosEmLote(PA)`, `transferirCodigo(PA)`,
  `pagarOPTriangularPA`, `gravarBaixaInsumos`) e as 4 funções de saldo
  (`obterSaldo`, `obterSaldoPA`, `obterEnderecosSaldo`,
  `obterEnderecosSaldoPA`, usadas pela tela de Ajuste pra revalidar o saldo
  ao abrir). Um único ciclo de Ajuste chegava a ler o Cadastro inteiro 3x
  (abrir tela + validar gravação + sincronizar resumo)
- Fix: essas 5 funções passam a ler `Cadastro_Resumo`/`Cadastro_PA_Resumo`
  em vez do original — mesma técnica da Fase 1, aplicada agora no caminho
  de escrita. `_mapaCadastroInfo` resolve a aba resumo internamente, então
  os 8 pontos que a chamam não precisaram mudar
- Pré-requisito de correção fechado junto: como a validação de "saldo
  insuficiente" passa a confiar no Resumo, os caminhos que ainda não
  sincronizavam (e por isso podiam deixar o Resumo desatualizado) ganharam
  a chamada de sincronização: `gravarMovimentosEmLote`/`PA` (BOM, baixa de
  insumos), `transferirCodigo`/`PA`, `pagarOPTriangularPA`,
  `gravarBaixaInsumos`, `mudarEndereco`/`PA`
- A sincronização em si (`_sincronizarResumoInsumo`/`PA`) continua lendo o
  Cadastro original inteiro (inevitável — precisa do valor já calculado
  pela fórmula) — o ganho é ter só **essa 1 leitura** por gravação, em vez
  de 2–3 redundantes
- Backup: tag git `backup-pre-fase1b-gravacao` (aponta pro commit `4c31b57`
  / deploy `@58`), com passo a passo de reversão na mensagem da tag
- **Fase 1c (2026-09-29, deploy @60)**: usuário confirmou que "Alterar
  Endereço" também estava lento (~30s só pra achar o código e gravar).
  `mudarEndereco`/`mudarEnderecoPA` escrevem na aba original (dona do
  campo Endereço, não dá pra apontar pro Resumo), mas liam a aba inteira
  com `getDataRange()` só pra achar a linha do código. Passaram a ler só a
  coluna CÓDIGO (texto puro, sem fórmula) via `getRange` — evita puxar as
  colunas com fórmula (`ESTOQUE_ATUAL`, `XLOOKUP`, etc.) só pra descobrir o
  número da linha
- Teste de latência automatizado (scratchpad) não deu números confiáveis
  desta vez — a rede deste ambiente de execução teve respostas 404/lentas
  intermitentes ao chamar o endpoint logo após o deploy (mesmo padrão de
  flakiness pós-deploy já visto antes, não é bug do código). Validação real
  fica por conta do usuário testando a tela de Ajuste em produção

**⚡ Fase 1 de performance — abas resumo Cadastro_Resumo/Cadastro_PA_Resumo (2026-09-29)**
- Contexto: login/dashboard/PA/Insumos estavam lentos (até 21s no pior caso)
  porque `Cadastro`/`Cadastro_PA` têm quase toda coluna com fórmula
  (`ESTOQUE_ATUAL`, `XLOOKUP` cruzando abas, etc.) — mesmo uma leitura
  "só de valores" (`getValues()`) precisa que o Sheets já tenha calculado
  tudo antes de devolver, então "só ler" nunca foi barato nessa planilha
- Criadas 2 abas novas **sem fórmula nenhuma** (só valor fixo):
  `Cadastro_Resumo` (19 campos) e `Cadastro_PA_Resumo` (13 campos) — os
  mesmos campos que `listarCadastro`/`listarCadastroPA` já devolviam antes,
  então o frontend não mudou nada
- `listarCadastro`/`listarCadastroPA` passam a ler dessas abas resumo em
  vez do Cadastro original. Medido sem cache, filtro "ATIVO" (o padrão do
  app): Insumos 12,7s → 6,8s (1119 itens), PA 4,7s → 3,0s (576 itens) —
  melhora real, mas **não elimina** a lentidão sozinha, porque parte do
  custo é só *abrir* a planilha (afeta até o login, que nem toca
  Cadastro/Cadastro_PA) — ver "Assuntos em aberto"
- `gravarMovimento`/`gravarMovimentoPA` (Entrada/Saída/Ajuste manual —
  os fluxos mais usados) passam a sincronizar a linha do resumo
  correspondente logo depois de gravar o movimento, lendo o valor já
  calculado do Cadastro/Cadastro_PA (1 linha só, bem mais barato que ler
  tudo) e escrevendo como valor fixo no resumo
- **Cobertura ainda parcial** — baixa em lote via BOM
  (`gravarMovimentosEmLote(PA)`, `gravarBaixaInsumos`), Triangular
  (`pagarOPTriangularPA`), Transferir Código
  (`transferirCodigo`/`transferirCodigoPA`) e edição direta de cadastro
  (`salvarItemCadastro(PA)`, `mudarEndereco(PA)`) **ainda não**
  sincronizam o resumo — um movimento gravado por esses caminhos deixa o
  resumo desatualizado até a próxima chamada de `popularResumoInsumo`/
  `popularResumoPA` (população completa, ação administrativa, não
  automática). Entra numa passada seguinte.
- 2 bugs achados e corrigidos durante a implementação: (1) comparação de
  nome de coluna sensível a maiúscula/minúscula deixava o campo `id`
  sempre vazio; (2) Sheets auto-convertia string numérica (ex: `obs` com
  valor tipo `"0.00499"`) pra número errado, porque no locale pt-BR desta
  planilha `.` é separador de milhar — corrigido formatando as colunas de
  texto do resumo como "Plain text" antes de escrever
- Testado: 1360 Insumos e 884 PA comparados campo a campo contra o
  resultado anterior (via fórmula) — 0 divergências, 0 faltando
- Backup do estado 100% operacional anterior a essa mudança: tag git
  `backup-pre-fase1-resumo` (aponta pro commit `4ae83e7` / deploy `@53`),
  com o passo a passo de reversão de backend e frontend na mensagem da tag

**🧹 Dashboard simplificado — sem resumo, só o botão Atualizar (2026-09-14)**
- Os 4 cards do Dashboard (Insumos ativos, PAs ativos, Estoque crítico, OPs
  abertas) não tinham utilidade no dia a dia — o único uso real dessa tela
  era o botão "Atualizar", que limpa `insumoCache`/`paCache` em memória
  pra forçar recarregar depois de uma movimentação (que não atualiza esse
  cache sozinha)
- Removidos: os 4 cards, o título "Resumo", `carregarDashboard()` (nada
  mais pra exibir), a chamada em `navegar()`, e o CSS
  `.dashboard-grid`/`.dash-card*` que ficou sem uso
- Mantido: o botão "↻ Atualizar", com o mesmo efeito de sempre
- Corrigido de quebra durante essa limpeza: `carregarOPS()` escrevia
  direto em `document.getElementById('dash-ops').textContent` sem checar
  null — com o card removido isso ia estourar erro toda vez que a lista de
  OPs carregasse (inclusive no auto-refresh de 5 min). Essa contagem só
  alimentava o card removido, então a linha saiu junto
- `obterResumoDashboard` (backend) não foi tocada — fica sem uso mas não
  compromete nada, evita precisar de um novo deploy do GAS só por isso
- Testado com Playwright: Dashboard renderiza só nome+versão+botão;
  Atualizar zera os 2 caches; navegar pra OPs depois disso renderiza a
  lista normal, sem erros de console

**🐛 Fix: PA validava saldo contra a fonte errada — causa raiz real (2026-08-12, deploy @43)**
- Reportado 3x com o mesmo item (`MCIP-515`): tela sempre mostrava "Saldo
  atual: 322", mas `gravarMovimentoPA` recusava a saída de 157 com
  "Disponível: 102" — número que nunca batia com o que a tela mostrava
- **Rodadas 1 e 2** trataram sintomas no frontend (saldo do cache não
  atualizado após o fetch fresco do detalhe; depois, corrida entre o
  clique em "Inventário" e esse fetch) — melhorias legítimas (o app agora
  sempre mostra o `ESTOQUE_ATUAL` mais recente possível), mas **não eram a
  causa do erro reportado**, por isso ele continuou voltando
- **Causa raiz real**, achada com um diagnóstico temporário direto na
  planilha: existem **duas fontes de saldo PA diferentes e dessincronizadas**.
  `ESTOQUE_ATUAL` (Cadastro_PA) é uma fórmula própria (`=IF(...;V-W;XLOOKUP(...))`)
  usada por **todas as telas** (lista, detalhe, Ajuste) — e valia 322.
  `gravarMovimentoPA`/`gravarMovimentosEmLotePA`/`pagarOPTriangularPA`
  validavam o saldo somando só o histórico de `Movimento_PA`
  (`_saldosEmMemoria`) — e essa soma valia 102. O último movimento do app
  pra esse código foi em 03/06/2026; os 220 de diferença vieram de fora do
  fluxo do app (ex: correção manual direto na planilha) e nunca apareceram
  no `Movimento_PA`, então a soma ficou presa no valor antigo
- Fix: as 3 funções passam a validar contra `ESTOQUE_ATUAL`
  (`_mapaCadastroInfo(...).saldo` — a mesma fonte que toda tela já usa)
  em vez de somar `Movimento_PA`. `pagarOPTriangularPA` também ganhou de
  brinde a eliminação de uma releitura duplicada do Cadastro_PA (descrição/
  endereço), já cobertos pelo mesmo `_mapaCadastroInfo`
- Testado ao vivo contra produção só com quantidade sempre maior que o
  saldo real (nada gravado): mensagem de erro passou a dizer
  "Disponível: 322" em vez de "Disponível: 102", confirmando a correção

**🐛 Fix: modal voltou a ser bottom-sheet no celular (2026-08-12)**
- Achado ao investigar um aviso do linter da IDE (`}` sem `@media{}`
  correspondente perto de `.modal-sheet`/`.modal-overlay`)
- Causa raiz (achada via `git log -p`): um `@media (min-width:600px){...}`
  perdeu a linha de abertura numa reescrita antiga do CSS (commit `2a467ef`,
  2026-06-10) — as regras `.modal-sheet{border-radius:20px;margin:auto;
  max-height:80vh}` e `.modal-overlay{align-items:center}` sobraram soltas
  e passaram a valer **sem condição, em qualquer tela**, inclusive celular
- Impacto real medido (Playwright, 390×844): todo modal do app abria
  centralizado com cantos arredondados nos 4 lados, em vez de grudado
  embaixo (bottom-sheet) como a animação `slideUp` e o `.modal-handle`
  sugerem — rodou assim em produção por ~2 meses, sem quebrar nada,
  só divergindo do design mobile-first original
- `#bottom-nav.visible{display:none}`/`#sidebar`/`#main-area`, que também
  estavam dentro do `@media` original, **não** foram restaurados — alvejam
  um layout de sidebar de desktop que não existe mais no HTML desde a
  mesma reescrita (hoje o app usa `#bottom-nav` sempre visível, sem
  sidebar)
- Fix: restaurado o `@media (min-width:600px)` só em torno das duas regras
  de modal. Validado nos dois breakpoints — mobile 390×844 fica
  `flex-end`/`20px 20px 0 0`/`776px` (grudado embaixo); desktop 1024×800
  fica `center`/`20px`/`640px` (igual já estava, sem mudança visível)

**👤 Cliente na lista de OPs (novo — 2026-08-11)**
- Usuário adicionou a coluna `CLIENTE` (P) na aba OPS, preenchida com quem
  fez o pedido — pra equipe de estoque saber a quem entregar a encomenda
- `listarOPS` agora lê essa coluna e devolve `cliente` em cada item; sem
  leitura extra (mesma leitura única da aba OPS que já existia)
- Card da OP mostra `👤 <cliente>` logo abaixo da descrição do produto,
  quando preenchido — mesma posição que o usuário indicou por cima de um
  print real do card (OP 9156 / Pedido 23124)
- Busca de OPs passa a considerar o nome do cliente também
- Testado ao vivo contra a planilha de produção: as 8 OPs abertas já têm
  `CLIENTE` preenchido, valor bate com o que está na coluna P

**Redesign do modal de detalhe — Insumo/PA (novo — 2026-08-11)**
- Header compacto: código/nome/endereço à esquerda, saldo numa caixa
  compacta à direita — substitui o bloco "Saldo total" grande centralizado
- Removida a seção "Endereços" (lista) do modal — redundante com o modelo
  de endereço único por item; o endereço agora aparece direto na linha do
  header (`Endereço: G04A`)
- As 5 ações (Entrada, Saída, Ajuste de Inventário, Transferir Código,
  Alterar Endereço) viraram uma fileira compacta ícone+rótulo curto, sob o
  título "Movimentos e Ajustes" — `overflow-x:auto` como fallback em telas
  muito estreitas, mas cabe exatamente em 390px sem precisar rolar
- "Fechar" virou link de texto na própria fileira, em vez de botão de
  largura cheia no rodapé
- Removida a fileira de impressão (Cartão G, Cartão P, ZPL avulso) do modal
  de detalhe — os cards da lista de Insumos/PA já têm botões +G/+P
  equivalentes (`adicionarFilaDireto`). `imprimirZPLDetalhe`/`adicionarFila`
  ficaram sem chamador na UI, mas não foram apagadas do código
- No PA, o espaço liberado vai pra "Estrutura de Insumos", que ganha mais
  visibilidade sem precisar rolar
- Validado com Playwright headless (viewport 390×844, iPhone 13 mini): sem
  erros de console/página, dados de endereço/saldo carregando certo nos
  dois modais. Preview visual publicado como artifact e aprovado pelo
  usuário antes do commit

**🔀 Transferência de Código (novo — 2026-08-11)**
- Botão "🔀 Transferir Código" no detalhe de Insumo e de PA (ao lado de
  "📍 Alterar Endereço") — move saldo (total ou parcial) de um código pra
  outro
- Só entre códigos do **mesmo tipo** (Insumo→Insumo, PA→PA) — decisão de
  negócio pra não misturar cadastros/unidades diferentes
- O código de destino **precisa já existir cadastrado e ATIVO** — não cria
  cadastro na hora, evita erro de digitação virando lixo no cadastro
- Modal: mostra saldo disponível da origem, campo de código de destino
  (com atalho "usar tudo" pra preencher a quantidade toda), preview em
  tempo real (SAÍDA na origem / ENTRADA no destino) igual ao padrão já
  usado no Triangular
- Backend: `transferirCodigo`/`transferirCodigoPA` gravam SAÍDA na origem +
  ENTRADA no destino numa única chamada (`setValues` de 2 linhas), com a
  mesma checagem de idempotência (`chave`) e de duplicidade de negócio
  (código+tipo+qtde nos últimos 90s) usada em `gravarMovimento` — protege
  contra duplo-clique do mesmo jeito
- OP gerada como `TRF-YYYYMMDD-HHmm` (prefixo próprio, pra diferenciar de
  `ADJ-` nos relatórios de Movimento)
- Testado ao vivo só nos caminhos de erro (código inexistente, origem =
  destino, saldo insuficiente) — nenhuma transferência real de dados foi
  gravada durante o teste; o fluxo completo (preview, confirmação, chamada
  de API) foi validado em navegador headless com API mockada

**Fix: movimento duplicado em Ajuste de Inventário / movimento manual (novo — 2026-08-11)**
- Reportado com print das linhas 1491-1492 da aba Movimento: mesma OP/código/
  qtde de Ajuste de Inventário gravada 2x, ~6s de diferença
- **Causa raiz (2 camadas):**
  1. Frontend: `confirmarAjuste`/`confirmarMovimentoInsumo`/`confirmarMovimentoPA`
     reabilitavam o botão "Confirmar" assim que a resposta do backend chegava
     (bloco `finally`), mas o modal só fechava 1.5-2s depois — nessa janela
     dava pra clicar de novo com uma `chaveIdem` nova (idempotência não pega,
     pois a chave é gerada por clique)
  2. Backend: `gravarMovimento` não tinha nenhuma checagem de duplicidade de
     negócio (só a `chaveIdem`); `gravarMovimentoPA` tinha uma checagem, mas
     que **excluía explicitamente** OPs `ADJ-` — e toda OP de movimento
     manual/ajuste é `ADJ-` (gerada por `_gerarOPAjuste()`), então a proteção
     nunca disparava nesse caminho
- **Investigação nos dados reais de produção** (via `listarMovimentos`,
  leitura, nada escrito) confirmou o padrão pelo menos 2x antes deste report
  (23/07/2026, `CMOS-A21` e `PLUNCM001`, mesmo código+tipo+qtde+obs, 1min de
  diferença) — em ambos os casos o campo `OP` tinha ficado **vazio**, não
  `ADJ-`, então uma checagem baseada só em "OP igual" não teria pego esses
  casos
- **Fix aplicado:**
  - Frontend: os 3 handlers só reabilitam o botão no caminho de **erro**
    (return antecipado ou `catch`) — no sucesso ele fica desabilitado até o
    modal fechar (que já reseta o estado ao reabrir)
  - Backend: `gravarMovimento` e `gravarMovimentoPA` ganham uma checagem de
    duplicidade por **código + tipo + qtde gravado nos últimos 90s** (em vez
    de exigir OP igual) — cobre tanto o caso com `ADJ-` quanto o caso com OP
    vazio, e não depende da granularidade de minuto do `ADJ-` (um clique
    duplo pode cruzar a virada do minuto e gerar OPs diferentes)
  - Checagem antiga de "mesma OP real (não-ADJ) já baixada" em
    `gravarMovimentoPA` (protege Triangular/BOM/PA Direto contra baixa dupla
    de OP de produção) foi mantida sem alteração
  - Deploy em 2 passos: `@37` (1a versão, baseada em OP) foi substituída por
    `@38` minutos depois, ao encontrar nos dados reais os casos de OP vazio
    que a v1 não cobria

**Dashboard mais rápido (novo — 2026-08-04)**
- `recarregarDashboard` ("↻ Atualizar" no Início) chegava a levar ~13s: pedia
  o catálogo completo de Insumos e depois o de PA (todas as colunas, ~1400
  itens no total), em série, só pra contar 3 números
- Nova ação leve `obterResumoDashboard` retorna só
  `{ totalInsumos, totalPA, criticos }` — 1 chamada em vez de 2, sem montar
  nem transmitir os itens completos
- Se Insumos/PA já foram abertos na sessão, o dashboard nem chama a API —
  calcula na hora a partir do cache local

**Baixa via BOM não força mais além do saldo (novo — 2026-08-04)**
- O modal de confirmação da baixa via BOM permitia editar/enviar quantidade
  maior que o saldo disponível ("confirme assim mesmo"), mas o backend
  rejeitava o **lote inteiro** nesse caso — nem os itens com saldo
  suficiente eram gravados
- Alinhado com o comportamento que já existia em PA Direto/Triangular: itens
  sem saldo suficiente ficam bloqueados/desmarcados automaticamente; o
  campo de quantidade também trava no valor disponível em vez de só
  avisar visualmente

**Endereço único por item (novo — 2026-08-04)**
- Decisão de negócio: cada item (Insumo ou PA) tem **1 endereço fixo só**,
  não mais saldo espalhado por vários endereços
- Endereço agora é um campo direto do cadastro — sem fórmula — em
  `Cadastro` (coluna D) e `Cadastro_PA` (coluna F)
- Backend não distribui mais saída entre endereços (`_distribuirPorEndereco`
  removido): toda gravação de Movimento/Movimento_PA usa o endereço fixo do
  item, lido do Cadastro/Cadastro_PA
- `obterEnderecosSaldo`/`obterEnderecosSaldoPA` leem só o Cadastro
  (rapidíssimo) em vez de escanear Movimento — mesmo formato de resposta de
  antes, então o frontend não precisou mudar
- `mudarEndereco`/`mudarEnderecoPA` deixaram de gerar movimento (SAÍDA +
  ENTRADA) e viraram uma edição direta do campo Endereço no
  Cadastro/Cadastro_PA — ação: `{ codigo, novoEndereco }`
- Botão "📍 Alterar Endereço" no detalhe de Insumo e de PA, abre modal
  simples (endereço atual + novo endereço), atualiza cache local e a lista
  na hora — sem chamada de backend nova, só liga a UI ao que já existia

**Performance (2026-08-03/04)**
- `obterSaldo` / `obterSaldoPA` leem `ESTOQUE_ATUAL` do Cadastro/Cadastro_PA
  (coluna calculada, 1 linha por item) em vez de somar o histórico inteiro de
  Movimento/Movimento_PA a cada chamada — não degrada mais conforme a
  planilha de movimentos cresce
- `prepararEListarBOM` troca `Utilities.sleep(3000)` fixo por polling curto
  (300ms, sai assim que a BOM estabiliza) — mesmo teto de espera, mas sai
  bem antes na maioria dos casos
- `listarOPS` lê a coluna `PAGO` da própria aba OPS (fórmula
  `ARRAYFORMULA`/`COUNTIF`, ver "Lembretes técnicos") em vez de escanear
  Movimento e Movimento_PA inteiros pra descobrir quais OPs já foram pagas
  — chamada toda vez que a tela de OPs abre + a cada 5 min de auto-refresh,
  então esse era um dos pontos mais quentes
- `listarOPS` também lê a foto direto da coluna `FOTO` da própria aba OPS,
  em vez de cruzar código-a-código com Cadastro/Cadastro_PA — a função foi
  de 6 leituras completas de planilha por chamada para **1 só** (a própria
  OPS). Testado ao vivo: URLs de foto idênticas, byte a byte, ao resultado
  anterior
- `listarCadastro`/`listarCadastroPA` ganham cache de 30s via
  `CacheService` (ver "Lembretes técnicos" — como o resultado passa dos
  100KB por chave, é guardado em pedaços/chunks). Testado ao vivo: segunda
  chamada dentro da janela de 30s cai de ~4.8s pra ~1.8s (Insumos) e de
  ~3.2s pra ~1.4s (PA), com o mesmo resultado byte a byte
- **Baixa de Insumos/PA mais rápida**: `gravarMovimento`, `gravarMovimentoPA`,
  `gravarMovimentosEmLote(PA)` e `gravarBaixaInsumos` liam Cadastro/
  Cadastro_PA 2-3 vezes cada (situação, endereço e saldo eram 3 funções
  separadas, cada uma relendo a aba inteira) — `gravarBaixaInsumos` em
  particular, chamada ao confirmar a Baixa via PA, foi de **3 leituras pra
  1**. Novo helper `_mapaCadastroInfo` lê tudo de uma vez. Validado sem
  gravar nada de verdade: forçando erro (saldo insuficiente/código
  inexistente) nas 5 funções, a mensagem de erro bate com o saldo real do
  `listarCadastro`

**Layout mobile (novo — 2026-08-03)**
- Lista de OPs: coluna de foto/Pedido-OP-Origem encolhe em telas ≤480px;
  labels de OBS/SILK saem do aperto do canto direito e ganham linha própria
- Modal "Confirmar baixa de insumos" (BOM/PA Direto/Triangular): nome do
  item ganha a linha toda em cima; Saldo/Neces./Baixar viram uma linha
  compacta embaixo, em vez de espremer a descrição numa coluna de ~80px
- Dashboard, Insumos, PA, Movimentos e os demais modais já eram responsivos
  (cards flexíveis, sem coluna de largura fixa) — auditados e sem problema

**Telas e navegação**
- Login, Dashboard, Insumos, PA, OPs, Movimentos, BOM
- Busca com debounce 300ms em todas as listas (sem re-render a cada tecla)
- Auto-refresh das OPs a cada 5 min

**Detalhe de Insumo / PA**
- Foto com `object-fit:contain`, lightbox ao tocar
- Saldo total e endereços
- Endereço exibido no cabeçalho dos modais de pagamento e na lista BOM

**Movimentos manuais**
- Entrada e Saída de Insumo
- Entrada e Baixa PA + Insumos (via Estrutura de Produtos)

**⚖️ Ajuste de Inventário**
- Acessível pelo botão no detalhe de Insumo ou PA
- Exibe foto, descrição, endereço e saldo atual
- Usuário digita a nova quantidade em estoque
- Sistema calcula automaticamente: ENTRADA ou SAÍDA (preview colorido em tempo real)
- Campo endereço aparece somente para entradas
- Reutiliza `gravarMovimento` / `gravarMovimentoPA` — sem mudanças no GAS

**Pagar OP**
- BOM — via aba BOM (planilha), com fallback quando "Estrutura de Produtos"
  está vazia; ou direto via `codigoPA`+`qtde` quando a Estrutura existe
- PA Direto
- Triangular — saldo de origem exibido em tempo real, bloqueia se insuficiente
- Insumos com saldo insuficiente aparecem bloqueados/desmarcados na confirmação
- Bloqueio de baixa duplicada de OP real (PA Direto, BOM, Triangular)

**Qualidade de gravação**
- Idempotência (chaveIdem) em todas as escritas — sem duplicatas mesmo em erro 404
- Retry automático: 3 tentativas com 4s de intervalo, toast a cada falha
- Triangular: 1 leitura única de Movimento_PA (saldo + idempotência + header)
- `appendRow` × 3 substituído por `setValues` na Triangular

**Impressão**
- Fila de cartões com barra fixa (Cartão G e Grade A4)
- Botões +G / +P direto nos cards, badge de contagem
- Botões Metal / OP nas OPs com impressoras corretas
- Impressão ZPL avulsa
- Cartão (G/Grade A4) mostra só o **Endereço** (lido na hora do
  Cadastro/Cadastro_PA — não imprime mais valor antigo/sujo que estivesse
  na célula) — **sem saldo e sem QR code** (2026-08-04: etiqueta passou a
  ser só pra identificação, não precisa mais dessas duas informações)
- Impressora de cartão temporariamente trocada pra uma impressora PDF do
  PrintNode (Brother "Copiadora 1" com defeito — ver "Assuntos em aberto")
- Ao mandar imprimir cartão, o PDF também baixa direto no navegador de
  quem imprimiu, além de (tentar) ir pro PrintNode

---

### 📌 Arquivos no repositório (frontend — `futura-estoque`)

| Arquivo | Função |
|---|---|
| `index.html` | App completo — todas as telas e modais |
| `config.js` | URL do GAS + timeout (editar ao mudar deploy) |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker v2 |
| `Cartao.html` | Template cartão grande (backup, não usado no deploy) |
| `CartaoGrade.html` | Template grade A4 (backup, não usado no deploy) |
| `Codigo.txt` | **Cópia de leitura/edição** do backend GAS — ver aviso abaixo |

> ⚠️ `Codigo.txt` é uma cópia do código do Apps Script mantida aqui só para
> facilitar leitura/edição (ex.: com o Claude Code). **Editar este arquivo
> não publica nada** — é preciso levar a mudança para o projeto clasp real
> (veja "Backend — projeto clasp" abaixo) e rodar `clasp push` + `clasp
> deploy`. `Cartao.html`/`CartaoGrade.html` deste repo também não são a fonte
> de verdade do deploy — a fonte real é o projeto clasp.

---

### 🔧 Backend — projeto clasp (fonte de verdade)

O backend (`Código.js`) **não vive neste repositório**. O projeto clasp
sincronizado com o Apps Script ativo (mesmo `scriptId`/Deployment ID do
topo deste README) fica em:

```
C:\Users\Delmer Pereira\Documents\GitHub\futura-estoque-gas\
```

Fluxo para publicar uma mudança de backend:

```bash
# 1. Edite Código.js em futura-estoque-gas/ (ou copie de Codigo.txt deste repo)
cd "C:\Users\Delmer Pereira\Documents\GitHub\futura-estoque-gas"
clasp push
clasp deploy -i AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg -d "descrição da mudança"
```

Isso **atualiza a implantação existente no lugar** — a URL em `config.js`
não muda. `clasp deploy` sem `-i` cria uma implantação **nova** (URL nova) —
não usar, quebraria `config.js`.

**Rollback:** toda versão antiga continua disponível — `clasp versions`
lista todas, `clasp deploy -i <deploymentId> -V <número>` aponta a
implantação ativa de volta pra uma versão anterior sem precisar reescrever
código.

> ⚠️ **Existe uma segunda cópia local** em
> `C:\Users\DELMER~1\AppData\Local\Temp\claude\gas-futura\` (mesmo
> `scriptId`). Em 2026-08-04 ela foi sincronizada manualmente com
> `futura-estoque-gas` (as duas batem hoje), mas fica numa pasta
> **temporária do sistema** — pode sumir ou ficar desatualizada de novo a
> qualquer momento sem aviso. Trate como descartável: `futura-estoque-gas`
> é a única pasta que deve ser considerada fonte de verdade local.

---

### ⚠️ Lembretes técnicos

- Após push do frontend: `sessionStorage.clear(); caches.keys().then(k=>k.forEach(c=>caches.delete(c))); location.reload(true);`
- CSS `.modal-overlay` é sensível — usar edições cirúrgicas, nunca substituição em bloco
- `sw.js` é network-first (busca a rede antes do cache) — não deveria precisar do passo acima na maioria dos casos, mas ajuda se a PWA parecer "travada" numa versão antiga
- **Aba OPS depende da coluna `PAGO`** (adicionada em 2026-08-04) — fórmula:
  `=ARRAYFORMULA(IF(D2:D="","",IF((COUNTIF(Movimento!E:E,D2:D)+COUNTIF(Movimento_PA!E:E,D2:D))>0,"PAGO","")))`
  (coluna D = número da OP na própria OPS; coluna E = número da OP em
  Movimento/Movimento_PA). Se essa coluna for apagada, renomeada, ou a
  fórmula for removida, `listarOPS` deixa de detectar OPs pagas — o código
  não escaneia mais Movimento/Movimento_PA como fallback.
- **Aba OPS depende da coluna `FOTO`** (coluna A, já existia) — `listarOPS`
  lê a foto direto dessa coluna, sem cruzar com Cadastro/Cadastro_PA. Se o
  cabeçalho for renomeado, `fotoUrl` volta vazio nas OPs (os cards ainda
  funcionam, só ficam sem imagem).
- **Cache de 30s em `listarCadastro`/`listarCadastroPA`** (`CacheService`,
  chave `listarCadastro_<FILTRO>` / `listarCadastroPA_<FILTRO>`, guardada em
  pedaços porque o resultado passa do limite de 100KB por chave do
  `CacheService`) — **não é invalidado nos writes**. Depois de editar um
  item, mudar endereço, ou qualquer movimento que altere `ESTOQUE_ATUAL`, a
  lista de Insumos/PA pode levar até 30s pra refletir a mudança. Isso é
  intencional (mantém o código simples, sem ter que invalidar cache em
  cada função de gravação) — as validações de saldo na hora de gravar
  (`obterSaldo`/`obterSaldoPA`, checagens dentro de `gravarMovimento` etc.)
  **não usam esse cache**, continuam sempre lendo a planilha na hora, então
  a integridade dos dados não é afetada — só a exibição da lista pode
  atrasar um pouco.

---

### 📋 Assuntos em aberto

- **Fase 1 (abas resumo) — cobertura de sincronização, o que falta**
  (atualizado 2026-10-01, deploy @63) — a Fase 1b fechou
  `gravarMovimentosEmLote`/`PA`, `gravarBaixaInsumos`, `pagarOPTriangularPA`,
  `transferirCodigo`/`PA` e `mudarEndereco`/`PA`; o `onEdit` (deploy @62/@63)
  fechou edição manual direto no Cadastro/Cadastro_PA e em Movimento/
  Movimento_PA (cadastrar item novo, corrigir campo, adicionar/editar linha
  de movimento). `salvarItemCadastro`/`salvarItemCadastroPA` continuam sem
  sincronizar, mas são 2 das 9 rotas sem chamador no frontend (ver abaixo) —
  não é usado na prática hoje. Único gap real que sobra: **exclusão de
  linha** direto na planilha, em qualquer uma das 4 abas (nem `onEdit` cobre
  isso de forma confiável — o código já não existe mais quando o evento
  dispara). Mitigação: rodar `popularResumoInsumo`/`popularResumoPA`
  periodicamente como rede de segurança — hoje é manual, sem gatilho
  automático instalado.
- **9 rotas do backend sem nenhum chamador no frontend** (achado 2026-09-29)
  — `alterarSenha`, `salvarCadastro`, `salvarCadastroPA`,
  `obterFormulasInsumo`, `obterFormulasPA`, `obterSaldo`, `obterSaldoPA`,
  `listarEmbarque`, `gravarEntradaDI`. Mesmo padrão do `obterResumoDashboard`
  (ver entrada de 2026-09-14) — provavelmente telas antigas removidas do
  app sem limpar o backend correspondente. Não afeta performance (código
  que nunca executa), fica registrado pra uma limpeza futura se fizer
  sentido.
- **Fase 2 (login) ainda não feita** — mesmo depois da Fase 1, medições
  indicam que parte da lentidão vem de só *abrir* a planilha (afeta até o
  login, que não toca `Cadastro`/`Cadastro_PA`). Precisa investigar
  separado — ver conversa/plano da Fase 2 (retry automático em timeout no
  frontend + medir de novo depois da Fase 1).
- **`ESTOQUE_ATUAL` do PA pode ficar dessincronizado do `Movimento_PA`
  (visto em 2026-08-12)** — a fórmula de `ESTOQUE_ATUAL` em `Cadastro_PA`
  não deriva só do `Movimento_PA`; qualquer correção de saldo feita fora
  do fluxo do app (edição direta na planilha, por exemplo) muda
  `ESTOQUE_ATUAL` sem gerar uma linha em `Movimento_PA`. Corrigimos os 3
  pontos do backend que validavam contra a soma errada (ver deploy @43),
  então agora a validação sempre bate com o que a tela mostra — mas o
  `ESTOQUE_ATUAL` em si continua sendo a fonte de verdade "por fora"; se
  ele estiver errado, todo o app mostra o número errado (só não vai mais
  dar erro de validação incoerente). Vale conferir periodicamente se
  `ESTOQUE_ATUAL` de itens PA batem com uma contagem física, especialmente
  itens sem movimento recente no app.
- **Backend sem controle de versão em git** — hoje só existe o histórico de
  versões do próprio Apps Script (`clasp versions`), sem diff/blame/PR, e foi
  exatamente essa falta de rastreabilidade que permitiu o incidente do @25
  passar despercebido antes do deploy. Considerar versionar
  `futura-estoque-gas` como repo git próprio (ou incorporar `Código.js` a
  este repo como fonte única) para ter diff real de toda mudança de backend
  antes de publicar.
- **Pasta temp `gas-futura`** — sincronizada com `futura-estoque-gas` em
  2026-08-04, mas por estar em `AppData\Local\Temp` pode ser recriada
  desatualizada por uma sessão futura. O ideal é parar de usá-la.
- **Impressora de cartão temporariamente trocada (2026-08-04)** — a Brother
  DCP-B7535DW ("Copiadora 1", PrintNode `75494109`) está com defeito.
  `PRINTNODE_PRINTER_CARTAO` aponta hoje para `75307275` (impressão em PDF).
  Quando a Brother for consertada, reverter essa constante em `Código.js`
  para `75494109` e publicar um novo deploy. (O download local do PDF —
  ver item abaixo — pode continuar existindo mesmo depois da Brother
  voltar, é só um bônus.)
- **PDF de cartão baixa localmente (2026-08-04)** — como a impressão em PDF
  do PrintNode só fica salva no servidor deles (sem chegar automaticamente
  no computador/celular de quem imprimiu), `imprimirFilaCartaoInsumo`/`PA`
  agora também devolvem o PDF em base64 pro frontend, que baixa na hora
  (`_baixarPDFBase64` em `index.html`).

---

## Histórico de deploys GAS

Fonte: `clasp versions` (descrições exatamente como cadastradas no deploy).

| Versão | Descrição |
|---|---|
| @16 | Fix idempotencia triangular BOM PA |
| @17 | perf: sem sleep BOM, leitura unica Triangular, setValues, debounce |
| @18 | fix: BOM via codigoPA+qtde direto do frontend, sem busca na aba OPS |
| @19 | perf: leitura unica Movimento_PA, setValues Triangular, BOM via codigoPA direto, fix estoqueInicial |
| @20 | fix: doPost passa objeto completo para prepararBOMComSaldo; fallback aba BOM quando Estrutura de Produtos vazia |
| @21 | fix: qtdPedido -> qtdePedido no map de Estrutura de Produtos |
| @22 | fix: idempotência em gravarMovimento (insumo); chaveIdem em movimentos manuais PA |
| @23 | fix: bloqueia baixa duplicada de OP real (PA Direto, BOM, Triangular) |
| @24 | fix: remove baixa automatica de insumos duplicada no Triangular |
| @25 | ⚠️ **REGREDIU @20-@24** — publicada a partir de uma cópia local desatualizada; perdeu o bloqueio de OP duplicada e voltou a baixar insumo em dobro no Triangular. Corrigida em minutos pela @26. Motivo pelo qual a regra de verificação pré-deploy acima existe. |
| @26 | restaura as proteções @20-@24 (bloqueio de OP duplicada, sem baixa dupla no Triangular) + mantém perf: saldo via ESTOQUE_ATUAL (Cadastro/Cadastro_PA) + polling no lugar de sleep fixo no BOM |
| @27 | feat: endereço único por item, lido direto do Cadastro/Cadastro_PA; remove distribuição por endereço em Movimento; mudarEndereco/PA viram edição simples de cadastro |
| @28 | feat: obterResumoDashboard, resumo leve do dashboard (só contagens, sem enviar itens completos) |
| @29 | fix: troca temporária da impressora de cartão (PrintNode `75494109` → `75307275`) — Brother DCP-B7535DW com defeito, imprimindo em PDF por enquanto |
| @30 | feat: imprimirFilaCartao(Insumo/PA) devolve o PDF em base64 pro frontend baixar localmente, além de tentar mandar pro PrintNode |
| @31 | fix: cartão mostra "Endereço : Saldo" de verdade (lido do Cadastro/Cadastro_PA na hora), em vez do dado antigo/sujo que ficava no campo Endereço |
| @32 | perf: listarOPS lê coluna PAGO (fórmula na planilha) em vez de escanear Movimento/Movimento_PA inteiros a cada chamada |
| @33 | perf: listarOPS lê a foto direto da coluna FOTO da própria aba OPS, em vez de cruzar com Cadastro/Cadastro_PA — agora lê só 1 aba no total |
| @34 | fix: remove QR code e saldo dos cartões de Insumo/PA — etiquetas passam a ser só pra identificação |
| @35 | perf: cache de 30s (CacheService, em chunks) para listarCadastro/listarCadastroPA |
| @36 | perf: unifica leituras de Cadastro/Cadastro_PA nas funções de gravação (gravarMovimento(PA), lote, gravarBaixaInsumos) — de 2-3 leituras por chamada pra 1 |
| @37 | fix: dedup de negócio em gravarMovimento/gravarMovimentoPA para movimentos manuais (op+código+tipo+qtde) — 1a tentativa, substituída pela @38 |
| @38 | fix: dedup de negócio em gravarMovimento/gravarMovimentoPA por código+tipo+qtde numa janela de 90s (em vez de exigir OP igual) — corrige duplicidade em Ajuste de Inventário/movimento manual |
| @39 | feat: transferirCodigo/transferirCodigoPA — transferência de saldo (total ou parcial) de um código pro outro, mesmo tipo (Insumo→Insumo, PA→PA) |
| @40 | feat: listarOPS lê a coluna CLIENTE (P) da aba OPS — quem fez o pedido, exibido no card da OP pra equipe de estoque saber a quem entregar |
| @41-@42 | diagnóstico temporário (removido) — investigar divergência entre ESTOQUE_ATUAL e a soma do Movimento_PA |
| @43 | fix: gravarMovimentoPA/gravarMovimentosEmLotePA/pagarOPTriangularPA passam a validar saldo contra ESTOQUE_ATUAL (mesma fonte das telas), não contra a soma do Movimento_PA |
| @44-@52 | investigação temporária (removida) — teste de ARRAYFORMULA vs fórmula por linha; abandonado por bloqueio de permissão ao criar/escrever em planilha externa (não resolvido) |
| @53 | limpeza — remove todas as funções de teste temporário, volta ao estado exato do @43 |
| @54 | Fase 1 (perf) — cria a infraestrutura das abas resumo: `_extrairCamposResumoInsumo/PA`, `_popularResumoInsumo/PA`, `_sincronizarResumoInsumo/PA` |
| @55 | Fase 1 — `listarCadastro`/`listarCadastroPA` passam a ler de `Cadastro_Resumo`/`Cadastro_PA_Resumo` em vez do Cadastro original; `gravarMovimento`/`gravarMovimentoPA` passam a sincronizar o resumo ao gravar |
| @56 | Fase 1, fix: `_linhaResumoNaOrdem` virou case-insensitive (cabeçalho "ID" vs campo "id" não batia, coluna ficava vazia); colunas de texto do resumo ganham formato "Plain text" (Sheets estava auto-convertendo string tipo "0.00499" pra número errado, por causa do "." ser separador de milhar no locale pt-BR) — ver "Estado atual" |
| @57 | diagnóstico temporário (`_diagCampoInsumo`) pra investigar `#NUM!` em `estoqueInicial` — campo confirmado sem uso pelo app, investigação encerrada a pedido do usuário |
| @58 | limpeza — remove `_diagCampoInsumo`, volta ao estado funcional do @56 |
| @59 | Fase 1b (perf): `_mapaCadastroInfo`, `obterSaldo(PA)`, `obterEnderecosSaldo(PA)` passam a ler do Resumo em vez do Cadastro original; sincronização do resumo fechada em `gravarMovimentosEmLote(PA)`, `transferirCodigo(PA)`, `pagarOPTriangularPA`, `gravarBaixaInsumos`, `mudarEndereco(PA)` — ver "Estado atual" |
| @60 | Fase 1c (perf): `mudarEndereco`/`mudarEnderecoPA` passam a ler só a coluna CÓDIGO em vez da aba inteira pra achar a linha — ver "Estado atual" |
| @61 | diagnóstico temporário (`_diagListarAbas`) — levanta todas as abas da planilha p/ plano de migração de banco. Ainda ativo (não é destrutivo, só leitura) |
| @62 | gatilho `onEdit` sincroniza Resumo em edição manual no Cadastro/Cadastro_PA (filtrado por coluna relevante); `_sincronizarResumoInsumo`/`PA` otimizadas (busca só a coluna CÓDIGO, não a aba inteira) |
| @63 | ✅ **ATIVO** — `onEdit` passa a vigiar também Movimento/Movimento_PA (correção de quantidade feita direto no histórico de movimento, não no Cadastro) — ver "Estado atual" |
