alter table public.regatta_registrations
  add column if not exists refunded_amount integer not null default 0 check (refunded_amount >= 0);
