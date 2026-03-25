const express = require('express');
const LogEntry = require('../models/LogEntry');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/logs/upload — students push logs (no auth needed)
router.post('/upload', async (req, res) => {
  try {
    const { studentEmail, logs } = req.body;

    if (!studentEmail || !logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: 'studentEmail and logs array are required' });
    }

    const entry = new LogEntry({ studentEmail, logs });
    await entry.save();

    res.status(201).json({ message: 'Logs uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/students — list all unique student emails (auth required)
router.get('/students', auth, async (req, res) => {
  try {
    const students = await LogEntry.distinct('studentEmail');
    res.json({ students });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/:email — get logs for a student (auth required)
router.get('/:email', auth, async (req, res) => {
  try {
    const logs = await LogEntry.find({ studentEmail: req.params.email })
      .sort({ uploadedAt: -1 });
    res.json({ logs });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
