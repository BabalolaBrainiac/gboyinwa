'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react').then((mod) => mod.default), { ssr: false });

const spec = {
  openapi: '3.0.0',
  info: { 
    title: 'Gbóyinwá API', 
    version: '1.0.0', 
    description: 'Admin and auth API. Use session cookie for authenticated routes.' 
  },
  servers: [{ url: typeof window !== 'undefined' ? window.location.origin : '', description: 'current' }],
  paths: {
    '/api/auth/forgot-password': {
      post: {
        summary: 'Request password reset',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'always returns same message for privacy' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset password with token',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'password updated' }, 400: { description: 'invalid or expired token' } },
      },
    },
    '/api/admin/events': {
      get: { summary: 'List events (admin)', security: [{ cookieAuth: [] }], responses: { 200: { description: 'list of events' }, 401: { description: 'unauthorized' } } },
      post: {
        summary: 'Create event (admin, events:create)',
        security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['title', 'slug'], properties: { title: { type: 'string' }, slug: { type: 'string' }, summary: { type: 'string' }, description: { type: 'string' }, start_date: { type: 'string', format: 'date' }, end_date: { type: 'string', format: 'date' }, location: { type: 'string' }, image_url: { type: 'string' }, featured: { type: 'boolean' }, published: { type: 'boolean' } } } } } },
        responses: { 200: { description: 'created event' }, 403: { description: 'forbidden' } },
      },
    },
    '/api/admin/events/{id}': {
      patch: { summary: 'Update event (admin, events:edit)', security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, slug: { type: 'string' }, summary: { type: 'string' }, description: { type: 'string' }, featured: { type: 'boolean' }, published: { type: 'boolean' } } } } } }, responses: { 200: { description: 'updated event' } } },
      delete: { summary: 'Delete event (admin, events:delete)', security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'deleted' } } },
    },
    '/api/admin/posts': {
      get: { summary: 'List blog posts (admin)', security: [{ cookieAuth: [] }], responses: { 200: { description: 'list of posts' } } },
      post: {
        summary: 'Create post (admin, posts:create)',
        security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['title', 'slug', 'body'], properties: { title: { type: 'string' }, slug: { type: 'string' }, excerpt: { type: 'string' }, body: { type: 'string' }, cover_url: { type: 'string' }, published: { type: 'boolean' } } } } } },
        responses: { 200: { description: 'created post' } },
      },
    },
    '/api/admin/posts/{id}': {
      patch: { summary: 'Update post (admin, posts:edit)', security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, slug: { type: 'string' }, excerpt: { type: 'string' }, body: { type: 'string' }, published: { type: 'boolean' } } } } } }, responses: { 200: { description: 'updated post' } } },
      delete: { summary: 'Delete post (admin, posts:delete)', security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'deleted' } } },
    },
    '/api/admin/users': {
      get: { summary: 'List users (superadmin only)', security: [{ cookieAuth: [] }], responses: { 200: { description: 'list of users (no PII)' } } },
      post: {
        summary: 'Create admin (superadmin only). Password generated and sent to email.',
        security: [{ cookieAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email', description: 'must be @gboyinwa.com' }, permissions: { type: 'array', items: { type: 'string' }, description: 'e.g. posts:create, events:edit' } } } } } },
        responses: { 200: { description: 'admin created, email sent' }, 400: { description: 'only @gboyinwa.com allowed' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'next-auth.session-token', description: 'sign in via /login to get session cookie' },
    },
  },
  security: [{ cookieAuth: [] }],
};

function ShareButton({ title }: { title: string }) {
  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.share?.({ title, url: window.location.href }).catch(() => {});
    }
  };
  
  return (
    <button 
      className="flex items-center gap-2 text-sm text-brand-green dark:text-brand-yellow hover:underline"
      onClick={handleShare}
    >
      Share
    </button>
  );
}

export default function ApiDocsPage() {
  const memoSpec = useMemo(() => spec, []);
  
  return (
    <div className="min-h-screen bg-white dark:bg-brand-black">
      {/* Header */}
      <header className="border-b border-brand-green/10 dark:border-brand-yellow/10 bg-white dark:bg-brand-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-green dark:text-brand-yellow" />
            <span className="font-bold text-brand-green dark:text-brand-yellow">API Documentation</span>
          </div>
        </div>
      </header>
      
      {/* Swagger UI */}
      <div className="swagger-wrapper">
        <SwaggerUI spec={memoSpec} />
      </div>
      
      <style jsx global>{`
        .swagger-wrapper .swagger-ui {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .swagger-wrapper .swagger-ui .topbar {
          display: none;
        }
        .swagger-wrapper .swagger-ui .info {
          margin-top: 20px;
        }
        .swagger-wrapper .swagger-ui .info .title {
          color: var(--brand-green, #053305);
        }
        .dark .swagger-wrapper .swagger-ui {
          filter: invert(1) hue-rotate(180deg);
        }
        .dark .swagger-wrapper .swagger-ui .microlight,
        .dark .swagger-wrapper .swagger-ui code {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
}
