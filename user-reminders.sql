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

alter table public.user_reminders enable row level security;

create policy "Users can select their own reminders"
on public.user_reminders
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own reminders"
on public.user_reminders
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own reminders"
on public.user_reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own reminders"
on public.user_reminders
for delete
to authenticated
using (auth.uid() = user_id);
