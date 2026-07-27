const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const credentialsEnv = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
if (credentialsEnv && String(credentialsEnv).trim()) {
  const value = String(credentialsEnv);
  let credentials;

  try {
    credentials = JSON.parse(value);
  } catch {
    credentials = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
  }

  if (credentials.private_key && typeof credentials.private_key === 'string') {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  const credentialsDir = '/app';
  const credentialsPath = path.join(credentialsDir, 'credentials.json');
  fs.mkdirSync(credentialsDir, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), 'utf8');
  process.env.GOOGLE_SERVICE_ACCOUNT_PATH = credentialsPath;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleServiceAccountCredentials: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
  googleServiceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH
};
