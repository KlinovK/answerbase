create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  constraint profiles_plan_check check (plan in ('free', 'pro'))
);

create or replace function public.generate_chatbot_public_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'bot_' || left(
    translate(
      encode(uuid_send(gen_random_uuid()), 'base64'),
      '+/',
      '-_'
    ),
    12
  );
$$;

create table public.chatbots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  public_id text not null default public.generate_chatbot_public_id() unique,
  name text not null,
  description text,
  welcome_message text not null default 'Hi! How can I help?',
  accent_color text not null default '#111827',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chatbots_user_id_idx on public.chatbots (user_id);

create or replace function public.set_chatbots_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_chatbots_updated_at
before update on public.chatbots
for each row
execute function public.set_chatbots_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free');

  return new;
end;
$$;

create trigger create_profile_after_user_signup
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

revoke execute on function public.generate_chatbot_public_id() from public, anon;
grant execute on function public.generate_chatbot_public_id() to authenticated;

revoke execute on function public.set_chatbots_updated_at()
from public, anon, authenticated;

revoke execute on function public.handle_new_user_profile()
from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.chatbots enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

revoke all on table public.chatbots from anon, authenticated;
grant select, insert, update, delete on table public.chatbots to authenticated;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can view their own chatbots"
on public.chatbots
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own chatbots"
on public.chatbots
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own chatbots"
on public.chatbots
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own chatbots"
on public.chatbots
for delete
to authenticated
using ((select auth.uid()) = user_id);
