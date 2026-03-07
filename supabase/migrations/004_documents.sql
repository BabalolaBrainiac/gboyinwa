-- Document Categories Table
CREATE TABLE IF NOT EXISTS public.document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#10B981',
  icon text DEFAULT 'file',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.document_categories (name, slug, description, color, sort_order)
VALUES 
  ('General', 'general', 'General documents', '#6B7280', 0),
  ('Pitch Decks', 'pitch_deck', 'Pitch presentations and decks', '#EAB308', 1),
  ('Financial', 'financial', 'Financial reports and projections', '#10B981', 2),
  ('Legal', 'legal', 'Legal documents and contracts', '#EF4444', 3),
  ('Marketing', 'marketing', 'Marketing materials and brand assets', '#F97316', 4),
  ('Media', 'media', 'Images, videos, and audio files', '#8B5CF6', 5),
  ('Operations', 'operations', 'Operations and team documents', '#06B6D4', 6)
ON CONFLICT (slug) DO NOTHING;

-- Updated documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_key text NOT NULL UNIQUE, -- R2 storage key
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL DEFAULT 'application/octet-stream',
  file_category text NOT NULL DEFAULT 'other', -- image, video, audio, pdf, spreadsheet, presentation, document, text, other
  category_id uuid REFERENCES public.document_categories(id) ON DELETE SET NULL,
  folder_path text NOT NULL DEFAULT '/', -- Folder structure path like "/2024/Q1"
  is_pitch_document boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}', -- Store media metadata, dimensions, etc.
  view_count int NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_path ON public.documents(folder_path);
CREATE INDEX IF NOT EXISTS idx_documents_file_category ON public.documents(file_category);
CREATE INDEX IF NOT EXISTS idx_documents_is_pitch ON public.documents(is_pitch_document) WHERE is_pitch_document = true;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- Full text search index (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_documents_search ON public.documents 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Updated document_shares table
CREATE TABLE IF NOT EXISTS public.document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  shared_with_email text NOT NULL,
  access_token text UNIQUE NOT NULL, -- for secure link sharing
  message text, -- Optional personal message
  expires_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_shares_document ON public.document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON public.document_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_email ON public.document_shares(shared_with_email);

-- Updated document_views table
CREATE TABLE IF NOT EXISTS public.document_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  viewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  viewer_ip text,
  view_duration_seconds int, -- How long the document was viewed
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_views_document ON public.document_views(document_id);
CREATE INDEX IF NOT EXISTS idx_document_views_created_at ON public.document_views(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;

-- Policies for document_categories
CREATE POLICY "document_categories_select_all" 
  ON public.document_categories FOR SELECT 
  USING (true);

-- Policies for documents
CREATE POLICY "documents_select_all" 
  ON public.documents FOR SELECT 
  USING (true);

CREATE POLICY "documents_insert_auth" 
  ON public.documents FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "documents_delete_auth" 
  ON public.documents FOR DELETE 
  USING (true);

-- Policies for document_shares
CREATE POLICY "document_shares_select_all" 
  ON public.document_shares FOR SELECT 
  USING (true);

CREATE POLICY "document_shares_insert_auth" 
  ON public.document_shares FOR INSERT 
  WITH CHECK (true);

-- Policies for document_views
CREATE POLICY "document_views_insert_all" 
  ON public.document_views FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "document_views_select_auth" 
  ON public.document_views FOR SELECT 
  USING (true);

-- Function to increment document view count
CREATE OR REPLACE FUNCTION increment_document_view_count(doc_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.documents
  SET view_count = view_count + 1
  WHERE id = doc_id;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Add documents permission to admin user (if exists)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find admin user
  SELECT id INTO admin_user_id FROM public.users WHERE role = 'admin' OR role = 'superadmin' LIMIT 1;
  
  -- Add documents permissions
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_permissions (user_id, permission)
    VALUES 
      (admin_user_id, 'documents:view'),
      (admin_user_id, 'documents:upload'),
      (admin_user_id, 'documents:share'),
      (admin_user_id, 'documents:delete'),
      (admin_user_id, 'documents:present'),
      (admin_user_id, 'documents:manage_categories')
    ON CONFLICT (user_id, permission) DO NOTHING;
  END IF;
END $$;
