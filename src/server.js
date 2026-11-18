const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/config');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./services/socket.service');

const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Attach Socket.IO to application service
initSocket(io);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`=================================================`);
      console.log(` Online Examination System Server Running `);
      console.log(` Port: ${config.port}`);
      console.log(` Environment: ${config.env}`);
      console.log(` Real-time Socket.IO: Initialized`);
      console.log(` Base API: http://localhost:${config.port}/api/v1`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    console.log('HTTP Server closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
