import CategoryGrid from "@/components/home/CategoryGrid";
import HomeCarousel from "@/components/home/HomeCarousel";
import HomeIntro from "@/components/home/HomeIntro";
import ProductGrid from "@/components/home/ProductGrid";
import {
  getHomeCarouselSlides,
  getHomeCategories,
  getHomeIntroContent,
  getHomeTopProducts,
} from "@/lib/home/public-home";

// Render on each request so new catalog data appears without a rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Load every home section in parallel.
  const [slides, introContent, products, categories] = await Promise.all([
    getHomeCarouselSlides(),
    getHomeIntroContent(),
    getHomeTopProducts(),
    getHomeCategories(),
  ]);

  return (
    <main className="flex-1 bg-purple-50">
      <HomeCarousel slides={slides} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <HomeIntro content={introContent} />
        <ProductGrid products={products} />
        <CategoryGrid categories={categories} />
      </div>
    </main>
  );
}
