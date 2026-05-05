const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/users', userRoutes);

const { protect } = require('./middleware/auth');
const Task = require('./models/Task');
const Project = require('./models/Project');

app.get('/api/dashboard', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);
    const now = new Date();

    const [totalTasks, myTasks, overdueTasks, todoCount, inProgressCount, doneCount] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ assignedTo: req.user._id }),
      Task.countDocuments({ project: { $in: projectIds }, dueDate: { $lt: now }, status: { $ne: 'Done' } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'Todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'In Progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'Done' }),
    ]);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 }).limit(5);

    const overduelist = await Task.find({
      project: { $in: projectIds }, dueDate: { $lt: now }, status: { $ne: 'Done' }
    }).populate('project', 'name').populate('assignedTo', 'name').limit(5);

    res.json({
      stats: { totalProjects: projects.length, totalTasks, myTasks, overdueTasks, todoCount, inProgressCount, doneCount },
      recentTasks, overduelist
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/', (req, res) => res.json({ message: 'Team Task Manager API running' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });
