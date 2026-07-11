export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.4"
    }
    public: {
        Tables: {
            abonnement: {
                Row: {
                    date_debut: string
                    date_fin: string | null
                    id_abonnement: number
                    id_commande: number
                    id_compte: string | null
                    id_prix: number
                    statut_abonnement: string
                    stripe_subscription_id: string | null
                }
                Insert: {
                    date_debut: string
                    date_fin?: string | null
                    id_abonnement?: number
                    id_commande: number
                    id_compte?: string | null
                    id_prix: number
                    statut_abonnement: string
                    stripe_subscription_id?: string | null
                }
                Update: {
                    date_debut?: string
                    date_fin?: string | null
                    id_abonnement?: number
                    id_commande?: number
                    id_compte?: string | null
                    id_prix?: number
                    statut_abonnement?: string
                    stripe_subscription_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "abonnement_id_commande_fkey"
                        columns: ["id_commande"]
                        isOneToOne: false
                        referencedRelation: "commande"
                        referencedColumns: ["id_commande"]
                    },
                    {
                        foreignKeyName: "abonnement_id_compte_fkey"
                        columns: ["id_compte"]
                        isOneToOne: false
                        referencedRelation: "utilisateur"
                        referencedColumns: ["id_compte"]
                    },
                    {
                        foreignKeyName: "abonnement_id_prix_fkey"
                        columns: ["id_prix"]
                        isOneToOne: false
                        referencedRelation: "prix_tarif"
                        referencedColumns: ["id_prix"]
                    },
                ]
            }
            adresse: {
                Row: {
                    adresse: string
                    adresse_complement: string | null
                    code_postal: string
                    id_adresse: number
                    id_compte: string | null
                    is_default: boolean
                    is_deleted: boolean
                    mail_utilisateur_invite: string | null
                    nom: string
                    pays: string
                    prenom: string
                    region: string | null
                    telephone: string | null
                    type_adresse: string | null
                    ville: string
                }
                Insert: {
                    adresse: string
                    adresse_complement?: string | null
                    code_postal: string
                    id_adresse?: number
                    id_compte?: string | null
                    is_default?: boolean
                    is_deleted?: boolean
                    mail_utilisateur_invite?: string | null
                    nom: string
                    pays: string
                    prenom: string
                    region?: string | null
                    telephone?: string | null
                    type_adresse?: string | null
                    ville: string
                }
                Update: {
                    adresse?: string
                    adresse_complement?: string | null
                    code_postal?: string
                    id_adresse?: number
                    id_compte?: string | null
                    is_default?: boolean
                    is_deleted?: boolean
                    mail_utilisateur_invite?: string | null
                    nom?: string
                    pays?: string
                    prenom?: string
                    region?: string | null
                    telephone?: string | null
                    type_adresse?: string | null
                    ville?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "adresse_id_compte_fkey"
                        columns: ["id_compte"]
                        isOneToOne: false
                        referencedRelation: "utilisateur"
                        referencedColumns: ["id_compte"]
                    },
                ]
            }
            caracteristique_technique: {
                Row: {
                    date_creation: string
                    id_caracteristique: number
                }
                Insert: {
                    date_creation?: string
                    id_caracteristique?: never
                }
                Update: {
                    date_creation?: string
                    id_caracteristique?: never
                }
                Relationships: []
            }
            caracteristique_technique_traduction: {
                Row: {
                    id_caracteristique: number
                    langue: Database["public"]["Enums"]["langue"]
                    nom_caracteristique: string
                }
                Insert: {
                    id_caracteristique: number
                    langue: Database["public"]["Enums"]["langue"]
                    nom_caracteristique: string
                }
                Update: {
                    id_caracteristique?: number
                    langue?: Database["public"]["Enums"]["langue"]
                    nom_caracteristique?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "caracteristique_technique_traduction_id_caracteristique_fkey"
                        columns: ["id_caracteristique"]
                        isOneToOne: false
                        referencedRelation: "caracteristique_technique"
                        referencedColumns: ["id_caracteristique"]
                    },
                ]
            }
            categorie: {
                Row: {
                    id_categorie: number
                    lien_image_cat: string | null
                    ordre_affichage: number | null
                }
                Insert: {
                    id_categorie?: number
                    lien_image_cat?: string | null
                    ordre_affichage?: number | null
                }
                Update: {
                    id_categorie?: number
                    lien_image_cat?: string | null
                    ordre_affichage?: number | null
                }
                Relationships: []
            }
            categorie_traduction: {
                Row: {
                    cat_description: string | null
                    cat_nom: string
                    id_categorie: number
                    langue: Database["public"]["Enums"]["langue"]
                }
                Insert: {
                    cat_description?: string | null
                    cat_nom: string
                    id_categorie: number
                    langue: Database["public"]["Enums"]["langue"]
                }
                Update: {
                    cat_description?: string | null
                    cat_nom?: string
                    id_categorie?: number
                    langue?: Database["public"]["Enums"]["langue"]
                }
                Relationships: [
                    {
                        foreignKeyName: "categorie_traduction_id_categorie_fkey"
                        columns: ["id_categorie"]
                        isOneToOne: false
                        referencedRelation: "categorie"
                        referencedColumns: ["id_categorie"]
                    },
                ]
            }
            code_promo: {
                Row: {
                    id_code_promo: number
                    id_promotion: number
                    is_actif: boolean
                    lib_code: string
                    type_promo: string | null
                    stripe_promotion_code_id: string | null
                }
                Insert: {
                    id_code_promo?: number
                    id_promotion: number
                    is_actif?: boolean
                    lib_code: string
                    type_promo?: string | null
                    stripe_promotion_code_id?: string | null
                }
                Update: {
                    id_code_promo?: number
                    id_promotion?: number
                    is_actif?: boolean
                    lib_code?: string
                    type_promo?: string | null
                    stripe_promotion_code_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "code_promo_id_promotion_fkey"
                        columns: ["id_promotion"]
                        isOneToOne: true
                        referencedRelation: "promotion"
                        referencedColumns: ["id_promotion"]
                    },
                ]
            }
            commande: {
                Row: {
                    date_commande: string
                    id_commande: number
                    id_compte: string | null
                    id_promotion: number | null
                    mail_utilisateur_invite: string | null
                    montant_total: number
                    statut_commande: string
                    stock_decremented_at: string | null
                    stripe_checkout_session_id: string | null
                    url_facture: string | null
                }
                Insert: {
                    date_commande?: string
                    id_commande?: number
                    id_compte?: string | null
                    id_promotion?: number | null
                    mail_utilisateur_invite?: string | null
                    montant_total: number
                    statut_commande?: string
                    stock_decremented_at?: string | null
                    stripe_checkout_session_id?: string | null
                    url_facture?: string | null
                }
                Update: {
                    date_commande?: string
                    id_commande?: number
                    id_compte?: string | null
                    id_promotion?: number | null
                    mail_utilisateur_invite?: string | null
                    montant_total?: number
                    statut_commande?: string
                    stock_decremented_at?: string | null
                    stripe_checkout_session_id?: string | null
                    url_facture?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "commande_id_compte_fkey"
                        columns: ["id_compte"]
                        isOneToOne: false
                        referencedRelation: "utilisateur"
                        referencedColumns: ["id_compte"]
                    },
                    {
                        foreignKeyName: "commande_id_promotion_fkey"
                        columns: ["id_promotion"]
                        isOneToOne: false
                        referencedRelation: "promotion"
                        referencedColumns: ["id_promotion"]
                    },
                ]
            }
            facture: {
                Row: {
                    created_at: string
                    date_facture: string
                    devise: string
                    email_client: string | null
                    hosted_invoice_url: string | null
                    id_commande: number | null
                    id_compte: string | null
                    id_facture: number
                    montant_total: number
                    statut: string
                    storage_path: string | null
                    stripe_invoice_id: string
                    stripe_subscription_id: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    date_facture: string
                    devise?: string
                    email_client?: string | null
                    hosted_invoice_url?: string | null
                    id_commande?: number | null
                    id_compte?: string | null
                    id_facture?: number
                    montant_total?: number
                    statut: string
                    storage_path?: string | null
                    stripe_invoice_id: string
                    stripe_subscription_id?: string | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    date_facture?: string
                    devise?: string
                    email_client?: string | null
                    hosted_invoice_url?: string | null
                    id_commande?: number | null
                    id_compte?: string | null
                    id_facture?: number
                    montant_total?: number
                    statut?: string
                    storage_path?: string | null
                    stripe_invoice_id?: string
                    stripe_subscription_id?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "facture_id_commande_fkey"
                        columns: ["id_commande"]
                        isOneToOne: false
                        referencedRelation: "commande"
                        referencedColumns: ["id_commande"]
                    },
                    {
                        foreignKeyName: "facture_id_compte_fkey"
                        columns: ["id_compte"]
                        isOneToOne: false
                        referencedRelation: "utilisateur"
                        referencedColumns: ["id_compte"]
                    },
                ]
            }
            image_carrousel: {
                Row: {
                    est_actif: boolean
                    id_image: number
                    lien_image_caroussel: string
                    ordre: number
                }
                Insert: {
                    est_actif?: boolean
                    id_image?: number
                    lien_image_caroussel: string
                    ordre?: number
                }
                Update: {
                    est_actif?: boolean
                    id_image?: number
                    lien_image_caroussel?: string
                    ordre?: number
                }
                Relationships: []
            }
            image_carrousel_traduction: {
                Row: {
                    description_image: string | null
                    id_image: number
                    langue: Database["public"]["Enums"]["langue"]
                    titre_image: string
                }
                Insert: {
                    description_image?: string | null
                    id_image: number
                    langue: Database["public"]["Enums"]["langue"]
                    titre_image: string
                }
                Update: {
                    description_image?: string | null
                    id_image?: number
                    langue?: Database["public"]["Enums"]["langue"]
                    titre_image?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "image_carrousel_traduction_id_image_fkey"
                        columns: ["id_image"]
                        isOneToOne: false
                        referencedRelation: "image_carrousel"
                        referencedColumns: ["id_image"]
                    },
                ]
            }
            image_produit: {
                Row: {
                    id_image: number
                    id_produit: number
                    lien_image_produit: string
                    ordre_affichage: number | null
                }
                Insert: {
                    id_image?: number
                    id_produit: number
                    lien_image_produit: string
                    ordre_affichage?: number | null
                }
                Update: {
                    id_image?: number
                    id_produit?: number
                    lien_image_produit?: string
                    ordre_affichage?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "image_produit_id_produit_fkey"
                        columns: ["id_produit"]
                        isOneToOne: false
                        referencedRelation: "produit"
                        referencedColumns: ["id_produit"]
                    },
                ]
            }
            lien_categorie_promo: {
                Row: {
                    id_categorie: number
                    id_promotion: number
                }
                Insert: {
                    id_categorie: number
                    id_promotion: number
                }
                Update: {
                    id_categorie?: number
                    id_promotion?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "lien_categorie_promo_id_categorie_fkey"
                        columns: ["id_categorie"]
                        isOneToOne: false
                        referencedRelation: "categorie"
                        referencedColumns: ["id_categorie"]
                    },
                    {
                        foreignKeyName: "lien_categorie_promo_id_promotion_fkey"
                        columns: ["id_promotion"]
                        isOneToOne: false
                        referencedRelation: "promotion"
                        referencedColumns: ["id_promotion"]
                    },
                ]
            }
            lien_produit_promo: {
                Row: {
                    id_produit: number
                    id_promotion: number
                }
                Insert: {
                    id_produit: number
                    id_promotion: number
                }
                Update: {
                    id_produit?: number
                    id_promotion?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "lien_produit_promo_id_produit_fkey"
                        columns: ["id_produit"]
                        isOneToOne: false
                        referencedRelation: "produit"
                        referencedColumns: ["id_produit"]
                    },
                    {
                        foreignKeyName: "lien_produit_promo_id_promotion_fkey"
                        columns: ["id_promotion"]
                        isOneToOne: false
                        referencedRelation: "promotion"
                        referencedColumns: ["id_promotion"]
                    },
                ]
            }
            ligne_commande: {
                Row: {
                    id_commande: number
                    id_prix: number
                    id_promotion: number | null
                    prix_unitaire: number
                    quantite: number
                    remise_unitaire_appliquee: string | null
                    sous_total: number
                    taux_remise_donne: string | null
                }
                Insert: {
                    id_commande: number
                    id_prix: number
                    id_promotion?: number | null
                    prix_unitaire: number
                    quantite?: number
                    remise_unitaire_appliquee?: string | null
                    sous_total: number
                    taux_remise_donne?: string | null
                }
                Update: {
                    id_commande?: number
                    id_prix?: number
                    id_promotion?: number | null
                    prix_unitaire?: number
                    quantite?: number
                    remise_unitaire_appliquee?: string | null
                    sous_total?: number
                    taux_remise_donne?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "ligne_commande_id_commande_fkey"
                        columns: ["id_commande"]
                        isOneToOne: false
                        referencedRelation: "commande"
                        referencedColumns: ["id_commande"]
                    },
                    {
                        foreignKeyName: "ligne_commande_id_prix_fkey"
                        columns: ["id_prix"]
                        isOneToOne: false
                        referencedRelation: "prix_tarif"
                        referencedColumns: ["id_prix"]
                    },
                    {
                        foreignKeyName: "ligne_commande_id_promotion_fkey"
                        columns: ["id_promotion"]
                        isOneToOne: false
                        referencedRelation: "promotion"
                        referencedColumns: ["id_promotion"]
                    },
                ]
            }
            prix_tarif: {
                Row: {
                    id_prix: number
                    id_produit: number
                    prix: number
                    stripe_price_id: string
                    type_facturation: string
                }
                Insert: {
                    id_prix?: number
                    id_produit: number
                    prix: number
                    stripe_price_id: string
                    type_facturation: string
                }
                Update: {
                    id_prix?: number
                    id_produit?: number
                    prix?: number
                    stripe_price_id?: string
                    type_facturation?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "prix_tarif_id_produit_fkey"
                        columns: ["id_produit"]
                        isOneToOne: false
                        referencedRelation: "produit"
                        referencedColumns: ["id_produit"]
                    },
                ]
            }
            prix_tarif_traduction: {
                Row: {
                    id_prix: number
                    langue: Database["public"]["Enums"]["langue"]
                    nom_prix_tarif: string | null
                    unite: string | null
                }
                Insert: {
                    id_prix: number
                    langue: Database["public"]["Enums"]["langue"]
                    nom_prix_tarif?: string | null
                    unite?: string | null
                }
                Update: {
                    id_prix?: number
                    langue?: Database["public"]["Enums"]["langue"]
                    nom_prix_tarif?: string | null
                    unite?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "prix_tarif_traduction_id_prix_fkey"
                        columns: ["id_prix"]
                        isOneToOne: false
                        referencedRelation: "prix_tarif"
                        referencedColumns: ["id_prix"]
                    },
                ]
            }
            produit: {
                Row: {
                    date_ajout: string
                    id_categorie: number
                    id_produit: number
                    is_priorite: boolean
                    mis_avant: boolean
                    mis_avant_ordre: number
                    ordre_priorite: number
                    quantite_produit: number
                    statut_produit: boolean
                    stripe_product_id: string | null
                }
                Insert: {
                    date_ajout?: string
                    id_categorie: number
                    id_produit?: number
                    is_priorite?: boolean
                    mis_avant?: boolean
                    mis_avant_ordre?: number
                    ordre_priorite?: number
                    quantite_produit?: number
                    statut_produit?: boolean
                    stripe_product_id?: string | null
                }
                Update: {
                    date_ajout?: string
                    id_categorie?: number
                    id_produit?: number
                    is_priorite?: boolean
                    mis_avant?: boolean
                    mis_avant_ordre?: number
                    ordre_priorite?: number
                    quantite_produit?: number
                    statut_produit?: boolean
                    stripe_product_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "produit_id_categorie_fkey"
                        columns: ["id_categorie"]
                        isOneToOne: false
                        referencedRelation: "categorie"
                        referencedColumns: ["id_categorie"]
                    },
                ]
            }
            produit_caracteristique_technique: {
                Row: {
                    id_caracteristique: number
                    id_produit: number
                    ordre_affichage: number
                }
                Insert: {
                    id_caracteristique: number
                    id_produit: number
                    ordre_affichage?: number
                }
                Update: {
                    id_caracteristique?: number
                    id_produit?: number
                    ordre_affichage?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "produit_caracteristique_technique_id_caracteristique_fkey"
                        columns: ["id_caracteristique"]
                        isOneToOne: false
                        referencedRelation: "caracteristique_technique"
                        referencedColumns: ["id_caracteristique"]
                    },
                    {
                        foreignKeyName: "produit_caracteristique_technique_id_produit_fkey"
                        columns: ["id_produit"]
                        isOneToOne: false
                        referencedRelation: "produit"
                        referencedColumns: ["id_produit"]
                    },
                ]
            }
            produit_traduction: {
                Row: {
                    id_produit: number
                    langue: Database["public"]["Enums"]["langue"]
                    nom_pro: string
                    pro_carac_technique: string | null
                    pro_description: string | null
                }
                Insert: {
                    id_produit: number
                    langue: Database["public"]["Enums"]["langue"]
                    nom_pro: string
                    pro_carac_technique?: string | null
                    pro_description?: string | null
                }
                Update: {
                    id_produit?: number
                    langue?: Database["public"]["Enums"]["langue"]
                    nom_pro?: string
                    pro_carac_technique?: string | null
                    pro_description?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "produit_traduction_id_produit_fkey"
                        columns: ["id_produit"]
                        isOneToOne: false
                        referencedRelation: "produit"
                        referencedColumns: ["id_produit"]
                    },
                ]
            }
            promotion: {
                Row: {
                    date_expiration: string
                    id_promotion: number
                    is_actif: boolean
                    is_code_promo: boolean
                    lien_image_promo: string | null
                    type_remise: string
                    valeur_remise: number
                    stripe_coupon_id: string | null
                    stripe_duration: string
                    duree_mois: number | null
                }
                Insert: {
                    date_expiration: string
                    id_promotion?: number
                    is_actif?: boolean
                    is_code_promo?: boolean
                    lien_image_promo?: string | null
                    type_remise: string
                    valeur_remise: number
                    stripe_coupon_id?: string | null
                    stripe_duration?: string
                    duree_mois?: number | null
                }
                Update: {
                    date_expiration?: string
                    id_promotion?: number
                    is_actif?: boolean
                    is_code_promo?: boolean
                    lien_image_promo?: string | null
                    type_remise?: string
                    valeur_remise?: number
                    stripe_coupon_id?: string | null
                    stripe_duration?: string
                    duree_mois?: number | null
                }
                Relationships: []
            }
            texte_general: {
                Row: {
                    emplacement_texte: string
                    id_texte: number
                    langue: Database["public"]["Enums"]["langue"]
                    texte: string
                }
                Insert: {
                    emplacement_texte: string
                    id_texte?: number
                    langue?: Database["public"]["Enums"]["langue"]
                    texte: string
                }
                Update: {
                    emplacement_texte?: string
                    id_texte?: number
                    langue?: Database["public"]["Enums"]["langue"]
                    texte?: string
                }
                Relationships: []
            }
            ticket_support: {
                Row: {
                    date_creation: string | null
                    date_fermeture: string | null
                    description: string | null
                    email_contact: string
                    id_compte: string | null
                    id_commande: number | null
                    id_support: string
                    origine_chatbot: boolean | null
                    status: string | null
                    sujet: string
                }
                Insert: {
                    date_creation?: string | null
                    date_fermeture?: string | null
                    description?: string | null
                    email_contact: string
                    id_compte?: string | null
                    id_commande?: number | null
                    id_support?: string
                    origine_chatbot?: boolean | null
                    status?: string | null
                    sujet: string
                }
                Update: {
                    date_creation?: string | null
                    date_fermeture?: string | null
                    description?: string | null
                    email_contact?: string
                    id_compte?: string | null
                    id_commande?: number | null
                    id_support?: string
                    origine_chatbot?: boolean | null
                    status?: string | null
                    sujet?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ticket_support_id_commande_fkey"
                        columns: ["id_commande"]
                        isOneToOne: false
                        referencedRelation: "commande"
                        referencedColumns: ["id_commande"]
                    },
                    {
                        foreignKeyName: "ticket_support_id_compte_fkey"
                        columns: ["id_compte"]
                        isOneToOne: false
                        referencedRelation: "utilisateur"
                        referencedColumns: ["id_compte"]
                    },
                ]
            }
            utilisateur: {
                Row: {
                    adresse_mail: string
                    id_compte: string
                    is_actif: boolean
                    nom_complet: string
                    role: string
                    token_connexion_stripe: string
                }
                Insert: {
                    adresse_mail: string
                    id_compte: string
                    is_actif?: boolean
                    nom_complet: string
                    role?: string
                    token_connexion_stripe: string
                }
                Update: {
                    adresse_mail?: string
                    id_compte?: string
                    is_actif?: boolean
                    nom_complet?: string
                    role?: string
                    token_connexion_stripe?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            est_admin: { Args: never; Returns: boolean }
            finalize_paid_order: { Args: { p_order_id: number }; Returns: boolean }
        }
        Enums: {
            langue: "fr" | "en"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            langue: ["fr", "en"],
        },
    },
} as const
