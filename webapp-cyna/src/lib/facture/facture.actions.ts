"use server";

import { createServerClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Génère une URL signée temporaire (60 secondes) pour permettre à l'utilisateur 
 * connecté de télécharger ou visualiser sa facture stockée dans le Bucket privé.
 * * @param fileName Le nom du fichier stocké dans la colonne 'url_facture' (ex: facture_12_in_abc.pdf)
 * @returns L'URL sécurisée et temporaire du PDF
 */
export async function getFactureSignedUrl(fileName: string) {
    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    // 1. Double sécurité : On vérifie que la personne qui demande est bien connectée sur le site
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Vous devez être connecté pour accéder à cette facture.");
    }

    // Récupérer la commande associée à cette facture pour connaître id_commande
    const { data: commande, error: cmdError } = await adminSupabase
        .from("commande")
        .select("id_commande, mail_utilisateur_invite")
        .eq("url_facture", fileName)
        .single();

    if (cmdError || !commande) {
        throw new Error("Commande introuvable pour cette facture.");
    }

    // Récupérer l'email de l'utilisateur connecté
    const { data: dbUser } = await adminSupabase
        .from("utilisateur")
        .select("adresse_mail")
        .eq("id_compte", user.id)
        .single();

    const userEmail = dbUser?.adresse_mail;

    // Vérifier les autorisations (l'email de l'utilisateur connecté doit correspondre)
    if (
        !userEmail || 
        !commande.mail_utilisateur_invite || 
        commande.mail_utilisateur_invite.toLowerCase() !== userEmail.toLowerCase()
    ) {
        throw new Error("Vous n'êtes pas autorisé à voir cette facture.");
    }

    // Le fichier a pu être uploadé dans différentes arborescences selon l'historique du code
    const userPath = `${user.id}/${commande.id_commande}/${fileName}`;
    const invitePath = `invite/${commande.id_commande}/${fileName}`;
    const rootPath = fileName;
    
    let filePath = rootPath; // par défaut on tente à la racine (anciennes factures)

    // 1. On vérifie s'il existe sous le dossier de l'utilisateur
    const { data: userFiles } = await adminSupabase.storage
        .from("invoice-pdf")
        .list(`${user.id}/${commande.id_commande}`);
        
    if (userFiles?.some((f) => f.name === fileName)) {
        filePath = userPath;
    } else {
        // 2. Sinon, on vérifie s'il existe sous le dossier invité
        const { data: inviteFiles } = await adminSupabase.storage
            .from("invoice-pdf")
            .list(`invite/${commande.id_commande}`);
            
        if (inviteFiles?.some((f) => f.name === fileName)) {
            filePath = invitePath;
        }
    }

    // 2. On demande à Supabase un lien secret temporaire valable 1 minute (60 secondes) via admin client pour bypasser RLS
    const { data, error } = await adminSupabase.storage
        .from("invoice-pdf")
        .createSignedUrl(filePath, 60);

    if (error || !data) {
        console.error(" Erreur Supabase Storage lors de la génération de l'URL signée :", error);
        throw new Error("Impossible de générer le lien de téléchargement.");
    }

    // On renvoie le lien à l'application (le navigateur pourra faire un window.open(url))
    return data.signedUrl;
}