import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function Subscriptions({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/user-dashboard/purchases/subscriptions", locale: locale as Locale });
}
