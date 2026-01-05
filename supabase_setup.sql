-- Unique table name for this specific app to avoid conflicts in your shared project
create table war_map_data (
  user_id uuid references auth.users not null primary key,
  tasks_by_date jsonb default '{}'::jsonb,
  color_keys jsonb default '[]'::jsonb,
  preloaded_events jsonb default '[]'::jsonb,
  rice_projects jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table war_map_data enable row level security;

-- Policies
create policy "Users can view their own data" 
  on war_map_data for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own data" 
  on war_map_data for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own data" 
  on war_map_data for update 
  using (auth.uid() = user_id);

-- Trigger for updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on war_map_data
  for each row execute procedure moddatetime (updated_at);