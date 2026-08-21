const app = require("./src/app");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const authenticateSocket = require("./src/socket/socket.auth");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  },
});

const {
  init,
  addUserPresence,
  removeUserPresence,
  getOnlineUsers,
} = require("./src/socket/socket");
init(io);

io.use(authenticateSocket);

io.on('connection', (socket) => {
  const trackingToken = socket.handshake.auth.trackingToken || socket.handshake.query.trackingToken;

  if (socket.user) {
    const tenantRoom = `tenant-${socket.user.tenantId}`;
    socket.join(tenantRoom);
    addUserPresence(socket.user.tenantId, socket.user.userId);
    io.to(tenantRoom).emit("online-users", getOnlineUsers(socket.user.tenantId));

    console.log("A client connected:", socket.id, "- joined room:", tenantRoom);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      removeUserPresence(socket.user.tenantId, socket.user.userId);
      io.to(tenantRoom).emit("online-users", getOnlineUsers(socket.user.tenantId));
    });
  } else if (trackingToken) {
    const trackRoom = `track-${trackingToken}`;
    socket.join(trackRoom);
    console.log("A client connected to tracking room:", trackRoom);

    socket.on("disconnect", () => {
      console.log("Tracking client disconnected:", socket.id);
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
