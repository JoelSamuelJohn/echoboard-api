const pool = require('../../db');

const createNote = async ({ reportId, userId, content }) => {
  const result = await pool.query(
    `INSERT INTO notes (report_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [reportId, userId, content] 
  );
  return result.rows[0];
};

const getNotesByReport = async (reportId) => {
  const result = await pool.query(
    `SELECT * FROM notes WHERE report_id = $1 ORDER BY created_at ASC`,
    [reportId]
  );
  return result.rows;
};

const createReply = async ({ reportId, userId, content }) => {
  const result = await pool.query(
    `INSERT INTO public_replies (report_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [reportId, userId, content]
  );
  return result.rows[0];
};

const getRepliesByReport = async (reportId) => {
  const result = await pool.query(
    `SELECT * FROM public_replies WHERE report_id = $1 ORDER BY created_at ASC`,
    [reportId]
  );
  return result.rows;
};

module.exports = { createNote, getNotesByReport, createReply, getRepliesByReport };