// ═══════════════════════════════════════════════════════
//  config.js — Configuração do ambiente
//  Troque GAS_URL pela URL do novo Apps Script publicado
// ═══════════════════════════════════════════════════════

const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwgEUSW5rliLXtkzPYsFYS46BrnrCrkcCHLdwL6E3lAW9CdOlC9Enx8aN05BmZB6bOg/exec',
  TIMEOUT_MS: 60000, // 60s — GAS pode demorar até 30s em planilhas grandes
};
// A versão exibida no app é a const APP_VERSION em index.html (commit do
// frontend), não este arquivo — esse campo existia duplicado aqui sem
// nunca ser lido por nada. Ver README.md para os números de versão atuais
// (commit do frontend + deployment do Apps Script).
