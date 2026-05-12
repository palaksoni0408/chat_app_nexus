const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

module.exports = {
  register({ strapi }) {},

  async bootstrap({ strapi }) {
    const httpServer = strapi.server.httpServer;

    const io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket"],
    });

    strapi.io = io;

    const jwtSecret =
      strapi.config.get("plugin.users-permissions.config.jwtSecret") ||
      strapi.config.get("plugin.users-permissions.jwtSecret") ||
      "a-very-long-jwt-secret-for-dev-use-only";

    const roomUsers = {};

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication token missing"));
      }
      try {
        const decoded = jwt.verify(token, jwtSecret);
        socket.user = decoded;
        next();
      } catch {
        next(new Error("Invalid or expired token"));
      }
    });

    io.on("connection", (socket) => {
      strapi.log.info(`Socket connected: ${socket.id} — user ${socket.user?.id}`);

      socket.on("join-room", async ({ room, username, userId }) => {
        socket.join(room);
        socket.currentRoom = room;

        if (!roomUsers[room]) roomUsers[room] = [];

        const existingIndex = roomUsers[room].findIndex((u) => u.socketId === socket.id);
        if (existingIndex === -1) {
          roomUsers[room].push({ socketId: socket.id, username, userId });
        }

        io.to(room).emit("active-users", roomUsers[room]);

        try {
          const messages = await strapi
            .service("api::message.message")
            .getMessagesByRoom(room, 50);
          socket.emit("room-messages", messages);
        } catch (err) {
          strapi.log.error("Failed to fetch room messages:", err);
          socket.emit("room-messages", []);
        }
      });

      socket.on("leave-room", ({ room, username }) => {
        socket.leave(room);

        if (roomUsers[room]) {
          roomUsers[room] = roomUsers[room].filter((u) => u.socketId !== socket.id);
          io.to(room).emit("active-users", roomUsers[room]);
        }
      });

      socket.on("disconnect", () => {
        strapi.log.info(`Socket disconnected: ${socket.id}`);
        Object.keys(roomUsers).forEach((room) => {
          const before = roomUsers[room].length;
          roomUsers[room] = roomUsers[room].filter((u) => u.socketId !== socket.id);
          if (roomUsers[room].length !== before) {
            io.to(room).emit("active-users", roomUsers[room]);
          }
        });
      });
    });

    strapi.log.info("Socket.io server initialized successfully");
  },
};
