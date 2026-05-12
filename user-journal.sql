create table if not exists public.user_journal (
  id serial primary key,
  user_id uuid references auth.users(id),
  exercise_id integer references EXERCISES(id),
  entry_text text,
  mood text,
  created_at timestamptz default now()
);
