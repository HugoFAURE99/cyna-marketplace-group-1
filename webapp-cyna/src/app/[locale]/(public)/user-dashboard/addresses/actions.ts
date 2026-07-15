"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";
import { stripe } from "@/lib/stripe";
import type { Tables, TablesInsert } from "@/types/database.types";

type AddressInput = Omit<
  TablesInsert<"adresse">,
  "id_adresse" | "id_compte" | "is_deleted" | "is_default" | "mail_utilisateur_invite"
>;

async function authenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  return user;
}

function parseAddress(formData: FormData): AddressInput {
  const required = ["prenom", "nom", "adresse", "code_postal", "ville", "pays"] as const;
  const values = Object.fromEntries(
    required.map((key) => [key, String(formData.get(key) ?? "").trim()]),
  ) as Record<(typeof required)[number], string>;
  if (required.some((key) => !values[key])) throw new Error("INVALID_ADDRESS");
  return {
    ...values,
    adresse_complement: String(formData.get("adresse_complement") ?? "").trim() || null,
    region: String(formData.get("region") ?? "").trim() || null,
    telephone: String(formData.get("telephone") ?? "").trim() || null,
    type_adresse: "Facturation",
  };
}

export async function addAddress(formData: FormData) {
  const user = await authenticatedUser();
  const admin = createAdminClient();
  const { count } = await admin
    .from("adresse")
    .select("id_adresse", { count: "exact", head: true })
    .eq("id_compte", user.id)
    .eq("is_deleted", false);
  const makeDefault = count === 0 || formData.get("is_default") === "on";
  if (makeDefault) {
    await admin.from("adresse").update({ is_default: false }).eq("id_compte", user.id);
  }
  const { data, error } = await admin
    .from("adresse")
    .insert({ ...parseAddress(formData), id_compte: user.id, is_default: makeDefault })
    .select("*")
    .single();
  if (error) throw error;
  if (data.is_default) await syncAddressToStripe(user.id, data);
  revalidatePath("/user-dashboard/addresses");
  redirect(`/${await getLocale()}/user-dashboard/addresses`);
}

export async function updateAddress(addressId: number, formData: FormData) {
  const user = await authenticatedUser();
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("adresse")
    .select("is_default")
    .eq("id_adresse", addressId)
    .eq("id_compte", user.id)
    .eq("is_deleted", false)
    .single();
  if (!existing) throw new Error("ADDRESS_NOT_FOUND");

  const makeDefault = existing.is_default || formData.get("is_default") === "on";
  if (makeDefault) {
    await admin.from("adresse").update({ is_default: false }).eq("id_compte", user.id);
  }
  const { data, error } = await admin
    .from("adresse")
    .update({ ...parseAddress(formData), is_default: makeDefault })
    .eq("id_adresse", addressId)
    .eq("id_compte", user.id)
    .select("*")
    .single();
  if (error) throw error;
  if (data.is_default) await syncAddressToStripe(user.id, data);
  revalidatePath("/user-dashboard/addresses");
  redirect(`/${await getLocale()}/user-dashboard/addresses`);
}

export async function setDefaultAddress(addressId: number) {
  const user = await authenticatedUser();
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("adresse")
    .select("*")
    .eq("id_adresse", addressId)
    .eq("id_compte", user.id)
    .eq("is_deleted", false)
    .single();
  if (!target) throw new Error("ADDRESS_NOT_FOUND");
  await admin.from("adresse").update({ is_default: false }).eq("id_compte", user.id);
  const { error } = await admin
    .from("adresse")
    .update({ is_default: true })
    .eq("id_adresse", addressId)
    .eq("id_compte", user.id);
  if (error) throw error;
  await syncAddressToStripe(user.id, { ...target, is_default: true });
  revalidatePath("/user-dashboard/addresses");
}

export async function deleteAddress(addressId: number) {
  const user = await authenticatedUser();
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("adresse")
    .select("is_default")
    .eq("id_adresse", addressId)
    .eq("id_compte", user.id)
    .eq("is_deleted", false)
    .single();
  if (!target) throw new Error("ADDRESS_NOT_FOUND");
  const { error } = await admin
    .from("adresse")
    .update({ is_default: false, is_deleted: true })
    .eq("id_adresse", addressId)
    .eq("id_compte", user.id);
  if (error) throw error;

  if (target.is_default) {
    const { data: replacement } = await admin
      .from("adresse")
      .select("*")
      .eq("id_compte", user.id)
      .eq("is_deleted", false)
      .order("id_adresse", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (replacement) {
      await admin.from("adresse").update({ is_default: true }).eq("id_adresse", replacement.id_adresse);
      await syncAddressToStripe(user.id, { ...replacement, is_default: true });
    }
  }
  revalidatePath("/user-dashboard/addresses");
}

async function syncAddressToStripe(userId: string, address: Tables<"adresse">) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("utilisateur")
    .select("token_connexion_stripe")
    .eq("id_compte", userId)
    .single();
  const customerId = profile?.token_connexion_stripe;
  if (!customerId || customerId === "non_configure") return;
  await stripe.customers.update(customerId, {
    name: `${address.prenom} ${address.nom}`.trim(),
    phone: address.telephone ?? undefined,
    address: {
      line1: address.adresse,
      line2: address.adresse_complement ?? undefined,
      city: address.ville,
      postal_code: address.code_postal,
      state: address.region ?? undefined,
      country: address.pays.length === 2 ? address.pays.toUpperCase() : undefined,
    },
  });
}
