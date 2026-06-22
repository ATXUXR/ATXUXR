-- Create event_files table
create table public.event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  file_url text not null,
  uploaded_by uuid not null references public.members(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for faster queries
create index idx_event_files_event_id on public.event_files(event_id);
create index idx_event_files_created_at on public.event_files(created_at);

-- Enable RLS
alter table public.event_files enable row level security;

-- RLS Policies

-- Allow anyone to read event files
create policy "anyone_can_read_event_files"
  on public.event_files for select
  using (true);

-- Only admins can insert event files
create policy "admins_can_insert_event_files"
  on public.event_files for insert
  to authenticated
  with check (
    exists (
      select 1 from public.members
      where id = auth.uid() and admin = true
    )
  );

-- Only admins can delete event files
create policy "admins_can_delete_event_files"
  on public.event_files for delete
  to authenticated
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and admin = true
    )
  );

-- Comment for documentation
comment on table public.event_files is 'Stores uploaded files (images, documents, etc.) for events';
comment on column public.event_files.event_id is 'Reference to the event';
comment on column public.event_files.file_name is 'Original filename';
comment on column public.event_files.file_size is 'File size in bytes';
comment on column public.event_files.file_type is 'MIME type (e.g., image/jpeg, application/pdf)';
comment on column public.event_files.file_url is 'Public URL to the file in storage';
comment on column public.event_files.uploaded_by is 'Admin who uploaded the file';
