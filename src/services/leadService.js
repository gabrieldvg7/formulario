const { v4: uuidv4 } = require('uuid');
const { getSheetsClient, getSpreadsheetId } = require('../config/googleSheets');

const HEADERS = [
  'Lead ID',
  'Data/Hora',
  'Empresa',
  'Faturamento',
  'Orçamento para mídia',
  'Materiais',
  'Capacidade operacional',
  'Serviço principal',
  'Principal dificuldade',
  'Nome',
  'WhatsApp',
  'E-mail',
  'Status'
];

async function ensureSheetStructure(sheets) {
  const spreadsheetId = getSpreadsheetId();
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = metadata.data.sheets.find((item) => item.properties.title === 'Leads');

  if (!sheet) {
    throw new Error('A aba Leads não foi encontrada na planilha informada.');
  }

  const range = 'Leads!A1:A1';
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const firstRow = response.data.values?.[0] || [];

  if (firstRow.length === 0) {
    const headerRange = 'Leads!A1:M1';
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [HEADERS]
      }
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheet.properties.sheetId,
                gridProperties: {
                  frozenRowCount: 1
                }
              },
              fields: 'gridProperties.frozenRowCount'
            }
          },
          {
            repeatCell: {
              range: {
                sheetId: sheet.properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  backgroundColor: {
                    red: 0.016,
                    green: 0.686,
                    blue: 1
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1
                    },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheet.properties.sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: HEADERS.length
              }
            }
          },
          {
            setBasicFilter: {
              filter: {
                range: {
                  sheetId: sheet.properties.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1000,
                  startColumnIndex: 0,
                  endColumnIndex: HEADERS.length
                }
              }
            }
          }
        ]
      }
    });
  }
}

async function createLeadService(lead) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await ensureSheetStructure(sheets);

  const row = [
    uuidv4(),
    new Date().toISOString(),
    lead.companyName || '',
    lead.revenue || '',
    lead.budget || '',
    lead.videos || '',
    lead.capacity || '',
    lead.companyWhat || '',
    lead.difficulty || '',
    lead.fullName || '',
    lead.phone || '',
    lead.email || '',
    'Qualificado'
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Leads!A:M',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row]
    }
  });

  return { success: true, leadId: row[0] };
}

module.exports = {
  createLeadService
};
