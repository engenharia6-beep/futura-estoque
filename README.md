# Controle de Estoque — Futura

PWA mobile-first para controle de insumos e produtos acabados.  
Backend: Google Apps Script | Frontend: GitHub Pages

**URL:** `https://engenharia6-beep.github.io/futura-estoque/`  
**GAS Script ID:** `1z_ahZGWewRAuxHVbPLgwfqbhBegzhrQbrvsVgdsRB795LVoSrxrPO976`  
**Deployment ID:** `AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg`  
**GAS ativo: @22 | Frontend: `2ce6473`+**

---

## Estado atual — 2026-07-03

### ✅ Funcionando

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

**⚖️ Ajuste de Inventário** *(novo — 2026-07-03)*
- Acessível pelo botão no detalhe de Insumo ou PA
- Exibe foto, descrição, endereço e saldo atual
- Usuário digita a nova quantidade em estoque
- Sistema calcula automaticamente: ENTRADA ou SAÍDA (preview colorido em tempo real)
- Campo endereço aparece somente para entradas
- Reutiliza `gravarMovimento` / `gravarMovimentoPA` — sem mudanças no GAS

**Pagar OP**
- BOM — sem `sleep(3000)`: lê Estrutura de Produtos diretamente (frontend envia `codigoPA` + `qtde`)
- PA Direto
- Triangular — saldo de origem exibido em tempo real, bloqueia se insuficiente
- Insumos com saldo insuficiente aparecem bloqueados/desmarcados na confirmação

**Qualidade de gravação**
- Idempotência (chaveIdem) em todas as escritas — sem duplicatas mesmo em erro 404
- Retry automático: 3 tentativas com 4s de intervalo, toast a cada falha
- Triangular: 1 leitura única de Movimento_PA (saldo + idempotência + header)
- `appendRow` × 3 substituído por `setValues` na Triangular
- `gravarMovimento` e `_baixarInsumosDaEstrutura` com leitura única do sheet

**Impressão**
- Fila de cartões com barra fixa (Cartão G e Grade A4)
- Botões +G / +P direto nos cards, badge de contagem
- Botões Metal / OP nas OPs com impressoras corretas
- Impressão ZPL avulsa

---

### 📌 Arquivos no repositório

| Arquivo | Função |
|---|---|
| `index.html` | App completo — todas as telas e modais |
| `config.js` | URL do GAS (editar ao mudar deploy) |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker v2 |
| `Cartao.html` | Template cartão grande (backup) |
| `CartaoGrade.html` | Template grade A4 (backup) |

> `Code_novo.gs` e os `.html` de cartão são **colados manualmente** no Apps Script — não vêm do git.

---

### ⚠️ Lembretes técnicos

- Após push: `sessionStorage.clear(); caches.keys().then(k=>k.forEach(c=>caches.delete(c))); location.reload(true);`
- Alterações no GAS exigem novo deploy — usar clasp em `C:/Users/DELMER~1/AppData/Local/Temp/claude/gas-futura/`
- `clasp deploy --deploymentId <ID> --description "desc"`
- Rollback GAS: `clasp deploy --deploymentId <ID> --versionNumber <N>`
- CSS `.modal-overlay` é sensível — usar edições cirúrgicas, nunca substituição em bloco

---

## Histórico de deploys GAS

| Versão | Data | Descrição |
|---|---|---|
| @16 | 2026-06-30 | Idempotência, triangular com saldo, retry 404, BOM com sleep(3000) |
| @17 | 2026-07-03 | ❌ Performance (revertido — BOM quebrou por comparação OP numérico vs string) |
| @18 | 2026-07-03 | ❌ Fix parcial BOM (revertido junto com @17) |
| @19 | 2026-07-03 | ✅ **ATIVO** — todos os fixes de performance + BOM via codigoPA do frontend + fix estoqueInicialPA na Triangular |
