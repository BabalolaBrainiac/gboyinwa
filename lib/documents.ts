import { getServiceClient } from './supabase';
import { randomBytes } from 'crypto';

export interface DocumentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  document_count?: number;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_key: string;
  file_size: number;
  file_type: string;
  file_category: string;
  category_id: string | null;
  category?: DocumentCategory;
  folder_path: string;
  is_pitch_document: boolean;
  metadata: Record<string, any>;
  view_count: number;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  uploader?: {
    display_name: string | null;
  };
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  shared_with_email: string;
  access_token: string;
  expires_at: string | null;
  message: string | null;
  viewed_at: string | null;
  created_at: string;
}

// Get all document categories
export async function getDocumentCategories(): Promise<DocumentCategory[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('document_categories')
    .select('*, documents:documents(id)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []).map(cat => ({
    ...cat,
    document_count: cat.documents?.length || 0,
  })) as DocumentCategory[];
}

// Get documents with optional filters
export async function getDocuments(options?: {
  categoryId?: string;
  folderPath?: string;
  fileType?: string;
  searchQuery?: string;
  isPitchDocument?: boolean;
}): Promise<Document[]> {
  const supabase = getServiceClient();
  
  let query = supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(*),
      uploader:users(display_name)
    `)
    .order('created_at', { ascending: false });

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.folderPath) {
    query = query.eq('folder_path', options.folderPath);
  }

  if (options?.isPitchDocument !== undefined) {
    query = query.eq('is_pitch_document', options.isPitchDocument);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  // Post-filter by file type if specified
  let documents = data || [];
  if (options?.fileType && documents.length > 0) {
    documents = documents.filter(doc => doc.file_category === options.fileType);
  }

  return documents as Document[];
}

// Search documents
export async function searchDocuments(query: string): Promise<Document[]> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(*),
      uploader:users(display_name)
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,file_name.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching documents:', error);
    return [];
  }

  return (data || []) as Document[];
}

// Get a single document by ID
export async function getDocumentById(id: string): Promise<Document | null> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(*),
      uploader:users(display_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    return null;
  }

  return data as Document;
}

// Create a new document
export async function createDocument(document: {
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_key: string;
  file_size: number;
  file_type: string;
  category_id?: string;
  folder_path: string;
  is_pitch_document: boolean;
  metadata?: Record<string, any>;
  uploaded_by: string;
}): Promise<Document | null> {
  const supabase = getServiceClient();

  // Determine file category from MIME type
  const fileCategory = getFileCategory(document.file_type);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...document,
      file_category: fileCategory,
    })
    .select(`
      *,
      category:document_categories(*),
      uploader:users(display_name)
    `)
    .single();

  if (error) {
    console.error('Error creating document:', error);
    return null;
  }

  return data as Document;
}

// Delete a document
export async function deleteDocument(id: string): Promise<boolean> {
  const supabase = getServiceClient();

  // First get the document to know what to delete from R2
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_key')
    .eq('id', id)
    .single();

  if (fetchError || !doc) {
    console.error('Error fetching document for deletion:', fetchError);
    return false;
  }

  // Delete from database (cascades to shares and views)
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting document:', deleteError);
    return false;
  }

  // Delete from R2
  try {
    const { deleteFromR2 } = await import('./r2');
    await deleteFromR2(doc.file_key);
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    // Still return true since DB record is deleted
  }

  return true;
}

// Share a document
export async function shareDocument(
  documentId: string,
  sharedBy: string,
  sharedWithEmail: string,
  message?: string,
  expiresInDays: number = 7
): Promise<DocumentShare | null> {
  const supabase = getServiceClient();

  // Generate access token
  const accessToken = generateAccessToken();

  // Calculate expiration
  const expiresAt = expiresInDays > 0 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('document_shares')
    .insert({
      document_id: documentId,
      shared_by: sharedBy,
      shared_with_email: sharedWithEmail.toLowerCase().trim(),
      access_token: accessToken,
      expires_at: expiresAt,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating share:', error);
    return null;
  }

  return data as DocumentShare;
}

// Get share by access token
export async function getShareByToken(token: string): Promise<DocumentShare | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('document_shares')
    .select('*, document:documents(*)')
    .eq('access_token', token)
    .single();

  if (error) {
    console.error('Error fetching share:', error);
    return null;
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data as DocumentShare;
}

// Mark share as viewed
export async function markShareAsViewed(token: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('document_shares')
    .update({ viewed_at: new Date().toISOString() })
    .eq('access_token', token);

  if (error) {
    console.error('Error marking share as viewed:', error);
    return false;
  }

  return true;
}

// Record document view
export async function recordDocumentView(
  documentId: string,
  viewedBy?: string,
  viewerIp?: string,
  viewDurationSeconds?: number
): Promise<boolean> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('document_views')
    .insert({
      document_id: documentId,
      viewed_by: viewedBy || null,
      viewer_ip: viewerIp || null,
      view_duration_seconds: viewDurationSeconds || null,
    });

  if (error) {
    console.error('Error recording view:', error);
    return false;
  }

  // Also increment view count on document
  await supabase.rpc('increment_document_view_count', { doc_id: documentId });

  return true;
}

// Get shares for a document
export async function getDocumentShares(documentId: string): Promise<DocumentShare[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('document_shares')
    .select(`
      *,
      shared_by_user:users!document_shares_shared_by_fkey(display_name)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shares:', error);
    return [];
  }

  return (data || []) as DocumentShare[];
}

// Helper function to categorize files by MIME type
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) return 'spreadsheet';
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) return 'presentation';
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) return 'document';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
}

// Generate cryptographically secure random access token
function generateAccessToken(): string {
  return randomBytes(24).toString('hex'); // 48-char hex string
}

// Get document stats
export async function getDocumentStats(): Promise<{
  totalDocuments: number;
  totalViews: number;
  totalShares: number;
  recentUploads: number;
}> {
  const supabase = getServiceClient();

  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id', { count: 'exact' });

  const { data: views, error: viewsError } = await supabase
    .from('document_views')
    .select('id', { count: 'exact' });

  const { data: shares, error: sharesError } = await supabase
    .from('document_shares')
    .select('id', { count: 'exact' });

  const { data: recentDocs, error: recentError } = await supabase
    .from('documents')
    .select('id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return {
    totalDocuments: docs?.length || 0,
    totalViews: views?.length || 0,
    totalShares: shares?.length || 0,
    recentUploads: recentDocs?.length || 0,
  };
}
