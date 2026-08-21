const express = require('express');
const router = express.Router();
const { signup, login, acceptInvite, refresh, getInviteDetails } = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');

router.post('/signup', signup);
router.post('/login', login)
router.post('/refresh', refresh);
router.get('/invite/:token', getInviteDetails);
router.post('/invite/:token', acceptInvite)

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;