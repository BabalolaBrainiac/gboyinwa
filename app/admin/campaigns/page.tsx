'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, Send, Trash2, Loader2, Users, Mail, BarChart3 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipient_type: 'staff' | 'subscribers' | 'all';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  created_at: string;
  sent_by_email?: string;
  total_recipients?: number;
  sent_count?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  open_rate?: number;
  click_rate?: number;
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  const canCreate = hasPermission(role, permissions, 'campaigns:create');
  const canSend = hasPermission(role, permissions, 'campaigns:send');
  const canDelete = hasPermission(role, permissions, 'campaigns:delete');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    content: '',
    recipientType: 'subscribers' as 'staff' | 'subscribers' | 'all',
    sendNow: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns');
      const data = await res.json();
      
      if (res.ok) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        setForm({ name: '', subject: '', content: '', recipientType: 'subscribers', sendNow: false });
        fetchCampaigns();
      } else {
        alert(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
      if (res.ok) {
        fetchCampaigns();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send campaign');
      }
    } catch (err) {
      console.error('Failed to send campaign:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'sending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecipientLabel = (type: string) => {
    switch (type) {
      case 'staff': return 'Staff Only';
      case 'subscribers': return 'Subscribers';
      case 'all': return 'All';
      default: return type;
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black dark:text-brand-yellow flex items-center gap-3">
            <Megaphone className="w-6 h-6" />
            Email Campaigns
          </h1>
          <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1">
            Create and manage email campaigns
          </p>
        </div>
        {canCreate && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="mb-8 bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-yellow mb-4">Create New Campaign</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">Campaign Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                placeholder="Internal name for this campaign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                placeholder="Email subject line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">Recipients</label>
              <select
                value={form.recipientType}
                onChange={(e) => setForm({ ...form, recipientType: e.target.value as 'staff' | 'subscribers' | 'all' })}
                className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
              >
                <option value="subscribers">Subscribers</option>
                <option value="staff">Staff Only</option>
                <option value="all">All (Staff + Subscribers)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                placeholder="Email content (HTML supported)"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendNow"
                checked={form.sendNow}
                onChange={(e) => setForm({ ...form, sendNow: e.target.checked })}
                className="w-4 h-4 text-brand-green rounded"
              />
              <label htmlFor="sendNow" className="text-sm text-brand-black dark:text-brand-yellow">
                Send immediately after creation
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isCreating ? 'Creating...' : 'Create Campaign'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-brand-green/20 dark:border-brand-yellow/20 rounded-lg hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Campaigns list */}
      <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green dark:text-brand-yellow" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-brand-black/50 dark:text-brand-yellow/50">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No campaigns yet</p>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-brand-green dark:text-brand-yellow hover:underline"
              >
                Create your first campaign
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-green/10 dark:divide-brand-yellow/10">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-brand-black dark:text-brand-yellow">{campaign.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusClass(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-brand-black/70 dark:text-brand-yellow/70 mb-2">{campaign.subject}</p>
                    <div className="flex items-center gap-4 text-xs text-brand-black/50 dark:text-brand-yellow/50">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {getRecipientLabel(campaign.recipient_type)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {campaign.sent_count || 0} / {campaign.total_recipients || 0} sent
                      </span>
                      {campaign.open_rate !== undefined && campaign.open_rate > 0 && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {campaign.open_rate.toFixed(1)}% opened
                        </span>
                      )}
                      {campaign.sent_by_email && (
                        <span>by {campaign.sent_by_email}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="p-2 text-brand-black/60 dark:text-brand-yellow/60 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {campaign.status === 'draft' && canSend && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Send campaign"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {(campaign.status === 'draft' || campaign.status === 'cancelled') && canDelete && (
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
