const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/logs');
const classRoutes = require('./routes/classes');

app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/classes', classRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ScholarTrace backend is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
