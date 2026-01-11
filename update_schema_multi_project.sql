-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- 1. Modify war_map_data to support multiple plans
-- First, drop the existing primary key (which is user_id)
alter table war_map_data drop constraint war_map_data_pkey;

-- Add a new unique ID column
alter table war_map_data add column id uuid default gen_random_uuid() primary key;

-- Add a name/title column
alter table war_map_data add column name text default 'My 2026 Plan';

-- Add a created_at column for sorting
alter table war_map_data add column created_at timestamp with time zone default timezone('utc'::text, now());

-- (Optional) If you want to keep user_id as a foreign key but not unique
-- It is already defined as 'user_id uuid references auth.users not null'
-- We just removed the primary key constraint, so it's no longer unique by default.

-- 2. Update RLS Policies
-- Drop old policies that relied on single row per user
drop policy if exists "Users can view their own data" on war_map_data;
drop policy if exists "Users can insert their own data" on war_map_data;
drop policy if exists "Users can update their own data" on war_map_data;
drop policy if exists "Users and collaborators can view data" on war_map_data;
drop policy if exists "Users and collaborators can update data" on war_map_data;

-- Create new policies
create policy "Users can view their own plans" 
  on war_map_data for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own plans" 
  on war_map_data for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own plans" 
  on war_map_data for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own plans" 
  on war_map_data for delete 
  using (auth.uid() = user_id);

-- 3. Update Collaboration (Optional: if sharing specific plans)
-- Add plan_id to collaborators table
alter table plan_collaborators add column plan_id uuid references war_map_data(id);

-- Update RLS for collaboration to work with plan_id
-- (You might need to migrate existing collaborators to link to the default plan ID)

-- For now, let's allow collaborators to view plans where they are listed as a collaborator
-- We need to update the war_map_data policy to check plan_collaborators
create policy "Collaborators can view shared plans" 
  on war_map_data for select 
  using (
    exists (
      select 1 from plan_collaborators 
      where plan_id = war_map_data.id 
      and collaborator_email = (auth.jwt() ->> 'email')
    )
  );

create policy "Collaborators can update shared plans" 
  on war_map_data for update 
  using (
    exists (
      select 1 from plan_collaborators 
      where plan_id = war_map_data.id 
      and collaborator_email = (auth.jwt() ->> 'email')
    )
  );
