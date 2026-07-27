const { createLeadService } = require('../services/leadService');

async function createLead(req, res, next) {
  try {
    const lead = req.body;

    if (!lead || typeof lead !== 'object') {
      return res.status(400).json({ success: false, message: 'Payload inválido.' });
    }

    const result = await createLeadService(lead);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createLead
};
