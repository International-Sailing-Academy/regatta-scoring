alter table public.regatta_registrations
  add column if not exists whatsapp text,
  add column if not exists tshirt_size text,
  add column if not exists medical_conditions text,
  add column if not exists charter_dates text,
  add column if not exists charter_days_short integer not null default 0 check (charter_days_short >= 0 and charter_days_short <= 5),
  add column if not exists charter_days_extended integer not null default 0 check (charter_days_extended >= 0 and charter_days_extended <= 100),
  add column if not exists pro_kit_rental boolean not null default false,
  add column if not exists boat_insurance boolean not null default false;

create index if not exists regatta_registrations_boat_class_idx on public.regatta_registrations(boat_class);
create index if not exists regatta_registrations_scoring_category_idx on public.regatta_registrations(scoring_category);
