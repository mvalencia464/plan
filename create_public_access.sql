-- Add public access columns
alter table war_map_data 
add column if not exists is_public boolean default false,
add column if not exists public_link_id uuid default gen_random_uuid();

-- Create index for performance
create index if not exists idx_war_map_data_public_link_id on war_map_data(public_link_id);

-- Update RLS for public access
-- We need to modify the "Users and collaborators can view data" policy or create a new one.
-- Let's create a specific one for public access to keep it clean.

create policy "Anyone can view public plans" 
  on war_map_data for select 
  using (is_public = true);
