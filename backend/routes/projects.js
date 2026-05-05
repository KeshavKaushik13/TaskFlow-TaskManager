const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { projectMember, projectAdmin } = require('../middleware/projectAccess');
const { validate, projectSchema, memberSchema, roleSchema } = require('../middleware/validate');

router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, validate(projectSchema), async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name, description,
      members: [{ user: req.user._id, role: 'Admin' }]
    });
    await project.populate('members.user', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId', protect, projectMember, (req, res) => {
  res.json(req.project);
});

router.put('/:projectId', protect, projectMember, projectAdmin, validate(projectSchema.partial()), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (name) req.project.name = name;
    if (description !== undefined) req.project.description = description;
    await req.project.save();
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:projectId', protect, projectMember, projectAdmin, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.project._id });
    await Project.findByIdAndDelete(req.project._id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:projectId/members', protect, projectMember, projectAdmin, validate(memberSchema), async (req, res) => {
  try {
    const { userId, role } = req.body;
    const alreadyMember = req.project.members.some(m => m.user._id.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'User already a member' });
    req.project.members.push({ user: userId, role: role || 'Member' });
    await req.project.save();
    await req.project.populate('members.user', 'name email');
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:projectId/members/:userId', protect, projectMember, projectAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const admins = req.project.members.filter(m => m.role === 'Admin');
    if (admins.length === 1 && admins[0].user._id.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the last Admin' });
    }
    req.project.members = req.project.members.filter(m => m.user._id.toString() !== userId);
    await req.project.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:projectId/members/:userId/role', protect, projectMember, projectAdmin, validate(roleSchema), async (req, res) => {
  try {
    const { role } = req.body;
    const member = req.project.members.find(m => m.user._id.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = role;
    await req.project.save();
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
