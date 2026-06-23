import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 1. Initialisation de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-05-27.dahlia",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// 2. Initialisation de Supabase avec la clé d'administration (Service Role)
// Cela permet au Webhook d'écrire dans la BDD de manière sécurisée en arrière-plan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !endpointSecret) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err: any) {
        console.error("❌ Erreur de signature du Webhook :", err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // 👇 LA MAGIE OPÈRE ICI 👇
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            // On récupère l'email et on convertit le montant en euros (Stripe envoie des centimes)
            const email = session.customer_details?.email || session.customer_email || "invite@inconnu.com";
            const montantTotal = (session.amount_total || 0) / 100;

            console.log("⏳ Insertion de la commande en cours...");

            // A. INSERTION DANS LA TABLE 'commande'
            const { data: nouvelleCommande, error: commandeError } = await supabase
                .from("commande")
                .insert({
                    montant_total: montantTotal,
                    statut_commande: "Validée", // On valide direct car Stripe a pris l'argent
                    mail_utilisateur_invite: email,
                })
                .select("id_commande")
                .single();

            if (commandeError) throw commandeError;

            // B. INSERTION DANS LA TABLE 'ligne_commande'
            // On lit le "post-it" qu'on avait caché dans la création de la session
            if (session.metadata?.cartData) {
                const cartItems = JSON.parse(session.metadata.cartData);

                const lignesAInserer = cartItems.map((item: any) => ({
                    id_commande: nouvelleCommande.id_commande,
                    id_prix: item.id_prix,
                    quantite: item.quantite,
                    prix_unitaire: item.prix_unitaire / 100, // On remet en euros
                    sous_total: (item.prix_unitaire * item.quantite) / 100,
                }));

                const { error: lignesError } = await supabase
                    .from("ligne_commande")
                    .insert(lignesAInserer);

                if (lignesError) throw lignesError;
            }

            console.log("✅ COMMANDE ENREGISTRÉE EN BASE DE DONNÉES ! ID:", nouvelleCommande.id_commande);

        } catch (dbError) {
            console.error("❌ Erreur lors de l'insertion dans Supabase :", dbError);
            // Même s'il y a une erreur BDD, on doit renvoyer 200 à Stripe sinon il va spammer le webhook
            return NextResponse.json({ received: true, db_error: true }, { status: 200 });
        }
    }

    // On dit à Stripe "C'est bon, on a bien reçu ton message !"
    return NextResponse.json({ received: true }, { status: 200 });
}