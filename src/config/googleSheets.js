const path = require('path');
const { google } = require('googleapis');
const {
  googleSheetId,
  googleServiceAccountCredentials,
  googleServiceAccountPath
} = require('./env');

function getCredentials() {
  let credentials;

  if (googleServiceAccountPath && String(googleServiceAccountPath).trim()) {
    const resolvedPath = path.isAbsolute(googleServiceAccountPath)
      ? googleServiceAccountPath
      : path.resolve(process.cwd(), googleServiceAccountPath);
    credentials = require(resolvedPath);
  } else if (googleServiceAccountCredentials && String(googleServiceAccountCredentials).trim()) {
    const value = String(googleServiceAccountCredentials);

    try {
      credentials = JSON.parse(value);
    } catch (parseError) {
      credentials = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
    }

    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
  } else {
    throw new Error('Credenciais do Google não configuradas. Defina GOOGLE_SERVICE_ACCOUNT_PATH ou GOOGLE_SERVICE_ACCOUNT_CREDENTIALS.');
  }

  return credentials;
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
