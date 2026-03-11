// =============================================================================
// PERMISSIONS SYSTEM - Granular RBAC for gboyinwa
// Only superadmin can assign permissions
// =============================================================================

// Content Management Permissions
export type ContentPermission =
  | 'posts:create'
  | 'posts:edit'
  | 'posts:delete'
  | 'posts:publish'
  | 'posts:edit_others'
  | 'events:create'
  | 'events:edit'
  | 'events:delete'
  | 'events:publish';

// User Management Permissions
export type UserPermission =
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:manage';

// Permission Management (Superadmin only)
export type PermissionManagement =
  | 'permissions:view'
  | 'permissions:assign'
  | 'permissions:manage';

// Audit & Logging Permissions
export type AuditPermission =
  | 'audit:view'
  | 'audit:export';

// Metrics & Analytics Permissions
export type MetricsPermission =
  | 'metrics:view_dashboard'
  | 'metrics:view_blog'
  | 'metrics:view_subscribers'
  | 'metrics:view_campaigns'
  | 'metrics:export';

// Subscriber Management Permissions
export type SubscriberPermission =
  | 'subscribers:view'
  | 'subscribers:manage'
  | 'subscribers:import'
  | 'subscribers:export';

// Campaign/Communication Permissions
export type CampaignPermission =
  | 'communications:view'
  | 'communications:send_staff'
  | 'communications:send_subscribers'
  | 'campaigns:view'
  | 'campaigns:create'
  | 'campaigns:edit'
  | 'campaigns:delete'
  | 'campaigns:send';

// Blog Subscription Permissions
export type BlogSubscriptionPermission =
  | 'subscriptions:view'
  | 'subscriptions:manage'
  | 'subscriptions:notify';

// Document/Pitch Management Permissions
export type DocumentPermission =
  | 'documents:view'
  | 'documents:upload'
  | 'documents:share'
  | 'documents:delete'
  | 'documents:present';

// Meeting Permissions
export type MeetingPermission =
  | 'meetings:view'
  | 'meetings:create'
  | 'meetings:edit'
  | 'meetings:delete'
  | 'meetings:send_invites';

// All Permissions Combined
export type Permission =
  | ContentPermission
  | UserPermission
  | PermissionManagement
  | MetricsPermission
  | SubscriberPermission
  | CampaignPermission
  | BlogSubscriptionPermission
  | DocumentPermission
  | AuditPermission
  | MeetingPermission;

// =============================================================================
// ALL PERMISSIONS ARRAY
// =============================================================================

export const ALL_PERMISSIONS: Permission[] = [
  // Content
  'posts:create',
  'posts:edit',
  'posts:delete',
  'posts:publish',
  'posts:edit_others',
  'events:create',
  'events:edit',
  'events:delete',
  'events:publish',
  // Users
  'users:view',
  'users:create',
  'users:edit',
  'users:delete',
  'users:manage',
  // Permissions
  'permissions:view',
  'permissions:assign',
  'permissions:manage',
  // Metrics
  'metrics:view_dashboard',
  'metrics:view_blog',
  'metrics:view_subscribers',
  'metrics:view_campaigns',
  'metrics:export',
  // Subscribers
  'subscribers:view',
  'subscribers:manage',
  'subscribers:import',
  'subscribers:export',
  // Communications & Campaigns
  'communications:view',
  'communications:send_staff',
  'communications:send_subscribers',
  'campaigns:view',
  'campaigns:create',
  'campaigns:edit',
  'campaigns:delete',
  'campaigns:send',
  // Blog Subscriptions
  'subscriptions:view',
  'subscriptions:manage',
  'subscriptions:notify',
  // Documents
  'documents:view',
  'documents:upload',
  'documents:share',
  'documents:delete',
  'documents:present',
  // Audit
  'audit:view',
  'audit:export',
  // Meetings
  'meetings:view',
  'meetings:create',
  'meetings:edit',
  'meetings:delete',
  'meetings:send_invites',
];

// =============================================================================
// PERMISSION CATEGORIES (for UI grouping)
// =============================================================================

export interface PermissionCategory {
  key: string;
  label: string;
  description: string;
  permissions: Permission[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: 'content',
    label: 'Content Management',
    description: 'Manage blog posts and events',
    permissions: [
      'posts:create',
      'posts:edit',
      'posts:delete',
      'posts:publish',
      'posts:edit_others',
      'events:create',
      'events:edit',
      'events:delete',
      'events:publish',
    ],
  },
  {
    key: 'users',
    label: 'User Management',
    description: 'Manage admin users and staff',
    permissions: [
      'users:view',
      'users:create',
      'users:edit',
      'users:delete',
      'users:manage',
    ],
  },
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Assign and manage permissions (Superadmin only)',
    permissions: [
      'permissions:view',
      'permissions:assign',
      'permissions:manage',
    ],
  },
  {
    key: 'metrics',
    label: 'Analytics & Metrics',
    description: 'View dashboard and analytics',
    permissions: [
      'metrics:view_dashboard',
      'metrics:view_blog',
      'metrics:view_subscribers',
      'metrics:view_campaigns',
      'metrics:export',
    ],
  },
  {
    key: 'subscribers',
    label: 'Subscriber Management',
    description: 'Manage blog subscribers',
    permissions: [
      'subscribers:view',
      'subscribers:manage',
      'subscribers:import',
      'subscribers:export',
    ],
  },
  {
    key: 'communications',
    label: 'Communications',
    description: 'Send emails to staff and subscribers',
    permissions: [
      'communications:view',
      'communications:send_staff',
      'communications:send_subscribers',
    ],
  },
  {
    key: 'campaigns',
    label: 'Email Campaigns',
    description: 'Create and manage email campaigns',
    permissions: [
      'campaigns:view',
      'campaigns:create',
      'campaigns:edit',
      'campaigns:delete',
      'campaigns:send',
    ],
  },
  {
    key: 'subscriptions',
    label: 'Blog Subscriptions',
    description: 'Manage blog subscription notifications',
    permissions: [
      'subscriptions:view',
      'subscriptions:manage',
      'subscriptions:notify',
    ],
  },
  {
    key: 'documents',
    label: 'Documents & Pitches',
    description: 'Manage pitch documents and share with stakeholders',
    permissions: [
      'documents:view',
      'documents:upload',
      'documents:share',
      'documents:delete',
      'documents:present',
    ],
  },
  {
    key: 'audit',
    label: 'Audit & Logs',
    description: 'View audit logs and system activity (Superadmin only)',
    permissions: [
      'audit:view',
      'audit:export',
    ],
  },
  {
    key: 'meetings',
    label: 'Meetings',
    description: 'Create and manage team meetings with Google Meet',
    permissions: [
      'meetings:view',
      'meetings:create',
      'meetings:edit',
      'meetings:delete',
      'meetings:send_invites',
    ],
  },
];

// =============================================================================
// PERMISSION LABELS (for UI display)
// =============================================================================

export const PERMISSION_LABELS: Record<Permission, { label: string; description: string }> = {
  // Content
  'posts:create': { label: 'Create Posts', description: 'Create new blog posts' },
  'posts:edit': { label: 'Edit Own Posts', description: 'Edit posts they created' },
  'posts:delete': { label: 'Delete Own Posts', description: 'Delete posts they created' },
  'posts:publish': { label: 'Publish Posts', description: 'Publish blog posts' },
  'posts:edit_others': { label: 'Edit Others Posts', description: 'Edit any blog post' },
  'events:create': { label: 'Create Events', description: 'Create new events' },
  'events:edit': { label: 'Edit Events', description: 'Edit existing events' },
  'events:delete': { label: 'Delete Events', description: 'Delete events' },
  'events:publish': { label: 'Publish Events', description: 'Publish events' },
  // Users
  'users:view': { label: 'View Users', description: 'View user list' },
  'users:create': { label: 'Create Users', description: 'Create new users' },
  'users:edit': { label: 'Edit Users', description: 'Edit user details' },
  'users:delete': { label: 'Delete Users', description: 'Delete users' },
  'users:manage': { label: 'Full User Management', description: 'Complete user management access' },
  // Permissions
  'permissions:view': { label: 'View Permissions', description: 'View permission assignments' },
  'permissions:assign': { label: 'Assign Permissions', description: 'Assign permissions to users (Superadmin only)' },
  'permissions:manage': { label: 'Manage Permissions', description: 'Full permission management (Superadmin only)' },
  // Metrics
  'metrics:view_dashboard': { label: 'View Dashboard', description: 'Access main dashboard metrics' },
  'metrics:view_blog': { label: 'View Blog Metrics', description: 'View blog post analytics' },
  'metrics:view_subscribers': { label: 'View Subscriber Metrics', description: 'View subscriber analytics' },
  'metrics:view_campaigns': { label: 'View Campaign Metrics', description: 'View email campaign analytics' },
  'metrics:export': { label: 'Export Metrics', description: 'Export analytics data' },
  // Subscribers
  'subscribers:view': { label: 'View Subscribers', description: 'View subscriber list' },
  'subscribers:manage': { label: 'Manage Subscribers', description: 'Add, edit, remove subscribers' },
  'subscribers:import': { label: 'Import Subscribers', description: 'Import subscribers from CSV' },
  'subscribers:export': { label: 'Export Subscribers', description: 'Export subscriber list' },
  // Communications
  'communications:view': { label: 'View Communications', description: 'Access communications tab' },
  'communications:send_staff': { label: 'Email Staff', description: 'Send emails to staff members' },
  'communications:send_subscribers': { label: 'Email Subscribers', description: 'Send emails to blog subscribers' },
  // Campaigns
  'campaigns:view': { label: 'View Campaigns', description: 'View email campaigns' },
  'campaigns:create': { label: 'Create Campaigns', description: 'Create new email campaigns' },
  'campaigns:edit': { label: 'Edit Campaigns', description: 'Edit existing campaigns' },
  'campaigns:delete': { label: 'Delete Campaigns', description: 'Delete campaigns' },
  'campaigns:send': { label: 'Send Campaigns', description: 'Send campaigns to recipients' },
  // Subscriptions
  'subscriptions:view': { label: 'View Subscriptions', description: 'View subscription settings' },
  'subscriptions:manage': { label: 'Manage Subscriptions', description: 'Manage subscription settings' },
  'subscriptions:notify': { label: 'Send Notifications', description: 'Send blog post notifications to subscribers' },
  // Documents
  'documents:view': { label: 'View Documents', description: 'View uploaded documents and pitches' },
  'documents:upload': { label: 'Upload Documents', description: 'Upload new documents to R2 storage' },
  'documents:share': { label: 'Share Documents', description: 'Share documents via email with stakeholders' },
  'documents:delete': { label: 'Delete Documents', description: 'Delete uploaded documents' },
  'documents:present': { label: 'Present Documents', description: 'Present/pitch documents in fullscreen mode' },
  // Audit
  'audit:view': { label: 'View Audit Logs', description: 'View system audit logs and activity history' },
  'audit:export': { label: 'Export Audit Logs', description: 'Export audit logs for compliance' },
  // Meetings
  'meetings:view': { label: 'View Meetings', description: 'View scheduled meetings' },
  'meetings:create': { label: 'Create Meetings', description: 'Create new meetings with Google Meet' },
  'meetings:edit': { label: 'Edit Meetings', description: 'Edit meeting details' },
  'meetings:delete': { label: 'Delete Meetings', description: 'Delete meetings' },
  'meetings:send_invites': { label: 'Send Invites', description: 'Send meeting invitations to staff' },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function hasPermission(
  role: string,
  permissions: Permission[],
  permission: Permission
): boolean {
  // Superadmin has all permissions
  if (role === 'superadmin') return true;
  return permissions.includes(permission);
}

export function hasAnyPermission(
  role: string,
  permissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  if (role === 'superadmin') return true;
  return requiredPermissions.some((p) => permissions.includes(p));
}

export function hasAllPermissions(
  role: string,
  permissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  if (role === 'superadmin') return true;
  return requiredPermissions.every((p) => permissions.includes(p));
}

// Check if user can view communications tab
export function canViewCommunications(role: string, permissions: Permission[]): boolean {
  return hasPermission(role, permissions, 'communications:view');
}

// Check if user can send emails to staff
export function canSendStaffEmails(role: string, permissions: Permission[]): boolean {
  return hasPermission(role, permissions, 'communications:send_staff');
}

// Check if user can send emails to subscribers
export function canSendSubscriberEmails(role: string, permissions: Permission[]): boolean {
  return hasPermission(role, permissions, 'communications:send_subscribers');
}

// Check if user can view subscribers
export function canViewSubscribers(role: string, permissions: Permission[]): boolean {
  return hasPermission(role, permissions, 'subscribers:view');
}

// Check if user can manage campaigns
export function canManageCampaigns(role: string, permissions: Permission[]): boolean {
  return hasAnyPermission(role, permissions, [
    'campaigns:view',
    'campaigns:create',
    'campaigns:edit',
    'campaigns:delete',
    'campaigns:send',
  ]);
}

// Check if user can view metrics dashboard
export function canViewDashboard(role: string, permissions: Permission[]): boolean {
  return hasPermission(role, permissions, 'metrics:view_dashboard');
}

// Get permissions that only superadmin can assign
export function getSuperadminOnlyPermissions(): Permission[] {
  return [
    'permissions:assign',
    'permissions:manage',
    'users:manage',
    'campaigns:send',
    'communications:send_subscribers',
  ];
}

// Check if permission requires superadmin to assign
export function requiresSuperadmin(permission: Permission): boolean {
  return getSuperadminOnlyPermissions().includes(permission);
}
