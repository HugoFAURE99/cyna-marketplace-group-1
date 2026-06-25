import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function UserDashboardPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  redirect({ href: "/user-dashboard/infos", locale: locale as Locale });
}
