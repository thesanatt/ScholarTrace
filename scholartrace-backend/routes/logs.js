const express = require('express');
const LogEntry = require('../models/LogEntry');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/logs/upload — students push logs (no auth, but requires valid class code)
router.post('/upload', async (req, res) => {
  try {
    const { studentEmail, logs, classCode } = req.body;

    if (!studentEmail || !logs) {
      return res.status(400).json({ error: 'studentEmail and logs are required' });
    }

    // If classCode is provided, validate it
    let validClassCode = null;
    if (classCode) {
      const classDoc = await Class.findOne({ code: classCode.toUpperCase() });
      if (!classDoc) {
        return res.status(400).json({ error: 'Invalid class code' });
      }
      validClassCode = classDoc.code;
    }

    // Support both array format (new) and single log format (old extension)
    if (Array.isArray(logs)) {
      const entry = new LogEntry({
        studentEmail,
        logs,
        classCode: validClassCode
      });
      await entry.save();
    } else {
      // Single log entry (old format)
      const entry = new LogEntry({
        studentEmail,
        timestamp: logs.timestamp,
        filename: logs.filename,
        content: logs.content,
        classCode: validClassCode
      });
      await entry.save();
    }

    res.status(201).json({ message: 'Logs uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/students/:classCode — list students in a class (auth required)
router.get('/students/:classCode', auth, async (req, res) => {
  try {
    // Verify professor owns this class
    const classDoc = await Class.findOne({
      code: req.params.classCode.toUpperCase(),
      professor: req.professor.id
    });

    if (!classDoc) {
      return res.status(403).json({ error: 'Not your class or invalid code' });
    }

    const students = await LogEntry.distinct('studentEmail', {
      classCode: classDoc.code
    });

    res.json({ students });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/students — list all students across all my classes (auth required)
router.get('/students', auth, async (req, res) => {
  try {
    const myClasses = await Class.find({ professor: req.professor.id });
    const classCodes = myClasses.map(c => c.code);

    // Get students from my classes + unscoped logs (old data without class codes)
    const students = await LogEntry.distinct('studentEmail', {
      $or: [
        { classCode: { $in: classCodes } },
        { classCode: null },
        { classCode: { $exists: false } }
      ]
    });

    res.json({ students });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/:email — get logs for a student (auth required)
router.get('/:email', auth, async (req, res) => {
  try {
    const myClasses = await Class.find({ professor: req.professor.id });
    const classCodes = myClasses.map(c => c.code);

    const logs = await LogEntry.find({
      studentEmail: req.params.email,
      $or: [
        { classCode: { $in: classCodes } },
        { classCode: null },
        { classCode: { $exists: false } }
      ]
    }).sort({ uploadedAt: -1 });

    res.json({ logs });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
