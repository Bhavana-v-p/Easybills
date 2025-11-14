const { Server } = require('socket.io');
let io;

/**
 * init(server, { ioOptions, sessionMiddleware })
 * - server: http server
 * - options: may include Socket.io server options and `sessionMiddleware` to parse sessions during handshake
 */
function init(server, options = {}) {
  if (io) return io;
  const { sessionMiddleware, ...ioOptions } = options || {};

  io = new Server(server, ioOptions);

  // If a session middleware is provided, use it to populate socket.request.session
  if (sessionMiddleware) {
    // Use session middleware to parse cookies and populate session during handshake
    io.use((socket, next) => {
      try {
        sessionMiddleware(socket.request, {}, (err) => {
          if (err) return next(err);
          // session parsed (may be undefined if no session exists)
          const session = socket.request.session;
          const authed = session && session.passport && session.passport.user;
          if (!authed) {
            // Reject the handshake - strict mode: no anonymous sockets
            const e = new Error('Unauthorized');
            e.data = { message: 'Authentication required' };
            return next(e);
          }
          return next();
        });
      } catch (err) {
        return next(err);
      }
    });
  }

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Optional: attach authenticated user id if available
    try {
      const session = socket.request.session;
      const authed = session && session.passport && session.passport.user;
      if (authed) {
        socket.authUserId = session.passport.user;
      }
    } catch (err) {
      // ignore
    }

    // Client should call 'join' with their userId to receive user-specific events
    socket.on('join', (data) => {
      try {
        const { userId } = data || {};
        // If socket has authenticated user id, require it to match requested userId
        if (socket.authUserId && String(socket.authUserId) !== String(userId)) {
          socket.emit('error', 'Unauthorized to join this room');
          return;
        }

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
