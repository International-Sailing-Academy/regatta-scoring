create table if not exists public.regatta_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'canceled', 'refunded')),
  amount_total integer not null default 10000,
  currency text not null default 'usd',
  full_name text not null,
  email text not null,
  phone text,
  country text,
  sail_number text,
  boat_class text not null check (boat_class in ('ILCA 4', 'ILCA 6', 'ILCA 7')),
  scoring_category text not null,
  birth_year integer,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  waiver_accepted boolean not null default false,
  sailor_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.regatta_registrations enable row level security;

-- No public RLS policies are created for this table.
-- Registrations are written/read by Next.js API routes using the Supabase service role.
-- This keeps personally identifiable registration data out of public client queries.

create index if not exists regatta_registrations_event_id_idx on public.regatta_registrations(event_id);
create index if not exists regatta_registrations_payment_status_idx on public.regatta_registrations(payment_status);
create index if not exists regatta_registrations_email_idx on public.regatta_registrations(lower(email));

create or replace function public.set_regatta_registrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_regatta_registrations_updated_at on public.regatta_registrations;
create trigger set_regatta_registrations_updated_at
before update on public.regatta_registrations
for each row
execute function public.set_regatta_registrations_updated_at();
