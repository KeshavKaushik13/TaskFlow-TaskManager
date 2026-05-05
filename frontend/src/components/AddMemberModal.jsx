import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AddMemberModal({ projectId, onAdded, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?email=${query}`);
      setResults(data);
      if (data.length === 0) toast.error('No users found');
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId) => {
    setAdding(true);
    try {
      await api.post(`/projects/${projectId}/members`, { userId, role: 'Member' });
      toast.success('Member added!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h3>
        <div className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="Search by email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={searching}>
            {searching ? '...' : 'Search'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2 mb-4">
            {results.map(u => (
              <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <button className="btn-primary text-sm" onClick={() => handleAdd(u._id)} disabled={adding}>
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-secondary w-full">Cancel</button>
      </div>
    </div>
  );
}
