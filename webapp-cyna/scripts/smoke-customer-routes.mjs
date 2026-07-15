const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const publicRoutes = [
  "", "/about", "/cart", "/faq", "/legal", "/login", "/register",
  "/reset-password", "/search", "/terms",
];
const accountRoutes = [
  "/user-dashboard", "/user-dashboard/infos", "/user-dashboard/addresses",
  "/user-dashboard/orders", "/user-dashboard/billing", "/user-dashboard/subscriptions",
  "/user-dashboard/purchases", "/user-dashboard/purchases/orders",
  "/user-dashboard/purchases/subscriptions", "/user-dashboard/purchases/invoices",
  "/user-dashboard/tickets",
];

const failures = [];
for (const locale of ["fr", "en"]) {
  for (const route of [...publicRoutes, ...accountRoutes]) {
    const path = `/${locale}${route}`;
    try {
      const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
      if (response.status === 404 || response.status >= 500) {
        failures.push(`${response.status} ${path}`);
      } else {
        console.log(`${response.status} ${path}`);
      }
    } catch (error) {
      failures.push(`ERR ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (failures.length) {
  console.error("Customer route smoke test failed:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Customer route smoke test passed without 404/5xx responses.");
}
