-- TGIT Cards — companies, cards, analytics.
-- Safe to run more than once in the Supabase SQL editor.
-- Public visitors can read active cards of active companies.
-- Only the super admin can change data. Analytics events are written by the server.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('super_admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_path text,
  logo_light_path text,
  color_primary text not null default '#FF0000',
  color_accent text not null default '#FFCF37',
  color_pale text not null default '#FFFFA1',
  color_ink text not null default '#000000',
  color_paper text not null default '#FFFFFF',
  color_muted text not null default '#E6E6E6',
  layout_template text not null default 'classic' check (layout_template in ('classic', 'bold', 'minimal')),
  phone text,
  email text,
  website text,
  whatsapp text,
  address_line text,
  city text,
  postal_code text,
  country text,
  about text,
  mission text,
  social_links jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  video_mode text not null default 'none' check (video_mode in ('none', 'file', 'youtube', 'vimeo')),
  video_path text,
  video_url text,
  video_poster_path text,
  video_autoplay boolean not null default false,
  theme_mode text not null default 'none' check (theme_mode in ('none', 'video', 'gif')),
  theme_path text,
  theme_poster_path text,
  tagline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  description text,
  is_example boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  title text,
  department text,
  phone text,
  whatsapp text,
  email text,
  website text,
  photo_path text,
  active boolean not null default true,
  use_company_colors boolean not null default true,
  color_primary text,
  color_accent text,
  color_pale text,
  color_ink text,
  color_paper text,
  color_muted text,
  video_mode text not null default 'none' check (video_mode in ('none', 'file', 'youtube', 'vimeo')),
  video_path text,
  video_url text,
  video_poster_path text,
  video_autoplay boolean not null default false,
  header_mode text not null default 'none',
  header_path text,
  header_poster_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_events (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  event_type text not null check (event_type in (
    'view', 'save', 'click_call', 'click_whatsapp', 'click_email',
    'click_website', 'click_directions', 'click_share', 'click_video'
  )),
  created_at timestamptz not null default now()
);

alter table public.companies add column if not exists tagline text;
alter table public.cards add column if not exists header_mode text not null default 'none';
alter table public.cards add column if not exists header_path text;
alter table public.cards add column if not exists header_poster_path text;

create index if not exists products_company_idx on public.products (company_id, sort_order);
create index if not exists cards_company_idx on public.cards (company_id);
create index if not exists card_events_card_idx on public.card_events (card_id, event_type);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_touch on public.companies;
create trigger companies_touch before update on public.companies
for each row execute function public.touch_updated_at();

drop trigger if exists cards_touch on public.cards;
create trigger cards_touch before update on public.cards
for each row execute function public.touch_updated_at();

-- True when the signed-in user is the super admin.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.event_counts(p_card uuid default null)
returns table (event_type text, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.event_type, count(*)::bigint
  from public.card_events e
  where p_card is null or e.card_id = p_card
  group by e.event_type;
$$;

create or replace function public.card_event_totals()
returns table (card_id uuid, views bigint, saves bigint, clicks bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.card_id,
    count(*) filter (where e.event_type = 'view')::bigint,
    count(*) filter (where e.event_type = 'save')::bigint,
    count(*) filter (where e.event_type like 'click_%')::bigint
  from public.card_events e
  group by e.card_id;
$$;

revoke all on function public.is_super_admin() from public;
revoke all on function public.event_counts(uuid) from public;
revoke all on function public.card_event_totals() from public;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;
grant execute on function public.event_counts(uuid) to authenticated, service_role;
grant execute on function public.card_event_totals() to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.cards enable row level security;
alter table public.card_events enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_admin on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());
create policy profiles_admin on public.profiles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists companies_public_read on public.companies;
drop policy if exists companies_admin on public.companies;
create policy companies_public_read on public.companies
  for select to anon, authenticated
  using (active = true);
create policy companies_admin on public.companies
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists products_public_read on public.products;
drop policy if exists products_admin on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.active = true
    )
  );
create policy products_admin on public.products
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists cards_public_read on public.cards;
drop policy if exists cards_admin on public.cards;
create policy cards_public_read on public.cards
  for select to anon, authenticated
  using (
    active = true and exists (
      select 1 from public.companies c
      where c.id = company_id and c.active = true
    )
  );
create policy cards_admin on public.cards
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists events_admin_read on public.card_events;
create policy events_admin_read on public.card_events
  for select to authenticated
  using (public.is_super_admin());

-- Visitors cannot write with the anon key. The server records events with the service role.

grant usage on schema public to anon, authenticated, service_role;
grant select on public.companies, public.products, public.cards to anon;
grant select, insert, update, delete on public.profiles, public.companies, public.products, public.cards, public.card_events to authenticated;
grant all on public.profiles, public.companies, public.products, public.cards, public.card_events to service_role;
revoke insert, update, delete on public.profiles, public.companies, public.products, public.cards, public.card_events from anon;

-- Storage bucket for logos, photos, and short videos. Skipped when storage is not installed.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('media', 'media', true)
    on conflict (id) do update set public = true;

    execute 'drop policy if exists media_public_read on storage.objects';
    execute 'drop policy if exists media_admin_insert on storage.objects';
    execute 'drop policy if exists media_admin_update on storage.objects';
    execute 'drop policy if exists media_admin_delete on storage.objects';
    execute 'create policy media_public_read on storage.objects for select to anon, authenticated using (bucket_id = ''media'')';
    execute 'create policy media_admin_insert on storage.objects for insert to authenticated with check (bucket_id = ''media'' and public.is_super_admin())';
    execute 'create policy media_admin_update on storage.objects for update to authenticated using (bucket_id = ''media'' and public.is_super_admin()) with check (bucket_id = ''media'' and public.is_super_admin())';
    execute 'create policy media_admin_delete on storage.objects for delete to authenticated using (bucket_id = ''media'' and public.is_super_admin())';
  end if;
end $$;
