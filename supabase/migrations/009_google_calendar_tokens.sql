-- Google Calendar OAuth tokens storage
-- Stores refresh tokens and access tokens for users who connected their Google Calendar

create table if not exists public.user_google_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expiry_date bigint not null, -- Unix timestamp in milliseconds
  scope text not null,
  token_type text not null default 'Bearer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_user_google_tokens_user on public.user_google_tokens(user_id);

-- rls
alter table public.user_google_tokens enable row level security;

-- Only service role can access (tokens are sensitive)
-- No public or anon access
