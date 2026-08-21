const pool = require('../../db');

const createTenant = async (client, { name, slug }) => {
  const result = await client.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING *`,
    [name, slug],
  );
  return result.rows[0];
};


const createUser = async (client, { tenantId, name, email, passwordHash, role }) => {
  const result = await client.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, name, email, passwordHash, role],
  );
  return result.rows[0];
};


const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users where email = $1`, [email])
  return result.rows[0];
}


const findInvitationByToken = async (token) => {
  const result = await pool.query(
    `SELECT * FROM invitations WHERE token = $1`,
    [token]
  );
  return result.rows[0];
};


const acceptInvitation = async (client, invitationId) => {
  await client.query(
    `UPDATE invitations SET accepted = true WHERE id = $1`,
    [invitationId]
  );
};


const getInvitationDetailsByToken = async (token) => {
  const result = await pool.query(
    `SELECT invitations.email, invitations.role, invitations.expires_at, invitations.accepted, tenants.name AS tenant_name
     FROM invitations
     JOIN tenants ON invitations.tenant_id = tenants.id
     WHERE invitations.token = $1`,
    [token]
  );
  return result.rows[0];
};


module.exports = { createTenant, createUser, findUserByEmail, findInvitationByToken, acceptInvitation, getInvitationDetailsByToken };