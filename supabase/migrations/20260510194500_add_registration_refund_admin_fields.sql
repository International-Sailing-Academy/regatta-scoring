alter table public.regatta_registrations
  add column if not exists refund_status text not null default 'none' check (refund_status in ('none', 'requested', 'refunded', 'partial', 'failed')),
  add column if not exists stripe_refund_id text,
  add column if not exists refunded_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists admin_notes text;

create index if not exists regatta_registrations_refund_status_idx
  on public.regatta_registrations(refund_status);
