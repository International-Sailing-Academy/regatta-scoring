alter table public.regatta_registrations
  add column if not exists sail_batten_rental boolean not null default false;
