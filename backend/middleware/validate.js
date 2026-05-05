const { z } = require('zod');
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
});
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['Todo', 'In Progress', 'Done']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  assignedTo: z.string().optional().nullable(),
});
const taskUpdateSchema = taskSchema.partial();
const memberSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  role: z.enum(['Admin', 'Member']).optional(),
});
const roleSchema = z.object({
  role: z.enum(['Admin', 'Member'], { errorMap: () => ({ message: 'Role must be Admin or Member' }) }),
});
// Middleware factory
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message);
    return res.status(400).json({ message: errors[0], errors });
  }
  req.body = result.data;
  next();
};
module.exports = {
  validate,
  signupSchema,
  loginSchema,
  projectSchema,
  taskSchema,
  taskUpdateSchema,
  memberSchema,
  roleSchema,
};