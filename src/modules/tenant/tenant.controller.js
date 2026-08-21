const { findTenantById, createInvitation, getUsersByTenant } = require('./tenant.queries');
const crypto = require('crypto');

const getTenant = async (req, res) => {
  const tenantId = req.user.tenantId;
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json({ tenant });
};

const inviteUser = async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const tenantId = req.user.tenantId;
  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await createInvitation(tenantId, email, role, token, expires_at);
  res.status(201).json({ invitation });
};


const getTeamMembers = async (req, res) => {
  const tenantId = req.user.tenantId;
  const users = await getUsersByTenant(tenantId);
  res.json(users);
};

module.exports = { getTenant, inviteUser, getTeamMembers };