//Fonction qui permet de créer un client Supabase à partir des variables d'environnement supabase
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Variables d\'environnement Supabase manquantes. Vérifie ton .env.local'
    )
  }

  return createClient(url, key)
}