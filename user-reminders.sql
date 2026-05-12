create table if not exists public.user_reminders (
  id serial primary key,
  user_id uuid references auth.users(id),
  enabled boolean default true,
  preferred_time time default '09:00:00',
  latitude decimal,
  longitude decimal,
  city text,
  created_at timestamptz default now()
);

create unique index if not exists user_reminders_user_id_idx
on public.user_reminders (user_id);
