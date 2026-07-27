const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: Number(process.env.PORT || 3000),
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleServiceAccountCredentials: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
  googleServiceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH
};
