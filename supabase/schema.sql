-- Likkle Table: run this script in the Supabase SQL editor.
-- It is safe to run repeatedly. Secrets are intentionally never stored in this file.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone_number_id text unique,
  whatsapp_access_token text,
  owner_whatsapp_number text,
  instagram_user_id text unique,
  instagram_page_token text,
  timezone text not null default 'America/Jamaica',
  digest_hour smallint not null default 9 check (digest_hour between 0 and 23),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  triggers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(question)) > 0),
  check (length(trim(answer)) > 0)
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  label text not null,
  filename text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  triggers text[] not null default '{}',
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.inbound_message_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'instagram')),
  external_message_id text not null,
  sender_id text,
  recipient_id text,
  message_type text,
  message_text text,
  payload jsonb not null default '{}'::jsonb,
  outcome text,
  created_at timestamptz not null default now(),
  unique (channel, external_message_id)
);

create table if not exists public.outbound_message_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'instagram')),
  recipient_id text,
  message_type text not null default 'text',
  message_text text,
  external_message_id text,
  status text not null default 'queued',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists faqs_business_id_idx on public.faqs(business_id);
create index if not exists media_items_business_id_idx on public.media_items(business_id);
create index if not exists inbound_message_events_business_idx on public.inbound_message_events(business_id, created_at desc);
create index if not exists outbound_message_events_business_idx on public.outbound_message_events(business_id, created_at desc);
create index if not exists businesses_phone_number_id_idx on public.businesses(phone_number_id);
create index if not exists businesses_instagram_user_id_idx on public.businesses(instagram_user_id);

-- Keep updated_at useful without requiring application code to remember it.
create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function public.set_updated_at();
drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at before update on public.faqs
for each row execute function public.set_updated_at();

-- Storage is private; the API uses the connector's service role proxy.
insert into storage.buckets (id, name, public)
values ('business-media', 'business-media', false)
on conflict (id) do update set public = false;