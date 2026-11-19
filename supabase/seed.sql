-- Starting company and card. Does not create the login.
-- The login is created by `npm run seed` or by hand in Supabase → Authentication → Users.
-- Safe to run more than once: existing rows are left as they are.
-- TODO: postal code 409538 matches the source PDF and is pending confirmation from TGIT.

insert into public.companies (
  id, name, slug, phone, email, website, whatsapp,
  address_line, city, postal_code, country,
  about, mission, tagline, layout_template, active,
  color_primary, color_accent, color_pale, color_ink, color_paper, color_muted
) values (
  'a0a0a0a0-0000-4000-8000-0000000000a1',
  'TGIT Pte Ltd',
  'tgit',
  '+65 80151060',
  'support@tgitsolutions.com',
  'https://tgitsolutions.com',
  'https://wa.me/6580151060',
  '#08-01, 101 Eunos Avenue 3',
  'Singapore',
  '409538',
  'Singapore',
  'Trusted provider of enterprise IT solutions since 2016, delivering cutting-edge hardware, software, and managed services across South Asia.',
  'At TGIT Pte Ltd, our mission is to deliver innovative IT solutions that empower businesses. We strive to enhance operational efficiency and drive growth through technology.',
  'Transforming IT into reality',
  'classic',
  true,
  '#FF0000', '#FFCF37', '#FFFFA1', '#000000', '#FFFFFF', '#E6E6E6'
) on conflict (slug) do nothing;

insert into public.products (id, company_id, title, description, is_example, sort_order)
select * from (values
  ('a0a0a0a0-0000-4000-8000-0000000000c1'::uuid, 'a0a0a0a0-0000-4000-8000-0000000000a1'::uuid, 'Managed IT and support', '', false, 0),
  ('a0a0a0a0-0000-4000-8000-0000000000c2'::uuid, 'a0a0a0a0-0000-4000-8000-0000000000a1'::uuid, 'ERP solutions', '', false, 1),
  ('a0a0a0a0-0000-4000-8000-0000000000c3'::uuid, 'a0a0a0a0-0000-4000-8000-0000000000a1'::uuid, 'Infrastructure and cloud', '', false, 2),
  ('a0a0a0a0-0000-4000-8000-0000000000c4'::uuid, 'a0a0a0a0-0000-4000-8000-0000000000a1'::uuid, 'Microsoft 365 and Teams', '', false, 3),
  ('a0a0a0a0-0000-4000-8000-0000000000c5'::uuid, 'a0a0a0a0-0000-4000-8000-0000000000a1'::uuid, 'CCTV and door access', '', false, 4),
  ('a0a0a0a0-0000-4000-8000-0000000000c6'::uuid, 'a0a0a0a0-0000-4000-8000-0000000000a1'::uuid, 'Products and licences', '', false, 5)
) as v(id, company_id, title, description, is_example, sort_order)
where not exists (
  select 1 from public.products p where p.company_id = 'a0a0a0a0-0000-4000-8000-0000000000a1'
);

insert into public.cards (
  id, company_id, slug, name, title, department, phone, whatsapp, email, website, active, qr_template, slug_locked
) values (
  'a0a0a0a0-0000-4000-8000-0000000000b1',
  'a0a0a0a0-0000-4000-8000-0000000000a1',
  'manoharan',
  'Manoharan Pethappan',
  'IT Manager',
  'Information Technology',
  '+65 8015 1060',
  'https://wa.me/6580151060',
  'manoharan@tgitsolutions.com',
  'https://tgitsolutions.com',
  true,
  'logo',
  true
) on conflict (slug) do nothing;
