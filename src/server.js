import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import morgan from 'morgan';

// Import routes
import postRoutes from './routes/post.route.js';
import profileRoutes from './routes/profile.route.js';
import likeRoutes from './routes/like.route.js';
import followRoutes from './routes/follow.route.js';
import notificationRoutes from './routes/notification.route.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8081;

// CORS config
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/follows', followRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Social Service is running!',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join room for real-time notifications
  socket.on('join', ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined room user:${userId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Attach Socket.io instance to app for access in controllers
app.set('io', io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Social Service is running on port ${port}`);
}); 