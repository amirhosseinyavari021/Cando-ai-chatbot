const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { setupLogger, httpLogger } = require('./middleware/logger');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Setup app-level logger
setupLogger(app);
app.use(httpLogger);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);

// --- API Routes ---
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));

// --- NEW ROADMAP ROUTES ---
app.use('/api/roadmap', require('./routes/roadmap'));

// --- Serve Frontend ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(buildPath));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(buildPath, 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('Cando AI API is running...');
  });
}

// --- Error Handler ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);