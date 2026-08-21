const pool = require('../../db');

const findTenantBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT * FROM tenants WHERE slug = $1`,
    [slug]
  );
  return result.rows[0];
};


const createReport = async ({ tenantId, title, description, category, submitterName, submitterEmail, trackingToken }) => {
  const result = await pool.query(
    `INSERT INTO reports (tenant_id, title, description, category, submitter_name, submitter_email, tracking_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, title, description, category, submitterName, submitterEmail, trackingToken]
  );
  return result.rows[0];
};


const getReportsByTenant = async (tenantId) => {
  const result = await pool.query(
    `SELECT * FROM reports WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
};


const getReportById = async (id, tenantId) => {
  const result = await pool.query(
    `SELECT * FROM reports WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0];
};

const getReportByTrackingToken = async (trackingToken) => {
  const result = await pool.query(
    `SELECT * FROM reports WHERE tracking_token = $1`,
    [trackingToken]
  );
  return result.rows[0];
};

const updateReportStatus = async (id, tenantId, status) => {
  const result = await pool.query(
    `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
    [status, id, tenantId]
  );
  return result.rows[0];
};


const updateReportAiCategory = async (id, aiCategory) => {
  const result = await pool.query(
    `UPDATE reports SET ai_category = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [aiCategory, id]
  );
  return result.rows[0];
};


const getOpenReportsByTenant = async (tenantId, excludeId) => {
  const result = await pool.query(
    `SELECT id, title, description FROM reports 
     WHERE tenant_id = $1 AND status NOT IN ('resolved', 'duplicate') AND id != $2`,
    [tenantId, excludeId]
  );
  return result.rows;
};


const markReportAsDuplicate = async (id, duplicateOfId) => {
  const result = await pool.query(
    `UPDATE reports SET duplicate_of = $1, status = 'duplicate', updated_at = NOW() WHERE id = $2 RETURNING *`,
    [duplicateOfId, id]
  );
  return result.rows[0];
};


module.exports = { findTenantBySlug, createReport, getReportsByTenant, getReportById, updateReportStatus, updateReportAiCategory, getOpenReportsByTenant, markReportAsDuplicate, getReportByTrackingToken };