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
      return JSON.parse(raw);
    } catch (err) {
      // try base64 decode (some panels require encoding)
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        return JSON.parse(decoded);
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
