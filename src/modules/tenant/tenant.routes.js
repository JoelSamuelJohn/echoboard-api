const express = require('express');
const { getTenant, inviteUser, getTeamMembers } = require('./tenant.controller');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const router = express.Router();


router.get('/', authenticate, getTenant);

router.post('/invite', authenticate, requireAdmin, inviteUser)

router.get('/users', authenticate, getTeamMembers);


module.exports = router;    