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
          id_commande: number
          id_compte: string
          statut_abonnement: string
        }
        Insert: {
          date_debut: string
          date_fin?: string | null
          id_commande: number
          id_compte: string
          statut_abonnement: string
        }
        Update: {
          date_debut?: string
          date_fin?: string | null
          id_commande?: number
          id_compte?: string
          statut_abonnement?: string
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
        ]
      }
      adresse_facturation: {
        Row: {
          adresse: string
          adresse_complement: string | null
          code_postal: string
          id_adresse: number
          id_compte: string
          nom: string
          pays: string
          prenom: string
          region: string
          telephone: string | null
          ville: string
        }
        Insert: {
          adresse: string
          adresse_complement?: string | null
          code_postal: string
          id_adresse?: number
          id_compte: string
          nom: string
          pays: string
          prenom: string
          region: string
          telephone?: string | null
          ville: string
        }
        Update: {
          adresse?: string
          adresse_complement?: string | null
          code_postal?: string
          id_adresse?: number
          id_compte?: string
          nom?: string
          pays?: string
          prenom?: string
          region?: string
          telephone?: string | null
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "adresse_facturation_id_compte_fkey"
            columns: ["id_compte"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_compte"]
          },
        ]
      }
      categorie: {
        Row: {
          cat_description: string | null
          cat_nom: string
          id_image_cat: string | null
          idcategorie: number
          ordre_affichage: number | null
        }
        Insert: {
          cat_description?: string | null
          cat_nom: string
          id_image_cat?: string | null
          idcategorie?: number
          ordre_affichage?: number | null
        }
        Update: {
          cat_description?: string | null
          cat_nom?: string
          id_image_cat?: string | null
          idcategorie?: number
          ordre_affichage?: number | null
        }
        Relationships: []
      }
      commande: {
        Row: {
          date_commande: string
          id_commande: number
          montant_total: number
          statut_commande: string
          url_facture: string | null
        }
        Insert: {
          date_commande?: string
          id_commande?: number
          montant_total: number
          statut_commande?: string
          url_facture?: string | null
        }
        Update: {
          date_commande?: string
          id_commande?: number
          montant_total?: number
          statut_commande?: string
          url_facture?: string | null
        }
        Relationships: []
      }
      image_produit: {
        Row: {
          id_image: number
          id_produit: number
          image_url: string
          ordre_affichage: number | null
        }
        Insert: {
          id_image?: number
          id_produit: number
          image_url: string
          ordre_affichage?: number | null
        }
        Update: {
          id_image?: number
          id_produit?: number
          image_url?: string
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
      ligne_commande: {
        Row: {
          id_commande: number
          id_prix: string
          id_promotion: number | null
          prix_unitaire: number
          quantite: number
          sous_total: number
        }
        Insert: {
          id_commande: number
          id_prix: string
          id_promotion?: number | null
          prix_unitaire: number
          quantite?: number
          sous_total: number
        }
        Update: {
          id_commande?: number
          id_prix?: string
          id_promotion?: number | null
          prix_unitaire?: number
          quantite?: number
          sous_total?: number
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
          id_prix: string
          id_produit: number
          prix: number
          stripe_price_id: string
          type_facturation: string
          unite: string | null
        }
        Insert: {
          id_prix: string
          id_produit: number
          prix: number
          stripe_price_id: string
          type_facturation: string
          unite?: string | null
        }
        Update: {
          id_prix?: string
          id_produit?: number
          prix?: number
          stripe_price_id?: string
          type_facturation?: string
          unite?: string | null
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
      produit: {
        Row: {
          date_ajout: string
          id_produit: number
          idcategorie: number
          mis_avant: boolean | null
          nom_pro: string
          ordre_priorite: number | null
          pro_carac_technique: string | null
          pro_description: string | null
          statut_produit: boolean
          stripe_product_id: string | null
        }
        Insert: {
          date_ajout?: string
          id_produit?: number
          idcategorie: number
          mis_avant?: boolean | null
          nom_pro: string
          ordre_priorite?: number | null
          pro_carac_technique?: string | null
          pro_description?: string | null
          statut_produit?: boolean
          stripe_product_id?: string | null
        }
        Update: {
          date_ajout?: string
          id_produit?: number
          idcategorie?: number
          mis_avant?: boolean | null
          nom_pro?: string
          ordre_priorite?: number | null
          pro_carac_technique?: string | null
          pro_description?: string | null
          statut_produit?: boolean
          stripe_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produit_idcategorie_fkey"
            columns: ["idcategorie"]
            isOneToOne: false
            referencedRelation: "categorie"
            referencedColumns: ["idcategorie"]
          },
        ]
      }
      promotion: {
        Row: {
          actif: boolean | null
          code_promo: string
          date_expiration: string
          id_promotion: number
          lien_image: string | null
          pourcentage_remise: number
        }
        Insert: {
          actif?: boolean | null
          code_promo: string
          date_expiration: string
          id_promotion?: number
          lien_image?: string | null
          pourcentage_remise: number
        }
        Update: {
          actif?: boolean | null
          code_promo?: string
          date_expiration?: string
          id_promotion?: number
          lien_image?: string | null
          pourcentage_remise?: number
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
          id_support?: string
          origine_chatbot?: boolean | null
          status?: string | null
          sujet?: string
        }
        Relationships: [
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
          nom_complet: string
          role: string | null
          token_connexion_stripe: string | null
        }
        Insert: {
          adresse_mail: string
          id_compte: string
          nom_complet: string
          role?: string | null
          token_connexion_stripe?: string | null
        }
        Update: {
          adresse_mail?: string
          id_compte?: string
          nom_complet?: string
          role?: string | null
          token_connexion_stripe?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
