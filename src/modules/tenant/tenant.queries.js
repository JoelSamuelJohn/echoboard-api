const pool = require("../../db");

const findTenantById = async (id) => {
  const result = await pool.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
  return result.rows[0];
};

const createInvitation = async (tenant_id, email, role, token, expires_at) => {
  const result = await pool.query(
    `INSERT INTO invitations  (tenant_id, email, role, token, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenant_id, email, role, token, expires_at],
  );
  return result.rows[0];
};

const updateTenantStripeCustomer = async (tenantId, stripeCustomerId) => {
  await pool.query(`UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2`, [
    stripeCustomerId,
    tenantId,
  ]);
};

const updateTenantPlan = async (stripeCustomerId, plan) => {
  const creditLimit = plan === 'pro' ? 100 : 10;

  await pool.query(
    `UPDATE tenants SET plan = $1, ai_credits_limit = $2 WHERE stripe_customer_id = $3`,
    [plan, creditLimit, stripeCustomerId],
  );
};

const incrementTenantAiCredits = async (tenantId) => {
  await pool.query(
    `UPDATE tenants SET ai_credits_used = ai_credits_used + 1 WHERE id = $1`,
    [tenantId]
  );
};

const getUsersByTenant = async (tenantId) => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at ASC`,
    [tenantId]
  );
  return result.rows;
};

module.exports = {
  findTenantById,
  createInvitation,
  updateTenantStripeCustomer,
  updateTenantPlan,
  incrementTenantAiCredits,
  getUsersByTenant,
};
