let io;
const presence = new Map();

const init = (socketIoInstance) => {
  io = socketIoInstance;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const addUserPresence = (tenantId, userId) => {
  if (!presence.has(tenantId)) {
    presence.set(tenantId, new Map());
  }
  const tenantUsers = presence.get(tenantId);
  const currentCount = tenantUsers.get(userId) || 0;
  tenantUsers.set(userId, currentCount + 1);
};

const removeUserPresence = (tenantId, userId) => {
  const tenantUsers = presence.get(tenantId);
  if (!tenantUsers) return;
  const currentCount = tenantUsers.get(userId) || 0;
  if (currentCount <= 1) {
    tenantUsers.delete(userId);
  } else {
    tenantUsers.set(userId, currentCount - 1);
  }
};

const getOnlineUsers = (tenantId) => {
  const tenantUsers = presence.get(tenantId);
  if (!tenantUsers) return [];
  return Array.from(tenantUsers.keys());
};

module.exports = { init, getIO, addUserPresence, removeUserPresence, getOnlineUsers };
