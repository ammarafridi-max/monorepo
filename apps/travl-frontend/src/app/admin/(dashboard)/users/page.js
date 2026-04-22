'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, Plus, Pencil, Trash2, X, Loader2, Search, Eye, EyeOff } from 'lucide-react';
import { useGetAdminUsers }    from '@travel-suite/frontend-shared/hooks/admin-users/useGetAdminUsers';
import { useCreateAdminUser }  from '@travel-suite/frontend-shared/hooks/admin-users/useCreateAdminUser';
import { useUpdateAdminUser }  from '@travel-suite/frontend-shared/hooks/admin-users/useUpdateAdminUser';
import { deleteAdminUserApi }  from '@travel-suite/frontend-shared/services/apiAdminUsers';

/* --- Config ----------------------------------------------------------------- */

const ROLES = ['admin', 'agent', 'blog-manager'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

const ROLE_CFG = {
  admin:          { label: 'Admin',        cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  agent:          { label: 'Agent',        cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  'blog-manager': { label: 'Blog Manager', cls: 'bg-green-50  text-green-700  border-green-200'  },
};

const STATUS_CFG = {
  ACTIVE:   { dot: 'bg-green-500', cls: 'text-green-700'  },
  INACTIVE: { dot: 'bg-gray-400',  cls: 'text-gray-500'   },
};

/* --- Helpers ---------------------------------------------------------------- */

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] ?? { label: role, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }) {
  const cfg = STATUS_CFG[status] ?? { dot: 'bg-gray-400', cls: 'text-gray-500' };
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  );
}

/* --- Modal ------------------------------------------------------------------ */

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

const EMPTY_CREATE = { name: '', username: '', email: '', password: '', role: 'agent', status: 'ACTIVE' };
const EMPTY_EDIT   = { name: '', email: '',                                role: 'agent', status: 'ACTIVE' };

function UserModal({ initial, onClose, onSave, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    isEdit
      ? { name: initial.name, email: initial.email, role: initial.role, status: initial.status }
      : EMPTY_CREATE,
  );
  const [showPw, setShowPw] = useState(false);

  function set(key, value) { setForm((p) => ({ ...p, [key]: value })); }

  const canSave = isEdit
    ? form.name.trim() && form.email.trim()
    : form.name.trim() && form.username.trim() && form.email.trim() && form.password.length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">{isEdit ? 'Edit User' : 'New User'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Smith" maxLength={100} className={inputCls} />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username <span className="text-red-500">*</span></label>
              <input type="text" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase())} placeholder="janesmith01" minLength={8} maxLength={50} className={`${inputCls} font-mono`} />
              <p className="text-[11px] text-gray-400 mt-1">Min. 8 characters, lowercase.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" className={inputCls} />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role <span className="text-red-500">*</span></label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <label key={s} className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                  form.status === s ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set('status', s)} className="sr-only" />
                  <span className={`w-1.5 h-1.5 rounded-full ${s === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {s === 'ACTIVE' ? 'Active' : 'Inactive'}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Page ------------------------------------------------------------------- */

export default function UsersPage() {
  const [search, setSearch]  = useState('');
  const [role, setRole]      = useState('');
  const [status, setStatus]  = useState('');
  const [modal,    setModal]    = useState(null); // null | 'new' | user object
  const [deleteId, setDeleteId] = useState(null); // username

  const { users = [], isLoadingUsers } = useGetAdminUsers({
    search: search.trim() || undefined,
    role: role || undefined,
    status: status || undefined,
  });
  const { createUser, isCreating }     = useCreateAdminUser();
  const { updateUser, isUpdating }     = useUpdateAdminUser();

  // useDeleteUser takes username at init — not suitable for a list.
  // Using useMutation directly so any row can be deleted.
  const queryClient = useQueryClient();
  const { mutate: deleteUser, isPending: isDeletingUser } = useMutation({
    mutationFn: (username) => deleteAdminUserApi(username),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('User could not be deleted'),
  });

  const saving = isCreating || isUpdating;

  function handleSave(form) {
    if (modal === 'new') {
      createUser(form, { onSuccess: () => setModal(null) });
    } else {
      updateUser(
        { username: modal.username, userData: { name: form.name, email: form.email, role: form.role, status: form.status } },
        { onSuccess: () => setModal(null) },
      );
    }
  }

  function handleDelete(username) {
    deleteUser(username, { onSettled: () => setDeleteId(null) });
  }

  return (
    <>
      {modal && (
        <UserModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Admin Users</h2>
            <p className="text-sm text-gray-400 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={14} /> New User
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, or email"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">All roles</option>
              {ROLES.map((item) => (
                <option key={item} value={item}>{ROLE_CFG[item]?.label ?? item}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Users size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">No users yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first user to grant admin access.</p>
              </div>
              <button onClick={() => setModal('new')} className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors">
                <Plus size={13} /> New User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['User', 'Email', 'Role', 'Status', 'Created', ''].map((h, i) => (
                      <th key={i} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user._id} className={`hover:bg-gray-50/60 transition-colors group ${isDeletingUser ? 'pointer-events-none' : ''}`}>

                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary-700">
                              {user.name?.charAt(0).toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-snug">{user.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">@{user.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>

                      {/* Role */}
                      <td className="px-4 py-3"><RoleBadge role={user.role} /></td>

                      {/* Status */}
                      <td className="px-4 py-3"><StatusDot status={user.status} /></td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(user.createdAt)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3 w-28">
                        {deleteId === user.username ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                            <button onClick={() => handleDelete(user.username)} className="font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition whitespace-nowrap">Yes</button>
                            <button onClick={() => setDeleteId(null)} className="font-bold px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModal(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(user.username)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
