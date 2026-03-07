import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { deleteDocument } from '@/lib/documents';

export const dynamic = 'force-dynamic';

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];

    // Check if user can delete documents
    if (!hasPermission(role, permissions, 'documents:delete')) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot delete documents' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deleteDocument(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    );
  }
}
