//Permet d'initialiser stripe avec la clé secrète qu'on a dans le .env
//C'est à partir de ce "stripe" que l'on va pouvoir utiliser les fonctions de stripe directement
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  throw new Error("STRIPE_SECRET_KEY manquante. Vérifie ton .env.local");
}

export const stripe = new Stripe(key, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});
