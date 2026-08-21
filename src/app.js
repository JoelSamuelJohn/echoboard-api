
const express = require('express');
const cors = require('cors');
const authRouter = require('./modules/auth/auth.routes');
const tenantRouter = require('./modules/tenant/tenant.routes');
const reportsRouter = require('./modules/reports/reports.routes');
const notesRouter = require('./modules/notes/notes.routes');
const billingRouter = require('./modules/billing/billing.routes');

const app = express();

app.use(cors());

app.use('/api/billing', billingRouter);

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/reports', notesRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;

