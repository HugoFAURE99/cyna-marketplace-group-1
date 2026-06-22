import { getTranslations } from "next-intl/server";
import ClearCart from "./ClearCart";

type PaymentSuccessBannerProps = {
  isSuccess: boolean;
};

export default async function PaymentSuccessBanner({
  isSuccess,
}: PaymentSuccessBannerProps) {
  // Si ce n'est pas un succès, on ne rend rien
  if (!isSuccess) return null;

  // On gère la traduction
  const t = await getTranslations("home");

  return (
    <div className="bg-green-50 p-4 border-b border-green-200">
      {/*le composant invisible qui va vider le cookie en arrière-plan */}
      <ClearCart />

      <div className="mx-auto flex max-w-6xl items-center justify-center text-green-800 font-medium px-4">
        {t("paymentSuccess")}
      </div>
    </div>
  );
}
