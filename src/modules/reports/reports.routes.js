const express = require('express')
const { submitReport, getReports, getReport, updateReport, getReportByToken } = require('./reports.controller')
const { authenticate } = require('../../middleware/auth');

const router = express.Router()

router.get('/track/:tracking_token', getReportByToken)
router.post('/:slug', submitReport)
router.get('/', authenticate, getReports)
router.get('/:id', authenticate, getReport)
router.patch('/:id/status', authenticate, updateReport)

module.exports = router