'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function createProduct(formData: {
  nom_pro: string
  pro_description: string
  pro_carac_technique?: string
  idcategorie: number
}) {
    
  // 1. Stripe en premier
  const stripeProduct = await stripe.products.create({
    name: formData.nom_pro,
    description: formData.pro_description,
  })

  // 2. Supabase seulement si Stripe OK
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('produit')
    .insert({
      nom_pro: formData.nom_pro,
      pro_description: formData.pro_description,
      pro_carac_technique: formData.pro_carac_technique,
      stripe_product_id: stripeProduct.id,
      idcategorie: formData.idcategorie,
      statut_produit: false,
    })
    .select()
    .single()

  // 3. Si Supabase échoue → on archive sur Stripe pour nettoyer
  if (error) {
    await stripe.products.update(stripeProduct.id, { active: false })
    throw new Error(`Erreur création produit : ${error.message}`)
  }

  return data
}