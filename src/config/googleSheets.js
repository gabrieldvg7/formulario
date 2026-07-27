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
    const raw = String(googleServiceAccountCredentials);
    console.log('[google-sheets] GOOGLE_SERVICE_ACCOUNT_CREDENTIALS env exists:', true);
    console.log('[google-sheets] GOOGLE_SERVICE_ACCOUNT_CREDENTIALS length:', raw.length);

    const trimmedRaw = raw.trim();
    const cleanedBase64 = trimmedRaw.replace(/\s+/g, '');
    const looksLikeJson = trimmedRaw.startsWith('{') || trimmedRaw.startsWith('[');
    const looksLikeBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanedBase64) && cleanedBase64.length % 4 === 0;

    function parseJson(text) {
      const result = JSON.parse(text);
      if (typeof result === 'string') {
        return JSON.parse(result);
      }
      return result;
    }

    try {
      if (looksLikeJson) {
        const parsed = parseJson(trimmedRaw);
        console.log('[google-sheets] Detected JSON format in GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
        return parsed;
      }

      if (looksLikeBase64) {
        const decoded = Buffer.from(cleanedBase64, 'base64').toString('utf8');
        const parsed2 = parseJson(decoded);
        console.log('[google-sheets] Detected Base64 format in GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
        return parsed2;
      }

      // fallback: try raw JSON parse and then base64 decode if necessary
      try {
        const parsed = parseJson(trimmedRaw);
        console.log('[google-sheets] Fallback parsed GOOGLE_SERVICE_ACCOUNT_CREDENTIALS as raw JSON');
        return parsed;
      } catch (err) {
        console.log('[google-sheets] Raw JSON parse failed, trying Base64 decode');
      }

      try {
        const decoded = Buffer.from(cleanedBase64, 'base64').toString('utf8');
        const parsed2 = parseJson(decoded);
        console.log('[google-sheets] Fallback parsed GOOGLE_SERVICE_ACCOUNT_CREDENTIALS as Base64');
        return parsed2;
      } catch (err2) {
        console.error('[google-sheets] ERROR parsing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS at Base64 fallback:', err2.message);
        throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS está inválido. Insira o JSON da Service Account ou base64 do JSON.');
      }
    } catch (err) {
      console.error('[google-sheets] ERROR parsing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', err.message);
      throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS está inválido. Insira o JSON da Service Account ou base64 do JSON.');
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
