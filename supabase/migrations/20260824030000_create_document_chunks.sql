create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null
    references public.documents (id) on delete cascade,
  chatbot_id uuid not null
    references public.chatbots (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint document_chunks_document_index_key
    unique (document_id, chunk_index),
  constraint document_chunks_chunk_index_check
    check (chunk_index >= 0),
  constraint document_chunks_content_check
    check (length(btrim(content)) > 0)
);

create index document_chunks_document_id_idx
on public.document_chunks (document_id);

create index document_chunks_chatbot_id_idx
on public.document_chunks (chatbot_id);

alter table public.document_chunks enable row level security;

revoke all on table public.document_chunks from public, anon, authenticated;
grant select on table public.document_chunks to authenticated;

create policy "Users can view chunks for their own documents"
on public.document_chunks
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.documents
    join public.chatbots
      on chatbots.id = documents.chatbot_id
    where documents.id = document_chunks.document_id
      and documents.chatbot_id = document_chunks.chatbot_id
      and documents.user_id = (select auth.uid())
      and chatbots.user_id = (select auth.uid())
  )
);

create or replace function public.replace_document_chunks(
  target_document_id uuid,
  target_chatbot_id uuid,
  target_user_id uuid,
  replacement_chunks jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(replacement_chunks) is distinct from 'array' then
    raise exception 'replacement_chunks must be a JSON array';
  end if;

  if not exists (
    select 1
    from public.documents
    join public.chatbots
      on chatbots.id = documents.chatbot_id
    where documents.id = target_document_id
      and documents.chatbot_id = target_chatbot_id
      and documents.user_id = target_user_id
      and chatbots.user_id = target_user_id
  ) then
    raise exception 'Document ownership validation failed';
  end if;

  delete from public.document_chunks
  where document_id = target_document_id;

  insert into public.document_chunks (
    document_id,
    chatbot_id,
    user_id,
    content,
    chunk_index,
    metadata
  )
  select
    target_document_id,
    target_chatbot_id,
    target_user_id,
    chunk.content,
    chunk.chunk_index,
    coalesce(chunk.metadata, '{}'::jsonb)
  from jsonb_to_recordset(replacement_chunks) as chunk (
    content text,
    chunk_index integer,
    metadata jsonb
  );
end;
$$;

revoke execute on function public.replace_document_chunks(
  uuid,
  uuid,
  uuid,
  jsonb
) from public, anon, authenticated;

grant execute on function public.replace_document_chunks(
  uuid,
  uuid,
  uuid,
  jsonb
) to service_role;
