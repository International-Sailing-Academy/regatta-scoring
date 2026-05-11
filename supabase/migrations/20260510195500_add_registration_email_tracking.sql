alter table public.regatta_registrations
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_error text;

create index if not exists regatta_registrations_confirmation_email_sent_idx
  on public.regatta_registrations(confirmation_email_sent_at);
