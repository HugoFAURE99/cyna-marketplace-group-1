'use server';

import { createServerClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

export async function addAddress(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const adresse = formData.get("adresse") as string;
  const adresse_complement = (formData.get("adresse_complement") as string) || null;
  const code_postal = formData.get("code_postal") as string;
  const ville = formData.get("ville") as string;
  const region = formData.get("region") as string;
  const pays = formData.get("pays") as string;
  const telephone = (formData.get("telephone") as string) || null;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("adresse").insert({
    id_compte: user.id,
    nom,
    prenom,
    adresse,
    adresse_complement,
    code_postal,
    ville,
    region,
    pays,
    telephone,
  });

  if (error) {
    console.error("Error inserting address:", error);
    throw new Error(`Failed to add address: ${error.message} (Details: ${error.details})`);
  }

  const locale = await getLocale();
  revalidatePath("/user-dashboard/addresses");
  redirect({ href: "/user-dashboard/addresses", locale: locale as any });
}
