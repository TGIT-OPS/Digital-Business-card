-- Local Postgres roles that hosted Supabase already provides.
-- Do not run this file in the hosted SQL editor.

create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login password 'postgres';
  end if;
end $$;

alter role authenticator with login password 'postgres' noinherit;
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role, authenticator;
grant all on schema auth to postgres;

-- GoTrue looks up users and identities without a schema name.
alter database postgres set search_path to auth, public;
