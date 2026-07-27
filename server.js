const express = require('express');
const cors = require('cors');
const { port } = require('./src/config/env');
const leadRoutes = require('./src/routes/leadRoutes');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/', leadRoutes);

app.use((err, _req, res, _next) => {
  console.error('[server]', err.message || err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor.'
  });
});

app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});
