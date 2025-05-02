const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message, Notification } = require('../models');

// Store active connections
const connectedUsers = new Map();

// Initialize socket.io with the HTTP server
const initializeSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',  // In production, specify exact origins
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user
      const user = await User.findByPk(decoded.userId);
      
      if (!user || user.status !== 'active') {
        return next(new Error('Authentication error: User not found or inactive'));
      }
      
      // Attach user to socket
      socket.user = user;
      
      // Update last active status
      user.lastActive = new Date();
      await user.save();
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: ' + error.message));
    }
  });

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Add user to connected users map
    connectedUsers.set(socket.user.id, socket.id);
    
    // Notify all friends that user is online
    notifyUserStatus(socket.user.id, true);
    
    // Join user's personal room for direct messages
    socket.join(`user:${socket.user.id}`);
    
    // Handle private message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, media } = data;
        
        if (!receiverId || !content) {
          return socket.emit('error', { 
            code: 'INVALID_DATA',
            message: 'Receiver ID and content are required' 
          });
        }
        
        // Create message in database
        const message = await Message.create({
          senderId: socket.user.id,
          receiverId,
          content,
          media
        });
        
        // Include sender info
        const messageWithSender = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'fullName', 'avatar']
            }
          ]
        });
        
        // Send to receiver if online
        if (connectedUsers.has(receiverId)) {
          io.to(`user:${receiverId}`).emit('new_message', messageWithSender);
        }
        
        // Also send back to sender
        socket.emit('message_sent', messageWithSender);
        
        // Create notification for receiver
        await Notification.create({
          type: 'message',
          message: `New message from ${socket.user.fullName}`,
          userId: receiverId,
          senderId: socket.user.id,
          targetId: message.id,
          targetType: 'message',
          data: {
            messageId: message.id
          }
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        socket.emit('error', { 
          code: 'DATABASE_ERROR',
          message: 'Failed to send message',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
    
    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId } = data;
        
        if (!messageId) {
          return socket.emit('error', { 
            code: 'INVALID_DATA',
            message: 'Message ID is required' 
          });
        }
        
        const message = await Message.findByPk(messageId);
        
        if (!message) {
          return socket.emit('error', { 
            code: 'NOT_FOUND',
            message: 'Message not found' 
          });
        }
        
        if (message.receiverId !== socket.user.id) {
          return socket.emit('error', { 
            code: 'UNAUTHORIZED',
            message: 'Unauthorized to mark this message as read' 
          });
        }
        
        // Mark as read
        await message.update({ isRead: true });
        
        // Notify sender if online
        if (connectedUsers.has(message.senderId)) {
          io.to(`user:${message.senderId}`).emit('message_read', { messageId });
        }
        
        // Confirm to the client that message was marked as read
        socket.emit('message_marked_read', { messageId });
      } catch (error) {
        console.error('Failed to mark message as read:', error);
        socket.emit('error', { 
          code: 'DATABASE_ERROR',
          message: 'Failed to mark message as read',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
      }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      
      if (connectedUsers.has(receiverId)) {
        io.to(`user:${receiverId}`).emit('user_typing', { userId: socket.user.id });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.id}`);
      
      // Remove user from connected users map
      connectedUsers.delete(socket.user.id);
      
      // Update last active status
      const user = await User.findByPk(socket.user.id);
      if (user) {
        user.lastActive = new Date();
        await user.save();
      }
      
      // Notify friends that user is offline
      notifyUserStatus(socket.user.id, false);
    });
  });
  
  return io;
};

// Helper to notify user's status to friends
const notifyUserStatus = async (userId, isOnline) => {
  // This would be expanded to notify all friends of the user's status change
  // For now, it broadcasts to all connected users
  for (const [friendId, socketId] of connectedUsers.entries()) {
    if (friendId !== userId) {
      io.to(`user:${friendId}`).emit('user_status_change', {
        userId,
        status: isOnline ? 'online' : 'offline'
      });
    }
  }
};

// Get socket instance by user ID
const getSocketByUserId = (userId) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    return io.sockets.sockets.get(socketId);
  }
  return null;
};

// Check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// Send notification to a specific user
const sendNotification = (userId, notification) => {
  if (connectedUsers.has(userId)) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Broadcast to all connected users
const broadcastToAll = (event, data) => {
  io.emit(event, data);
};

module.exports = {
  initializeSocketIO,
  getSocketByUserId,
  isUserOnline,
  sendNotification,
  broadcastToAll
}; 