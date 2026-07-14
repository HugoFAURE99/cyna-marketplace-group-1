"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import ProductsTableClient from "./ProductsTableClient";
import PriorityProductsTable from "./PriorityProductsTable";
import FeaturedProductsManager from "./FeaturedProductsManager";
import type { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { Input } from "@/components/ui/input";
import { matchesAdminProductSearch } from "@/lib/admin/product-search";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

type Tab = "products" | "priority" | "featured";

interface ProductsTableTranslations {
  image: string;
  name: string;
  category: string;
  status: string;
  priceMonthly: string;
  priceAnnual: string;
  actions: string;
  priority: string;
  stock: string;
  active: string;
  inactive: string;
  edit: string;
}

interface PriorityTranslations {
  title: string;
  image: string;
  name: string;
  category: string;
  order: string;
  validate: string;
  validating: string;
  noProducts: string;
  dragHint: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  cancel: string;
}

interface TabsTranslations {
  products: string;
  priorityOrder: string;
  featuredOrder: string;
  featuredEmpty: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  unsavedSaveAndLeave: string;
  allCategories: string;
  filterByCategory: string;
  searchPlaceholder: string;
}

export interface CategoryOption {
  id: number;
  name: string;
}

interface FeaturedTranslations {
  title: string;
  validate: string;
  validating: string;
  dragHint: string;
  addProduct: string;
  removeProduct: string;
  emptySlot: string;
  pickerTitle: string;
  pickerSearch: string;
  pickerName: string;
  pickerCategory: string;
  pickerPrice: string;
  pickerNoResults: string;
  pickerSelect: string;
  allCategories: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  confirmRemoveTitle: string;
  confirmRemoveMessage: string;
  confirmRemove: string;
  cancelRemove: string;
  cancel: string;
  close: string;
  dragProduct: string;
  perMonth: string;
  perYear: string;
  promotionBadge: string;
}

export default function ProductsPageTabs({
  products,
  categories,
  productsTableTranslations,
  priorityTranslations,
  featuredTranslations,
  tabsTranslations,
}: {
  products: Product[];
  categories: CategoryOption[];
  productsTableTranslations: ProductsTableTranslations;
  priorityTranslations: PriorityTranslations;
  featuredTranslations: FeaturedTranslations;
  tabsTranslations: TabsTranslations;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [priorityDirty, setPriorityDirty] = useState(false);
  const [featuredDirty, setFeaturedDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const prioritySaveRef = useRef<(() => Promise<void>) | null>(null);
  const featuredSaveRef = useRef<(() => Promise<void>) | null>(null);

  const t = tabsTranslations;

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (!categoryFilter || product.id_categorie === categoryFilter) &&
          matchesAdminProductSearch(product, searchQuery),
      ),
    [products, categoryFilter, searchQuery],
  );

  const handleRegisterPrioritySave = useCallback((fn: () => Promise<void>) => {
    prioritySaveRef.current = fn;
  }, []);

  const handleRegisterFeaturedSave = useCallback((fn: () => Promise<void>) => {
    featuredSaveRef.current = fn;
  }, []);

  const switchTab = useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return;
      const isDirtyTab =
        (priorityDirty && activeTab === "priority") ||
        (featuredDirty && activeTab === "featured");
      if (isDirtyTab) {
        setPendingTab(tab);
      } else {
        setActiveTab(tab);
      }
    },
    [activeTab, priorityDirty, featuredDirty],
  );

  const confirmSwitch = () => {
    if (pendingTab) {
      setPriorityDirty(false);
      setFeaturedDirty(false);
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelSwitch = () => {
    setPendingTab(null);
  };

  const saveAndLeave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "priority" && prioritySaveRef.current) {
        await prioritySaveRef.current();
      }
      if (activeTab === "featured" && featuredSaveRef.current) {
        await featuredSaveRef.current();
      }
      setPriorityDirty(false);
      setFeaturedDirty(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: t.products },
    { key: "priority", label: t.priorityOrder },
    { key: "featured", label: t.featuredOrder },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 border-b xl:flex-row xl:items-end">
        <div className="grid w-full shrink-0 grid-cols-3 gap-1 sm:flex sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`min-w-0 whitespace-normal px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab !== "featured" && (
          <div className="flex w-full flex-col gap-2 pb-3 sm:flex-row xl:ml-auto xl:min-w-0 xl:max-w-4xl xl:flex-1 xl:pb-2">
            <label className="relative block w-full min-w-0 sm:flex-[5]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t.searchPlaceholder}
                className="h-11 pl-9"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                type="search"
                value={searchQuery}
              />
            </label>
            <select
              value={categoryFilter ?? ""}
              onChange={(e) =>
                setCategoryFilter(e.target.value ? Number(e.target.value) : null)
              }
              aria-label={t.filterByCategory}
              className="h-11 w-full min-w-0 rounded-md border bg-background px-3 py-1.5 text-sm sm:flex-[4]"
            >
              <option value="">{t.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === "products" && (
        <ProductsTableClient
          key={`${categoryFilter ?? "all"}:${searchQuery}`}
          products={filteredProducts}
          translations={productsTableTranslations}
          pageSize={10}
        />
      )}

      {activeTab === "priority" && (
        <PriorityProductsTable
          products={filteredProducts}
          translations={priorityTranslations}
          onDirtyChange={setPriorityDirty}
          onRegisterSave={handleRegisterPrioritySave}
        />
      )}

      {activeTab === "featured" && (
        <FeaturedProductsManager
          products={products}
          categories={categories}
          translations={featuredTranslations}
          onDirtyChange={setFeaturedDirty}
          onRegisterSave={handleRegisterFeaturedSave}
        />
      )}

      <Dialog.Root
        open={pendingTab !== null}
        onOpenChange={(open) => {
          if (!open) cancelSwitch();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg sm:p-6">
            <Dialog.Title className="text-base font-semibold">
              {t.unsavedTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.unsavedMessage}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelSwitch}>
                {t.unsavedStay}
              </Button>
              <Button
                size="sm"
                onClick={saveAndLeave}
                disabled={isSaving}
              >
                {isSaving ? <><Spinner /> {t.unsavedSaveAndLeave}</> : t.unsavedSaveAndLeave}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmSwitch}
                disabled={isSaving}
              >
                {t.unsavedLeave}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
