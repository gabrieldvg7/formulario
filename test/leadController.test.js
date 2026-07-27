const test = require('node:test');
const assert = require('node:assert/strict');

const leadService = require('../src/services/leadService');
const originalCreateLeadService = leadService.createLeadService;

test('createLead returns standardized error payload when service fails', async () => {
  leadService.createLeadService = async () => {
    const error = new Error('Falha de integração com o Google Sheets');
    error.statusCode = 502;
    error.details = 'Detalhe técnico do erro';
    throw error;
  };

  delete require.cache[require.resolve('../src/controllers/leadController')];
  const { createLead } = require('../src/controllers/leadController');

  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  await createLead({ body: { companyName: 'Teste', fullName: 'Teste', phone: '11999999999', email: 'teste@example.com' } }, res, () => {});

  assert.equal(statusCode, 502);
  assert.deepEqual(responseBody, {
    success: false,
    message: 'Falha de integração com o Google Sheets',
    details: 'Detalhe técnico do erro'
  });

  leadService.createLeadService = originalCreateLeadService;
});

test('createLead rejects payloads with missing required fields', async () => {
  delete require.cache[require.resolve('../src/controllers/leadController')];
  const { createLead } = require('../src/controllers/leadController');

  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  await createLead({ body: { companyName: 'Teste' } }, res, () => {});

  assert.equal(statusCode, 400);
  assert.deepEqual(responseBody, {
    success: false,
    message: 'Campos obrigatórios ausentes.',
    details: 'Faltam campos: fullName, phone, email'
  });

  leadService.createLeadService = originalCreateLeadService;
});
