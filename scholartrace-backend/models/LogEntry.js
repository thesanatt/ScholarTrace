const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  timestamp: Date,
  filename: String,
  content: String
}, { _id: false });

const logSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true, index: true },
  classCode: { type: String, index: true },
  // New format: array of snapshots
  logs: [snapshotSchema],
  // Old format: single snapshot (kept for backward compat)
  timestamp: Date,
  filename: String,
  content: String,
  // When this batch was uploaded
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LogEntry', logSchema);