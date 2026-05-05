import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import AddMemberModal from '../components/AddMemberModal';

const STATUSES = ['Todo', 'In Progress', 'Done'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks'); // tasks | members
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchProject = () => api.get(`/projects/${projectId}`).then(r => setProject(r.data));
  const fetchTasks = () => {
    let url = `/projects/${projectId}/tasks?`;
    if (filterStatus) url += `status=${filterStatus}&`;
    if (filterPriority) url += `priority=${filterPriority}&`;
    return api.get(url).then(r => setTasks(r.data));
  };

  const loadAll = async () => {
    setLoading(true);
    try { await Promise.all([fetchProject(), fetchTasks()]); }
      catch (err) {
         console.error('Load error:', err.response?.status, err.message);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [projectId]);
  useEffect(() => { if (!loading) fetchTasks(); }, [filterStatus, filterPriority]);

  const isAdmin = project?.members?.some(m => m.user._id === user._id && m.role === 'Admin');

  const handleSaveTask = async (formData) => {
    try {
      if (editingTask) {
        await api.put(`/projects/${projectId}/tasks/${editingTask._id}`, formData);
        toast.success('Task updated!');
      } else {
        await api.post(`/projects/${projectId}/tasks`, formData);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status });
      fetchTasks();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      toast.success('Member removed');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? This will also delete all tasks.`)) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project?.name}</h2>
          {project?.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{project?.members?.length} members · {tasks.length} tasks</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
              <button onClick={handleDeleteProject} className="btn-danger">Delete Project</button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['tasks', 'members'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <select className="input max-w-[160px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Todo</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
            <select className="input max-w-[160px]" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            {(filterStatus || filterPriority) && (
              <button className="btn-secondary text-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>Clear</button>
            )}
          </div>

          {/* Kanban-style columns */}
          {filterStatus ? (
            <div className="space-y-3">
              {tasks.length === 0 ? <p className="text-sm text-gray-400">No tasks match the filter.</p> :
                tasks.map(task => (
                  <TaskCard key={task._id} task={task} isAdmin={isAdmin}
                    onEdit={t => { setEditingTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {STATUSES.map(status => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-gray-700 text-sm">{status}</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tasksByStatus[status].length}</span>
                  </div>
                  <div className="space-y-3">
                    {tasksByStatus[status].length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No tasks</p>
                    ) : tasksByStatus[status].map(task => (
                      <TaskCard key={task._id} task={task} isAdmin={isAdmin}
                        onEdit={t => { setEditingTask(t); setShowTaskModal(true); }}
                        onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'members' && (
        <div className="max-w-2xl">
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAddMember(true)} className="btn-primary">Add Member</button>
            </div>
          )}
          <div className="space-y-3">
            {project?.members?.map(m => (
              <div key={m.user._id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {m.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{m.user.name}
                      {m.user._id === user._id && <span className="text-xs text-gray-400 ml-2">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.user._id !== user._id && (
                    <button onClick={() => handleRemoveMember(m.user._id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          members={project?.members}
          onSave={handleSaveTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onAdded={fetchProject}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
