-- PostgreSQL requires a newly added enum value to be committed before it is
-- referenced, hence this index intentionally lives in the following migration.
CREATE UNIQUE INDEX IF NOT EXISTS ticket_support_one_open_admin_access_per_account
  ON public.ticket_support (id_compte)
  WHERE categorie = 'admin_access'
    AND status NOT IN ('resolved', 'closed')
    AND id_compte IS NOT NULL;
