-- meetings: store meeting information
-- Uses Google Meet links generated via Google Calendar API or manual creation

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  meet_link text not null, -- Google Meet link
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text not null default 'UTC',
  created_by uuid not null references public.users(id) on delete cascade,
  status text not null default 'scheduled' check (status in ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meetings_created_by on public.meetings(created_by);
create index if not exists idx_meetings_start_time on public.meetings(start_time);
create index if not exists idx_meetings_status on public.meetings(status);

-- meeting_participants: track who is invited to meetings
-- Links to users table for staff members
create table if not exists public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'tentative')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(meeting_id, user_id)
);

create index if not exists idx_meeting_participants_meeting on public.meeting_participants(meeting_id);
create index if not exists idx_meeting_participants_user on public.meeting_participants(user_id);

-- rls
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;

-- Only service role can access (admin operations via API)
-- No public read access for meetings
