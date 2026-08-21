
const { createNote, getNotesByReport, createReply, getRepliesByReport } = require("./notes.queries");
const { getReportByTrackingToken } = require("../reports/reports.queries");

const addNote = async (req, res) => {
    const reportId = req.params.id
    const userId  = req.user.userId
    const { content } = req.body
    if(!content) {
        return res.status(400).json({ error: 'credential missing'})
    }
    const note = await createNote({reportId, userId, content})
    return res.status(201).json(note)
}

const getNotes = async (req, res) => {
    const reportId = req.params.id
    const notes = await getNotesByReport(reportId)
    return res.status(200).json(notes)
}

const addReply = async (req, res) => {
    const reportId = req.params.id
    const userId  = req.user.userId
    const { content } = req.body
    if(!content) {
        return res.status(400).json({ error: 'credential missing'})
    }
    const reply = await createReply({reportId, userId, content})
    return res.status(201).json(reply)
}

const getReplies = async (req, res) => {
    const reportId = req.params.id
    const replies = await getRepliesByReport(reportId)
    return res.status(200).json(replies)
}

const getRepliesByToken = async (req, res) => {
    const trackingToken = req.params.tracking_token
    const report = await getReportByTrackingToken(trackingToken)
    if (!report) {
        return res.status(404).json({ error: 'invalid or no report' })
    }
    const replies = await getRepliesByReport(report.id)
    return res.status(200).json(replies)
}

module.exports = { addNote, getNotes, addReply, getReplies, getRepliesByToken };
