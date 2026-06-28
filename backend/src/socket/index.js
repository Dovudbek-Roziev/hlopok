// Socket.io real-time ulanishlar / Socket.io real-time connections
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (io) => {
  // Autentifikatsiya middleware / Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('role');
        socket.userId = decoded.id;
        socket.userRole = user?.role;
      }
      next();
    } catch {
      next(); // Token yo'q bo'lsa ham ulanishga ruxsat / Allow connection without token
    }
  });

  io.on('connection', (socket) => {
    // Foydalanuvchi o'z xonasiga kiradi / User joins their room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Admin xonasiga kirish / Admin joins admin room
    if (socket.userRole === 'admin') {
      socket.join('admin');
    }

    // join_admin event fallback — in case middleware ran before token was available
    socket.on('join_admin', () => {
      if (socket.userRole === 'admin') socket.join('admin');
    });

    socket.on('disconnect', () => {
      // cleanup
    });
  });
};

module.exports = initSocket;
