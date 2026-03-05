-- users: lookup by email_hash only; email_encrypted for admin display (decrypt server-side)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  email_encrypted text,
  password_hash text not null,
  role text not null check (role in ('superadmin', 'admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email_hash)
);

create index if not exists idx_users_email_hash on public.users(email_hash);
create index if not exists idx_users_role on public.users(role);

-- user_permissions: granular permissions for admins
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  permission text not null,
  granted_at timestamptz not null default now(),
  unique(user_id, permission)
);

create index if not exists idx_user_permissions_user_id on public.user_permissions(user_id);

-- events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  summary text,
  start_date date,
  end_date date,
  location text,
  image_url text,
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_featured on public.events(featured) where featured = true;
create index if not exists idx_events_published on public.events(published) where published = true;

-- blog_posts
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  cover_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid references public.users(id)
);

create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_published on public.blog_posts(published) where published = true;
create index if not exists idx_blog_posts_published_at on public.blog_posts(published_at desc);

-- team_members
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text not null,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_members_sort on public.team_members(sort_order);

-- rls
alter table public.users enable row level security;
alter table public.user_permissions enable row level security;
alter table public.events enable row level security;
alter table public.blog_posts enable row level security;
alter table public.team_members enable row level security;

-- public read for events (published), blog_posts (published), team_members
create policy "public read events" on public.events for select using (published = true);
create policy "public read blog_posts" on public.blog_posts for select using (published = true);
create policy "public read team_members" on public.team_members for select using (true);

-- service role bypass is implicit; app uses service role for admin writes
-- anon can only read what policies allow above
create policy "anon read events" on public.events for select using (published = true);
create policy "anon read blog" on public.blog_posts for select using (published = true);
create policy "anon read team" on public.team_members for select using (true);
