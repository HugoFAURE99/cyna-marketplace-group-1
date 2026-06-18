import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n/translations";
import { Http2ServerRequest } from "http2";

export default async function Legal({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <>
      <div className="flex justify-center my-10">
        <div className="p-5 w-250">
          <h2 className="text-2xl font-bold text-purple-800 mb-10">
            {t("legal_title")}
          </h2>

          <p className="text-lg">{t("legal_paragraph")}</p>

          <h2 className="text-2xl font-bold text-purple-800 my-10">
            1. {t("webedit_title")}
          </h2>
          <ul>
            <li className="my-6 text-lg">
              <strong>{t("webedit_ul1")} :</strong>
              <p>CYNA-IT</p>
            </li>
            <li className="my-6 text-lg">
              <strong>{t("webedit_ul2")} :</strong>
              <p>SARL</p>
            </li>
            <li className="my-6 text-lg">
              <strong>{t("webedit_ul3")} :</strong>
              <p>10 Rue de Penthièvre, 75008 Paris</p>
            </li>
            <li className="my-6 text-lg">
              <strong>{t("webedit_ul4")} :</strong>
              <p>913 711 032 00015</p>
            </li>
            <li className="my-6 text-lg">
              <strong>{t("webedit_ul5")} :</strong>
              <p>G1 Dev</p>
            </li>
            <li className="my-6 text-lg">
              <strong>Contact :</strong>
              <p>arketing@cyna-it.fr | Tél : 01 99 00 34 56</p>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-purple-800 mt-10 my-10">
            2. {t("hosting_title")}
          </h2>
          <p className="my-5 text-lg  ">{t("hosting_paragraph")}</p>
          <ul>
            <li className="my-6 text-lg">
              <strong>{t("hosting_title")}</strong>
              <p>Netify</p>
            </li>
            <li className="my-6 text-lg">
              <strong>{t("hosting_email_ref")} :</strong>
              <p>[Insérer l'adresse physique de l'hébergeur en France]</p>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-purple-800 my-10">
            3. {t("intelprop_title")}
          </h2>
          <p className="text-lg">{t("intelprop_paragraph1")}</p>
          <p className="my-8 text-lg">{t("intelprop_paragraph2")}</p>
          <p className="text-lg">{t("intelprop_paragraph3")}</p>
        </div>
      </div>
    </>
  );
}
