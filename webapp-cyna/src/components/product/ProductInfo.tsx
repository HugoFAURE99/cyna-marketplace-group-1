// Product details: overview (description) and the technical specs list.
// Name, stock, and pricing live in the buy box on the product page.
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

type ProductInfoProps = {
  description: string | null;
  specs: string[];
};

export default async function ProductInfo({
  description,
  specs,
}: ProductInfoProps) {
  const t = await getTranslations("product");

  if (!description && specs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {description && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">
            {t("overview")}
          </h2>
          <p className="text-base leading-7 text-slate-700">{description}</p>
        </section>
      )}

      {specs.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">
            {t("technicalSpecifications")}
          </h2>
          <ul className="space-y-3">
            {specs.map((spec) => (
              <li className="flex gap-3 text-sm text-slate-700" key={spec}>
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-purple-700"
                />
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
