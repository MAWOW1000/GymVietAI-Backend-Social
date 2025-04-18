const express = require('express');
const cors = require('cors');
const http = require('http');
const routes = require('./routes');
const { errorHandler } = require('./utils/errorHandler');
const { initializeDatabase } = require('./utils/database');
const { initializeSocketIO } = require('./services/socketService');
require('dotenv').config();

// Initialize Express app
const app = express();

// Create HTTP server from Express app
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use(routes);

// Error handler
app.use(errorHandler);

// Socket.io
const io = initializeSocketIO(server);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Export for testing
module.exports = { app, startServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
} 