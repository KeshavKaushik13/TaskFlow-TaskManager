const express = require('express');
const router = express.Router({ mergeParams: true });
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { projectMember, projectAdmin } = require('../middleware/projectAccess');
const { validate, taskSchema, taskUpdateSchema } = require('../middleware/validate');
router.get('/', protect, projectMember, async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/', protect, projectMember, projectAdmin, validate(taskSchema), async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    if (assignedTo && !req.project.isMember(assignedTo)) {
      return res.status(400).json({ message: 'Assigned user is not a project member' });
    }
    const task = await Task.create({
      title, description, status, priority, dueDate,
      assignedTo: assignedTo || null,
      project: req.params.projectId,
      createdBy: req.user._id
    });
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/:taskId', protect, projectMember, validate(taskUpdateSchema), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isAdmin = req.project.isAdmin(req.user._id);
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (isAdmin) {
      const { title, description, status, priority, dueDate, assignedTo } = req.body;
      if (assignedTo && !req.project.isMember(assignedTo)) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    } else {
      if (req.body.status) task.status = req.body.status;
    }
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/:taskId', protect, projectMember, projectAdmin, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;