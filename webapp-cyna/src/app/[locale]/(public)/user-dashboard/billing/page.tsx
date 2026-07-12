import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function Billing({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect({ href: "/user-dashboard/purchases/invoices", locale });
}
