'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Video, Users, Calendar, Clock, ExternalLink, Mail, Trash2, X, Check, 
  AlertCircle, RefreshCw, Link2, Unlink, Info, Plus, UserMinus 
} from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  meet_link: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
};

type StaffMember = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
};

type Participant = {
  id: string;
  user_id: string;
  status: 'invited' | 'accepted' | 'declined' | 'tentative';
  invited_at: string;
  user?: {
    id: string;
    display_name: string | null;
  };
};

type MeetingWithParticipants = Meeting & {
  participants: Participant[];
};

type GoogleStatus = {
  isConfigured: boolean;
  isConnected: boolean;
};

type Permissions = {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSendInvites: boolean;
};

export function AdminMeetingsClient({ permissions }: { permissions: Permissions }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meet_link: '',
    start_time: '',
    end_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    participant_ids: [] as string[],
    send_invites: true,
    create_calendar_event: true,
  });
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithParticipants | null>(null);
  const [editingParticipants, setEditingParticipants] = useState(false);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, ConfirmDialog } = useConfirm();

  // Handle URL params (for OAuth callback messages)
  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    
    if (success === 'google_connected') {
      setSuccessMessage('Google Calendar connected successfully!');
      // Clear the URL param
      router.replace('/admin/meetings');
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        'oauth_denied': 'Google authorization was denied.',
        'expired_code': 'Authorization expired. Please try again.',
        'storage_failed': 'Failed to save Google credentials.',
        'google_not_configured': 'Google Calendar API is not configured.',
      };
      setError(errorMessages[errorParam] || 'An error occurred during Google authentication.');
      router.replace('/admin/meetings');
    }
  }, [searchParams, router]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch meetings, staff, and Google status
  const fetchData = useCallback(async () => {
    try {
      const [meetingsRes, staffRes, googleRes] = await Promise.all([
        fetch('/api/admin/meetings'),
        fetch('/api/admin/meetings/staff'),
        fetch('/api/admin/meetings/google/status'),
      ]);

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }

      if (googleRes.ok) {
        const googleData = await googleRes.json();
        setGoogleStatus(googleData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle Google Calendar connect
  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const res = await fetch('/api/admin/meetings/google/connect');
      const data = await res.json();
      
      if (res.ok && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to initiate Google connection');
      }
    } catch (err) {
      setError('Failed to connect to Google Calendar');
    } finally {
      setConnectingGoogle(false);
    }
  };

  // Handle Google Calendar disconnect
  const handleDisconnectGoogle = async () => {
    const confirmed = await confirm({
      title: 'Disconnect Google Calendar?',
      description: 'This will remove your Google Calendar connection. Existing meetings will not be affected.',
      confirmLabel: 'Disconnect',
      cancelLabel: 'Cancel',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/meetings/google/disconnect', {
        method: 'POST',
      });

      if (res.ok) {
        setGoogleStatus(prev => prev ? { ...prev, isConnected: false } : null);
        setSuccessMessage('Google Calendar disconnected successfully');
      } else {
        setError('Failed to disconnect Google Calendar');
      }
    } catch (err) {
      setError('Failed to disconnect Google Calendar');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create meeting');
        return;
      }

      // Reset form and refresh
      setFormData({
        title: '',
        description: '',
        meet_link: '',
        start_time: '',
        end_time: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        participant_ids: [],
        send_invites: true,
        create_calendar_event: true,
      });
      setShowForm(false);
      fetchData();
      
      // Show calendar creation status
      if (data.calendar?.created) {
        setSuccessMessage('Meeting created with Google Calendar event!');
      } else if (data.calendar?.error) {
        setSuccessMessage(`Meeting created, but calendar event failed: ${data.calendar.error}`);
      }
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle meeting deletion
  const handleDelete = async (meetingId: string) => {
    const confirmed = await confirm({
      title: 'Delete Meeting?',
      description: 'This will permanently delete the meeting and all participant records. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
        if (selectedMeeting?.id === meetingId) {
          setSelectedMeeting(null);
        }
        router.refresh();
      }
    } catch (err) {
      console.error('Error deleting meeting:', err);
    }
  };

  // Handle sending invites
  const handleSendInvites = async (meetingId: string) => {
    const confirmed = await confirm({
      title: 'Send Meeting Invites?',
      description: 'This will send Google Meet invitation emails to all participants.',
      confirmLabel: 'Send Invites',
      cancelLabel: 'Cancel',
      variant: 'info',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}/send-invites`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Invites sent: ${data.sent} successful, ${data.failed} failed`);
        if (selectedMeeting?.id === meetingId) {
          fetchMeetingDetails(meetingId);
        }
      } else {
        alert('Failed to send invites: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error sending invites:', err);
      alert('Failed to send invites');
    }
  };

  // Fetch meeting details
  const fetchMeetingDetails = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMeeting(data);
      }
    } catch (err) {
      console.error('Error fetching meeting details:', err);
    }
  };

  // Add participant to existing meeting
  const handleAddParticipant = async (meetingId: string, userId: string) => {
    if (!permissions.canEdit) return;
    setParticipantLoading(true);
    
    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: [userId], send_invites: false }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh meeting details
        await fetchMeetingDetails(meetingId);
      } else {
        setError(data.error || 'Failed to add participant');
      }
    } catch (err) {
      console.error('Error adding participant:', err);
      setError('Failed to add participant');
    } finally {
      setParticipantLoading(false);
    }
  };

  // Remove participant from meeting
  const handleRemoveParticipant = async (meetingId: string, userId: string, userName: string) => {
    if (!permissions.canEdit) return;
    
    const confirmed = await confirm({
      title: 'Remove Participant?',
      description: `Are you sure you want to remove ${userName || 'this participant'} from the meeting?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'warning',
    });

    if (!confirmed) return;

    setParticipantLoading(true);
    
    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}/participants?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Refresh meeting details
        await fetchMeetingDetails(meetingId);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove participant');
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant');
    } finally {
      setParticipantLoading(false);
    }
  };

  // Get available staff (not already participants)
  const getAvailableStaff = () => {
    if (!selectedMeeting) return staff;
    const participantIds = new Set(selectedMeeting.participants.map(p => p.user_id));
    return staff.filter(s => !participantIds.has(s.id));
  };

  // Toggle participant selection
  const toggleParticipant = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(userId)
        ? prev.participant_ids.filter((id) => id !== userId)
        : [...prev.participant_ids, userId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green dark:border-brand-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError('')} 
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 flex items-start gap-3">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{successMessage}</p>
          </div>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Calendar Connection Status */}
      {googleStatus && (
        <div className={`p-4 rounded-xl border ${
          googleStatus.isConnected 
            ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
            : googleStatus.isConfigured
            ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                googleStatus.isConnected 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : googleStatus.isConfigured
                  ? 'bg-yellow-100 dark:bg-yellow-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {googleStatus.isConnected ? (
                  <Link2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Unlink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-brand-black dark:text-brand-yellow">
                  Google Calendar {googleStatus.isConnected ? 'Connected' : 'Not Connected'}
                </h3>
                <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  {googleStatus.isConnected 
                    ? 'Your Google Calendar is connected. Meet links will be created automatically.'
                    : googleStatus.isConfigured
                    ? 'Connect your Google Calendar to auto-generate Meet links.'
                    : 'Google Calendar API is not configured. Contact your administrator.'
                  }
                </p>
              </div>
            </div>
            
            {googleStatus.isConfigured && (
              <div>
                {googleStatus.isConnected ? (
                  <button
                    onClick={handleDisconnectGoogle}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {connectingGoogle ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    Connect Google Calendar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        {permissions.canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium hover:opacity-90 transition-opacity"
          >
            <Video className="w-4 h-4" />
            {showForm ? 'Cancel' : 'New Meeting'}
          </button>
        )}
      </div>

      {/* Create Meeting Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black/50 space-y-4"
        >
          <h2 className="font-semibold text-brand-black dark:text-brand-yellow flex items-center gap-2">
            <Video className="w-5 h-5" />
            Create New Meeting
          </h2>

          {googleStatus?.isConnected && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Google Calendar is connected. A Google Meet link will be generated automatically. 
                The meeting will also appear in your Google Calendar.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Weekly Team Sync"
                className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow"
              />
            </div>

            {/* Show Meet link input only if Google is not connected or user chooses manual */}
            {(!googleStatus?.isConnected || !formData.create_calendar_event) && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-1">
                  Google Meet Link *
                </label>
                <input
                  type="url"
                  value={formData.meet_link}
                  onChange={(e) => setFormData({ ...formData, meet_link: e.target.value })}
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow"
                />
                <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 mt-1">
                  {googleStatus?.isConnected 
                    ? 'Auto-generation is disabled. Please paste a Meet link manually.'
                    : 'Create a meeting in Google Calendar and paste the Meet link here, or connect Google Calendar above.'}
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Meeting agenda and notes..."
                className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="UTC"
                className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-yellow"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.send_invites}
                  onChange={(e) => setFormData({ ...formData, send_invites: e.target.checked })}
                  className="w-4 h-4 rounded border-brand-green/30 dark:border-brand-yellow/30"
                />
                <span className="text-sm text-brand-black/70 dark:text-brand-yellow/70">
                  Send invites
                </span>
              </label>

              {googleStatus?.isConnected && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.create_calendar_event}
                    onChange={(e) => setFormData({ ...formData, create_calendar_event: e.target.checked })}
                    className="w-4 h-4 rounded border-brand-green/30 dark:border-brand-yellow/30"
                  />
                  <span className="text-sm text-brand-black/70 dark:text-brand-yellow/70">
                    Create calendar event
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Participants Selection */}
          <div>
            <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-2">
              Participants
            </label>
            <div className="border border-brand-green/20 dark:border-brand-yellow/20 rounded-lg p-3 max-h-48 overflow-y-auto">
              {staff.length === 0 ? (
                <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                  No staff members found
                </p>
              ) : (
                <div className="space-y-2">
                  {staff.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.participant_ids.includes(member.id)}
                        onChange={() => toggleParticipant(member.id)}
                        className="w-4 h-4 rounded border-brand-green/30 dark:border-brand-yellow/30"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-black dark:text-brand-yellow">
                          {member.display_name || 'Unnamed'}
                        </p>
                        <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50">
                          {member.email}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow capitalize">
                        {member.role}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.participant_ids.length > 0 && (
              <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 mt-1">
                {formData.participant_ids.length} participant(s) selected
                {googleStatus?.isConnected && formData.create_calendar_event && (
                  <span className="text-blue-600 dark:text-blue-400 ml-1">
                    (will be added to Google Calendar)
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={formLoading}
              className="py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {formLoading ? 'Creating...' : 'Create Meeting'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="py-2 px-4 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-green/30 dark:border-brand-yellow/30 rounded-xl">
            <Video className="w-12 h-12 text-brand-black/30 dark:text-brand-yellow/30 mx-auto mb-4" />
            <p className="text-brand-black/60 dark:text-brand-yellow/60">
              No meetings scheduled yet
            </p>
            {permissions.canCreate && (
              <p className="text-sm text-brand-black/40 dark:text-brand-yellow/40 mt-1">
                Click &quot;New Meeting&quot; to create your first meeting
              </p>
            )}
          </div>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 hover:border-brand-green/40 dark:hover:border-brand-yellow/40 transition-colors bg-white dark:bg-brand-black/30"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-brand-black dark:text-brand-yellow truncate">
                      {meeting.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(
                        meeting.status
                      )}`}
                    >
                      {meeting.status}
                    </span>
                  </div>

                  {meeting.description && (
                    <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 mb-2 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-brand-black/50 dark:text-brand-yellow/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(meeting.start_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                    </span>
                    <span className="text-xs">({meeting.timezone})</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => fetchMeetingDetails(meeting.id)}
                    className="p-2 rounded-lg hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow"
                    title="View details"
                  >
                    <Users className="w-4 h-4" />
                  </button>

                  <a
                    href={meeting.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow"
                    title="Join meeting"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {permissions.canSendInvites && (
                    <button
                      onClick={() => handleSendInvites(meeting.id)}
                      className="p-2 rounded-lg hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow"
                      title="Send invites"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}

                  {permissions.canDelete && (
                    <button
                      onClick={() => handleDelete(meeting.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-brand-black rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow">
                {selectedMeeting.title}
              </h2>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1 rounded-lg hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedMeeting.description && (
              <p className="text-brand-black/70 dark:text-brand-yellow/70 mb-4">
                {selectedMeeting.description}
              </p>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-brand-green dark:text-brand-yellow" />
                <span>{formatDate(selectedMeeting.start_time)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-brand-green dark:text-brand-yellow" />
                <span>
                  {formatTime(selectedMeeting.start_time)} - {formatTime(selectedMeeting.end_time)} ({selectedMeeting.timezone})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-brand-green dark:text-brand-yellow" />
                <a
                  href={selectedMeeting.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-green dark:text-brand-yellow hover:underline truncate"
                >
                  {selectedMeeting.meet_link}
                </a>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-brand-black dark:text-brand-yellow flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participants ({selectedMeeting.participants.length})
                </h3>
                {permissions.canEdit && (
                  <button
                    onClick={() => setEditingParticipants(!editingParticipants)}
                    className="text-sm text-brand-green dark:text-brand-yellow hover:underline"
                  >
                    {editingParticipants ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>

              {editingParticipants && permissions.canEdit && (
                <div className="mb-4 p-3 rounded-lg bg-brand-green/5 dark:bg-brand-yellow/5 border border-brand-green/20 dark:border-brand-yellow/20">
                  <label className="block text-sm font-medium text-brand-black/70 dark:text-brand-yellow/70 mb-2">
                    Add Participants
                  </label>
                  {getAvailableStaff().length === 0 ? (
                    <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                      All staff members are already participants
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {getAvailableStaff().map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleAddParticipant(selectedMeeting.id, member.id)}
                          disabled={participantLoading}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-brand-black/50 text-left transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4 text-brand-green dark:text-brand-yellow shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-black dark:text-brand-yellow truncate">
                              {member.display_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 truncate">
                              {member.email}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow capitalize shrink-0">
                            {member.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedMeeting.participants.length === 0 ? (
                <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                  No participants added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedMeeting.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-brand-green/5 dark:bg-brand-yellow/5"
                    >
                      <span className="text-sm">
                        {participant.user?.display_name || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            participant.status === 'accepted'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : participant.status === 'declined'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : participant.status === 'tentative'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {participant.status}
                        </span>
                        {editingParticipants && permissions.canEdit && (
                          <button
                            onClick={() => handleRemoveParticipant(selectedMeeting.id, participant.user_id, participant.user?.display_name || '')}
                            disabled={participantLoading}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 disabled:opacity-50"
                            title="Remove participant"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-brand-green/10 dark:border-brand-yellow/10">
              <a
                href={selectedMeeting.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium text-center hover:opacity-90 transition-opacity"
              >
                Join Meeting
              </a>
              {permissions.canSendInvites && (
                <button
                  onClick={() => handleSendInvites(selectedMeeting.id)}
                  className="py-2 px-4 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
