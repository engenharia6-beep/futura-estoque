# Controle de Estoque — Futura

PWA mobile-first para controle de insumos e produtos acabados.  
Backend: Google Apps Script | Frontend: GitHub Pages

**URL:** `https://engenharia6-beep.github.io/futura-estoque/`  
**GAS Script ID:** `1z_ahZGWewRAuxHVbPLgwfqbhBegzhrQbrvsVgdsRB795LVoSrxrPO976`  
**Deployment ID:** `AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg`  
**Versão GAS ativa: @16**

---

## Estado atual — 2026-06-30

### ✅ Funcionando (versão @16)

- Login, Dashboard, Insumos, PA, OPs, Movimentos
- Detalhe Insumo/PA — foto com `object-fit:contain`, lightbox ao tocar
- Pagar OP: BOM, PA Direto, Triangular
- BOM — lista de PAs pesquisável (aba 📊); modal com estrutura completa, saldo, endereço
- Triangular — saldo do produto origem exibido em tempo real, bloqueia se saldo insuficiente
- Insumos com saldo insuficiente aparecem desabilitados/desmarcados na lista de confirmação
- Idempotência em todas as gravações (chaveIdem) — evita duplicatas em caso de 404 + retry
- Retry automático com 3 tentativas no `api()`, toast a cada falha
- Botões Metal/OP nas OPs com impressoras corretas
- Botões +G/+P direto nos cards, badge de contagem na fila
- Fila de impressão com barra fixa, Cartão G e Grade A4
- Impressão ZPL avulsa
- Endereço exibido no modal de pagamento de OP e na lista BOM
- Auto-refresh das OPs a cada 5 min

---

### 📌 Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | App completo — todas as telas |
| `config.js` | URL do GAS (editar ao mudar deploy) |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker v2 |
| `Cartao.html` | Template cartão grande (backup) |
| `CartaoGrade.html` | Template grade A4 (backup) |

> `Code_novo.gs` e os `.html` de cartão são **colados manualmente** no Apps Script — não vêm do git.

---

### ⚠️ Lembretes técnicos

- Após push: `sessionStorage.clear(); caches.keys().then(k=>k.forEach(c=>caches.delete(c))); location.reload(true);`
- Alterações no GAS exigem novo deploy — usar clasp (`C:/Users/DELMER~1/AppData/Local/Temp/claude/gas-futura/`)
- CSS `.modal-overlay` é sensível — usar edições cirúrgicas, nunca substituição em bloco
- clasp deploy: `clasp deploy --deploymentId <ID> --description "desc"`
- Rollback GAS: `clasp deploy --deploymentId <ID> --versionNumber <N>`

---

## Otimizações de performance — PENDENTE (parado em 2026-06-30)

As melhorias abaixo foram implementadas e revertidas porque quebraram o BOM.  
Estão prontas para retomar com mais cuidado, **uma por vez com teste intermediário**.

### Backend (Código.js) — o que foi tentado e o problema

| Fix | O que muda | Status |
|---|---|---|
| `prepararEListarBOM` sem `sleep(3000)` | Lê OPS + Estrutura direto em vez de escrever célula A2 e esperar | ❌ **Quebrou** — BOM sumia os itens |
| `pagarOPTriangularPA` — leitura única de Movimento_PA | Era 4 leituras separadas (saldo, idempotência, header, header de novo); virou 1 | Revertido junto |
| `appendRow` × 3 → `setValues` na Triangular | Substituição de 3 chamadas por 1 | Revertido junto |
| `gravarMovimento` — `getDataRange()` único | Lia header separado + `obterEnderecosSaldo` relendo o sheet | Revertido junto |
| `_baixarInsumosDaEstrutura` — header duplicado | Linha 355-358: `getDataRange()` + `getRange(...header...)` separados | Revertido junto |

**Causa raiz do bug do BOM:**  
O novo `prepararEListarBOM` buscava o produto na aba OPS comparando OP como string.  
A planilha armazena o número como valor numérico — a comparação falhava silenciosamente.  
A função retornava `{ ok: true, itens: [] }` (sem erro visível).

**Solução correta (para retomar):**  
O frontend já tem `op.codigo` e `op.qtde` — basta enviá-los ao backend:
```js
// index.html linha ~1493
const res = await api('prepararBOMComSaldo', { op: op.op, codigoPA: op.codigo, qtde: op.qtde });
```
No GAS, `prepararEListarBOM(opNumero, dadosOPC)` usa `dadosOPC.codigoPA`/`dadosOPC.qtde` diretamente  
e **não precisa ler a aba OPS**. Com isso elimina o `sleep(3000)` e uma leitura de planilha.

### Frontend (index.html) — o que foi tentado

| Fix | O que muda | Status |
|---|---|---|
| Debounce 300ms nos filtros de busca | `_deb('ins', ()=>filtrarInsumos(this.value))` nos 4 campos search | Revertido junto (era seguro) |

O debounce é seguro e independente — pode ser reaproveitado.

---

### Como retomar as otimizações com segurança

1. **Primeiro:** só o fix do frontend (debounce) — risco zero  
2. **Segundo:** só o fix do BOM com `codigoPA` passado pelo frontend — testar BOM isoladamente  
3. **Terceiro:** consolidar leituras em `pagarOPTriangularPA` — testar Triangular  
4. **Quarto:** `appendRow` → `setValues` — testar pagamentos  
5. **Quinto:** `gravarMovimento` e `_baixarInsumosDaEstrutura` — testar movimentos manuais  

Cada item gera um commit/deploy separado e é testado antes de avançar.

---

## Histórico de deploys GAS relevantes

| Versão | Descrição |
|---|---|
| @16 | ✅ **ATIVA** — idempotência, triangular com saldo, retry 404, BOM com sleep(3000) |
| @17 | ❌ Performance fixes (revertido) — BOM quebrou |
| @18 | ❌ Fix parcial BOM (revertido junto) |
