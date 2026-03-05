-- display name for welcome message (no full email in client)
alter table public.users add column if not exists display_name text;

-- password reset tokens (one-time use, short-lived)
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user_id on public.password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_expires on public.password_reset_tokens(expires_at) where used_at is null;

alter table public.password_reset_tokens enable row level security;
