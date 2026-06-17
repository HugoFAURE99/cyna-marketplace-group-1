// Product heading, description, and technical specs list.
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

type ProductInfoProps = {
  description: string | null;
  name: string;
  specs: string[];
};

export default async function ProductInfo({
  description,
  name,
  specs,
}: ProductInfoProps) {
  const t = await getTranslations("product");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
          {name}
        </h1>
        {description && (
          <p className="max-w-2xl text-base leading-7 text-slate-700">
            {description}
          </p>
        )}
      </div>

      {specs.length > 0 && (
        <section className="rounded-lg bg-white p-6 shadow-xs ring-1 ring-black/5">
          <h2 className="mb-4 text-xl font-semibold text-slate-950">
            {t("technicalSpecifications")}
          </h2>
          <ul className="space-y-3">
            {specs.map((spec) => (
              <li className="flex gap-3 text-sm text-slate-950" key={spec}>
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
