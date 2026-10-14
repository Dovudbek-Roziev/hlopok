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
        const user = await User.findById(decoded.id).select('role isActive tokenVersion');
        if (!user || !user.isActive || (decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
          return next(new Error('Unauthorized'));
        }
        socket.userId = decoded.id;
        socket.userRole = user.role;
      }
      next();
    } catch {
      if (socket.handshake.auth?.token) return next(new Error('Unauthorized'));
      next(); // Guest sockets remain available for public events.
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
