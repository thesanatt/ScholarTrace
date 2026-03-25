const mongoose = require('mongoose');
const crypto = require('crypto');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    uppercase: true
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate a 6-character join code before saving
classSchema.pre('save', async function (next) {
  if (!this.code) {
    let code;
    let exists = true;
    while (exists) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      exists = await mongoose.model('Class').findOne({ code });
    }
    this.code = code;
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);
