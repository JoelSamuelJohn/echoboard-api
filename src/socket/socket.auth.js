const jwt = require('jsonwebtoken');

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  const trackingToken = socket.handshake.auth.trackingToken || socket.handshake.query.trackingToken;

  if (!token && !trackingToken) {
    return next(new Error('No token provided'));
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded;
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  }

  next();
};

module.exports = authenticateSocket;

