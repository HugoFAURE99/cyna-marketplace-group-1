"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";

export async function getInvoiceSignedUrl(invoiceId: number) {
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    throw new Error("INVALID_INVOICE");
  }

  const supabase = await createServerClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const [{ data: invoice, error }, { data: profile }] = await Promise.all([
    admin
      .from("facture")
      .select("id_compte, email_client, storage_path, hosted_invoice_url")
      .eq("id_facture", invoiceId)
      .single(),
    admin
      .from("utilisateur")
      .select("adresse_mail")
      .eq("id_compte", user.id)
      .single(),
  ]);
  if (error || !invoice) throw new Error("INVOICE_NOT_FOUND");

  const ownsInvoice =
    invoice.id_compte === user.id ||
    Boolean(
      invoice.email_client &&
        profile?.adresse_mail &&
        invoice.email_client.toLowerCase() === profile.adresse_mail.toLowerCase(),
    );
  if (!ownsInvoice) throw new Error("INVOICE_FORBIDDEN");

  if (!invoice.storage_path) {
    if (invoice.hosted_invoice_url) return invoice.hosted_invoice_url;
    throw new Error("INVOICE_PDF_PENDING");
  }

  const { data, error: signedUrlError } = await admin.storage
    .from("invoice-pdf")
    .createSignedUrl(invoice.storage_path, 60);
  if (signedUrlError || !data) throw new Error("INVOICE_LINK_FAILED");
  return data.signedUrl;
}
