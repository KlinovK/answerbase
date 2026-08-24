create extension if not exists vector with schema extensions;

alter table public.document_chunks
add column embedding extensions.vector(1536);

comment on column public.document_chunks.embedding is
'OpenAI text-embedding-3-small embedding (1536 dimensions).';

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

  if exists (
    select 1
    from jsonb_array_elements(replacement_chunks) as chunk
    where jsonb_typeof(chunk -> 'embedding') is distinct from 'array'
      or jsonb_array_length(chunk -> 'embedding') <> 1536
  ) then
    raise exception 'Every replacement chunk must have a 1536-dimensional embedding';
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
    metadata,
    embedding
  )
  select
    target_document_id,
    target_chatbot_id,
    target_user_id,
    chunk.content,
    chunk.chunk_index,
    coalesce(chunk.metadata, '{}'::jsonb),
    (chunk.embedding::text)::extensions.vector
  from jsonb_to_recordset(replacement_chunks) as chunk (
    content text,
    chunk_index integer,
    metadata jsonb,
    embedding jsonb
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

create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  target_chatbot_id uuid,
  match_count integer default 5,
  similarity_threshold double precision default 0.5
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    document_chunks.id as chunk_id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (
      document_chunks.embedding
      operator(extensions.<=>)
      query_embedding
    ) as similarity
  from public.document_chunks
  where document_chunks.chatbot_id = target_chatbot_id
    and document_chunks.user_id = (select auth.uid())
    and document_chunks.embedding is not null
    and exists (
      select 1
      from public.chatbots
      where chatbots.id = target_chatbot_id
        and chatbots.user_id = (select auth.uid())
    )
    and 1 - (
      document_chunks.embedding
      operator(extensions.<=>)
      query_embedding
    ) >= coalesce(similarity_threshold, 0.5)
  order by
    document_chunks.embedding
    operator(extensions.<=>)
    query_embedding
  limit least(greatest(coalesce(match_count, 5), 1), 10);
$$;

revoke execute on function public.match_document_chunks(
  extensions.vector,
  uuid,
  integer,
  double precision
) from public, anon;

grant execute on function public.match_document_chunks(
  extensions.vector,
  uuid,
  integer,
  double precision
) to authenticated;
