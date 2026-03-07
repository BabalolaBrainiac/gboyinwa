'use client';

import { useState, useEffect } from 'react';
import { UsersRound, Search, Download, Plus, Trash2, Mail, CheckCircle, XCircle, Clock, Loader2, X, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';

interface Subscriber {
  id: string;
  status: 'pending' | 'active' | 'unsubscribed' | 'bounced';
  source: string;
  first_name?: string;
  last_name?: string;
  confirmed_at?: string;
  unsubscribed_at?: string;
  created_at: string;
}

export default function SubscribersPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  const canManage = hasPermission(role, permissions, 'subscribers:manage');

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    unsubscribed: 0,
    total: 0,
  });

  // Add subscriber modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    fetchSubscribers();
    fetchStats();
  }, [filter]);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      
      const res = await fetch(`/api/admin/subscribers?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/metrics?type=subscribers');
      const data = await res.json();
      
      if (res.ok && data.stats) {
        setStats({
          active: data.stats.active_count || 0,
          pending: data.stats.pending_count || 0,
          unsubscribed: data.stats.unsubscribed_count || 0,
          total: data.stats.total_count || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscribers(subscribers.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete subscriber:', err);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError('');
    setAddSuccess('');

    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSubscriber.email,
          firstName: newSubscriber.firstName,
          lastName: newSubscriber.lastName,
          skipConfirmation: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAddSuccess(data.message || 'Subscriber added successfully');
        setNewSubscriber({ email: '', firstName: '', lastName: '' });
        fetchSubscribers();
        fetchStats();
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccess('');
        }, 1500);
      } else {
        setAddError(data.error || 'Failed to add subscriber');
      }
    } catch (err) {
      setAddError('Failed to add subscriber');
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'unsubscribed':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'unsubscribed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubscribers = subscribers.filter(s => 
    search === '' || 
    s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-black dark:text-brand-yellow flex items-center gap-3">
          <UsersRound className="w-6 h-6" />
          Subscribers
        </h1>
        <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1">
          Manage blog subscribers and view subscription analytics
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Total</p>
          <p className="text-2xl font-bold text-brand-black dark:text-brand-yellow">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Unsubscribed</p>
          <p className="text-2xl font-bold text-gray-500">{stats.unsubscribed}</p>
        </div>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40" />
          <input
            type="text"
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        {canManage && (
          <>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </>
        )}
      </div>

      {/* Subscribers table */}
      <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green dark:text-brand-yellow" />
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center py-12 text-brand-black/50 dark:text-brand-yellow/50">
            <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No subscribers found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-brand-green/5 dark:bg-brand-yellow/5">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Source</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Subscribed</th>
                {canManage && <th className="text-right px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-green/10 dark:divide-brand-yellow/10">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(subscriber.status)}
                      <span className="text-sm text-brand-black dark:text-brand-yellow">
                        {subscriber.first_name} {subscriber.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(subscriber.status)}`}>
                      {subscriber.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-black/70 dark:text-brand-yellow/70 capitalize">
                    {subscriber.source}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-black/70 dark:text-brand-yellow/70">
                    {new Date(subscriber.created_at).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete subscriber"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="bg-white dark:bg-brand-black rounded-2xl border border-brand-green/20 dark:border-brand-yellow/20 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                  <UsersRound className="w-5 h-5 text-brand-green dark:text-brand-yellow" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-black dark:text-brand-yellow">
                    Add Subscriber
                  </h3>
                  <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50">
                    Add a new email subscriber
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-brand-black/40 dark:text-brand-yellow/40 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 hover:text-brand-black dark:hover:text-brand-yellow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newSubscriber.email}
                  onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                  placeholder="subscriber@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newSubscriber.firstName}
                    onChange={(e) => setNewSubscriber({ ...newSubscriber, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newSubscriber.lastName}
                    onChange={(e) => setNewSubscriber({ ...newSubscriber, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                  />
                </div>
              </div>

              {addError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {addError}
                </div>
              )}

              {addSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {addSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 border border-brand-green/20 dark:border-brand-yellow/20 text-brand-black dark:text-brand-yellow font-medium rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !newSubscriber.email}
                  className="flex-1 py-2.5 px-4 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-sm flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add Subscriber</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
