create table public.documents (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid not null references public.chatbots (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  status text not null default 'uploaded',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_status_check
    check (status in ('uploaded', 'processing', 'ready', 'failed'))
);

create index documents_chatbot_id_idx on public.documents (chatbot_id);
create index documents_user_id_idx on public.documents (user_id);

create or replace function public.set_documents_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_documents_updated_at();

revoke execute on function public.set_documents_updated_at()
from public, anon, authenticated;

alter table public.documents enable row level security;

revoke all on table public.documents from anon, authenticated;
grant select, insert, update, delete on table public.documents to authenticated;

create policy "Users can view their own documents"
on public.documents
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.chatbots
    where chatbots.id = documents.chatbot_id
      and chatbots.user_id = (select auth.uid())
  )
);

create policy "Users can create documents for their own chatbots"
on public.documents
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.chatbots
    where chatbots.id = documents.chatbot_id
      and chatbots.user_id = (select auth.uid())
  )
);

create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.chatbots
    where chatbots.id = documents.chatbot_id
      and chatbots.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.chatbots
    where chatbots.id = documents.chatbot_id
      and chatbots.user_id = (select auth.uid())
  )
);

create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.chatbots
    where chatbots.id = documents.chatbot_id
      and chatbots.user_id = (select auth.uid())
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'knowledge-documents',
  'knowledge-documents',
  false,
  10485760,
  array['application/pdf', 'text/plain', 'text/markdown']::text[]
);

create policy "Users can upload their own knowledge documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'knowledge-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.chatbots
    where chatbots.id::text = (storage.foldername(name))[2]
      and chatbots.user_id = (select auth.uid())
  )
);

create policy "Users can read their own knowledge documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'knowledge-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own knowledge documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'knowledge-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
