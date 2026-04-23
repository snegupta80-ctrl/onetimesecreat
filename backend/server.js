require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Fix: Remove any duplicate MONGODB_URI= prefix from the value
let mongoUri = process.env.MONGODB_URI;
if (mongoUri && mongoUri.startsWith('MONGODB_URI=')) {
  mongoUri = mongoUri.replace(/^MONGODB_URI=/, '');
  process.env.MONGODB_URI = mongoUri;
}

// Debug: Log the MONGODB_URI
console.log('MONGODB_URI from env:', process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI?.substring(0, 20));

const authRoutes = require('./routes/auth.routes');
const secretRoutes = require('./routes/secret.routes');
const teamRoutes = require('./routes/team.routes');
const activityRoutes = require('./routes/activity.routes');

const app = express();

// Allow all local network IPs for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://192.168.0.108:5173',
  // Allow any IP on local network (192.168.x.x, 10.x.x.x, etc.)
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed or is a local IP
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.match(/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/) ||
        origin.match(/^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/) ||
        origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$/)) {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all origins
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/secrets', secretRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/activity', activityRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Zero-Knowledge One-Time Secret Sharing API' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
