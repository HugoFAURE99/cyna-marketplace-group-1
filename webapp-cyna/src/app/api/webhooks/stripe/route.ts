import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 1. Initialisation de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-05-27.dahlia",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// 2. Initialisation de Supabase avec la clé Service Role
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
        console.error(" Erreur de signature du Webhook :", err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }


    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            console.log(" Traitement du paiement réussi, récupération de la facture...");

            // On récupère l'ID de la commande "En attente" via les metadata
            const idCommande = session.metadata?.id_commande;
            if (!idCommande) {
                throw new Error("Aucun id_commande trouvé dans les metadata Stripe");
            }

            let fileNameKey = null;

            // RÉCUPÉRATION ET TÉLÉCHARGEMENT DE LA FACTURE STRIPE
            if (session.invoice) {
                const invoice = await stripe.invoices.retrieve(session.invoice as string);
                const pdfUrl = invoice.invoice_pdf;

                if (pdfUrl) {
                    const response = await fetch(pdfUrl);
                    if (!response.ok) throw new Error("Impossible de télécharger le PDF de Stripe");

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Nom unique du fichier
                    const fileName = `facture_${idCommande}_${invoice.id}.pdf`;

                    // Envoi du PDF dans ton Bucket privé avec le bon format
                    const { error: storageError } = await supabase.storage
                        .from("Factures")
                        .upload(fileName, buffer, {
                            contentType: "application/pdf",
                            upsert: true,
                        });

                    if (storageError) throw storageError;

                    // On enregistre uniquement le nom du fichier pour la BDD
                    fileNameKey = fileName;
                    console.log("📁 PDF sauvegardé dans le Bucket :", fileNameKey);
                }
            }

            // A. MISE À JOUR DE LA COMMANDE EXISTANTE
            const { error: commandeError } = await supabase
                .from("commande")
                .update({
                    statut_commande: "Validée",
                    url_facture: fileNameKey, // On stocke juste le nom du PDF
                })
                .eq("id_commande", idCommande);

            if (commandeError) throw commandeError;

            // B. INSERTION DANS LA TABLE 'ligne_commande'
            if (session.metadata?.cartData) {
                const cartItems = JSON.parse(session.metadata.cartData);

                const lignesAInserer = cartItems.map((item: any) => ({
                    id_commande: parseInt(idCommande),
                    id_prix: item.id_prix,
                    quantite: item.quantite,
                    prix_unitaire: item.prix_unitaire, // Assure-toi que c'est le bon montant (en euros ou centimes selon ton action)
                    sous_total: item.sous_total || (item.prix_unitaire * item.quantite),
                }));

                const { error: lignesError } = await supabase
                    .from("ligne_commande")
                    .insert(lignesAInserer);

                if (lignesError) throw lignesError;
            }

            console.log(`✅ COMMANDE ${idCommande} MISE À JOUR ET ENREGISTRÉE EN BASE DE DONNÉES !`);

        } catch (dbError) {
            console.error("❌ Erreur lors de l'insertion dans Supabase :", dbError);
            return NextResponse.json({ received: true, db_error: true }, { status: 200 });
        }
    }

    // On dit à Stripe "C'est bon, on a bien reçu ton message !"
    return NextResponse.json({ received: true }, { status: 200 });
}