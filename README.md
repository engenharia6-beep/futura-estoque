# Controle de Estoque — Futura

PWA mobile-first para controle de insumos e produtos acabados.  
Backend: Google Apps Script | Frontend: GitHub Pages

---

## Estrutura

```
futura-estoque/
├── index.html      ← App principal (todas as telas)
├── config.js       ← URL do GAS (único arquivo a editar por ambiente)
├── manifest.json   ← Configuração do PWA
├── sw.js           ← Service Worker (cache offline)
└── assets/
    ├── icon-192.png
    └── icon-512.png
```

---

## Setup

### 1. Criar repositório no GitHub
- Nome: `futura-estoque`
- Visibilidade: Public (necessário para GitHub Pages gratuito)

### 2. Subir os arquivos
```bash
git init
git add .
git commit -m "feat: estrutura base PWA"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/futura-estoque.git
git push -u origin main
```

### 3. Ativar GitHub Pages
- Repositório → Settings → Pages
- Source: `Deploy from a branch`
- Branch: `main` / `/ (root)`
- Save

O app ficará disponível em:  
`https://SEU_USUARIO.github.io/futura-estoque/`

### 4. Criar o novo Apps Script (backend)
- Abra a mesma planilha do sistema atual
- Extensions → Apps Script → novo projeto
- Cole o `Code_novo.gs` (será gerado na próxima etapa)
- Publicar → Deploy as web app
  - Execute as: Me
  - Who has access: Anyone
- Copie a URL gerada

### 5. Configurar a URL do GAS
Edite o `config.js` e substitua `SEU_ID_AQUI` pelo ID do seu deploy:
```js
GAS_URL: 'https://script.google.com/macros/s/SEU_ID/exec',
```

---

## Instalar no celular

**Android (Chrome):**  
Abra o link → menu (⋮) → "Adicionar à tela inicial"

**iPhone (Safari):**  
Abra o link → compartilhar (□↑) → "Adicionar à Tela de Início"

---

## Roadmap

- [x] Estrutura base PWA
- [x] Login
- [x] Dashboard com resumo
- [x] Listagem de Insumos com busca
- [x] Listagem de PA com busca
- [x] Listagem de OPs
- [x] Listagem de Movimentos
- [ ] Detalhe de Insumo (saldo por endereço, histórico)
- [ ] Detalhe de PA
- [ ] Modal de baixa PA + baixa automática de insumos (Estrutura de Produtos)
- [ ] Modal de baixa Triangular + baixa automática de insumos
- [ ] Modal de baixa via BOM
- [ ] Embarque / DI
- [ ] Cartões / impressão


## Resumo do Estado Atual — Projeto futura-estoque

### 📁 Repositório GitHub
`futura-estoque` — GitHub Pages (PWA mobile-first)

---

### ✅ O que está pronto

**Infraestrutura**
- PWA instalável no celular (manifest.json + service worker)
- Login com sessionStorage — pede login ao fechar o browser
- Backend `Code_novo.gs` separado do sistema atual (zero impacto no que funciona)
- Comunicação via `fetch() → doPost` no GAS

**Telas implementadas**
- Dashboard com resumo (insumos ativos, PAs, estoque crítico, OPs abertas)
- Lista de Insumos com busca multi-termo + foto thumbnail
- Lista de PA com busca multi-termo + foto thumbnail
- Lista de OPs abertas com busca
- Lista de Movimentos (insumos e PA) com filtro

**Modais**
- Detalhe de Insumo — foto banner 200px, saldo total, endereços, botões entrada/saída
- Detalhe de PA — foto banner 200px, saldo, endereços, estrutura de insumos
- Movimento Insumo (entrada/saída manual)
- Movimento PA (entrada/saída manual)
- Pagar OP — escolha entre BOM, PA Direto, Triangular
- Baixa PA via OP
- Triangular com preview em tempo real dos 3 movimentos
- **Confirmação de insumos** — lista editável com checkbox por item, saldo atual, quantidade ajustável, alerta vermelho para saldo insuficiente

**Impressão**
- Fila de impressão com barra fixa na parte inferior
- Botões Cartão G e Cartão P nos detalhes de Insumo e PA
- Envio para PrintNode (layouts G e P para insumos e PA)

**Correção do problema original**
- Baixa PA direto e Triangular agora abrem o modal de confirmação de insumos
- Insumos lidos da aba `Estrutura de Produtos` com quantidades proporcionais
- Usuário controla quais itens baixar via checkbox antes de confirmar

---

### 🔄 Pendente / Próximas etapas

- Modal BOM (baixa via insumos — opção que ainda retorna "em breve")
- Tela Embarque / DI
- Impressão de etiqueta ZPL via modal de detalhe
- Ícones PNG para o PWA (`assets/icon-192.png` e `assets/icon-512.png`)
- Publicar e testar com o GAS novo conectado à planilha real

---

### 📌 Arquivos do projeto

| Arquivo | Função |
|---|---|
| `index.html` | App completo — todas as telas e modais |
| `Code_novo.gs` | Backend API REST — 34 rotas, 1613 linhas |
| `config.js` | URL do GAS (único arquivo a editar por ambiente) |
| `manifest.json` | Configuração do PWA |
| `sw.js` | Service Worker (cache offline) |
| `README.md` | Instruções de setup |





