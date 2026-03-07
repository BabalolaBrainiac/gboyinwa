'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, UserPlus, Shield, Check, X,
  ChevronDown, ChevronUp, Trash2, Mail, Key,
  Search, Edit2, Save, Camera, Loader2, AlertCircle,
  UserCircle,
} from 'lucide-react';
import { useAlert } from '@/components/ui/confirm-dialog';

const PERMISSION_GROUPS = {
  'Content': ['posts:create', 'posts:edit', 'posts:delete', 'posts:publish'],
  'Events': ['events:create', 'events:edit', 'events:delete'],
  'Documents': ['documents:view', 'documents:upload', 'documents:share', 'documents:delete', 'documents:present'],
  'Users': ['users:manage'],
  'System': ['permissions:manage'],
};

const PERMISSION_LABELS: Record<string, string> = {
  'posts:create': 'Create Posts',
  'posts:edit': 'Edit Posts',
  'posts:delete': 'Delete Posts',
  'posts:publish': 'Publish Posts',
  'events:create': 'Create Events',
  'events:edit': 'Edit Events',
  'events:delete': 'Delete Events',
  'documents:view': 'View Documents',
  'documents:upload': 'Upload Documents',
  'documents:share': 'Share Documents',
  'documents:delete': 'Delete Documents',
  'documents:present': 'Present Documents',
  'users:manage': 'Manage Users',
  'permissions:manage': 'Manage Permissions',
};

type UserRow = {
  id: string;
  role: string;
  created_at: string;
  permissions: string[];
  display_name: string | null;
  avatar_url: string | null;
};

type EditState = {
  userId: string;
  displayName: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  saving: boolean;
  error: string;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { alert, AlertDialog } = useAlert();

  // Edit permissions
  const [editingPermsUser, setEditingPermsUser] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Edit profile (name + avatar)
  const [editProfile, setEditProfile] = useState<EditState | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setFetchLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setFetchLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setFormError('');
    setFormSuccess('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), permissions }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setFormError(data.error || 'Failed to create admin'); return; }
    setEmail('');
    setPermissions([]);
    setFormSuccess(data.emailSent
      ? 'Admin created! Login credentials sent to their email.'
      : 'Admin created! Email delivery failed — contact them manually.');
    setShowAddForm(false);
    setUsers(prev => [{
      id: data.id,
      role: 'admin',
      created_at: new Date().toISOString(),
      permissions,
      display_name: null,
      avatar_url: null,
    }, ...prev]);
  }

  async function handleUpdatePermissions(userId: string) {
    setSavingPermissions(true);
    const res = await fetch(`/api/admin/users/${userId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: editingPermissions }),
    });
    setSavingPermissions(false);
    if (!res.ok) { const d = await res.json(); setFormError(d.error || 'Failed to update permissions'); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: editingPermissions } : u));
    setEditingPermsUser(null);
    setFormSuccess('Permissions updated');
    setTimeout(() => setFormSuccess(''), 3000);
  }

  function startEditProfile(user: UserRow) {
    setEditProfile({
      userId: user.id,
      displayName: user.display_name || '',
      avatarFile: null,
      avatarPreview: user.avatar_url,
      saving: false,
      error: '',
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editProfile) return;
    setEditProfile(s => s ? { ...s, saving: true, error: '' } : s);

    const formData = new FormData();
    if (editProfile.displayName.trim()) formData.append('display_name', editProfile.displayName.trim());
    if (editProfile.avatarFile) formData.append('avatar', editProfile.avatarFile);

    const res = await fetch(`/api/admin/users/${editProfile.userId}`, { method: 'PUT', body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setEditProfile(s => s ? { ...s, saving: false, error: data.error || 'Failed to save' } : s);
      return;
    }

    setUsers(prev => prev.map(u =>
      u.id === editProfile.userId
        ? { ...u, display_name: data.display_name, avatar_url: data.avatar_url }
        : u
    ));
    setEditProfile(null);
    setFormSuccess('Profile updated');
    setTimeout(() => setFormSuccess(''), 3000);
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;
    const res = await fetch(`/api/admin/users/${deletingUser}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      await alert({
        title: 'Delete Failed',
        description: d.error || 'Failed to delete user',
        variant: 'error',
      });
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== deletingUser));
    setDeletingUser(null);
    setDeleteConfirm('');
    setExpandedUser(null);
  }

  function togglePerm(perm: string, isEditing = false) {
    if (isEditing) {
      setEditingPermissions(prev => prev.includes(perm) ? prev.filter(x => x !== perm) : [...prev, perm]);
    } else {
      setPermissions(prev => prev.includes(perm) ? prev.filter(x => x !== perm) : [...prev, perm]);
    }
  }

  function toggleGroup(groupPerms: string[], isEditing = false) {
    const list = isEditing ? editingPermissions : permissions;
    const setter = isEditing ? setEditingPermissions : setPermissions;
    const allOn = groupPerms.every(p => list.includes(p));
    setter(prev => allOn ? prev.filter(p => !groupPerms.includes(p)) : Array.from(new Set([...prev, ...groupPerms])));
  }

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function UserAvatar({ user, size = 'md' }: { user: UserRow; size?: 'sm' | 'md' | 'lg' }) {
    const dim = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';
    const initials = (user.display_name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div className={`${dim} rounded-xl flex items-center justify-center overflow-hidden border shrink-0 ${
        user.role === 'superadmin'
          ? 'bg-brand-yellow/20 border-brand-yellow/30'
          : 'bg-brand-green/10 border-brand-green/20 dark:bg-brand-yellow/10 dark:border-brand-yellow/20'
      }`}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name || ''} className="w-full h-full object-cover" />
        ) : user.role === 'superadmin' ? (
          <Shield className="w-5 h-5 text-brand-yellow" />
        ) : (
          <span className="font-bold text-brand-green dark:text-brand-yellow">{initials}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-brand-green to-brand-violet rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Admins</p>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-black/60 dark:text-brand-yellow/60 text-sm">Superadmins</p>
              <p className="text-3xl font-bold text-brand-green dark:text-brand-yellow">
                {users.filter(u => u.role === 'superadmin').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-yellow" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-black/60 dark:text-brand-yellow/60 text-sm">Regular Admins</p>
              <p className="text-3xl font-bold text-brand-green dark:text-brand-yellow">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-brand-orange" />
            </div>
          </div>
        </div>
      </div>

      {/* Global feedback */}
      {formError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{formError}
        </div>
      )}
      {formSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
          <Check className="w-4 h-4 shrink-0" />{formSuccess}
        </div>
      )}

      {/* Add Admin */}
      <div className="bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-hidden">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-between p-6 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-green dark:bg-brand-yellow flex items-center justify-center">
              <Plus className="w-6 h-6 text-white dark:text-brand-black" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-brand-black dark:text-brand-yellow">Add New Admin</h3>
              <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Create account with @gboyinwa.com email</p>
            </div>
          </div>
          {showAddForm ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showAddForm && (
          <div className="border-t border-brand-green/10 dark:border-brand-yellow/10 p-6">
            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" placeholder="admin@gboyinwa.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none" />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">Only @gboyinwa.com emails are allowed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-3">Permissions</label>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(PERMISSION_GROUPS).map(([group, groupPerms]) => (
                    <div key={group} className="p-4 rounded-xl bg-brand-green/5 dark:bg-brand-yellow/5 border border-brand-green/10 dark:border-brand-yellow/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm text-brand-green dark:text-brand-yellow">{group}</span>
                        <button type="button" onClick={() => toggleGroup(groupPerms)}
                          className="text-xs text-brand-orange hover:underline">
                          {groupPerms.every(p => permissions.includes(p)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {groupPerms.map((perm) => (
                          <label key={perm} className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-brand-black/50 cursor-pointer">
                            <span className="text-sm text-brand-black/80 dark:text-brand-yellow/80">{PERMISSION_LABELS[perm] || perm}</span>
                            <button type="button" onClick={() => togglePerm(perm)}
                              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${permissions.includes(perm) ? 'bg-brand-green dark:bg-brand-yellow' : 'bg-gray-200 dark:bg-gray-700'}`}>
                              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${permissions.includes(perm) ? 'left-6' : 'left-1'}`} />
                            </button>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Key className="w-4 h-4" />Create Admin</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Users list */}
      <div className="bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-hidden">
        <div className="p-5 border-b border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-brand-black dark:text-brand-yellow">Admin Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search users..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none w-48" />
            </div>
          </div>
        </div>

        {fetchLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading users...</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-green/5 dark:divide-brand-yellow/5">
            {filteredUsers.map((u) => (
              <div key={u.id}>
                {/* Row header */}
                <div className="flex items-center gap-4 p-5 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                  <UserAvatar user={u} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-brand-black dark:text-brand-yellow text-sm">
                        {u.display_name || 'Unnamed Admin'}
                      </span>
                      {u.role === 'superadmin' && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-medium">Superadmin</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">
                      {u.role} · Joined {new Date(u.created_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEditProfile(u)}
                      className="p-2 rounded-lg hover:bg-brand-green/10 text-brand-green transition-colors"
                      title="Edit profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.role !== 'superadmin' && (
                      <button
                        onClick={() => { setDeletingUser(u.id); setDeleteConfirm(''); }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                      title="Manage permissions"
                    >
                      {expandedUser === u.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded permissions */}
                {expandedUser === u.id && (
                  <div className="px-5 pb-5">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Permissions</h4>
                        {u.role !== 'superadmin' && (
                          editingPermsUser === u.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleUpdatePermissions(u.id)} disabled={savingPermissions}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-green text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                                {savingPermissions ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : <><Save className="w-3 h-3" />Save</>}
                              </button>
                              <button onClick={() => setEditingPermsUser(null)}
                                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingPermsUser(u.id); setEditingPermissions(u.permissions); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-yellow/20 text-brand-black dark:text-brand-yellow rounded-lg hover:bg-brand-yellow/30">
                              <Edit2 className="w-3 h-3" />
                              Edit Permissions
                            </button>
                          )
                        )}
                      </div>

                      {u.role === 'superadmin' ? (
                        <p className="text-sm text-brand-yellow/70 flex items-center gap-1.5">
                          <Shield className="w-4 h-4" />
                          Superadmins have full access to everything
                        </p>
                      ) : editingPermsUser === u.id ? (
                        <div className="space-y-3">
                          {Object.entries(PERMISSION_GROUPS).map(([group, groupPerms]) => (
                            <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-brand-black dark:text-brand-yellow">{group}</span>
                                <button type="button" onClick={() => toggleGroup(groupPerms, true)}
                                  className="text-xs text-brand-orange hover:underline">
                                  {groupPerms.every(p => editingPermissions.includes(p)) ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {groupPerms.map((perm) => (
                                  <button key={perm} onClick={() => togglePerm(perm, true)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                      editingPermissions.includes(perm)
                                        ? 'bg-brand-green text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}>
                                    {PERMISSION_LABELS[perm] || perm}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : u.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {u.permissions.map((perm) => (
                            <span key={perm} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-medium">
                              <Check className="w-3 h-3" />
                              {PERMISSION_LABELS[perm] || perm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No specific permissions assigned</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <UserCircle className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  {searchTerm ? 'No users match your search' : 'No admin users found'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ EDIT PROFILE MODAL ═══════════════ */}
      {editProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setEditProfile(null); }}>
          <div className="bg-white dark:bg-[#0f1117] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-brand-black dark:text-brand-yellow">Edit Admin Profile</h3>
              <button onClick={() => setEditProfile(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-green/10 border-2 border-brand-green/20 flex items-center justify-center">
                    {editProfile.avatarPreview ? (
                      <img src={editProfile.avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-12 h-12 text-brand-green/40" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                  >
                    <Camera className="w-4 h-4 text-brand-black" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { 
                        await alert({
                          title: 'File Too Large',
                          description: 'Image must be under 5 MB',
                          variant: 'error',
                        });
                        return; 
                      }
                      const url = URL.createObjectURL(file);
                      setEditProfile(s => s ? { ...s, avatarFile: file, avatarPreview: url } : s);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">Click the camera icon to change photo</p>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={editProfile.displayName}
                  onChange={(e) => setEditProfile(s => s ? { ...s, displayName: e.target.value } : s)}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none"
                />
              </div>

              {editProfile.error && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />{editProfile.error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditProfile(null)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editProfile.saving}
                  className="flex-1 py-2.5 bg-brand-yellow text-brand-black font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {editProfile.saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ DELETE CONFIRM MODAL ═══════════════ */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f1117] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-brand-black dark:text-brand-yellow mb-1">Delete Admin?</h3>
            <p className="text-sm text-center text-gray-400 mb-5">
              This will permanently remove the admin and all their permissions.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setDeletingUser(null); setDeleteConfirm(''); }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteUser}
                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog />
    </div>
  );
}
