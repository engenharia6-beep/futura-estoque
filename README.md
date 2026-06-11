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
