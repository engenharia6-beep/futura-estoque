# Controle de Estoque — Futura

PWA mobile-first para controle de insumos e produtos acabados.
Backend: Google Apps Script | Frontend: GitHub Pages

**URL:** `https://engenharia6-beep.github.io/futura-estoque/`
**GAS Script ID:** `1z_ahZGWewRAuxHVbPLgwfqbhBegzhrQbrvsVgdsRB795LVoSrxrPO976`
**Deployment ID:** `AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg`
**GAS ativo: @29 | Frontend: `b0e2198`+**

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

## Estado atual — 2026-08-04

### ✅ Funcionando

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

---

### 📋 Assuntos em aberto

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
  para `75494109` e publicar um novo deploy.

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
| @29 | ✅ **ATIVO** — fix: troca temporária da impressora de cartão (PrintNode `75494109` → `75307275`) — Brother DCP-B7535DW com defeito, imprimindo em PDF por enquanto |
