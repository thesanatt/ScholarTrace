const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Reuse the same logs route for both endpoints
const logsRoute = require('./routes/logs');

// 🔁 POST /api/uploadLogs
app.use('/api/uploadLogs', logsRoute);

// 🔁 GET /api/logs/:email
app.use('/api/logs', logsRoute);

const authRoute = require('./routes/auth');
app.use('/api/auth', authRoute);

mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
