'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';
import { useConfirm, useAlert } from '@/components/ui/confirm-dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  FileText,
  Upload,
  Trash2,
  Share2,
  Presentation,
  Download,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Folder,
  Grid,
  List,
  ChevronRight,
  FolderOpen,
  Image,
  Video,
  Music,
  FileIcon,
  Loader2,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface DocumentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  file_category: string;
  category?: DocumentCategory;
  folder_path: string;
  is_pitch_document: boolean;
  metadata: Record<string, unknown>;
  view_count: number;
  share_count: number;
  created_at: string;
  uploader?: { display_name: string | null };
}

type UploadStep = 'select' | 'details' | 'uploading' | 'success' | 'error';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function DocTypeIcon({ doc, size = 'md' }: { doc: Document; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-4 h-4' : 'w-7 h-7';
  const cat = doc.file_category;
  if (cat === 'image') return <Image className={`${cls} text-purple-500`} />;
  if (cat === 'video') return <Video className={`${cls} text-red-500`} />;
  if (cat === 'audio') return <Music className={`${cls} text-blue-500`} />;
  if (cat === 'pdf') return <FileText className={`${cls} text-red-600`} />;
  if (cat === 'spreadsheet') return <FileSpreadsheet className={`${cls} text-green-600`} />;
  if (cat === 'presentation') return <Presentation className={`${cls} text-orange-500`} />;
  return <FileIcon className={`${cls} text-gray-400`} />;
}

function MimeIcon({ mimeType, size = 'md' }: { mimeType: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
  if (mimeType.startsWith('image/')) return <Image className={`${cls} text-purple-500`} />;
  if (mimeType.startsWith('video/')) return <Video className={`${cls} text-red-500`} />;
  if (mimeType.startsWith('audio/')) return <Music className={`${cls} text-blue-500`} />;
  if (mimeType === 'application/pdf') return <FileText className={`${cls} text-red-600`} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return <FileSpreadsheet className={`${cls} text-green-600`} />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <Presentation className={`${cls} text-orange-500`} />;
  return <FileIcon className={`${cls} text-gray-400`} />;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string })?.role || '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions || []) as Permission[];
  const { confirm, ConfirmDialog } = useConfirm();
  const { alert, AlertDialog } = useAlert();

  const canView = hasPermission(role, permissions, 'documents:view');
  const canUpload = hasPermission(role, permissions, 'documents:upload');
  const canShare = hasPermission(role, permissions, 'documents:share');
  const canDelete = hasPermission(role, permissions, 'documents:delete');
  const canPresent = hasPermission(role, permissions, 'documents:present');
  const isSuperadmin = role === 'superadmin';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('/');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New folder modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>('select');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState('');
  const [uploadIsPitch, setUploadIsPitch] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPulsing, setUploadPulsing] = useState(false);
  const [uploadElapsed, setUploadElapsed] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Client-side signed URL cache — avoids re-fetching when reopening the same doc
  const signedUrlCacheRef = useRef<Map<string, { url: string; fileType: string; fileName: string; expiresAt: number }>>(new Map());

  // Search debounce
  const [searchInput, setSearchInput] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CSV viewer state
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvLoading, setCsvLoading] = useState(false);

  // Share state
  const [sharingDoc, setSharingDoc] = useState<Document | null>(null);
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareExpirationDays, setShareExpirationDays] = useState<number>(7);
  const [shareNeverExpires, setShareNeverExpires] = useState(false);

  // Presentation / viewer state
  const [presentingDoc, setPresentingDoc] = useState<Document | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrlLoading, setSignedUrlLoading] = useState(false);
  const [signedUrlError, setSignedUrlError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedFolder !== '/') params.append('folder', selectedFolder);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedFolder, search]);

  // Debounce search input — only fires API call after 300ms of no typing
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(value), 300);
  }

  useEffect(() => {
    if (canView) fetchDocuments();
  }, [canView, fetchDocuments]);

  useEffect(() => () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    abortControllerRef.current?.abort();
  }, []);

  // ESC key closes the viewer
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && presentingDoc) closeViewer();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [presentingDoc]);

  // Fetch signed URL when opening a document — uses client-side cache
  async function openViewer(doc: Document) {
    setPresentingDoc(doc);
    setSignedUrlError('');
    setCsvData([]);

    const now = Date.now();
    const cached = signedUrlCacheRef.current.get(doc.id);
    if (cached && cached.expiresAt > now) {
      setSignedUrl(cached.url);
      setSignedUrlLoading(false);
      // Kick off CSV fetch if needed (uses cached url)
      if (cached.fileType === 'text/csv' || doc.file_name.endsWith('.csv')) {
        fetchCsv(cached.url);
      }
      return;
    }

    setSignedUrl(null);
    setSignedUrlLoading(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/view`);
      if (!res.ok) {
        const err = await res.json();
        setSignedUrlError(err.error || 'Could not load document');
      } else {
        const data = await res.json();
        setSignedUrl(data.signedUrl);
        // Cache for 45 min (URL valid 60 min, server caches 50 min)
        signedUrlCacheRef.current.set(doc.id, {
          url: data.signedUrl,
          fileType: data.fileType,
          fileName: data.fileName,
          expiresAt: now + 45 * 60 * 1000,
        });
        if (data.fileType === 'text/csv' || data.fileName?.endsWith('.csv')) {
          fetchCsv(data.signedUrl);
        }
      }
    } catch {
      setSignedUrlError('Network error — could not load document');
    } finally {
      setSignedUrlLoading(false);
    }
  }

  async function fetchCsv(url: string) {
    setCsvLoading(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      const rows = text.trim().split('\n').map(row => {
        // Handle quoted fields with commas
        const result: string[] = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === '"') { inQuote = !inQuote; }
          else if (ch === ',' && !inQuote) { result.push(current.trim()); current = ''; }
          else { current += ch; }
        }
        result.push(current.trim());
        return result;
      });
      setCsvData(rows);
    } catch {
      setCsvData([]);
    } finally {
      setCsvLoading(false);
    }
  }

  function closeViewer() {
    setPresentingDoc(null);
    setSignedUrl(null);
    setSignedUrlError('');
    setIsFullscreen(false);
    setCsvData([]);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function openUploadModal() {
    setUploadStep('select');
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategoryId(selectedCategory !== 'all' ? selectedCategory : '');
    setUploadIsPitch(false);
    setUploadProgress(0);
    setUploadPulsing(false);
    setUploadElapsed(0);
    setUploadError('');
    setUploadedDoc(null);
    setShowUploadModal(true);
  }

  function closeUploadModal() {
    if (uploadStep === 'uploading') return;
    setShowUploadModal(false);
    if (uploadStep === 'success') fetchDocuments();
  }

  function handleFileChosen(file: File) {
    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setUploadStep('details');
    setUploadError('');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChosen(file);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setUploadStep('uploading');
    setUploadProgress(0);
    setUploadPulsing(false);
    setUploadElapsed(0);

    const startTime = Date.now();
    elapsedIntervalRef.current = setInterval(() => {
      setUploadElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    let fakeProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      fakeProgress += Math.random() * 10 + 2;
      if (fakeProgress >= 85) {
        fakeProgress = 85;
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setUploadPulsing(true);
      }
      setUploadProgress(Math.floor(fakeProgress));
    }, 200);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    const stopTimers = () => {
      clearTimeout(timeoutId);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());
      if (uploadCategoryId) formData.append('category_id', uploadCategoryId);
      formData.append('folder_path', selectedFolder);
      formData.append('is_pitch', String(uploadIsPitch));

      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      stopTimers();

      if (!res.ok) {
        let errMsg = 'Upload failed';
        try { errMsg = (await res.json()).error || errMsg; } catch {}
        setUploadError(errMsg);
        setUploadStep('error');
        return;
      }

      const doc = await res.json();
      setUploadProgress(100);
      setUploadPulsing(false);
      setUploadedDoc(doc);
      // Refresh documents list to show the new upload
      fetchDocuments();
      setTimeout(() => setUploadStep('success'), 400);
    } catch (err) {
      stopTimers();
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      setUploadError(isAbort ? 'Upload timed out — file may be too large or connection is slow' : 'Network error — please try again');
      setUploadStep('error');
    }
  }

  async function handleDelete(id: string) {
    if (!canDelete) return;
    const confirmed = await confirm({
      title: 'Delete Document?',
      description: 'This will permanently remove the document from the library. This action cannot be undone.',
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
      const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
      loadingToast.remove();
      
      if (res.ok) {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right';
        toast.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Document deleted';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        fetchDocuments();
      } else {
        const data = await res.json().catch(() => ({}));
        await alert({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete document. Please try again.',
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
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!canShare || !sharingDoc) return;
    const emails = shareEmails.split(',').map(x => x.trim()).filter(Boolean);
    if (!emails.length) { setShareError('Enter at least one email address'); return; }
    setSharing(true);
    setShareError('');
    setShareSuccess('');
    try {
      const res = await fetch(`/api/admin/documents/${sharingDoc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emails, 
          message: shareMessage,
          expiresInDays: shareExpirationDays,
          neverExpires: shareNeverExpires,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const sent = data.emailsSent ?? emails.length;
        setShareSuccess(`Shared with ${emails.length} recipient${emails.length !== 1 ? 's' : ''}${sent > 0 ? ` · ${sent} email${sent !== 1 ? 's' : ''} sent` : ''}`);
        setShareEmails('');
        setShareMessage('');
      } else {
        setShareError(data.error || 'Failed to share document');
      }
    } catch { setShareError('Network error — please try again'); }
    finally { setSharing(false); }
  }

  const filteredDocs = useMemo(() => documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category?.id === selectedCategory;
    const matchesFolder = selectedFolder === '/' || doc.folder_path === selectedFolder || doc.folder_path.startsWith(selectedFolder + '/');
    return matchesCategory && matchesFolder;
  }), [documents, selectedCategory, selectedFolder]);

  const activeCategory = categories.find(c => c.id === selectedCategory);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-red-600 text-sm">You don&apos;t have permission to view documents.</p>
          <p className="text-xs text-red-400 mt-1">Contact a superadmin to request access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-green dark:text-brand-yellow flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Document Library
          </h1>
          <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 mt-0.5">
            {filteredDocs.length} file{filteredDocs.length !== 1 ? 's' : ''}
            {activeCategory && ` in ${activeCategory.name}`}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={openUploadModal}
            className="self-start sm:self-auto px-4 py-2 bg-brand-yellow text-brand-black font-semibold rounded-lg hover:opacity-90 flex items-center gap-2 text-sm shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        )}
      </div>

      {/* ─── Filters bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Category dropdown — styled with color indicator */}
        <CustomSelect
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={[
            { value: 'all', label: 'All Categories', color: '#6b7280' },
            ...categories.map(cat => ({
              value: cat.id,
              label: cat.name,
              color: cat.color,
            })),
          ]}
          placeholder="Select Category"
          className="w-48"
          triggerClassName="border-brand-green/20 dark:border-brand-yellow/20"
        />

        {/* Active category pill with X */}
        {activeCategory && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: activeCategory.color + '18', color: activeCategory.color }}
          >
            {activeCategory.name}
            <button onClick={() => setSelectedCategory('all')} className="hover:opacity-70 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-sm w-40 sm:w-48 focus:w-56 transition-all outline-none focus:ring-2 focus:ring-brand-green/30 dark:text-brand-yellow"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grid / List toggle */}
        <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-brand-green text-white' : 'bg-white dark:bg-brand-black text-gray-400 hover:bg-gray-50'}`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-brand-green text-white' : 'bg-white dark:bg-brand-black text-gray-400 hover:bg-gray-50'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <button
          onClick={() => setSelectedFolder('/')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            selectedFolder === '/'
              ? 'bg-brand-green/10 text-brand-green font-medium'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          Root
        </button>
        {selectedFolder !== '/' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-lg font-medium">
              {selectedFolder.split('/').pop()}
            </span>
          </>
        )}
      </div>

      {/* ─── Document list ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <FolderOpen className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No documents found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Try a different search term' : 'Upload your first document to get started'}
          </p>
          {canUpload && !search && (
            <button onClick={openUploadModal} className="mt-4 px-6 py-2.5 bg-brand-yellow text-brand-black font-semibold rounded-xl hover:opacity-90 text-sm">
              Upload Document
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="group bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-4 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <DocTypeIcon doc={doc} />
                </div>
                {doc.is_pitch_document && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">Pitch</span>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate text-brand-black dark:text-brand-yellow" title={doc.title}>{doc.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span>{formatFileSize(doc.file_size)}</span>
                {doc.share_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-brand-green dark:text-brand-yellow">
                      <Share2 className="w-3 h-3" />
                      {doc.share_count} share{doc.share_count !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
              {doc.category && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full mb-3 bg-gray-100 dark:bg-gray-800 text-brand-black dark:text-brand-yellow">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: doc.category.color }} />
                  {doc.category.name}
                </span>
              )}
              <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                {/* Present button */}
                {canPresent && (
                  <button onClick={() => openViewer(doc)}
                    className="flex-1 p-2 text-center text-xs font-medium text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 rounded-lg transition-all duration-200" 
                    title="Present">
                    <Presentation className="w-4 h-4 mx-auto" />
                  </button>
                )}
                {/* Share button */}
                {canShare && (
                  <button onClick={() => setSharingDoc(doc)}
                    className="flex-1 p-2 text-center text-xs font-medium text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 rounded-lg transition-all duration-200" 
                    title="Share">
                    <Share2 className="w-4 h-4 mx-auto" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(doc.id)}
                    className="flex-1 p-2 text-center text-xs font-medium bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">File</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shares</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0">
                        <DocTypeIcon doc={doc} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-brand-black dark:text-brand-yellow truncate max-w-[200px]">{doc.title}</p>
                        {doc.is_pitch_document && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded">Pitch</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {doc.category ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-brand-black dark:text-brand-yellow">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: doc.category.color }} />
                        {doc.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatFileSize(doc.file_size)}</td>
                  <td className="px-4 py-3">
                    {doc.share_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green dark:text-brand-yellow">
                        <Share2 className="w-3 h-3" />
                        {doc.share_count}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Present/View button - unified */}
                      {canPresent && (
                        <button 
                          onClick={() => openViewer(doc)} 
                          className="p-2 text-brand-black/50 dark:text-brand-yellow/50 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 rounded-lg transition-all duration-200" 
                          title="Present"
                        >
                          <Presentation className="w-4 h-4" />
                        </button>
                      )}
                      {/* Share button */}
                      {canShare && (
                        <button 
                          onClick={() => setSharingDoc(doc)} 
                          className="p-2 text-brand-black/50 dark:text-brand-yellow/50 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 rounded-lg transition-all duration-200" 
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete button */}
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="p-2 text-brand-black/50 dark:text-brand-yellow/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════ UPLOAD MODAL ═══════════════════════════════ */}
      {showUploadModal && canUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) closeUploadModal(); }}>
          <div className="bg-white dark:bg-[#0f1117] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">

            {uploadStep === 'select' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-brand-black dark:text-brand-yellow">Upload Document</h3>
                  <button onClick={closeUploadModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 dark:border-gray-700 hover:border-brand-green/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-brand-green/10 dark:bg-brand-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-brand-green dark:text-brand-yellow" />
                  </div>
                  <p className="text-brand-black dark:text-brand-yellow font-semibold mb-1">Drop file here or click to browse</p>
                  <p className="text-sm text-gray-400">PDF, Office, Images, Videos, Audio — up to 200 MB</p>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileChosen(e.target.files[0])} />
                </div>
              </div>
            )}

            {uploadStep === 'details' && uploadFile && (
              <form onSubmit={handleUploadSubmit} className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <button type="button" onClick={() => setUploadStep('select')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-brand-black dark:text-brand-yellow flex-1">Document Details</h3>
                  <button type="button" onClick={closeUploadModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-5">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <MimeIcon mimeType={uploadFile.type} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate text-brand-black dark:text-brand-yellow">{uploadFile.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(uploadFile.size)} · {uploadFile.type || 'unknown'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1.5">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} rows={2}
                      placeholder="Brief description..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none resize-none" />
                  </div>

                  {/* Category — styled with color dots */}
                  <CustomSelect
                    value={uploadCategoryId}
                    onChange={setUploadCategoryId}
                    options={[
                      { value: '', label: 'No category', color: '#d1d5db' },
                      ...categories.map(cat => ({
                        value: cat.id,
                        label: cat.name,
                        color: cat.color,
                      })),
                    ]}
                    label="Category"
                    placeholder="Select category"
                  />

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <button type="button" onClick={() => setUploadIsPitch(p => !p)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${uploadIsPitch ? 'bg-brand-yellow' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${uploadIsPitch ? 'left-6' : 'left-1'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-brand-black dark:text-brand-yellow">Mark as Pitch Document</p>
                      <p className="text-xs text-gray-400">Enables enhanced presentation mode</p>
                    </div>
                  </label>
                </div>

                <button type="submit" disabled={!uploadTitle.trim()}
                  className="w-full mt-5 py-3 bg-brand-yellow text-brand-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              </form>
            )}

            {uploadStep === 'uploading' && uploadFile && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-brand-green/10 dark:bg-brand-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <MimeIcon mimeType={uploadFile.type} size="lg" />
                </div>
                <h3 className="text-lg font-bold text-brand-black dark:text-brand-yellow mb-1">
                  {uploadPulsing ? 'Uploading to cloud...' : 'Uploading...'}
                </h3>
                <p className="text-sm text-gray-400 mb-6 truncate px-4">{uploadFile.name}</p>
                <div className="mb-3">
                  {uploadPulsing ? (
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-yellow to-brand-green rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                    </div>
                  ) : (
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-green to-brand-yellow rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-xs text-gray-400">{uploadPulsing ? 'Processing...' : `${uploadProgress}%`}</span>
                    <span className="text-xs text-gray-400">{uploadElapsed > 0 && `${uploadElapsed}s`}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Please wait — do not close this window</p>
              </div>
            )}

            {uploadStep === 'success' && uploadedDoc && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-1">Upload Complete!</h3>
                <p className="text-sm text-gray-500 mb-2">{uploadedDoc.title}</p>
                <p className="text-xs text-gray-400 mb-6">{formatFileSize(uploadedDoc.file_size)}</p>
                <div className="flex gap-3">
                  <button onClick={() => openViewer(uploadedDoc)}
                    className="flex-1 py-2.5 bg-brand-green/10 text-brand-green font-medium rounded-xl hover:bg-brand-green/20 flex items-center justify-center gap-2 text-sm">
                    <Eye className="w-4 h-4" />
                    View File
                  </button>
                  <button onClick={() => { setUploadStep('select'); setUploadFile(null); setUploadTitle(''); setUploadDescription(''); }}
                    className="flex-1 py-2.5 bg-brand-yellow text-brand-black font-semibold rounded-xl hover:opacity-90 text-sm">
                    Upload Another
                  </button>
                </div>
                <button onClick={closeUploadModal} className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">Done</button>
              </div>
            )}

            {uploadStep === 'error' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-2">Upload Failed</h3>
                <p className="text-sm text-red-500 mb-6">{uploadError}</p>
                <div className="flex gap-3">
                  <button onClick={() => setUploadStep('details')} className="flex-1 py-2.5 bg-brand-yellow text-brand-black font-semibold rounded-xl hover:opacity-90 text-sm">Try Again</button>
                  <button onClick={closeUploadModal} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ SHARE MODAL ════════════════════════════════ */}
      {sharingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget && !sharing) { setSharingDoc(null); setShareSuccess(''); setShareError(''); } }}>
          <div className="bg-white dark:bg-[#0f1117] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-brand-green px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-brand-yellow" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Share Document</h3>
                    <p className="text-white/60 text-xs mt-0.5 truncate max-w-[220px]">{sharingDoc.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSharingDoc(null); setShareSuccess(''); setShareError(''); }}
                  disabled={sharing}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {shareSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-brand-black dark:text-brand-yellow mb-1">Shared successfully!</p>
                  <p className="text-sm text-gray-500">{shareSuccess}</p>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { setShareSuccess(''); }}
                      className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-brand-black dark:text-brand-yellow hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      Share Again
                    </button>
                    <button
                      onClick={() => { setSharingDoc(null); setShareSuccess(''); setShareError(''); }}
                      className="flex-1 py-2.5 bg-brand-green text-white font-semibold rounded-xl hover:opacity-90 text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleShare} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-brand-black dark:text-brand-yellow">
                      Email Addresses
                      <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
                    </label>
                    <textarea
                      value={shareEmails}
                      onChange={(e) => { setShareEmails(e.target.value); setShareError(''); }}
                      placeholder="email1@example.com, email2@example.com"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none resize-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-brand-black dark:text-brand-yellow">
                      Personal Message
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder="Add a personal note for the recipient..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Expiration Settings */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow">
                      Link Expiration
                    </label>
                    
                    {/* Never expires checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareNeverExpires}
                        onChange={(e) => setShareNeverExpires(e.target.checked)}
                        className="w-4 h-4 rounded border-brand-green/20 text-brand-green focus:ring-brand-green"
                      />
                      <span className="text-sm text-brand-black/70 dark:text-brand-yellow/70">
                        Never expires
                      </span>
                    </label>
                    
                    {/* Days selector (only show if not never expires) */}
                    {!shareNeverExpires && (
                      <div className="flex items-center gap-3">
                        <select
                          value={shareExpirationDays}
                          onChange={(e) => setShareExpirationDays(Number(e.target.value))}
                          className="px-3 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-sm text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none"
                        >
                          <option value={1}>1 day</option>
                          <option value={3}>3 days</option>
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                          <option value={90}>90 days</option>
                        </select>
                        <span className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                          Link will expire on {new Date(Date.now() + shareExpirationDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    
                    {shareNeverExpires && (
                      <p className="text-sm text-brand-green dark:text-brand-yellow">
                        Link will never expire. Recipients can access this document indefinitely.
                      </p>
                    )}
                  </div>

                  {shareError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />{shareError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => { setSharingDoc(null); setShareSuccess(''); setShareError(''); }}
                      disabled={sharing}
                      className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-sm text-brand-black dark:text-brand-yellow transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sharing || !shareEmails.trim()}
                      className="flex-1 py-2.5 bg-brand-yellow text-brand-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2 transition-opacity"
                    >
                      {sharing ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Share2 className="w-4 h-4" />Send Link</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
      <AlertDialog />

      {/* ═══════════════════════════ IN-APP DOCUMENT VIEWER ═════════════════════════ */}
      {presentingDoc && (
        <div className="fixed inset-0 bg-black flex flex-col z-50">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-black/80 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={closeViewer}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0" title="Close (Esc)">
                <X className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{presentingDoc.title}</p>
                {presentingDoc.category && (
                  <p className="text-white/40 text-xs">{presentingDoc.category.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {signedUrl && (
                <a href={signedUrl} download={presentingDoc.file_name}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
                  } else {
                    document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
                  }
                }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#111] relative">
            {signedUrlLoading && (
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-white/40 animate-spin mx-auto mb-3" />
                <p className="text-white/50 text-sm">Loading document...</p>
              </div>
            )}

            {signedUrlError && (
              <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Could not load document</p>
                <p className="text-white/50 text-sm">{signedUrlError}</p>
              </div>
            )}

            {signedUrl && !signedUrlLoading && (() => {
              const cat = presentingDoc.file_category;
              const mime = presentingDoc.file_type;
              const name = presentingDoc.file_name.toLowerCase();

              // ── Image ──────────────────────────────────────────────────────
              if (cat === 'image') {
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signedUrl} alt={presentingDoc.title}
                    className="max-w-full max-h-full object-contain p-4" />
                );
              }

              // ── PDF ────────────────────────────────────────────────────────
              if (mime === 'application/pdf') {
                return (
                  <iframe
                    src={`${signedUrl}#toolbar=1&navpanes=0&view=FitH`}
                    className="w-full h-full"
                    title={presentingDoc.title}
                    style={{ border: 'none' }}
                  />
                );
              }

              // ── Office files via Microsoft Office Online viewer ────────────
              const isOffice = (
                mime.includes('presentationml') || mime.includes('powerpoint') ||
                mime.includes('spreadsheetml') || mime.includes('excel') ||
                mime.includes('wordprocessingml') || mime.includes('word') ||
                mime.includes('opendocument') ||
                name.endsWith('.pptx') || name.endsWith('.ppt') ||
                name.endsWith('.xlsx') || name.endsWith('.xls') ||
                name.endsWith('.docx') || name.endsWith('.doc') ||
                name.endsWith('.odp') || name.endsWith('.ods') || name.endsWith('.odt')
              );
              if (isOffice) {
                const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`;
                return (
                  <iframe
                    src={officeUrl}
                    className="w-full h-full"
                    title={presentingDoc.title}
                    style={{ border: 'none' }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                );
              }

              // ── CSV ────────────────────────────────────────────────────────
              if (mime === 'text/csv' || name.endsWith('.csv')) {
                if (csvLoading) {
                  return (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-white/40 animate-spin mx-auto mb-2" />
                      <p className="text-white/50 text-sm">Parsing CSV...</p>
                    </div>
                  );
                }
                if (csvData.length === 0) {
                  return <p className="text-white/40 text-sm">Empty or unreadable CSV</p>;
                }
                const headers = csvData[0];
                const rows = csvData.slice(1);
                return (
                  <div className="w-full h-full overflow-auto p-4">
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0">
                        <tr>
                          {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 bg-brand-green text-white text-left font-semibold whitespace-nowrap border border-white/10">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.02]'}>
                            {headers.map((_, ci) => (
                              <td key={ci} className="px-3 py-1.5 text-white/80 border border-white/5 whitespace-nowrap max-w-[240px] truncate">
                                {row[ci] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // ── Video ──────────────────────────────────────────────────────
              if (cat === 'video') {
                return (
                  <video src={signedUrl} controls autoPlay
                    className="max-w-full max-h-full rounded-lg shadow-2xl" />
                );
              }

              // ── Audio ──────────────────────────────────────────────────────
              if (cat === 'audio') {
                return (
                  <div className="text-center text-white p-8">
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Music className="w-16 h-16 text-white/40" />
                    </div>
                    <p className="text-xl font-semibold mb-6">{presentingDoc.title}</p>
                    <audio src={signedUrl} controls className="w-full max-w-sm" />
                  </div>
                );
              }

              // ── Fallback — open/download ───────────────────────────────────
              return (
                <div className="text-center text-white p-8">
                  <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <DocTypeIcon doc={presentingDoc} size="lg" />
                  </div>
                  <p className="text-xl font-semibold mb-2">{presentingDoc.title}</p>
                  <p className="text-white/40 text-sm mb-8">Preview not available for this file type</p>
                  <div className="flex gap-3 justify-center">
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm">
                      <Eye className="w-4 h-4" />
                      Open in new tab
                    </a>
                    <a href={signedUrl} download={presentingDoc.file_name}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow text-brand-black rounded-xl font-semibold hover:opacity-90 text-sm">
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-5 py-2 bg-black/80 border-t border-white/10 shrink-0">
            <span className="text-white/30 text-xs">{formatFileSize(presentingDoc.file_size)} · {presentingDoc.file_type}</span>
            <span className="text-white/30 text-xs">Press Esc to exit</span>
          </div>
        </div>
      )}
    </div>
  );
}
