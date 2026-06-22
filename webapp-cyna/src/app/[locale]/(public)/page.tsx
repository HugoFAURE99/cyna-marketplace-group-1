import { setRequestLocale } from "next-intl/server";

import CategoryGrid from "@/components/home/CategoryGrid";
import HomeCarousel from "@/components/home/HomeCarousel";
import HomeIntro from "@/components/home/HomeIntro";
import ProductGrid from "@/components/home/ProductGrid";
import PaymentSuccessBanner from "@/components/home/PaymentSuccessBanner";
import {
  getHomeCarouselSlides,
  getHomeCategories,
  getHomeIntroContent,
  getHomeTopProducts,
} from "@/lib/home/public-home";
import type { Locale } from "@/lib/i18n/translations";

// Render on each request so new catalog data appears without a rebuild.
export const dynamic = "force-dynamic";

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const isPaymentSuccess = sp.payment === "success";

  // Load every home section in parallel.
  const [slides, introContent, products, categories] = await Promise.all([
    getHomeCarouselSlides(locale),
    getHomeIntroContent(locale),
    getHomeTopProducts(locale),
    getHomeCategories(locale),
  ]);

  return (
    <main className="flex-1">
      <PaymentSuccessBanner isSuccess={isPaymentSuccess} />
      <HomeCarousel slides={slides} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <HomeIntro content={introContent} />
        <ProductGrid products={products} />
        <CategoryGrid categories={categories} />
      </div>
    </main>
  );
}
