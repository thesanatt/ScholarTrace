const express = require('express');
const Class = require('../models/Class');
const LogEntry = require('../models/LogEntry');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/classes — create a new class (professor only)
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const newClass = new Class({
      name,
      professor: req.professor.id
    });

    await newClass.save();

    res.status(201).json({
      id: newClass._id,
      name: newClass.name,
      code: newClass.code,
      createdAt: newClass.createdAt
    });
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/classes — list my classes (professor only)
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.find({ professor: req.professor.id })
      .sort({ createdAt: -1 });

    res.json({
      classes: classes.map(c => ({
        id: c._id,
        name: c.name,
        code: c.code,
        createdAt: c.createdAt
      }))
    });
  } catch (err) {
    console.error('List classes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/classes/verify/:code — verify a class code exists (public, for extension)
router.get('/verify/:code', async (req, res) => {
  try {
    const classDoc = await Class.findOne({ code: req.params.code.toUpperCase() });
    if (!classDoc) {
      return res.status(404).json({ error: 'Invalid class code' });
    }
    res.json({ name: classDoc.name, code: classDoc.code });
  } catch (err) {
    console.error('Verify class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/classes/:id — delete a class and all its logs (professor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const classDoc = await Class.findOne({
      _id: req.params.id,
      professor: req.professor.id
    });

    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found or not yours' });
    }

    // Delete all logs associated with this class
    const deleteResult = await LogEntry.deleteMany({ classCode: classDoc.code });

    // Delete the class itself
    await Class.deleteOne({ _id: classDoc._id });

    res.json({
      message: 'Class and all associated logs deleted',
      logsDeleted: deleteResult.deletedCount
    });
  } catch (err) {
    console.error('Delete class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
