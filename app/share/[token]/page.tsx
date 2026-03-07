'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, Lock, Eye, AlertCircle, Clock, FileSpreadsheet, Presentation, FileIcon } from 'lucide-react';

interface ShareData {
  id: string;
  document: {
    id: string;
    title: string;
    description: string | null;
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
    file_category: string;
  };
  shared_by: {
    display_name: string | null;
  };
  shared_at: string;
  expires_at: string | null;
  message: string | null;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [viewStarted, setViewStarted] = useState(false);

  useEffect(() => {
    fetchShareData();
  }, [token]);

  const fetchShareData = async () => {
    try {
      const res = await fetch(`/api/share/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Unable to access this document');
        return;
      }
      const data = await res.json();
      setShareData(data);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    if (!shareData) return;
    setViewStarted(true);
    // Track view
    fetch(`/api/share/${token}/view`, { method: 'POST' }).catch(console.error);
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-2xl">🖼️</span></div>;
      case 'video':
        return <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center"><span className="text-2xl">🎬</span></div>;
      case 'pdf':
        return <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center"><FileText className="w-8 h-8 text-red-600" /></div>;
      case 'spreadsheet':
        return <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center"><FileSpreadsheet className="w-8 h-8 text-green-600" /></div>;
      case 'presentation':
        return <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center"><Presentation className="w-8 h-8 text-orange-600" /></div>;
      case 'document':
        return <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center"><FileText className="w-8 h-8 text-blue-600" /></div>;
      default:
        return <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center"><FileIcon className="w-8 h-8 text-gray-600" /></div>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            This link may have expired or been revoked. Please contact the sender for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (!shareData) return null;

  const isExpired = shareData.expires_at && new Date(shareData.expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600">This document link has expired.</p>
          <p className="text-sm text-gray-500 mt-4">
            Please contact {shareData.shared_by.display_name || 'the sender'} for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center">
              <span className="text-brand-yellow font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl text-brand-green">Gboyinwa</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!viewStarted ? (
          // Document preview card
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-brand-green p-6 text-white">
                <p className="text-brand-yellow/80 text-sm mb-1">You&apos;ve been invited to view</p>
                <h1 className="text-2xl font-bold">{shareData.document.title}</h1>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  {getFileIcon(shareData.document.file_category)}
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{shareData.document.file_name}</h2>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(shareData.document.file_size)}
                    </p>
                    {shareData.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                        <p className="font-medium text-gray-500 mb-1">Message from {shareData.shared_by.display_name}:</p>
                        <p className="italic">&ldquo;{shareData.message}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleView}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Eye className="w-5 h-5" />
                    View Document
                  </button>
                  <a
                    href={`/api/share/${token}/download`}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Shared by {shareData.shared_by.display_name || 'someone'} on{' '}
                  {new Date(shareData.shared_at).toLocaleDateString()}
                  {shareData.expires_at && (
                    <span className="ml-2">
                      • Expires {new Date(shareData.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Protected by Gboyinwa document sharing
              </p>
            </div>
          </div>
        ) : (
          // Document viewer
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {getFileIcon(shareData.document.file_category)}
                <div>
                  <h1 className="font-semibold">{shareData.document.title}</h1>
                  <p className="text-sm text-gray-500">{formatFileSize(shareData.document.file_size)}</p>
                </div>
              </div>
              <a
                href={`/api/share/${token}/download`}
                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:opacity-90"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
            
            <div className="h-[calc(100vh-200px)] bg-gray-50">
              {shareData.document.file_category === 'image' ? (
                <img
                  src={shareData.document.file_url}
                  alt={shareData.document.title}
                  className="w-full h-full object-contain bg-gray-900"
                />
              ) : shareData.document.file_type.includes('pdf') ? (
                <iframe
                  src={`${shareData.document.file_url}#toolbar=1&navpanes=0`}
                  className="w-full h-full"
                  title={shareData.document.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : shareData.document.file_category === 'video' ? (
                <video
                  src={shareData.document.file_url}
                  controls
                  className="w-full h-full bg-black"
                  controlsList="nodownload"
                />
              ) : shareData.document.file_category === 'presentation' || 
                 shareData.document.file_type.includes('presentation') ||
                 shareData.document.file_type.includes('powerpoint') ? (
                // Office Online Viewer for PowerPoint
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(shareData.document.file_url)}`}
                  className="w-full h-full"
                  title={shareData.document.title}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              ) : shareData.document.file_category === 'spreadsheet' ||
                 shareData.document.file_type.includes('spreadsheet') ||
                 shareData.document.file_type.includes('excel') ? (
                // Office Online Viewer for Excel
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(shareData.document.file_url)}`}
                  className="w-full h-full"
                  title={shareData.document.title}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              ) : shareData.document.file_category === 'document' ||
                 shareData.document.file_type.includes('word') ? (
                // Office Online Viewer for Word
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(shareData.document.file_url)}`}
                  className="w-full h-full"
                  title={shareData.document.title}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Preview not available</h3>
                  <p className="text-gray-500 mb-4">
                    This file type cannot be previewed in the browser. Please download to view.
                  </p>
                  <a
                    href={`/api/share/${token}/download`}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-yellow text-brand-black rounded-xl font-semibold hover:opacity-90"
                  >
                    <Download className="w-5 h-5" />
                    Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
