const express = require('express');
const { createCheckoutSession, handleWebhook } = require('./billing.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;