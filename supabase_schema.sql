-- =========================================================
-- Life RPG – Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the DB
-- =========================================================

-- ── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Habits ───────────────────────────────────────────────
create table if not exists public.habits (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  name          text not null,
  icon          text default '💧',
  description   text,
  frequency     text default 'daily' check (frequency in ('daily','weekly','monthly')),
  reminder_time time,
  color         text default '#00d4c8',
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ── Habit Logs ────────────────────────────────────────────
create table if not exists public.habit_logs (
  id           uuid default gen_random_uuid() primary key,
  habit_id     uuid references public.habits on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  completed_at date default current_date not null,
  notes        text,
  created_at   timestamptz default now(),
  unique (habit_id, completed_at)
);

-- ── Row Level Security ────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.habits      enable row level security;
alter table public.habit_logs  enable row level security;

-- Profiles
create policy "Users can read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Habits
create policy "Users can read own habits"   on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

-- Habit Logs
create policy "Users can read own logs"   on public.habit_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs" on public.habit_logs for delete using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────
create index if not exists habits_user_idx     on public.habits     (user_id);
create index if not exists logs_user_idx       on public.habit_logs (user_id);
create index if not exists logs_habit_idx      on public.habit_logs (habit_id);
create index if not exists logs_date_idx       on public.habit_logs (completed_at);
create index if not exists logs_user_date_idx  on public.habit_logs (user_id, completed_at);
