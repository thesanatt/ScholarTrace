const express = require('express');
const jwt = require('jsonwebtoken');
const Professor = require('../models/Professor');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if professor already exists
    const existing = await Professor.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create professor (password gets hashed by the pre-save hook)
    const professor = new Professor({ name, email, password });
    await professor.save();

    // Generate token
    const token = jwt.sign(
      { id: professor._id, email: professor.email, name: professor.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      professor: { id: professor._id, name: professor.name, email: professor.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find professor
    const professor = await Professor.findOne({ email });
    if (!professor) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await professor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: professor._id, email: professor.email, name: professor.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      professor: { id: professor._id, name: professor.name, email: professor.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
