const pool = require("../../db");
const {
  createTenant,
  createUser,
  findUserByEmail,
  findInvitationByToken,
  acceptInvitation,
  getInvitationDetailsByToken,
} = require("./auth.queries");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { error } = require("console");

const signup = async (req, res) => {
  const { companyName, name, email, password } = req.body;
  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const slug = companyName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tenant = await createTenant(client, { name: companyName, slug });
    const user = await createUser(client, {
      tenantId: tenant.id,
      name,
      email,
      passwordHash,
      role: 'admin',
    });
    await client.query("COMMIT");
    res.status(201).json({
      message: "Account created successfully",
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const accessToken = jwt.sign(
    { userId: user.id, tenantId: user.tenant_id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, tenant_id, role FROM users WHERE id = $1",
      [decoded.userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } finally {
    client.release();
  }
};

const acceptInvite = async (req, res) => {
  const { token } = req.params;
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  if (invitation.accepted) {
    return res.status(400).json({ error: 'Invitation already accepted' });
  }
  if (new Date() > new Date(invitation.expires_at)) {
    return res.status(400).json({ error: 'Invitation expired' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await createUser(client, {
      tenantId: invitation.tenant_id,
      name,
      email: invitation.email,
      passwordHash,
      role: invitation.role,
    });
    await acceptInvitation(client, invitation.id);
    await client.query('COMMIT');
    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not accept invitation' });
  } finally {
    client.release();
  }
};


const getInviteDetails = async (req, res) => {
  const { token } = req.params;
  const invitation = await getInvitationDetailsByToken(token);

  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found' });
  }
  if (invitation.accepted) {
    return res.status(400).json({ error: 'Invitation already accepted' });
  }
  if (new Date() > new Date(invitation.expires_at)) {
    return res.status(400).json({ error: 'Invitation expired' });
  }

  res.json({
    email: invitation.email,
    role: invitation.role,
    tenantName: invitation.tenant_name,
  });
};


module.exports = { signup, login, acceptInvite, refresh, getInviteDetails };