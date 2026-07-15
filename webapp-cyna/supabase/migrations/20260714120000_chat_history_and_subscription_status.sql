-- Canonical Stripe subscription statuses and retained chatbot transcripts.

UPDATE public.abonnement
SET statut_abonnement = CASE lower(btrim(statut_abonnement))
  WHEN 'actif' THEN 'active'
  WHEN 'active' THEN 'active'
  WHEN 'annulé' THEN 'canceled'
  WHEN 'annule' THEN 'canceled'
  WHEN 'cancelled' THEN 'canceled'
  WHEN 'canceled' THEN 'canceled'
  WHEN 'expiré' THEN 'canceled'
  WHEN 'expire' THEN 'canceled'
  WHEN 'expired' THEN 'canceled'
  WHEN 'en attente' THEN 'incomplete'
  WHEN 'pending' THEN 'incomplete'
  ELSE lower(btrim(statut_abonnement))
END;

ALTER TABLE public.abonnement
  DROP CONSTRAINT IF EXISTS abonnement_statut_abonnement_check;

ALTER TABLE public.abonnement
  ADD CONSTRAINT abonnement_statut_abonnement_check
  CHECK (statut_abonnement IN (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  ));

CREATE TABLE public.chat_conversation (
  id_conversation uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_compte uuid REFERENCES public.utilisateur(id_compte) ON DELETE SET NULL,
  guest_session_hash text,
  locale public.langue NOT NULL DEFAULT 'fr',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  CHECK (guest_session_hash IS NULL OR length(guest_session_hash) = 64),
  CHECK (expires_at >= created_at)
);

CREATE TABLE public.chat_message (
  id_message bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_conversation uuid NOT NULL
    REFERENCES public.chat_conversation(id_conversation) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'error')),
  content text NOT NULL CHECK (length(content) <= 20000),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_conversation_updated_idx
  ON public.chat_conversation(updated_at DESC, id_conversation);
CREATE INDEX chat_conversation_account_updated_idx
  ON public.chat_conversation(id_compte, updated_at DESC)
  WHERE id_compte IS NOT NULL;
CREATE INDEX chat_conversation_guest_session_idx
  ON public.chat_conversation(guest_session_hash, updated_at DESC)
  WHERE guest_session_hash IS NOT NULL;
CREATE INDEX chat_conversation_expiry_idx
  ON public.chat_conversation(expires_at);
CREATE INDEX chat_message_conversation_timeline_idx
  ON public.chat_message(id_conversation, created_at, id_message);

ALTER TABLE public.chat_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;

-- Public clients receive no direct policies. Chat writes and BackOffice reads
-- go through guarded server code using the service role.
REVOKE ALL ON TABLE public.chat_conversation FROM anon, authenticated;
REVOKE ALL ON TABLE public.chat_message FROM anon, authenticated;
GRANT ALL ON TABLE public.chat_conversation TO service_role;
GRANT ALL ON TABLE public.chat_message TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.chat_message_id_message_seq TO service_role;

CREATE OR REPLACE FUNCTION public.purge_expired_chat_conversations()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.chat_conversation
  WHERE expires_at <= now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_chat_conversations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_chat_conversations() TO service_role;
