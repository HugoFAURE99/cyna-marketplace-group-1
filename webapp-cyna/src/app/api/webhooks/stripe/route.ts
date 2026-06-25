import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 1. Initialisation de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-05-27.dahlia",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// 2. Initialisation de Supabase avec la clé d'administration (Service Role)
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

    // 👇 TRAITEMENT DU PAIEMENT RÉUSSI 👇
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            console.log("⏳ Début du traitement automatique post-paiement...");

            // Récupération des métadonnées envoyées depuis ton checkout action
            const idCommande = session.metadata?.id_commande;
            const idCompte = session.metadata?.id_compte; // UUID de l'user ou la chaîne 'invite'

            if (!idCommande) {
                throw new Error("Aucun id_commande trouvé dans les metadata Stripe");
            }

            // Récupération des détails clients fournis sur Stripe
            const emailClient = session.customer_details?.email || session.customer_email || "invite@inconnu.com";
            const customerName = session.customer_details?.name;
            const phone = session.customer_details?.phone;
            const address = session.customer_details?.address;
            const stripeCustomerId = session.customer as string;

            let fileNameKey = null;

            // ==========================================
            // ÉTAPE A : TÉLÉCHARGEMENT DE LA FACTURE PDF
            // ==========================================
            if (session.invoice) {
                const invoice = await stripe.invoices.retrieve(session.invoice as string);
                const pdfUrl = invoice.invoice_pdf;

                if (pdfUrl) {
                    const response = await fetch(pdfUrl);
                    if (!response.ok) throw new Error("Impossible de télécharger le PDF de Stripe");

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Nom unique du fichier pour ton bucket
                    const fileName = `facture_${idCommande}_${invoice.id}.pdf`;

                    // Envoi du PDF dans ton Bucket privé "Factures" (avec la majuscule)
                    const { error: storageError } = await supabase.storage
                        .from("Factures")
                        .upload(fileName, buffer, {
                            contentType: "application/pdf",
                            upsert: true,
                        });

                    if (storageError) throw storageError;
                    fileNameKey = fileName;
                    console.log("📁 Facture PDF sécurisée dans le Bucket Privé.");
                }
            }

            // ==========================================
            // ÉTAPE B : MISE À JOUR DE LA COMMANDE
            // ==========================================
            const { error: commandeError } = await supabase
                .from("commande")
                .update({
                    statut_commande: "Validée",
                    url_facture: fileNameKey,
                })
                .eq("id_commande", idCommande);

            if (commandeError) throw commandeError;
            console.log(`✅ Commande N°${idCommande} validée en BDD.`);

            // ==========================================
            // ÉTAPE C : ENREGISTREMENT DE L'ADRESSE (Point 2)
            // ==========================================
            if (address) {
                const nameParts = customerName ? customerName.split(" ") : [];
                const prenom = nameParts[0] || "Prénom inconnu";
                const nom = nameParts.slice(1).join(" ") || "Nom inconnu";

                const { error: adresseError } = await supabase
                    .from("adresse")
                    .insert({
                        prenom: prenom,
                        nom: nom,
                        adresse: address.line1,
                        adresse_complement: address.line2 || null,
                        ville: address.city,
                        code_postal: address.postal_code,
                        pays: address.country,
                        telephone: phone || null,
                        type_adresse: "Facturation",
                        id_compte: idCompte !== "invite" ? idCompte : null, // NULL si invité
                        mail_utilisateur_invite: idCompte === "invite" ? emailClient : null // Pour la réconciliation (Point 1)
                    });

                if (adresseError) {
                    console.error("⚠️ Échec insertion adresse (non bloquant) :", adresseError);
                } else {
                    console.log("📍 Adresse de facturation enregistrée.");
                }
            }

            // ==========================================
            // ÉTAPE D : INSERTION DES LIGNES DE COMMANDE
            // ==========================================
            let listCartItems: any[] = [];
            if (session.metadata?.cartData) {
                listCartItems = JSON.parse(session.metadata.cartData);

                const lignesAInserer = listCartItems.map((item: any) => ({
                    id_commande: parseInt(idCommande),
                    id_prix: item.id_prix,
                    quantite: item.quantite,
                    prix_unitaire: item.prix_unitaire,
                    sous_total: item.sous_total || (item.prix_unitaire * item.quantite),
                }));

                const { error: lignesError } = await supabase
                    .from("ligne_commande")
                    .insert(lignesAInserer);

                if (lignesError) throw lignesError;
                console.log("📦 Lignes de commande enregistrées.");
            }

            // ==========================================
            // ÉTAPE E : CRÉATION DE L'ABONNEMENT SAAS (Point 4)
            // ==========================================
            if (session.subscription) {
                const subscription: any = await stripe.subscriptions.retrieve(session.subscription as string);

                // 🆕 On récupère les dates depuis les "lines" de la facture (invoice)
                // Comme on a déjà récupéré 'invoice' à l'étape A, on peut s'en servir !
                let dateDebut = new Date().toISOString(); // Valeur par défaut : aujourd'hui
                let dateFin = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(); // Valeur par défaut : +1 mois

                if (session.invoice) {
                    // Si tu n'as pas gardé la variable invoice de l'étape A en dehors du if,
                    // refaisons un retrieve propre ici juste pour être sûr.
                    const inv = await stripe.invoices.retrieve(session.invoice as string);
                    if (inv.lines && inv.lines.data.length > 0) {
                        const firstLine = inv.lines.data[0];
                        if (firstLine.period) {
                            dateDebut = new Date(firstLine.period.start * 1000).toISOString();
                            dateFin = new Date(firstLine.period.end * 1000).toISOString();
                        }
                    }
                }

                // On cherche l'id_prix technique de notre BDD à partir du premier item du panier
                const premierItem = listCartItems[0];

                if (premierItem) {
                    const { error: abonnementError } = await supabase
                        .from("abonnement")
                        .insert({
                            statut_abonnement: subscription.status === "active" ? "Actif" : subscription.status,
                            date_debut: dateDebut,
                            date_fin: dateFin,
                            id_prix: premierItem.id_prix,
                            id_commande: parseInt(idCommande),
                            id_compte: idCompte !== "invite" ? idCompte : null,
                            stripe_subscription_id: subscription.id
                        });

                    if (abonnementError) {
                        console.error("⚠️ Échec création abonnement :", abonnementError);
                    } else {
                        console.log("📅 Abonnement SaaS activé en BDD avec les bonnes dates.");
                    }
                }
            }

            // ==========================================
            // ÉTAPE F : SAUVEGARDE DE L'ID CLIENT STRIPE (Point 3)
            // ==========================================
            if (idCompte !== "invite" && stripeCustomerId) {
                const { error: userUpdateError } = await supabase
                    .from("utilisateur")
                    .update({
                        token_connexion_stripe: stripeCustomerId
                    })
                    .eq("id_compte", idCompte)
                    .is("token_connexion_stripe", null); // 👈 On utilise .is() pour le vrai null SQL

                if (userUpdateError) {
                    console.error("⚠️ Échec mise à jour token_connexion_stripe :", userUpdateError);
                } else {
                    console.log(`💳 Vérification ID Client Stripe effectuée (ajouté ou déjà existant).`);
                }
            }

            console.log(`🚀 TRAITEMENT REUSSI POUR LA COMMANDE N°${idCommande} !`);

        } catch (dbError) {
            console.error("❌ Crash lors du traitement du Webhook :", dbError);
            return NextResponse.json({ received: true, db_error: true }, { status: 200 });
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}