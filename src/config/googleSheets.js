const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const {
  googleSheetId,
  googleServiceAccountCredentials,
  googleServiceAccountPath
} = require('./env');

function getCredentials() {
  if (googleServiceAccountCredentials) {
    try {
      return JSON.parse(googleServiceAccountCredentials);
    } catch (error) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS está inválido.');
    }
  }

  if (googleServiceAccountPath) {
    const resolvedPath = path.resolve(process.cwd(), googleServiceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Arquivo de credenciais não encontrado em ${resolvedPath}.`);
    }

    try {
      return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    } catch (error) {
      throw new Error('Não foi possível ler o arquivo de credenciais da Service Account.');
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
