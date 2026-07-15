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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      abonnement: {
        Row: {
          annulation_programmee: boolean
          date_debut: string
          date_fin: string | null
          id_abonnement: number
          id_commande: number
          id_compte: string | null
          id_prix: number
          nombre_utilisateurs: number
          statut_abonnement: string
          stripe_subscription_id: string | null
          stripe_subscription_item_id: string | null
        }
        Insert: {
          annulation_programmee?: boolean
          date_debut: string
          date_fin?: string | null
          id_abonnement?: number
          id_commande: number
          id_compte?: string | null
          id_prix: number
          nombre_utilisateurs?: number
          statut_abonnement: string
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
        }
        Update: {
          annulation_programmee?: boolean
          date_debut?: string
          date_fin?: string | null
          id_abonnement?: number
          id_commande?: number
          id_compte?: string | null
          id_prix?: number
          nombre_utilisateurs?: number
          statut_abonnement?: string
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
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
      chat_conversation: {
        Row: {
          created_at: string
          expires_at: string
          guest_session_hash: string | null
          id_compte: string | null
          id_conversation: string
          locale: Database["public"]["Enums"]["langue"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          guest_session_hash?: string | null
          id_compte?: string | null
          id_conversation?: string
          locale?: Database["public"]["Enums"]["langue"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          guest_session_hash?: string | null
          id_compte?: string | null
          id_conversation?: string
          locale?: Database["public"]["Enums"]["langue"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_id_compte_fkey"
            columns: ["id_compte"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_compte"]
          },
        ]
      }
      chat_message: {
        Row: {
          content: string
          created_at: string
          id_conversation: string
          id_message: number
          metadata: Json
          role: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          id_conversation: string
          id_message?: never
          metadata?: Json
          role: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          id_conversation?: string
          id_message?: never
          metadata?: Json
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_id_conversation_fkey"
            columns: ["id_conversation"]
            isOneToOne: false
            referencedRelation: "chat_conversation"
            referencedColumns: ["id_conversation"]
          },
        ]
      }
      code_promo: {
        Row: {
          id_code_promo: number
          id_promotion: number
          is_actif: boolean
          lib_code: string
          stripe_promotion_code_id: string | null
          type_promo: string | null
        }
        Insert: {
          id_code_promo?: number
          id_promotion: number
          is_actif?: boolean
          lib_code: string
          stripe_promotion_code_id?: string | null
          type_promo?: string | null
        }
        Update: {
          id_code_promo?: number
          id_promotion?: number
          is_actif?: boolean
          lib_code?: string
          stripe_promotion_code_id?: string | null
          type_promo?: string | null
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
          billing_address_snapshot: Json | null
          date_commande: string
          id_commande: number
          id_compte: string | null
          id_promotion: number | null
          mail_utilisateur_invite: string | null
          montant_total: number
          payment_method_brand: string | null
          payment_method_last4: string | null
          statut_commande: string
          stock_decremented_at: string | null
          stripe_checkout_session_id: string | null
          url_facture: string | null
        }
        Insert: {
          billing_address_snapshot?: Json | null
          date_commande?: string
          id_commande?: number
          id_compte?: string | null
          id_promotion?: number | null
          mail_utilisateur_invite?: string | null
          montant_total: number
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          statut_commande?: string
          stock_decremented_at?: string | null
          stripe_checkout_session_id?: string | null
          url_facture?: string | null
        }
        Update: {
          billing_address_snapshot?: Json | null
          date_commande?: string
          id_commande?: number
          id_compte?: string | null
          id_promotion?: number | null
          mail_utilisateur_invite?: string | null
          montant_total?: number
          payment_method_brand?: string | null
          payment_method_last4?: string | null
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
          id_facture?: never
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
          id_facture?: never
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
          lien_bouton: string | null
          lien_image_caroussel: string
          ordre: number
        }
        Insert: {
          est_actif?: boolean
          id_image?: number
          lien_bouton?: string | null
          lien_image_caroussel: string
          ordre?: number
        }
        Update: {
          est_actif?: boolean
          id_image?: number
          lien_bouton?: string | null
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
          texte_bouton: string | null
          titre_image: string
        }
        Insert: {
          description_image?: string | null
          id_image: number
          langue: Database["public"]["Enums"]["langue"]
          texte_bouton?: string | null
          titre_image: string
        }
        Update: {
          description_image?: string | null
          id_image?: number
          langue?: Database["public"]["Enums"]["langue"]
          texte_bouton?: string | null
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
      mfa_reset_audit: {
        Row: {
          actor_id: string
          completed_at: string | null
          created_at: string
          error_code: string | null
          factor_count: number
          id_audit: string
          status: string
          target_id: string
          ticket_id: string
        }
        Insert: {
          actor_id: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          factor_count?: number
          id_audit?: string
          status?: string
          target_id: string
          ticket_id: string
        }
        Update: {
          actor_id?: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          factor_count?: number
          id_audit?: string
          status?: string
          target_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_reset_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_compte"]
          },
          {
            foreignKeyName: "mfa_reset_audit_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_compte"]
          },
          {
            foreignKeyName: "mfa_reset_audit_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_support"
            referencedColumns: ["id_support"]
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
          est_disponible: boolean
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
          est_disponible?: boolean
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
          est_disponible?: boolean
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
          duree_mois: number | null
          id_promotion: number
          is_actif: boolean
          is_code_promo: boolean
          lien_image_promo: string | null
          stripe_coupon_id: string | null
          stripe_duration: string
          type_remise: string
          valeur_remise: number
        }
        Insert: {
          date_expiration: string
          duree_mois?: number | null
          id_promotion?: number
          is_actif?: boolean
          is_code_promo?: boolean
          lien_image_promo?: string | null
          stripe_coupon_id?: string | null
          stripe_duration?: string
          type_remise: string
          valeur_remise: number
        }
        Update: {
          date_expiration?: string
          duree_mois?: number | null
          id_promotion?: number
          is_actif?: boolean
          is_code_promo?: boolean
          lien_image_promo?: string | null
          stripe_coupon_id?: string | null
          stripe_duration?: string
          type_remise?: string
          valeur_remise?: number
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
          categorie: Database["public"]["Enums"]["support_ticket_category"]
          date_creation: string | null
          date_fermeture: string | null
          description: string | null
          email_contact: string
          id_commande: number | null
          id_compte: string | null
          id_support: string
          origine_chatbot: boolean | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          sujet: string
          updated_at: string
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["support_ticket_category"]
          date_creation?: string | null
          date_fermeture?: string | null
          description?: string | null
          email_contact: string
          id_commande?: number | null
          id_compte?: string | null
          id_support?: string
          origine_chatbot?: boolean | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          sujet: string
          updated_at?: string
        }
        Update: {
          categorie?: Database["public"]["Enums"]["support_ticket_category"]
          date_creation?: string | null
          date_fermeture?: string | null
          description?: string | null
          email_contact?: string
          id_commande?: number | null
          id_compte?: string | null
          id_support?: string
          origine_chatbot?: boolean | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          sujet?: string
          updated_at?: string
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
      ticket_support_message: {
        Row: {
          auteur_id: string | null
          contenu: string
          created_at: string
          id_message: number
          id_support: string
          sender: Database["public"]["Enums"]["support_message_sender"]
        }
        Insert: {
          auteur_id?: string | null
          contenu: string
          created_at?: string
          id_message?: never
          id_support: string
          sender: Database["public"]["Enums"]["support_message_sender"]
        }
        Update: {
          auteur_id?: string | null
          contenu?: string
          created_at?: string
          id_message?: never
          id_support?: string
          sender?: Database["public"]["Enums"]["support_message_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "ticket_support_message_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_compte"]
          },
          {
            foreignKeyName: "ticket_support_message_id_support_fkey"
            columns: ["id_support"]
            isOneToOne: false
            referencedRelation: "ticket_support"
            referencedColumns: ["id_support"]
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
      create_support_ticket: {
        Args: {
          p_categorie: Database["public"]["Enums"]["support_ticket_category"]
          p_description: string
          p_email_contact: string
          p_id_commande?: number
          p_id_compte?: string
          p_origine_chatbot?: boolean
          p_sujet: string
        }
        Returns: string
      }
      est_admin: { Args: never; Returns: boolean }
      finalize_paid_order: { Args: { p_order_id: number }; Returns: boolean }
      purge_expired_chat_conversations: { Args: never; Returns: number }
      replace_product_technical_characteristics: {
        Args: { p_characteristic_ids: number[]; p_product_id: number }
        Returns: undefined
      }
      upsert_technical_characteristic: {
        Args: { p_id?: number; p_label_en?: string; p_label_fr?: string }
        Returns: number
      }
    }
    Enums: {
      langue: "fr" | "en"
      support_message_sender: "customer" | "support"
      support_ticket_category:
        | "billing"
        | "order"
        | "subscription"
        | "account"
        | "data_access"
        | "technical"
        | "other"
        | "admin_access"
        | "mfa_reset"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting_customer"
        | "resolved"
        | "closed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      langue: ["fr", "en"],
      support_message_sender: ["customer", "support"],
      support_ticket_category: [
        "billing",
        "order",
        "subscription",
        "account",
        "data_access",
        "technical",
        "other",
        "admin_access",
        "mfa_reset",
      ],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting_customer",
        "resolved",
        "closed",
      ],
    },
  },
} as const
