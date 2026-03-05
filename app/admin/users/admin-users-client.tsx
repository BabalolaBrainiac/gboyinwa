'use client';

import { useState, useEffect } from 'react';
import { ALL_PERMISSIONS } from '@/lib/permissions';
import { 
  Users, Plus, UserPlus, Shield, Check, X, 
  ChevronDown, ChevronUp, Trash2, Mail, Key,
  Search, Filter
} from 'lucide-react';

const PERMISSION_GROUPS = {
  'Content': ['posts:create', 'posts:edit', 'posts:delete', 'posts:publish'],
  'Events': ['events:create', 'events:edit', 'events:delete'],
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
  'users:manage': 'Manage Users',
  'permissions:manage': 'Manage Permissions',
};

type UserRow = { 
  id: string; 
  role: string; 
  created_at: string; 
  permissions: string[];
  emailSent?: boolean;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), permissions }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Failed to create admin');
      return;
    }
    setEmail('');
    setPermissions([]);
    setSuccess(data.emailSent ? 'Admin created successfully! Login credentials sent to their email.' : 'Admin created! Email delivery failed - contact them manually.');
    setShowAddForm(false);
    setUsers((prev) => [{ 
      id: data.id, 
      role: 'admin', 
      created_at: new Date().toISOString(), 
      permissions,
      emailSent: data.emailSent 
    }, ...prev]);
  }

  function togglePerm(perm: string) {
    setPermissions((prev) => 
      prev.includes(perm) 
        ? prev.filter((x) => x !== perm) 
        : [...prev, perm]
    );
  }

  function toggleGroup(groupPerms: string[]) {
    const allSelected = groupPerms.every(p => permissions.includes(p));
    if (allSelected) {
      setPermissions(prev => prev.filter(p => !groupPerms.includes(p)));
    } else {
      setPermissions(prev => {
        const newPerms = [...prev];
        groupPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
        return newPerms;
      });
    }
  }

  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Stats */}
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

      {/* Add Admin Section */}
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
              <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                Create admin account with @gboyinwa.com email
              </p>
            </div>
          </div>
          {showAddForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showAddForm && (
          <div className="border-t border-brand-green/10 dark:border-brand-yellow/10 p-6">
            <form onSubmit={handleAddAdmin} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-black/40 dark:text-brand-yellow/40" />
                  <input
                    type="email"
                    placeholder="admin@gboyinwa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="mt-2 text-sm text-brand-black/50 dark:text-brand-yellow/50">
                  Only @gboyinwa.com email addresses are allowed
                </p>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-4">
                  Permissions
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(PERMISSION_GROUPS).map(([group, groupPerms]) => (
                    <div 
                      key={group} 
                      className="p-4 rounded-xl bg-brand-green/5 dark:bg-brand-yellow/5 border border-brand-green/10 dark:border-brand-yellow/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-brand-green dark:text-brand-yellow">{group}</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupPerms)}
                          className="text-xs text-brand-orange hover:underline"
                        >
                          {groupPerms.every(p => permissions.includes(p)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {groupPerms.map((perm) => (
                          <label 
                            key={perm} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-brand-black/50 cursor-pointer transition-colors"
                          >
                            <span className="text-sm text-brand-black/80 dark:text-brand-yellow/80">
                              {PERMISSION_LABELS[perm] || perm}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePerm(perm)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                permissions.includes(perm) 
                                  ? 'bg-brand-green dark:bg-brand-yellow' 
                                  : 'bg-brand-black/20 dark:bg-brand-yellow/20'
                              }`}
                            >
                              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                permissions.includes(perm) ? 'left-7' : 'left-1'
                              }`} />
                            </button>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <X className="w-5 h-5" />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 text-brand-black dark:text-brand-yellow font-medium hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Create Admin & Send Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-hidden">
        <div className="p-6 border-b border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-brand-black dark:text-brand-yellow">Admin Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40 dark:text-brand-yellow/40" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-brand-green/10 dark:divide-brand-yellow/10">
          {filteredUsers.map((u) => (
            <div key={u.id} className="group">
              <button
                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    u.role === 'superadmin' 
                      ? 'bg-brand-yellow/20' 
                      : 'bg-brand-green/10 dark:bg-brand-yellow/10'
                  }`}>
                    {u.role === 'superadmin' ? (
                      <Shield className="w-6 h-6 text-brand-yellow" />
                    ) : (
                      <UserPlus className="w-6 h-6 text-brand-green dark:text-brand-yellow" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-black dark:text-brand-yellow capitalize">
                        {u.role}
                      </span>
                      {u.role === 'superadmin' && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-medium">
                          Full Access
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-brand-black/50 dark:text-brand-yellow/50 font-mono">
                      ID: {u.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                    {new Date(u.created_at).toLocaleDateString('en-NG', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  {expandedUser === u.id ? (
                    <ChevronUp className="w-5 h-5 text-brand-black/40 dark:text-brand-yellow/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-brand-black/40 dark:text-brand-yellow/40" />
                  )}
                </div>
              </button>
              
              {expandedUser === u.id && u.role !== 'superadmin' && (
                <div className="px-6 pb-6">
                  <div className="p-4 rounded-xl bg-brand-green/5 dark:bg-brand-yellow/5">
                    <h4 className="text-sm font-medium text-brand-black/60 dark:text-brand-yellow/60 mb-3">
                      Assigned Permissions
                    </h4>
                    {u.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {u.permissions.map((perm) => (
                          <span 
                            key={perm}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-sm"
                          >
                            <Check className="w-3 h-3" />
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-brand-black/40 dark:text-brand-yellow/40 italic">
                        No specific permissions assigned
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-brand-black/20 dark:text-brand-yellow/20 mx-auto mb-4" />
            <p className="text-brand-black/50 dark:text-brand-yellow/50">
              {searchTerm ? 'No users match your search' : 'No admin users found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
