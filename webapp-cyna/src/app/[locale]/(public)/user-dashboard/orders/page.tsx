import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function Orders({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect({ href: "/user-dashboard/purchases/orders", locale });
}
