'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type { Tables } from '@/types/database.types'

export async function createProduct(formData: {
  nom_pro: string
  pro_description: string
  pro_carac_technique?: string
  idcategorie: number
}) {

  const stripeProduct = await stripe.products.create({
    name: formData.nom_pro,
    description: formData.pro_description,
  })

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

  if (error) {
    await stripe.products.update(stripeProduct.id, { active: false })
    throw new Error(`Erreur création produit : ${error.message}`)
  }

  return data
}

export async function getProducts() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('produit')
    .select(`
      id_produit,
      nom_pro,
      pro_description,
      statut_produit,
      stripe_product_id,
      categorie (
        cat_nom
      )
    `)
    .order('date_ajout', { ascending: false })

  if (error) {
    throw new Error(`Erreur chargement produits : ${error.message}`)
  }

  return data
}

export async function deleteProduct(productId: number) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('produit')
    .delete()
    .eq('id_produit', productId)
    .select('stripe_product_id')
    .single()

  if (error) {
    throw new Error(`Erreur suppression produit : ${error.message}`)
  }

  if (data?.stripe_product_id) {
    await stripe.products.update(data.stripe_product_id, { active: false })
  }

  revalidatePath('/admin/products')
}