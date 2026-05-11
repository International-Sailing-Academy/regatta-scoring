alter table public.regatta_registrations
  drop constraint if exists regatta_registrations_stripe_checkout_session_id_key;

create index if not exists regatta_registrations_checkout_session_idx
  on public.regatta_registrations(stripe_checkout_session_id);

alter table public.regatta_registrations
  add column if not exists registration_group_id uuid,
  add column if not exists purchaser_name text,
  add column if not exists purchaser_email text,
  add column if not exists purchaser_phone text;

create index if not exists regatta_registrations_group_id_idx
  on public.regatta_registrations(registration_group_id);
