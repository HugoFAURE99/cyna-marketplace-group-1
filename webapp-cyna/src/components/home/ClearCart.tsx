"use client"; //  Ce code tourne dans le navigateur

import { useEffect } from "react";
import { clearCartAction } from "@/lib/cart/cart.actions";

export default function ClearCart() {
  useEffect(() => {
    // Dès que le composant apparaît à l'écran, il appelle l'Action Serveur
    clearCartAction();
  }, []);

  return null; // Il n'affiche rien du tout
}
