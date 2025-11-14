const { Server } = require('socket.io');
let io;

function init(server, options = {}) {
  if (io) return io;
  io = new Server(server, options);

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Client should call 'join' with their userId to receive user-specific events
    socket.on('join', (data) => {
      try {
        const { userId } = data || {};
        if (userId) {
          const room = `user_${userId}`;
          socket.join(room);
          console.log(`Socket ${socket.id} joined room ${room}`);
        }
      } catch (err) {
        console.warn('Error in join handler', err);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', socket.id, reason);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Realtime not initialized. Call init(server) first.');
  return io;
}

module.exports = { init, getIO };
