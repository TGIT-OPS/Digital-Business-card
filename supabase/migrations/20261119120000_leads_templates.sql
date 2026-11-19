-- Leads, card templates, QR choice, labels, and location on events.
-- Safe to run more than once.
-- TODO: TGIT postal code 409538 matches the source PDF. Confirm with TGIT before treating it as final.

alter table public.companies add column if not exists uen text;
alter table public.companies add column if not exists tagline text;

alter table public.cards add column if not exists labels text[] not null default '{}';
alter table public.cards add column if not exists qr_template text not null default 'logo';
alter table public.cards add column if not exists slug_locked boolean not null default false;
alter table public.cards add column if not exists track_location boolean;
alter table public.cards add column if not exists two_way_share boolean;
alter table public.cards add column if not exists template_id uuid;

alter table public.card_events add column if not exists country text;
alter table public.card_events add column if not exists city text;

alter table public.card_events drop constraint if exists card_events_event_type_check;
alter table public.card_events add constraint card_events_event_type_check check (event_type in (
  'view', 'save', 'click_call', 'click_whatsapp', 'click_email',
  'click_website', 'click_directions', 'click_share', 'click_video', 'lead'
));

create table if not exists public.card_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  name text not null,
  layout text not null default 'classic',
  locked_fields jsonb not null default '[]'::jsonb,
  defaults jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  name text not null,
  email text not null,
  company text not null,
  phone text,
  note text,
  consent boolean not null default false,
  country text,
  city text,
  created_at timestamptz not null default now()
);

create index if not exists leads_card_idx on public.leads (card_id, created_at desc);

create table if not exists public.org_settings (
  id integer primary key default 1 check (id = 1),
  two_way_share boolean not null default true,
  track_location boolean not null default true
);

insert into public.org_settings (id, two_way_share, track_location)
values (1, true, true)
on conflict (id) do nothing;

alter table public.card_templates enable row level security;
alter table public.leads enable row level security;
alter table public.org_settings enable row level security;

drop policy if exists templates_public_read on public.card_templates;
drop policy if exists templates_admin on public.card_templates;
create policy templates_public_read on public.card_templates
  for select to anon, authenticated using (true);
create policy templates_admin on public.card_templates
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists leads_admin_read on public.leads;
drop policy if exists leads_admin_write on public.leads;
create policy leads_admin_read on public.leads
  for select to authenticated using (public.is_super_admin());
create policy leads_admin_write on public.leads
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists settings_admin on public.org_settings;
create policy settings_admin on public.org_settings
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists settings_public_read on public.org_settings;
create policy settings_public_read on public.org_settings
  for select to anon, authenticated using (true);

grant select on public.card_templates to anon, authenticated;
grant select on public.org_settings to anon, authenticated;
grant select, insert, update, delete on public.card_templates, public.leads, public.org_settings to authenticated;
grant all on public.card_templates, public.leads, public.org_settings to service_role;

do $$
begin
  if not exists (
    select 1 from public.card_templates where name = 'TGIT Classic v8' and company_id = 'a0a0a0a0-0000-4000-8000-0000000000a1'
  ) then
    insert into public.card_templates (company_id, name, layout, locked_fields, defaults, is_default)
    values (
      'a0a0a0a0-0000-4000-8000-0000000000a1',
      'TGIT Classic v8',
      'classic',
      '["layout","palette"]'::jsonb,
      '{"qr_template":"logo","tagline":"Transforming IT into reality","department":"Information Technology"}'::jsonb,
      true
    );
  end if;
exception when foreign_key_violation then
  null;
end $$;
