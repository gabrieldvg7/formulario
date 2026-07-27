const { createLeadService } = require('../services/leadService');

function buildErrorResponse(error) {
  const statusCode = error.statusCode || 500;

  return {
    statusCode,
    body: {
      success: false,
      message: error.message || 'Erro ao processar o lead.',
      details: error.details || 'Ocorreu um erro inesperado ao concluir o envio.'
    }
  };
}

async function createLead(req, res, _next) {
  try {
    const lead = req.body;
    console.log('[lead-controller] Requisição recebida', { body: lead });

    if (!lead || typeof lead !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Payload inválido.',
        details: 'O corpo da requisição deve ser um objeto JSON.'
      });
    }

    const requiredFields = ['companyName', 'fullName', 'phone', 'email'];
    const missingFields = requiredFields.filter((field) => !String(lead[field] || '').trim());

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios ausentes.',
        details: `Faltam campos: ${missingFields.join(', ')}`
      });
    }

    const result = await createLeadService(lead);
    console.log('[lead-controller] Lead criado com sucesso', { leadId: result.leadId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[lead-controller] Falha ao criar lead', error);
    const { statusCode, body } = buildErrorResponse(error);
    return res.status(statusCode).json(body);
  }
}

module.exports = {
  createLead
};
