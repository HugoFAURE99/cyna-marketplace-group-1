"use server";

// Cart mutations. Cookies can only be written from a Server Action / Route
// Handler, so every change to the cart goes through here. After each write we
// revalidate the root layout so the header badge (and the cart page, if open)
// re-render with the new cart.
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  clampLicenseUserCount,
  parseCart,
  serializeCart,
  type CartLine,
} from "@/lib/cart/cart";

async function currentCart(): Promise<CartLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

async function writeCart(lines: CartLine[]) {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(CART_COOKIE);
  } else {
    store.set(CART_COOKIE, serializeCart(lines), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: CART_COOKIE_MAX_AGE,
    });
  }
  revalidatePath("/", "layout");
}

export async function addToCart(input: {
  productId: number;
  tariffId: number;
  licenseUserCount: number;
}) {
  const productId = Math.trunc(input.productId);
  const tariffId = Math.trunc(input.tariffId);
  if (productId <= 0 || tariffId <= 0) {
    return;
  }
  const licenseUserCount = clampLicenseUserCount(input.licenseUserCount);

  const lines = await currentCart();
  const existing = lines.find(
    (line) => line.productId === productId && line.tariffId === tariffId,
  );
  if (existing) {
    existing.licenseUserCount = clampLicenseUserCount(
      existing.licenseUserCount + licenseUserCount,
    );
  } else {
    lines.push({ productId, tariffId, licenseUserCount });
  }
  await writeCart(lines);
}

export async function updateCartLineUserCount(input: {
  productId: number;
  tariffId: number;
  licenseUserCount: number;
}) {
  const lines = await currentCart();
  const line = lines.find(
    (entry) =>
      entry.productId === input.productId && entry.tariffId === input.tariffId,
  );
  if (!line) {
    return;
  }
  line.licenseUserCount = clampLicenseUserCount(input.licenseUserCount);
  await writeCart(lines);
}

// Switching a line's billing period changes its key; if a line for the target
// tariff already exists, merge the covered users into it.
export async function updateCartLineTariff(input: {
  productId: number;
  fromTariffId: number;
  toTariffId: number;
}) {
  if (input.fromTariffId === input.toTariffId) {
    return;
  }
  const lines = await currentCart();
  const source = lines.find(
    (entry) =>
      entry.productId === input.productId &&
      entry.tariffId === input.fromTariffId,
  );
  if (!source) {
    return;
  }

  const target = lines.find(
    (entry) =>
      entry.productId === input.productId &&
      entry.tariffId === input.toTariffId,
  );
  if (target) {
    target.licenseUserCount = clampLicenseUserCount(
      target.licenseUserCount + source.licenseUserCount,
    );
    await writeCart(lines.filter((entry) => entry !== source));
  } else {
    source.tariffId = input.toTariffId;
    await writeCart(lines);
  }
}

export async function removeCartLine(input: {
  productId: number;
  tariffId: number;
}) {
  const lines = await currentCart();
  await writeCart(
    lines.filter(
      (entry) =>
        !(
          entry.productId === input.productId &&
          entry.tariffId === input.tariffId
        ),
    ),
  );
}

export async function clearCartAction() {
  // On passe un tableau vide pour vider le panier proprement
  // et déclencher la mise à jour visuelle du site
  await writeCart([]);
}
