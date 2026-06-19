// Category pages are now the search page pre-filtered by category. This route
// stays as a redirect so old links/bookmarks keep working.
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/translations";

type CategoryPageProps = {
  params: Promise<{ id: string; locale: Locale }>;
};

export default async function CategoryRedirect({ params }: CategoryPageProps) {
  const { id, locale } = await params;
  const categoryId = Number(id);
  const target =
    Number.isInteger(categoryId) && categoryId > 0
      ? `/${locale}/search?category=${categoryId}`
      : `/${locale}/search`;

  redirect(target);
}
