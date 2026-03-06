-- =============================================================================
-- SUBSCRIBERS & EMAIL CAMPAIGNS SCHEMA
-- Granular permission-based system for blog subscriptions and communications
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SUBSCRIBERS TABLE
-- Stores blog subscribers with double opt-in support
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash for lookup
  email_encrypted TEXT, -- Encrypted email address
  first_name TEXT,
  last_name TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),
  source VARCHAR(50) DEFAULT 'website', -- Where they subscribed from
  metadata JSONB DEFAULT '{}', -- Additional subscriber data
  
  -- Double opt-in tracking
  confirmation_token VARCHAR(64) UNIQUE,
  confirmation_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  -- Unsubscribe tracking
  unsubscribe_token VARCHAR(64) UNIQUE,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscribers
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_email_hash ON subscribers(email_hash);
CREATE INDEX idx_subscribers_created_at ON subscribers(created_at);
CREATE INDEX idx_subscribers_source ON subscribers(source);

-- =============================================================================
-- EMAIL CAMPAIGNS TABLE
-- Stores email campaigns (both staff and subscriber campaigns)
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL, -- Internal name for the campaign
  subject VARCHAR(500) NOT NULL,
  content_html TEXT, -- HTML content
  content_text TEXT, -- Plain text fallback
  
  -- Campaign type and targeting
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('staff', 'subscribers', 'all')),
  recipient_filter JSONB DEFAULT '{}', -- Filter criteria (e.g., specific segments)
  
  -- Campaign status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Sender info
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_by_email TEXT, -- Snapshot of sender email
  
  -- Campaign metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_recipient_type ON email_campaigns(recipient_type);
CREATE INDEX idx_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX idx_campaigns_scheduled_at ON email_campaigns(scheduled_at) WHERE status = 'scheduled';

-- =============================================================================
-- CAMPAIGN RECIPIENTS TABLE
-- Tracks individual email sends and engagement
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  
  -- Recipient info (polymorphic - can be subscriber or staff)
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('subscriber', 'staff')),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE SET NULL,
  staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Email info (snapshot at send time)
  email_hash VARCHAR(64) NOT NULL,
  email_encrypted TEXT,
  
  -- Delivery tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'bounced', 'failed', 'complained')),
  
  -- Engagement tracking
  opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  
  -- Links clicked (JSON array of link URLs)
  links_clicked JSONB DEFAULT '[]',
  
  -- Delivery details
  external_message_id VARCHAR(255), -- Provider's message ID
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one of subscriber_id or staff_user_id is set
  CONSTRAINT chk_recipient_type CHECK (
    (recipient_type = 'subscriber' AND subscriber_id IS NOT NULL AND staff_user_id IS NULL) OR
    (recipient_type = 'staff' AND staff_user_id IS NOT NULL AND subscriber_id IS NULL)
  )
);

-- Indexes for campaign recipients
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX idx_campaign_recipients_subscriber ON campaign_recipients(subscriber_id) WHERE subscriber_id IS NOT NULL;
CREATE INDEX idx_campaign_recipients_staff ON campaign_recipients(staff_user_id) WHERE staff_user_id IS NOT NULL;
CREATE INDEX idx_campaign_recipients_opened ON campaign_recipients(opened_at) WHERE opened_at IS NOT NULL;

-- =============================================================================
-- BLOG POST NOTIFICATIONS TABLE
-- Tracks which blog posts have been sent to subscribers
-- =============================================================================
CREATE TABLE IF NOT EXISTS blog_post_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL, -- Optional: link to campaign
  
  -- Notification status
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metrics snapshot
  subscriber_count INTEGER,
  delivered_count INTEGER,
  opened_count INTEGER,
  clicked_count INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_post_notifications_post ON blog_post_notifications(post_id);
CREATE INDEX idx_blog_post_notifications_sent ON blog_post_notifications(notification_sent);

-- =============================================================================
-- METRICS AGGREGATION TABLE (for performance)
-- Pre-computed metrics for dashboard
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  
  -- Subscriber metrics
  new_subscribers INTEGER DEFAULT 0,
  unsubscribes INTEGER DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  
  -- Blog metrics
  new_posts INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  
  -- Campaign metrics
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  
  -- Engagement rates (stored as percentages * 100 for precision)
  open_rate INTEGER, -- e.g., 2550 = 25.50%
  click_rate INTEGER, -- e.g., 520 = 5.20%
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);

-- =============================================================================
-- UPDATE TRIGGER FOR updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_post_notifications_updated_at BEFORE UPDATE ON blog_post_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes)
CREATE POLICY service_subscribers ON subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_campaigns ON email_campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_recipients ON campaign_recipients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_notifications ON blog_post_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_metrics ON daily_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active subscribers count
CREATE OR REPLACE VIEW v_subscriber_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced_count,
  COUNT(*) as total_count
FROM subscribers;

-- Campaign stats view
CREATE OR REPLACE VIEW v_campaign_stats AS
SELECT
  c.id,
  c.name,
  c.subject,
  c.recipient_type,
  c.status,
  c.created_at,
  c.sent_by,
  COUNT(cr.id) as total_recipients,
  COUNT(cr.id) FILTER (WHERE cr.status = 'sent') as sent_count,
  COUNT(cr.id) FILTER (WHERE cr.status = 'delivered') as delivered_count,
  COUNT(cr.id) FILTER (WHERE cr.opened_at IS NOT NULL) as opened_count,
  COUNT(cr.id) FILTER (WHERE cr.clicked_at IS NOT NULL) as clicked_count,
  COUNT(cr.id) FILTER (WHERE cr.status = 'bounced') as bounced_count,
  COUNT(cr.id) FILTER (WHERE cr.status = 'failed') as failed_count,
  CASE 
    WHEN COUNT(cr.id) FILTER (WHERE cr.status IN ('sent', 'delivered')) > 0 
    THEN ROUND(100.0 * COUNT(cr.id) FILTER (WHERE cr.opened_at IS NOT NULL) / COUNT(cr.id) FILTER (WHERE cr.status IN ('sent', 'delivered')), 2)
    ELSE 0
  END as open_rate,
  CASE 
    WHEN COUNT(cr.id) FILTER (WHERE cr.opened_at IS NOT NULL) > 0 
    THEN ROUND(100.0 * COUNT(cr.id) FILTER (WHERE cr.clicked_at IS NOT NULL) / COUNT(cr.id) FILTER (WHERE cr.opened_at IS NOT NULL), 2)
    ELSE 0
  END as click_rate
FROM email_campaigns c
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
GROUP BY c.id;

-- =============================================================================
-- FUNCTIONS FOR DASHBOARD METRICS
-- =============================================================================

-- Get dashboard summary metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
  total_subscribers BIGINT,
  active_subscribers BIGINT,
  new_subscribers_today BIGINT,
  total_posts BIGINT,
  total_campaigns BIGINT,
  emails_sent_this_month BIGINT,
  avg_open_rate NUMERIC,
  avg_click_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM subscribers) as total_subscribers,
    (SELECT COUNT(*) FROM subscribers WHERE status = 'active') as active_subscribers,
    (SELECT COUNT(*) FROM subscribers WHERE status = 'active' AND created_at >= CURRENT_DATE) as new_subscribers_today,
    (SELECT COUNT(*) FROM posts WHERE published = true) as total_posts,
    (SELECT COUNT(*) FROM email_campaigns WHERE status = 'sent') as total_campaigns,
    (SELECT COUNT(*) FROM campaign_recipients WHERE sent_at >= DATE_TRUNC('month', CURRENT_DATE)) as emails_sent_this_month,
    (SELECT ROUND(AVG(open_rate), 2) FROM v_campaign_stats WHERE open_rate > 0) as avg_open_rate,
    (SELECT ROUND(AVG(click_rate), 2) FROM v_campaign_stats WHERE click_rate > 0) as avg_click_rate;
END;
$$ LANGUAGE plpgsql;

-- Get subscriber growth by date range
CREATE OR REPLACE FUNCTION get_subscriber_growth(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  new_subscribers BIGINT,
  unsubscribes BIGINT,
  net_growth BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::INTERVAL)::DATE as date
  )
  SELECT
    ds.date,
    COALESCE(COUNT(s.id) FILTER (WHERE s.created_at::DATE = ds.date AND s.status = 'active'), 0) as new_subscribers,
    COALESCE(COUNT(s.id) FILTER (WHERE s.unsubscribed_at::DATE = ds.date), 0) as unsubscribes,
    COALESCE(COUNT(s.id) FILTER (WHERE s.created_at::DATE = ds.date AND s.status = 'active'), 0) -
      COALESCE(COUNT(s.id) FILTER (WHERE s.unsubscribed_at::DATE = ds.date), 0) as net_growth
  FROM date_series ds
  LEFT JOIN subscribers s ON (s.created_at::DATE = ds.date OR s.unsubscribed_at::DATE = ds.date)
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE subscribers IS 'Blog subscribers with double opt-in and unsubscribe tracking';
COMMENT ON TABLE email_campaigns IS 'Email campaigns for staff and subscriber communications';
COMMENT ON TABLE campaign_recipients IS 'Individual email delivery and engagement tracking';
COMMENT ON TABLE blog_post_notifications IS 'Tracks which blog posts have been sent to subscribers';
COMMENT ON TABLE daily_metrics IS 'Pre-computed daily metrics for dashboard performance';
