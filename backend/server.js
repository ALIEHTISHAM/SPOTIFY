// REMOVE cluster logic and run as a single process

// Import Winston logger
const logger = require('./src/logger');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 