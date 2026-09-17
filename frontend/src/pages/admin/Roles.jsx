import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, X, Lock } from 'lucide-react';

// One row per resource, only the actions that endpoint actually supports -
// kept in sync with backend/app/main.py's require_permission(...) calls.
// See docs/ROLES_AND_PERMISSIONS.md.
const RESOURCES = [
  { key: 'sevas', label: 'Sevas', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'day_profiles', label: 'Day Profiles', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'slots', label: 'Slots', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'bookings', label: 'Bookings', actions: ['view', 'create', 'edit', 'delete', 'reconcile'] },
  { key: 'donations', label: 'Donations', actions: ['view'] },
  { key: 'accommodations', label: 'Accommodation', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'news', label: 'News', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'panchangam', label: 'Panchangam', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'live_blog', label: 'Live Blog', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'gallery', label: 'Gallery', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'stotrams', label: 'Stotrams', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'devotees', label: 'Devotees', actions: ['view', 'edit', 'delete'] },
  { key: 'newsletter', label: 'Newsletter', actions: ['view', 'create'] },
  { key: 'contact_messages', label: 'Contact Messages', actions: ['view', 'edit'] },
  { key: 'aashirvachanam', label: 'Aashirvachanam', actions: ['view'] },
  { key: 'staff', label: 'Staff', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'roles', label: 'Roles', actions: ['view', 'create', 'edit', 'delete'] },
];

const ACTION_LABELS = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', reconcile: 'Reconcile' };
const ALL_ACTIONS = ['view', 'create', 'edit', 'delete', 'reconcile'];

// Permission keys for one row (every action that resource supports) or one
// column (that action, across every resource that supports it) - the units
// the row/column/select-all checkboxes each toggle as a group.
const rowKeys = (resource) => resource.actions.map(a => `${resource.key}:${a}`);
const columnKeys = (action) => RESOURCES.filter(r => r.actions.includes(action)).map(r => `${r.key}:${action}`);
const allKeys = () => RESOURCES.flatMap(rowKeys);

// A checkbox that shows an indeterminate dash when some but not all of its
// group is selected - plain `checked` alone can't express "partially on".
function GroupCheckbox({ keys, permissions, onToggle, testId }) {
  const allOn = keys.every(k => permissions.includes(k));
  const someOn = keys.some(k => permissions.includes(k));
  return (
    <input
      type="checkbox"
      checked={allOn}
      ref={el => { if (el) el.indeterminate = !allOn && someOn; }}
      onChange={() => onToggle(keys, allOn)}
      data-testid={testId}
    />
  );
}

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null); // role being edited in the matrix, or null

  const load = () => {
    api.get('/admin/roles').then(r => { setRoles(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const createRole = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/admin/roles', { name: newName, permissions: [] });
      setNewName('');
      setShowForm(false);
      load();
      setEditing(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create the role.');
    }
  };

  const togglePermission = (role, permission) => {
    const has = role.permissions.includes(permission);
    const next = has ? role.permissions.filter(p => p !== permission) : [...role.permissions, permission];
    setEditing({ ...role, permissions: next });
  };

  // Shared by the row, column, and "select all" checkboxes: turns a whole
  // group of permission keys on (if any are currently off) or off (if the
  // whole group is already on) in one click, instead of one checkbox at a
  // time - e.g. granting "view" everywhere, or every action on "Bookings".
  const toggleGroup = (keys, currentlyAllOn) => {
    setEditing(role => ({
      ...role,
      permissions: currentlyAllOn
        ? role.permissions.filter(p => !keys.includes(p))
        : [...new Set([...role.permissions, ...keys])],
    }));
  };

  const savePermissions = async () => {
    setError('');
    try {
      await api.put(`/admin/roles/${editing.id}`, { permissions: editing.permissions });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save permissions.');
    }
  };

  const deleteRole = async (role) => {
    setError('');
    try {
      await api.delete(`/admin/roles/${role.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete this role.');
    }
  };

  const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  if (editing) {
    return (
      <AdminLayout title={`Permissions — ${editing.name}`}>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="roles-matrix-error">{error}</p>}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => toggleGroup(allKeys(), true)} className="px-3 py-1.5 border border-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#FDFBF7]" data-testid="roles-matrix-select-all">Select All</button>
          <button onClick={() => toggleGroup(allKeys(), false)} className="px-3 py-1.5 border border-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#FDFBF7]" data-testid="roles-matrix-clear-all">Clear All</button>
        </div>
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="permissions-matrix">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Resource</th>
                  {ALL_ACTIONS.map(a => (
                    <th key={a} className="text-center px-4 py-3 font-medium text-[#5D4037]">
                      <div className="flex flex-col items-center gap-1">
                        <span>{ACTION_LABELS[a]}</span>
                        <GroupCheckbox keys={columnKeys(a)} permissions={editing.permissions} onToggle={toggleGroup} testId={`perm-col-${a}`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map(r => (
                  <tr key={r.key} className="border-b border-[#E6DCCA]/50" data-testid={`roles-matrix-row-${r.key}`}>
                    <td className="px-4 py-3 text-[#2D1B0E]">
                      <label className="flex items-center gap-2">
                        <GroupCheckbox keys={rowKeys(r)} permissions={editing.permissions} onToggle={toggleGroup} testId={`perm-row-${r.key}`} />
                        {r.label}
                      </label>
                    </td>
                    {ALL_ACTIONS.map(a => (
                      <td key={a} className="text-center px-4 py-3">
                        {r.actions.includes(a) ? (
                          <input
                            type="checkbox"
                            checked={editing.permissions.includes(`${r.key}:${a}`)}
                            onChange={() => togglePermission(editing, `${r.key}:${a}`)}
                            data-testid={`perm-${r.key}-${a}`}
                          />
                        ) : (
                          <span className="text-[#E6DCCA]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditing(null)} className="px-5 py-2 border border-[#E6DCCA] text-[#621B00] text-sm rounded-full hover:bg-[#FDFBF7]" data-testid="roles-matrix-cancel">Cancel</button>
          <button onClick={savePermissions} className="px-5 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90" data-testid="roles-matrix-save">Save Permissions</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Roles">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">Each role's permissions decide which admin screens its staff accounts can see and use.</p>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90" data-testid="roles-add-btn">
          <Plus className="h-4 w-4" /> New Role
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="roles-list-error">{error}</p>}

      {showForm && (
        <form onSubmit={createRole} className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Role Name</label>
            <input className={`${inputCls} w-full`} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Accountant" required data-testid="roles-new-name" />
          </div>
          <button type="submit" className="px-5 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90" data-testid="roles-create-btn">Create</button>
        </form>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="roles-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Permissions</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id} className="border-b border-[#E6DCCA]/50" data-testid={`roles-row-${r.id}`}>
                    <td className="px-4 py-3 text-[#2D1B0E] flex items-center gap-2">
                      {r.name}
                      {r.is_system && <span title="Built-in role"><Lock className="h-3 w-3 text-[#8D6E63]" /></span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8D6E63]">
                      {r.is_superuser ? 'All permissions (superuser)' : (r.permissions.length ? r.permissions.join(', ') : 'None yet')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {!r.is_superuser && (
                          <button onClick={() => setEditing(r)} className="px-2 py-1 bg-[#FDFBF7] border border-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#F0E6D6]" data-testid={`roles-edit-${r.id}`}>
                            Edit Permissions
                          </button>
                        )}
                        {!r.is_system && (
                          <button onClick={() => deleteRole(r)} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 inline-flex items-center gap-1" data-testid={`roles-delete-${r.id}`}>
                            <X className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
