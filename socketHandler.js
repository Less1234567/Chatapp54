const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

module.exports = (io) => {
  const connectedUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      const user = await User.findById(socket.userId);
      user.status = 'online';
      await user.save();
      connectedUsers.set(socket.userId, socket.id);

      socket.on('private-message', async (data) => {
        try {
          const message = new Message({
            sender: socket.userId,
            recipient: data.to,
            content: data.content,
            type: data.type,
            mediaUrl: data.mediaUrl
          });
          await message.save();

          const recipientSocketId = connectedUsers.get(data.to);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('new-message', {
              message,
              sender: socket.userId
            });
          }
        } catch (err) {
          console.error('Message error:', err);
        }
      });

      socket.on('disconnect', async () => {
        try {
          const user = await User.findById(socket.userId);
          user.status = 'offline';
          user.lastSeen = new Date();
          await user.save();
          connectedUsers.delete(socket.userId);
        } catch (err) {
          console.error('Disconnect error:', err);
        }
      });
    } catch (err) {
      console.error('Socket connection error:', err);
    }
  });
};
