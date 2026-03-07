'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, Send, Trash2, Loader2, Users, Mail, BarChart3, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';
import { useConfirm, useAlert } from '@/components/ui/confirm-dialog';
import { CustomSelect } from '@/components/ui/custom-select';
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
  const { confirm, ConfirmDialog } = useConfirm();
  const { alert, AlertDialog } = useAlert();

  const canCreate = hasPermission(role, permissions, 'campaigns:create');
  const canSend = hasPermission(role, permissions, 'campaigns:send');
  const canDelete = hasPermission(role, permissions, 'campaigns:delete');
  const canEdit = hasPermission(role, permissions, 'campaigns:edit');

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
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
        await alert({
          title: 'Error',
          description: data.error || 'Failed to create campaign',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSend = async (id: string) => {
    const confirmed = await confirm({
      title: 'Send Campaign?',
      description: 'This will immediately send the campaign to all recipients. Are you sure?',
      confirmLabel: 'Send Now',
      cancelLabel: 'Cancel',
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
      if (res.ok) {
        fetchCampaigns();
      } else {
        const data = await res.json();
        await alert({
          title: 'Send Failed',
          description: data.error || 'Failed to send campaign',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to send campaign:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Campaign?',
      description: 'This will permanently remove the campaign. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 z-50 bg-brand-black dark:bg-white text-white dark:text-brand-black px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right';
    loadingToast.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Deleting...';
    document.body.appendChild(loadingToast);

    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      loadingToast.remove();
      
      if (res.ok) {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right';
        toast.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Campaign deleted';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        setCampaigns(campaigns.filter(c => c.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        await alert({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete campaign',
          variant: 'error',
        });
      }
    } catch (err) {
      loadingToast.remove();
      await alert({
        title: 'Delete Failed',
        description: 'Network error. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      content: '', // Would need to fetch full content
      recipientType: campaign.recipient_type,
      sendNow: false,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setIsUpdating(true);

    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 z-50 bg-brand-black dark:bg-white text-white dark:text-brand-black px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right';
    loadingToast.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Updating...';
    document.body.appendChild(loadingToast);

    try {
      const res = await fetch(`/api/admin/campaigns/${editingCampaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          subject: form.subject,
          recipient_type: form.recipientType,
        }),
      });

      loadingToast.remove();
      const data = await res.json();

      if (res.ok) {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right';
        toast.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Campaign updated';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        
        setEditingCampaign(null);
        setForm({ name: '', subject: '', content: '', recipientType: 'subscribers', sendNow: false });
        fetchCampaigns();
      } else {
        await alert({
          title: 'Update Failed',
          description: data.error || 'Failed to update campaign',
          variant: 'error',
        });
      }
    } catch (err) {
      loadingToast.remove();
      await alert({
        title: 'Update Failed',
        description: 'Network error. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsUpdating(false);
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
              <CustomSelect
                value={form.recipientType}
                onChange={(value) => setForm({ ...form, recipientType: value as 'staff' | 'subscribers' | 'all' })}
                options={[
                  { value: 'subscribers', label: 'Subscribers' },
                  { value: 'staff', label: 'Staff Only' },
                  { value: 'all', label: 'All (Staff + Subscribers)' },
                ]}
                label="Recipients"
              />
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
                    {/* Edit button - available for draft and sending campaigns */}
                    {(campaign.status === 'draft' || campaign.status === 'sending') && canEdit && (
                      <>
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-2 text-brand-black/60 dark:text-brand-yellow/60 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 rounded-lg transition-colors"
                          title="Edit campaign"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canSend && (
                          <button
                            onClick={() => handleSend(campaign.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Send campaign"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    {/* Delete button - available for draft, sending, and cancelled campaigns */}
                    {(campaign.status === 'draft' || campaign.status === 'sending' || campaign.status === 'cancelled') && canDelete && (
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 text-brand-black/60 dark:text-brand-yellow/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
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

      {/* Edit Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCampaign(null); }}>
          <div className="bg-white dark:bg-brand-black rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-brand-green px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Edit Campaign</h3>
                <button
                  onClick={() => setEditingCampaign(null)}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-sm text-brand-black dark:text-brand-yellow transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-brand-yellow text-brand-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog />
      <AlertDialog />
    </div>
  );
}
