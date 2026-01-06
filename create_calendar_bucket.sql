-- Create a public storage bucket for calendars
insert into storage.buckets (id, name, public)
values ('calendars', 'calendars', true)
on conflict (id) do nothing;

-- Set up security policies for the calendars bucket

-- Public Read Access
create policy "Calendar files are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'calendars' );

-- Authenticated Users Can Upload (Insert)
create policy "Users can upload their own calendar"
  on storage.objects for insert
  with check ( 
    bucket_id = 'calendars' 
    and auth.uid()::text = (storage.foldername(name))[1] 
  );

-- Authenticated Users Can Update Their Own Files
create policy "Users can update their own calendar"
  on storage.objects for update
  using ( 
    bucket_id = 'calendars' 
    and auth.uid()::text = (storage.foldername(name))[1] 
  );

-- Authenticated Users Can Delete Their Own Files
create policy "Users can delete their own calendar"
  on storage.objects for delete
  using ( 
    bucket_id = 'calendars' 
    and auth.uid()::text = (storage.foldername(name))[1] 
  );
