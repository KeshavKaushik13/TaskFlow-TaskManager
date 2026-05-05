const Project = require('../models/Project');

// Attach project to req, verify user is a member
const projectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied: not a project member' });
    }
    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Must be called after projectMember
const projectAdmin = (req, res, next) => {
  if (!req.project.isAdmin(req.user._id)) {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }
  next();
};

module.exports = { projectMember, projectAdmin };
