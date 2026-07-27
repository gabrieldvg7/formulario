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
  console.log('[lead-service] Validando estrutura da aba Leads');

  try {
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = metadata.data.sheets.find((item) => item.properties.title === 'Leads');

    if (!sheet) {
      throw new Error('A aba Leads não foi encontrada na planilha informada.');
    }

    const range = 'Leads!A1:M1';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const firstRow = response.data.values?.[0] || [];
    const hasExpectedHeaders = firstRow.length >= HEADERS.length && firstRow.every((value, index) => value === HEADERS[index]);

    if (!hasExpectedHeaders) {
      console.log('[lead-service] Cabeçalhos ausentes ou incompletos; restaurando a linha de cabeçalhos.', { firstRow });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
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
    } else {
      console.log('[lead-service] Estrutura da planilha já está correta.', { firstRow });
    }
  } catch (error) {
    console.error('[lead-service] Falha ao validar a estrutura da planilha', error);
    const wrappedError = new Error('Não foi possível preparar a planilha do Google Sheets para o envio.');
    wrappedError.statusCode = 502;
    wrappedError.details = error.message || 'Erro ao validar a estrutura da sheet.';
    throw wrappedError;
  }
}

async function createLeadService(lead) {
  console.log('[lead-service] Iniciando criação do lead');
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

  console.log('[lead-service] Gravando linha na planilha', { row });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Leads!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    });
  } catch (error) {
    console.error('[lead-service] Falha ao gravar lead na planilha', error);
    const wrappedError = new Error('Falha ao gravar o lead na planilha do Google Sheets.');
    wrappedError.statusCode = 502;
    wrappedError.details = error.message || 'Erro desconhecido ao gravar a linha.';
    throw wrappedError;
  }

  return { success: true, leadId: row[0] };
}

module.exports = {
  createLeadService
};
