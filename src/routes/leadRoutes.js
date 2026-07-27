const express = require('express');
const { createLead } = require('../controllers/leadController');

const router = express.Router();

router.post('/lead', createLead);

module.exports = router;
