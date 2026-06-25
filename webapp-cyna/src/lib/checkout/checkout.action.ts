"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/server";
import { getCartView } from "@/lib/cart/cart";
import Stripe from "stripe";

// Utilisation de ta clé secrète de test (sk_test_...)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-05-27.dahlia",
});

export async function processCheckout(locale: any) {
    const supabase = await createServerClient();

    // 1. Vérification de l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    let stripeCustomerId: string | undefined;

    if (user) {
        const { data: userData } = await supabase
            .from('utilisateur')
            .select('token_connexion_stripe')
            .eq('id_compte', user.id)
            .single();

        if (userData && userData.token_connexion_stripe !== 'non_configure') {
            stripeCustomerId = userData.token_connexion_stripe;
        }
    }

    // 2. Récupération du panier enrichi (avec le stripePriceId)
    const cartView = await getCartView(locale);
    if (!cartView || cartView.items.length === 0) {
        throw new Error("Votre panier est vide.");
    }
    // On utilise le passe-partout pour contourner les blocages (RLS)
    const supabaseAdmin = createAdminClient();

    const { data: commande, error: commandeError } = await supabaseAdmin
        .from("commande")
        .insert({
            montant_total: cartView.subtotalCents / 100, // On stocke en euros (ou devise de base)
            statut_commande: "En attente",
            mail_utilisateur_invite: user ? user.email : null
        })
        .select("id_commande")
        .single();

    if (commandeError || !commande) {
        throw new Error("Impossible de créer la commande.");
    }

    // 4. Insertion des lignes de commande
    const lignesCommande = cartView.items.map((item) => ({
        id_commande: commande.id_commande,
        id_prix: item.tariffId,
        quantite: item.licenseUserCount,
        prix_unitaire: item.unitPriceCents / 100,
        sous_total: item.lineTotalCents / 100,
    }));

    const { error: lignesError } = await supabaseAdmin
        .from("ligne_commande")
        .insert(lignesCommande);

    if (lignesError) {
        throw new Error("Impossible de sauvegarder le détail de la commande.");
    }

    // 5. Configuration de la session Stripe
    const lineItems = cartView.items.map((item) => ({
        price: item.stripePriceId, // C'est ici qu'on utilise la donnée !
        quantity: item.licenseUserCount,
    }));

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        billing_address_collection: "required", // Stripe demandera l'adresse
        phone_number_collection: { enabled: true },//stripe demande le numero de telephone
        line_items: lineItems,
        mode: "subscription", // Important pour les SaaS (abonnements)
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,

        metadata: {
            // 1. Les infos de base
            id_commande: commande.id_commande.toString(),
            id_compte: user ? user.id : 'invite',

            // 2. Le "post-it" du panier
            cartData: JSON.stringify(
                cartView.items.map((item) => ({
                    id_prix: item.tariffId,
                    quantite: item.licenseUserCount,
                    prix_unitaire: item.unitPriceCents,
                }))
            ),
        },
    };

    if (stripeCustomerId) {
        sessionConfig.customer = stripeCustomerId;
    } else if (user?.email) {
        sessionConfig.customer_email = user.email;
    }

    // 6. Création chez Stripe et Redirection
    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (session.url) {
        return { url: session.url };
    } else {
        throw new Error("Erreur de création de la session Stripe.");
    }
}