const express = require('express')
const { addNote, getNotes, addReply, getReplies, getRepliesByToken } = require('./notes.controller')
const { authenticate } = require('../../middleware/auth')

const router = express.Router()

router.post('/:id/notes', authenticate, addNote)
router.get('/:id/notes', authenticate, getNotes)
router.post('/:id/replies', authenticate, addReply)
router.get('/:id/replies', authenticate, getReplies)
router.get('/track/:tracking_token/replies', getRepliesByToken)

module.exports = router