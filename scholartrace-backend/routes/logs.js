const express = require('express');
const router = express.Router();
const LogEntry = require('../models/LogEntry');

// POST /api/uploadLogs — Save logs from extension
router.post('/', async (req, res) => {
  const { studentEmail, logs } = req.body;

  if (!studentEmail || !logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const entries = logs.map(entry => ({
      studentEmail,
      timestamp: entry.timestamp,
      filename: entry.filename,
      content: entry.content
    }));

    await LogEntry.insertMany(entries);
    res.status(201).json({ message: 'Logs stored successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/logs/:email — Fetch logs for a student email
router.get('/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const logs = await LogEntry.find({ studentEmail: email }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs', details: err.message });
  }
});

module.exports = router;
