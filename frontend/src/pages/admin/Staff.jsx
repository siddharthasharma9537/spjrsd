import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, KeyRound, X, Pencil, Trash2 } from 'lucide-react';

const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E] w-full";
const emptyForm = { name: '', username: '', password: '', role: '', counter_id: '' };

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    Promise.all([api.get('/admin/staff'), api.get('/admin/roles'), api.get('/admin/counters')]).then(([s, r, c]) => {
      setStaff(s.data);
      setRoles(r.data);
      setCounters(c.data);
      setLoading(false);
      setForm(f => f.role ? f : { ...f, role: r.data[0]?.name || '' });
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/staff', { ...form, counter_id: form.counter_id || null });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create the account.');
    }
  };

  const toggleActive = async (member) => {
    setListError('');
    try {
      await api.put(`/admin/staff/${member.id}`, { active_flag: !member.active_flag });
      load();
    } catch (err) {
      setListError(err.response?.data?.detail || 'Could not update that account.');
    }
  };

  const changeRole = async (member, role) => {
    setListError('');
    try {
      await api.put(`/admin/staff/${member.id}`, { role });
      load();
    } catch (err) {
      setListError(err.response?.data?.detail || 'Could not update that account.');
    }
  };

  const changeCounter = async (member, counterId) => {
    setListError('');
    try {
      // "" means "no counter" - the backend treats an explicit empty string
      // as unassign, not "leave unchanged" (see StaffUpdate.counter_id).
      await api.put(`/admin/staff/${member.id}`, { counter_id: counterId });
      load();
    } catch (err) {
      setListError(err.response?.data?.detail || 'Could not update that account.');
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (!resetTarget) return;
    setListError('');
    try {
      await api.put(`/admin/staff/${resetTarget.id}/password`, { password: resetPassword });
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setListError(err.response?.data?.detail || 'Could not reset that password.');
    }
  };

  const openEdit = (member) => {
    setListError('');
    setEditTarget(member);
    setEditForm({ name: member.name, username: member.username });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setListError('');
    try {
      await api.put(`/admin/staff/${editTarget.id}`, editForm);
      setEditTarget(null);
      load();
    } catch (err) {
      setListError(err.response?.data?.detail || 'Could not update that account.');
    }
  };

  const confirmDelete = async (member) => {
    setListError('');
    try {
      await api.delete(`/admin/staff/${member.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setListError(err.response?.data?.detail || 'Could not delete that account.');
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout title="User Accounts">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">Logins for the admin portal. Manage what each role can do under Roles, and which counter (if any) under Counters.</p>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90" data-testid="staff-add-btn">
          <Plus className="h-4 w-4" /> Add User Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
          {error && <p className="sm:col-span-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="staff-form-error">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required data-testid="staff-name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Username</label>
            <input className={inputCls} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required data-testid="staff-username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Temporary Password</label>
            <input className={inputCls} type="text" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required data-testid="staff-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Role</label>
            <select className={inputCls} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} data-testid="staff-role">
              {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Counter</label>
            <select className={inputCls} value={form.counter_id} onChange={e => setForm({ ...form, counter_id: e.target.value })} data-testid="staff-counter">
              <option value="">— No counter (office role) —</option>
              {counters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-5 flex justify-end">
            <button type="submit" className="px-5 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90" data-testid="staff-create-btn">Create Account</button>
          </div>
        </form>
      )}

      {listError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="staff-list-error">{listError}</p>}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : staff.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No user accounts yet.</p>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="staff-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Username</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Counter</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`staff-row-${s.id}`}>
                    <td className="px-4 py-3 text-[#2D1B0E]">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#621B00]">{s.username}</td>
                    <td className="px-4 py-3">
                      <select className="h-8 px-2 bg-white border border-[#E6DCCA] rounded-lg text-xs text-[#2D1B0E]" value={s.role} onChange={e => changeRole(s, e.target.value)} data-testid={`staff-role-select-${s.id}`}>
                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="h-8 px-2 bg-white border border-[#E6DCCA] rounded-lg text-xs text-[#2D1B0E]" value={s.counter_id || ''} onChange={e => changeCounter(s, e.target.value)} data-testid={`staff-counter-select-${s.id}`}>
                        <option value="">— No counter —</option>
                        {counters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active_flag ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {s.active_flag ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deleteTarget === s.id ? (
                        <div className="flex gap-1 justify-end items-center">
                          <span className="text-xs text-[#8D6E63]">Delete {s.name}?</span>
                          <button onClick={() => confirmDelete(s)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700" data-testid={`staff-delete-confirm-${s.id}`}>Confirm</button>
                          <button onClick={() => setDeleteTarget(null)} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(s)} className="px-2 py-1 bg-[#FDFBF7] border border-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#F0E6D6] inline-flex items-center gap-1" data-testid={`staff-edit-${s.id}`}>
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button onClick={() => setResetTarget(s)} className="px-2 py-1 bg-[#FDFBF7] border border-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#F0E6D6] inline-flex items-center gap-1" data-testid={`staff-reset-${s.id}`}>
                            <KeyRound className="h-3 w-3" /> Reset Password
                          </button>
                          <button onClick={() => toggleActive(s)} className={`px-2 py-1 text-xs rounded-full ${s.active_flag ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`} data-testid={`staff-toggle-${s.id}`}>
                            {s.active_flag ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => setDeleteTarget(s.id)} className="px-2 py-1 bg-[#FDFBF7] border border-[#E6DCCA] text-red-700 text-xs rounded-full hover:bg-red-50 inline-flex items-center gap-1" data-testid={`staff-delete-${s.id}`}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-english-heading text-[#621B00]">Reset password — {resetTarget.name}</h3>
              <button onClick={() => setResetTarget(null)}><X className="h-4 w-4 text-[#8D6E63]" /></button>
            </div>
            <form onSubmit={submitReset} className="space-y-4">
              <input className={inputCls} type="text" minLength={8} placeholder="New password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required data-testid="staff-reset-password-input" />
              <button type="submit" className="w-full h-10 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90" data-testid="staff-reset-submit">Set New Password</button>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-english-heading text-[#621B00]">Edit — {editTarget.name}</h3>
              <button onClick={() => setEditTarget(null)}><X className="h-4 w-4 text-[#8D6E63]" /></button>
            </div>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Name</label>
                <input className={inputCls} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required data-testid="staff-edit-name-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Username</label>
                <input className={inputCls} value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} required data-testid="staff-edit-username-input" />
              </div>
              <button type="submit" className="w-full h-10 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90" data-testid="staff-edit-submit">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
