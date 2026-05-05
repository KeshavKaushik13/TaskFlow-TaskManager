const priorityClass = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
const statusClass = { 'Todo': 'badge-todo', 'In Progress': 'badge-inprogress', 'Done': 'badge-done' };

export default function TaskCard({ task, isAdmin, onEdit, onDelete, onStatusChange }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <div className={`card border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{task.title}</h4>
        <div className="flex gap-1.5 flex-shrink-0">
          <span className={priorityClass[task.priority]}>{task.priority}</span>
          <span className={statusClass[task.status]}>{task.status}</span>
        </div>
      </div>
      {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-400 space-y-0.5">
          {task.assignedTo && <p>👤 {task.assignedTo.name}</p>}
          {task.dueDate && (
            <p className={isOverdue ? 'text-red-500 font-medium' : ''}>
              📅 {new Date(task.dueDate).toLocaleDateString()}{isOverdue ? ' (Overdue)' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Status quick change for assigned member */}
          {!isAdmin && task.status !== 'Done' && (
            <select
              className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-600"
              value={task.status}
              onChange={e => onStatusChange(task._id, e.target.value)}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          )}
          {isAdmin && (
            <>
              <button onClick={() => onEdit(task)} className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50">Edit</button>
              <button onClick={() => onDelete(task._id)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50">Del</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
