drop policy "Users can upload their own knowledge documents"
on storage.objects;

create policy "Users can upload their own knowledge documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'knowledge-documents'
  and (storage.foldername(storage.objects.name))[1]
    = (select auth.uid())::text
  and exists (
    select 1
    from public.chatbots
    where chatbots.id::text
      = (storage.foldername(storage.objects.name))[2]
      and chatbots.user_id = (select auth.uid())
  )
);
