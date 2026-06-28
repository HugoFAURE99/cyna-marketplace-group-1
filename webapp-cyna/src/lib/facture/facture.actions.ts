"use server";

import { createServerClient } from "@/lib/supabase/server-client";

/**
 * Génère une URL signée temporaire (60 secondes) pour permettre à l'utilisateur 
 * connecté de télécharger ou visualiser sa facture stockée dans le Bucket privé.
 * * @param fileName Le nom du fichier stocké dans la colonne 'url_facture' (ex: facture_12_in_abc.pdf)
 * @returns L'URL sécurisée et temporaire du PDF
 */
export async function getFactureSignedUrl(fileName: string) {
    const supabase = await createServerClient();

    // 1. Double sécurité : On vérifie que la personne qui demande est bien connectée sur le site
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Vous devez être connecté pour accéder à cette facture.");
    }

    // 2. On demande à Supabase un lien secret temporaire valable 1 minute (60 secondes)
    const { data, error } = await supabase.storage
        .from("invoice-pdf")
        .createSignedUrl(fileName, 60);

    if (error || !data) {
        console.error(" Erreur Supabase Storage lors de la génération de l'URL signée :", error);
        throw new Error("Impossible de générer le lien de téléchargement.");
    }

    // On renvoie le lien à l'application (le navigateur pourra faire un window.open(url))
    return data.signedUrl;
}