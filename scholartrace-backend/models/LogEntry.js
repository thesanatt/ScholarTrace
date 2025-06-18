const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
	studentEmail: String,
	timestamp: Date,
	filename: String,
	content: String
});

module.exports = mongoose.model('LogEntry', logSchema);