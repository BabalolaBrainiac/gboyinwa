-- Migration: Document Enhancements and Audit Logs
-- Adds share count, configurable expiration, and comprehensive audit logging

-- Add share_count to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS share_count int NOT NULL DEFAULT 0;

-- Add share_count index
CREATE INDEX IF NOT EXISTS idx_documents_share_count ON public.documents(share_count);

-- Update document_shares table to track share number per document
ALTER TABLE public.document_shares 
ADD COLUMN IF NOT EXISTS share_number int;

-- Function to update document share count and set share number
CREATE OR REPLACE FUNCTION update_document_share_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_share_count int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get current share count for this document
    SELECT share_count INTO current_share_count
    FROM public.documents 
    WHERE id = NEW.document_id;
    
    -- Set the share number
    NEW.share_number := COALESCE(current_share_count, 0) + 1;
    
    -- Increment share count on document
    UPDATE public.documents 
    SET share_count = share_count + 1
    WHERE id = NEW.document_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement share count on document
    UPDATE public.documents 
    SET share_count = GREATEST(share_count - 1, 0)
    WHERE id = OLD.document_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger for share count
DROP TRIGGER IF EXISTS document_shares_count ON public.document_shares;
CREATE TRIGGER document_shares_count
  BEFORE INSERT OR DELETE ON public.document_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_document_share_count();

-- ============================================
-- AUDIT LOGS SYSTEM
-- ============================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  action text NOT NULL, -- e.g., 'document:share', 'document:upload', 'user:created'
  resource_type text NOT NULL, -- e.g., 'document', 'user', 'event', 'campaign'
  resource_id uuid, -- ID of the affected resource
  resource_name text, -- Human-readable name/title
  details jsonb DEFAULT '{}', -- Additional context
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view all audit logs
CREATE POLICY "audit_logs_select_superadmin" 
  ON public.audit_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  ));

-- Allow inserts (for logging)
CREATE POLICY "audit_logs_insert_auth" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (true);

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_user_email text,
  p_user_role text,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_resource_name text,
  p_details jsonb DEFAULT '{}',
  p_ip_address text DEFAULT null,
  p_user_agent text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    resource_id,
    resource_name,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_email,
    p_user_role,
    p_action,
    p_resource_type,
    p_resource_id,
    p_resource_name,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- ============================================
-- DOCUMENT SHARE HISTORY VIEW
-- ============================================

CREATE OR REPLACE VIEW public.document_share_history AS
SELECT 
  ds.id,
  ds.document_id,
  d.title as document_title,
  ds.shared_by,
  u.display_name as shared_by_name,
  ds.shared_with_email,
  ds.access_token,
  ds.message,
  ds.expires_at,
  ds.viewed_at,
  ds.share_number,
  ds.created_at,
  CASE 
    WHEN ds.expires_at IS NULL THEN 'never'
    WHEN ds.expires_at < now() THEN 'expired'
    ELSE 'active'
  END as status
FROM public.document_shares ds
JOIN public.documents d ON ds.document_id = d.id
LEFT JOIN public.users u ON ds.shared_by = u.id
ORDER BY ds.created_at DESC;

-- ============================================
-- SHARE STATISTICS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_document_share_stats(p_document_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_shares', COUNT(*),
    'active_shares', COUNT(*) FILTER (WHERE expires_at IS NULL OR expires_at > now()),
    'expired_shares', COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= now()),
    'viewed_shares', COUNT(*) FILTER (WHERE viewed_at IS NOT NULL),
    'unique_recipients', COUNT(DISTINCT shared_with_email),
    'last_shared_at', MAX(created_at),
    'first_shared_at', MIN(created_at)
  )
  INTO result
  FROM public.document_shares
  WHERE document_id = p_document_id;
  
  RETURN result;
END;
$$;

-- ============================================
-- AUDIT LOG SUMMARY VIEW
-- ============================================

CREATE OR REPLACE VIEW public.audit_log_summary AS
SELECT 
  al.id,
  al.user_id,
  al.user_email,
  al.user_role,
  al.action,
  al.resource_type,
  al.resource_id,
  al.resource_name,
  al.details,
  al.ip_address,
  al.created_at,
  CASE 
    WHEN al.action LIKE '%:create' THEN 'create'
    WHEN al.action LIKE '%:update' THEN 'update'
    WHEN al.action LIKE '%:delete' THEN 'delete'
    WHEN al.action LIKE '%:share' THEN 'share'
    WHEN al.action LIKE '%:view' THEN 'view'
    ELSE 'other'
  END as action_category
FROM public.audit_logs al
ORDER BY al.created_at DESC;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.document_share_history TO authenticated;
GRANT SELECT ON public.audit_log_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_share_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_log(uuid, text, text, text, text, uuid, text, jsonb, text, text) TO authenticated;