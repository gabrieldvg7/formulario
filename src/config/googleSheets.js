const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const {
  googleSheetId,
  googleServiceAccountCredentials,
  googleServiceAccountPath
} = require('./env');

function getCredentials() {
  if (googleServiceAccountCredentials && String(googleServiceAccountCredentials).trim()) {
    // prefer credentials provided as JSON string in env
    const raw = String(googleServiceAccountCredentials).trim();
    try {
      const parsed = JSON.parse(raw);
      console.log('[google-sheets] Using GOOGLE_SERVICE_ACCOUNT_CREDENTIALS from environment');
      return parsed;
    } catch (err) {
      // try base64 decode (some panels require encoding)
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        const parsed2 = JSON.parse(decoded);
        console.log('[google-sheets] Using GOOGLE_SERVICE_ACCOUNT_CREDENTIALS (base64) from environment');
        return parsed2;
      } catch (err2) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS está inválido. Insira o JSON da Service Account ou base64 do JSON.');
      }
    }
  }

  if (googleServiceAccountPath) {
    // allow either absolute path or path relative to project root
    const resolvedPath = path.isAbsolute(googleServiceAccountPath)
      ? googleServiceAccountPath
      : path.resolve(process.cwd(), googleServiceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Arquivo de credenciais não encontrado em ${resolvedPath}.`);
    }

    try {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      console.log('[google-sheets] Using GOOGLE_SERVICE_ACCOUNT_PATH at', resolvedPath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Não foi possível ler ou parsear o arquivo de credenciais da Service Account.');
    }
  }

  throw new Error('Credenciais da Service Account não configuradas. Defina GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ou GOOGLE_SERVICE_ACCOUNT_PATH.');
}

async function getSheetsClient() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

function getSpreadsheetId() {
  if (!googleSheetId) {
    throw new Error('GOOGLE_SHEET_ID não configurado.');
  }

  return googleSheetId;
}

module.exports = {
  getSheetsClient,
  getSpreadsheetId
};
