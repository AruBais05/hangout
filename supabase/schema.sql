-- Hangout database (Supabase, free plan).
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run. Safe to run again.
--
-- Who can do what (Row Level Security):
--   * Everyone signs in (friends without an account get an anonymous session).
--   * Rooms: found only by invite code (room_by_code); after that, only the host and the
--     people in the room can read it. Only the host can change it.
--   * Members: only people in the same room see who's in (name, type, neighborhood); each
--     person edits only their own row. Budgets live in member_budgets: only you can read yours.
--   * Crew Pass and Big Plan unlock can only be set by the server after Stripe confirms payment.

-- ---------- profiles (one per account) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '' check (char_length(name) <= 20),
  venmo text not null default '' check (venmo ~ '^[A-Za-z0-9_-]{0,30}$'),
  saved jsonb,                       -- remembered join answers ("Welcome back")
  crew_pass boolean not null default false,
  crew_pass_since timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id and crew_pass = false);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- rooms (one per hangout) ----------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_id uuid not null references auth.users on delete cascade,
  meeting jsonb not null,            -- purpose, dates, expected size, city, vibe, name
  host_name text not null default '' check (char_length(host_name) <= 20),
  host_venmo text not null default '' check (host_venmo ~ '^[A-Za-z0-9_-]{0,30}$'),
  group_quiz jsonb,                  -- the same questions for everyone
  plans jsonb,                       -- the ideas everyone votes on
  voting_ended boolean not null default false,
  unlocked boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;

-- (the read policy is below, after in_room() exists)
drop policy if exists "rooms: host creates" on public.rooms;
create policy "rooms: host creates" on public.rooms for insert to authenticated
  with check (host_id = auth.uid() and unlocked = false);
drop policy if exists "rooms: host updates" on public.rooms;
create policy "rooms: host updates" on public.rooms for update to authenticated
  using (host_id = auth.uid()) with check (host_id = auth.uid());

-- ---------- members (who joined a room) ----------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  type text not null check (type in ('explorer', 'homebody', 'nightowl', 'planner')),
  area text not null default '' check (char_length(area) <= 60),
  point jsonb,                       -- rounded to about 1 km by the app
  travel int not null default 30 check (travel in (15, 30, 45)),
  venmo text not null default '' check (venmo ~ '^[A-Za-z0-9_-]{0,30}$'),
  cells jsonb not null default '{}', -- free times
  vote text check (vote is null or char_length(vote) <= 80),
  paid boolean not null default false,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);
alter table public.members enable row level security;

-- (the read policy is below, after in_room() exists)
drop policy if exists "members: join as yourself" on public.members;
create policy "members: join as yourself" on public.members for insert to authenticated
  with check (user_id = auth.uid()
    and (is_host = false or exists (select 1 from public.rooms r where r.id = room_id and r.host_id = auth.uid())));
drop policy if exists "members: edit yourself" on public.members;
create policy "members: edit yourself" on public.members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "members: leave" on public.members;
create policy "members: leave" on public.members for delete to authenticated using (user_id = auth.uid());

-- A hangout is full at 50.
create or replace function public.members_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.members where room_id = new.room_id) >= 50 then
    raise exception 'This hangout is full';
  end if;
  return new;
end $$;
drop trigger if exists members_limit on public.members;
create trigger members_limit before insert on public.members for each row execute function public.members_limit();

-- ---------- private budgets ----------
create table if not exists public.member_budgets (
  member_id uuid primary key references public.members on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  room_id uuid not null references public.rooms on delete cascade,
  budget text not null check (budget in ('u25', '25to50', '50to100', 'flex'))
);
alter table public.member_budgets enable row level security;

drop policy if exists "budgets: only yours" on public.member_budgets;
create policy "budgets: only yours" on public.member_budgets for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The group's budget = the lowest range. Returns only that, never who chose what.
create or replace function public.room_budget(p_room uuid) returns text
language sql security definer set search_path = public stable as $$
  select budget from public.member_budgets
  where room_id = p_room
    and exists (select 1 from public.members m where m.room_id = p_room and m.user_id = auth.uid())
  order by array_position(array['u25', '25to50', '50to100', 'flex'], budget) limit 1
$$;
revoke all on function public.room_budget(uuid) from public;
grant execute on function public.room_budget(uuid) to authenticated;

-- ---------- Crew Pass cost split ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  payer text not null check (char_length(payer) between 1 and 20),
  what text not null check (char_length(what) between 1 and 40),
  amount_cents int not null check (amount_cents between 1 and 1000000),
  handle text not null default '' check (handle ~ '^[A-Za-z0-9_-]{0,30}$'),
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;

create table if not exists public.settled (
  room_id uuid not null references public.rooms on delete cascade,
  key text not null check (char_length(key) <= 45),
  primary key (room_id, key)
);
alter table public.settled enable row level security;

-- Only people in the room see or change its expenses.
create or replace function public.in_room(p_room uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.members where room_id = p_room and user_id = auth.uid())
$$;
grant execute on function public.in_room(uuid) to authenticated;

drop policy if exists "rooms: read when signed in" on public.rooms;
drop policy if exists "rooms: host or members" on public.rooms;
create policy "rooms: host or members" on public.rooms for select to authenticated
  using (host_id = auth.uid() or public.in_room(id));

drop policy if exists "members: read when signed in" on public.members;
drop policy if exists "members: same room" on public.members;
create policy "members: same room" on public.members for select to authenticated
  using (user_id = auth.uid() or public.in_room(room_id));

-- Opening an invite: look a room up by its code (the only way to find a room you're not in yet).
create or replace function public.room_by_code(p_code text) returns setof public.rooms
language sql security definer set search_path = public stable as $$
  select * from public.rooms where code = upper(p_code) limit 1
$$;
revoke all on function public.room_by_code(text) from public;
grant execute on function public.room_by_code(text) to authenticated;

drop policy if exists "expenses: room members" on public.expenses;
create policy "expenses: room members" on public.expenses for select to authenticated using (public.in_room(room_id));
drop policy if exists "expenses: add" on public.expenses;
create policy "expenses: add" on public.expenses for insert to authenticated
  with check (public.in_room(room_id) and created_by = auth.uid());
drop policy if exists "expenses: remove own" on public.expenses;
create policy "expenses: remove own" on public.expenses for delete to authenticated using (created_by = auth.uid());

drop policy if exists "settled: room members" on public.settled;
create policy "settled: room members" on public.settled for all to authenticated
  using (public.in_room(room_id)) with check (public.in_room(room_id));

-- ---------- money flags only the server may set ----------
-- One check per table (a single shared function can't name columns that only one table has).
drop trigger if exists protect_paid_flags on public.profiles;
drop trigger if exists protect_paid_flags on public.rooms;
drop function if exists public.protect_paid_flags();

create or replace function public.protect_crew_pass() returns trigger language plpgsql as $$
begin
  if auth.role() is distinct from 'service_role'
     and (new.crew_pass is distinct from old.crew_pass or new.crew_pass_since is distinct from old.crew_pass_since) then
    raise exception 'Crew Pass can only be changed after payment';
  end if;
  return new;
end $$;
drop trigger if exists protect_crew_pass on public.profiles;
create trigger protect_crew_pass before update on public.profiles for each row execute function public.protect_crew_pass();

create or replace function public.protect_unlock() returns trigger language plpgsql as $$
begin
  if auth.role() is distinct from 'service_role' and new.unlocked is distinct from old.unlocked then
    raise exception 'Big Plan unlock can only be changed after payment';
  end if;
  return new;
end $$;
drop trigger if exists protect_unlock on public.rooms;
create trigger protect_unlock before update on public.rooms for each row execute function public.protect_unlock();

-- ---------- live updates ----------
do $$
declare t text;
begin
  foreach t in array array['rooms', 'members', 'expenses', 'settled'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
