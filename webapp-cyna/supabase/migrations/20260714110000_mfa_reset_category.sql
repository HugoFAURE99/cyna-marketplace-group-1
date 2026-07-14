-- PostgreSQL enum additions must commit before they are referenced by indexes.
ALTER TYPE public.support_ticket_category
  ADD VALUE IF NOT EXISTS 'mfa_reset';
