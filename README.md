# Controle de Estoque — Futura

PWA mobile-first para controle de insumos e produtos acabados.
Backend: Google Apps Script | Frontend: GitHub Pages

**URL:** `https://engenharia6-beep.github.io/futura-estoque/`
**GAS Script ID:** `1z_ahZGWewRAuxHVbPLgwfqbhBegzhrQbrvsVgdsRB795LVoSrxrPO976`
**Deployment ID:** `AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg`
**GAS ativo: @25 | Frontend: `af69bbc`+**

> O número de versão exibido no rodapé do app (`APP_VERSION` em `index.html`) é
> o hash do **último commit do frontend antes dele** — não o commit que fez o
> próprio bump. Ao publicar mudanças no frontend, atualize essa constante
> (e a linha acima) para o hash do commit que acabou de subir.

---

## Estado atual — 2026-08-03

### ✅ Funcionando

**Performance (novo — 2026-08-03)**
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

> ⚠️ **Existe uma segunda cópia local divergente** em
> `C:\Users\DELMER~1\AppData\Local\Temp\claude\gas-futura\` (mesmo
> `scriptId`, conteúdo diferente — parece um rascunho de uma sessão antiga
> que nunca foi publicado). **Não é a fonte de verdade** — fica numa pasta
> temporária do sistema, pode sumir a qualquer momento, e diverge do que
> está realmente em produção. Ver "Assuntos em aberto" abaixo.

---

### ⚠️ Lembretes técnicos

- Após push do frontend: `sessionStorage.clear(); caches.keys().then(k=>k.forEach(c=>caches.delete(c))); location.reload(true);`
- CSS `.modal-overlay` é sensível — usar edições cirúrgicas, nunca substituição em bloco
- `sw.js` é network-first (busca a rede antes do cache) — não deveria precisar do passo acima na maioria dos casos, mas ajuda se a PWA parecer "travada" numa versão antiga

---

### 📋 Assuntos em aberto

- **Cópia divergente do backend em pasta temp** (ver aviso acima) — decidir
  se as mudanças de lá eram intencionais (e nesse caso comparar/mesclar com
  `futura-estoque-gas`) ou se é só rascunho descartável.
- **Backend sem controle de versão em git** — hoje só existe o histórico de
  versões do próprio Apps Script (`clasp versions`), sem diff/blame/PR.
  Considerar versionar `futura-estoque-gas` como repo git próprio (ou
  incorporar `Código.js` a este repo como fonte única) se isso continuar
  gerando confusão.

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
| @25 | ✅ **ATIVO** — perf: saldo via ESTOQUE_ATUAL (Cadastro/Cadastro_PA) + polling no lugar de sleep fixo no BOM |
