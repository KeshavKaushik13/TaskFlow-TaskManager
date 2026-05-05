const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  members: [memberSchema],
}, { timestamps: true });

// Virtual: get all member user ids
projectSchema.methods.isMember = function (userId) {
  return this.members.some(m => {
    const memberId = m.user._id ? m.user._id : m.user;
    return memberId.toString() === userId.toString();
  });
};

projectSchema.methods.isAdmin = function (userId) {
  return this.members.some(m => {
    const memberId = m.user._id ? m.user._id : m.user;
    return memberId.toString() === userId.toString() && m.role === 'Admin';
  });
};

module.exports = mongoose.model('Project', projectSchema);
