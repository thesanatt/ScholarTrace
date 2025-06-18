const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const logsRoute = require('./routes/logs');
const authRoute = require('./routes/auth');

// 🔁 POST /api/uploadLogs
app.use('/api/uploadLogs', logsRoute);

// 🔁 GET /api/logs/:email
app.use('/api/logs', logsRoute);

// 🔐 Login route
app.use('/api/auth', authRoute);

// ✅ Root route to prevent "Cannot GET /"
app.get('/', (req, res) => {
  res.send('🎉 ScholarTrace backend is live and running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
