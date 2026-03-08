'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  User, 
  FileText, 
  Eye, 
  Share2, 
  Plus, 
  Edit, 
  Trash2,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/permissions';
import Link from 'next/link';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
  action_category?: 'create' | 'update' | 'delete' | 'share' | 'view' | 'other';
}

interface AuditStats {
  totalActions: number;
  actionsToday: number;
  actionsThisWeek: number;
  mostActiveResource: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="w-4 h-4 text-green-500" />,
  update: <Edit className="w-4 h-4 text-blue-500" />,
  delete: <Trash2 className="w-4 h-4 text-red-500" />,
  share: <Share2 className="w-4 h-4 text-purple-500" />,
  view: <Eye className="w-4 h-4 text-gray-500" />,
  other: <FileText className="w-4 h-4 text-gray-400" />,
};

const resourceColors: Record<string, string> = {
  document: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  event: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  post: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  campaign: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  subscriber: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('');
  const limit = 50;

  const canViewAudit = hasPermission(role, permissions as any, 'audit:view');

  useEffect(() => {
    if (canViewAudit) {
      fetchAuditLogs();
    }
  }, [offset, filter, canViewAudit]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());
      if (filter) params.set('resourceType', filter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canViewAudit) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-16 h-16 text-brand-yellow/30 mb-4" />
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-2">Access Restricted</h2>
        <p className="text-brand-black/60 dark:text-brand-yellow/60 text-center max-w-md">
          You don't have permission to view audit logs. This feature is only available to superadmins.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    return action.split(':').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-black dark:text-brand-yellow flex items-center gap-3">
          <Shield className="w-6 h-6" />
          Audit Logs
        </h1>
        <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1">
          Track all admin actions and system activity
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Total Actions</p>
            <p className="text-2xl font-bold text-brand-black dark:text-brand-yellow">{stats.totalActions.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Today</p>
            <p className="text-2xl font-bold text-brand-green">{stats.actionsToday}</p>
          </div>
          <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">This Week</p>
            <p className="text-2xl font-bold text-brand-yellow">{stats.actionsThisWeek}</p>
          </div>
          <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-4">
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Most Active</p>
            <p className="text-lg font-bold text-brand-orange capitalize">{stats.mostActiveResource}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-brand-black/50 rounded-lg border border-brand-green/10 dark:border-brand-yellow/10 px-3 py-2">
          <Filter className="w-4 h-4 text-brand-black/40" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setOffset(0); }}
            className="bg-transparent text-sm text-brand-black dark:text-brand-yellow focus:outline-none"
          >
            <option value="">All Resources</option>
            <option value="document">Documents</option>
            <option value="user">Users</option>
            <option value="event">Events</option>
            <option value="post">Posts</option>
            <option value="campaign">Campaigns</option>
            <option value="subscriber">Subscribers</option>
          </select>
        </div>
        
        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-green/10 dark:border-brand-yellow/10 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-green dark:text-brand-yellow" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-brand-black/50 dark:text-brand-yellow/50">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-green/5 dark:bg-brand-yellow/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Action</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Resource</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Details</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-brand-black dark:text-brand-yellow">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-green/10 dark:divide-brand-yellow/10">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {actionIcons[log.action_category || 'other']}
                          <span className="text-sm font-medium text-brand-black dark:text-brand-yellow">
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${resourceColors[log.resource_type] || 'bg-gray-100 text-gray-800'}`}>
                            {log.resource_type}
                          </span>
                          {log.resource_name && (
                            <span className="text-sm text-brand-black/70 dark:text-brand-yellow/70 truncate max-w-[150px]">
                              {log.resource_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-brand-black/40" />
                          <div>
                            <p className="text-sm text-brand-black dark:text-brand-yellow">{log.user_email || 'System'}</p>
                            {log.user_role && (
                              <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 capitalize">{log.user_role}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="text-xs text-brand-black/60 dark:text-brand-yellow/60">
                            {log.details.recipientCount && (
                              <span>{log.details.recipientCount} recipients</span>
                            )}
                            {log.details.expiration && (
                              <span> • Expires: {log.details.expiration}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-brand-black/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-green/10 dark:border-brand-yellow/10">
              <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                Showing {offset + 1} - {Math.min(offset + logs.length, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="p-2 rounded-lg border border-brand-green/10 dark:border-brand-yellow/10 disabled:opacity-50 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="p-2 rounded-lg border border-brand-green/10 dark:border-brand-yellow/10 disabled:opacity-50 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-lg bg-brand-green/5 dark:bg-brand-yellow/5 border border-brand-green/10 dark:border-brand-yellow/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-brand-black dark:text-brand-yellow mb-1">About Audit Logs</h3>
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
              Audit logs track all significant actions performed by admins in the system. This includes document shares, 
              user management, content creation, and more. Logs are retained for compliance and security purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
