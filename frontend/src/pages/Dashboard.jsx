import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusColor = { 'Todo': '#e5e7eb', 'In Progress': '#6366f1', 'Done': '#22c55e' };
const statusText = { 'Todo': 'text-gray-500', 'In Progress': 'text-indigo-600', 'Done': 'text-green-600' };

function DonutChart({ todo, inProgress, done }) {
  const total = todo + inProgress + done || 1;
  const data = [
    { value: todo, color: '#e5e7eb', label: 'Todo' },
    { value: inProgress, color: '#6366f1', label: 'In Progress' },
    { value: done, color: '#22c55e', label: 'Done' },
  ];

  const r = 54;
  const cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const slice = { ...d, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="18" />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-2xl font-bold" fill="#111827" fontSize="22" fontWeight="700">{todo + inProgress + done}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize="11">Total Tasks</text>
      </svg>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color, border: d.color === '#e5e7eb' ? '1px solid #d1d5db' : 'none' }} />
            <span className="text-sm text-gray-600">{d.label}</span>
            <span className="text-sm font-semibold text-gray-900 ml-auto pl-4">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const statusBadge = (status) => {
  if (status === 'Done') return <span className="badge-done">{status}</span>;
  if (status === 'In Progress') return <span className="badge-inprogress">{status}</span>;
  return <span className="badge-todo">{status}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  const { stats, recentTasks, overduelist } = data || {};
  const completionRate = stats?.totalTasks ? Math.round((stats.doneCount / stats.totalTasks) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h2>
          <p className="text-gray-500 text-sm mt-1">Here's your project overview</p>
        </div>
        <Link to="/projects" className="btn-primary text-sm">+ New Project</Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Projects" value={stats?.totalProjects ?? 0} icon="📁" color="bg-indigo-50" />
        <StatCard label="Assigned to Me" value={stats?.myTasks ?? 0} icon="👤" color="bg-blue-50" />
        <StatCard label="Overdue" value={stats?.overdueTasks ?? 0} icon="⚠️" color="bg-red-50" />
        <StatCard label="Completion" value={`${completionRate}%`} icon="🎯" color="bg-green-50" sub={`${stats?.doneCount ?? 0} of ${stats?.totalTasks ?? 0} done`} />
      </div>

      {/* Chart + Recent + Overdue */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">

        {/* Donut Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Task Breakdown</h3>
          <DonutChart
            todo={stats?.todoCount ?? 0}
            inProgress={stats?.inProgressCount ?? 0}
            done={stats?.doneCount ?? 0}
          />
          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Overall Progress</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Tasks</h3>
          {!recentTasks?.length ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm text-gray-400">No tasks yet</p>
              <Link to="/projects" className="text-indigo-600 text-sm hover:underline">Create a project</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task._id} className="flex items-start justify-between gap-2 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{task.project?.name}</p>
                  </div>
                  {statusBadge(task.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Overdue Tasks
            {overduelist?.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">{overduelist.length}</span>
            )}
          </h3>
          {!overduelist?.length ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm text-gray-400">No overdue tasks!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overduelist.map(task => (
                <div key={task._id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-800">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.project?.name}</p>
                  <p className="text-xs text-red-500 mt-0.5 font-medium">
                    Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <Link to="/projects" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            📁 View All Projects
          </Link>
          <Link to="/projects" className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
            ✅ My Assigned Tasks
          </Link>
          {overduelist?.length > 0 && (
            <Link to="/projects" className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              ⚠️ {overduelist.length} Overdue — Fix Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}