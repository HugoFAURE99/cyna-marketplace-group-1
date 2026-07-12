import { getTranslations } from "next-intl/server";

import { PurchasesTabs } from "@/components/account/purchases-tabs";

export default async function PurchasesLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("purchases");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{t("subtitle")}</p>
      </div>
      <PurchasesTabs />
      {children}
    </div>
  );
}
