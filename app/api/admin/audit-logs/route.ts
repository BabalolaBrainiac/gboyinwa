import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getAuditLogs, getAuditStats } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];

    // Only superadmins can view audit logs
    if (!hasPermission(role, permissions, 'audit:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const [logsData, stats] = await Promise.all([
      getAuditLogs({ limit, offset, action, resourceType, startDate, endDate }),
      getAuditStats(),
    ]);

    return NextResponse.json({
      logs: logsData.logs,
      total: logsData.total,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: logsData.total > offset + limit,
      },
    });
  } catch (err) {
    console.error('[audit-logs] error:', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
