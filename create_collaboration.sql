-- Create a table to track collaboration
create table if not exists plan_collaborators (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  owner_email text not null,
  collaborator_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(owner_id, collaborator_email)
);

-- Enable RLS
alter table plan_collaborators enable row level security;

-- Policies for plan_collaborators

-- Owners can manage their own collaborators
create policy "Owners can manage collaborators" 
  on plan_collaborators 
  for all 
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Collaborators can view plans shared with them (to know which plans they can access)
create policy "Collaborators can view shares" 
  on plan_collaborators 
  for select 
  using (collaborator_email = (auth.jwt() ->> 'email'));


-- Update policies for war_map_data to allow collaborators to view/edit

-- Drop existing policies to recreate them with collaboration logic
drop policy if exists "Users can view their own data" on war_map_data;
drop policy if exists "Users can insert their own data" on war_map_data;
drop policy if exists "Users can update their own data" on war_map_data;

-- View: Owner OR Collaborator
create policy "Users and collaborators can view data" 
  on war_map_data for select 
  using (
    auth.uid() = user_id 
    OR 
    exists (
      select 1 from plan_collaborators 
      where owner_id = war_map_data.user_id 
      and collaborator_email = (auth.jwt() ->> 'email')
    )
  );

-- Insert: Only Owner (Collaborators edit existing plans, they don't create new roots for others usually, but technically if they edit it's an update. Insert is for creating the row.)
-- Actually, the war_map_data row is created on first load usually. 
-- Let's keep insert restricted to owner for their own ID.
create policy "Users can insert their own data" 
  on war_map_data for insert 
  with check (auth.uid() = user_id);

-- Update: Owner OR Collaborator
create policy "Users and collaborators can update data" 
  on war_map_data for update 
  using (
    auth.uid() = user_id 
    OR 
    exists (
      select 1 from plan_collaborators 
      where owner_id = war_map_data.user_id 
      and collaborator_email = (auth.jwt() ->> 'email')
    )
  );
