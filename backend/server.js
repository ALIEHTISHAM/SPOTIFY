const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master process running. Forking for ${numCPUs} CPUs`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting..`);
    cluster.fork();
  });
} else {
  // Import Winston logger
  const logger = require('./src/logger');

  // Global handler for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at Promise:', { reason });
  });

  // Global handler for uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', { message: err.message, stack: err.stack });
    // Do NOT exit the process; continue running as per user preference
  });

  // All workers write to the same Winston log files (error.log, combined.log) for aggregation
  require('./src/app'); // Start the Express app in each worker
} 