import { writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

import {
  CommerceReportPdf,
  sanitizePdfNumberText,
} from "@/lib/admin/CommerceReportPdf";
import { aggregateCommerceReport, type CommerceOrder } from "@/lib/admin/commerce-report-core";
import { createReportRange } from "@/lib/admin/report-range";
import { aggregateSubscriptionHealth } from "@/lib/admin/subscription-health";

describe("commerce PDF", () => {
  it("replaces PDF-unsafe French number spaces", () => {
    const formatted = new Intl.NumberFormat("fr", {
      currency: "EUR",
      style: "currency",
    }).format(12_135);
    const safe = sanitizePdfNumberText(formatted);
    expect(safe).toBe("12 135,00 €");
    expect(safe).not.toMatch(/[\u00a0\u202f]/);
  });

  it("renders a readable branded multipage report", async () => {
    const range = createReportRange("custom", { from: "2026-07-01", to: "2026-07-31" });
    const orders: CommerceOrder[] = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      customerId: `customer-${index}`,
      guestEmail: null,
      date: `2026-07-${String((index % 20) + 1).padStart(2, "0")}T10:00:00Z`,
      status: "Validée",
      total: 99 + index,
      lines: [{ billingPlan: index % 2 ? "annuel" : "mensuel", categoryId: index % 4, categoryName: `Category ${index % 4}`, productId: index + 1, productName: `Protection ${index + 1}`, quantity: 1, subtotal: 99 + index }],
    }));
    const subscriptionHealth = aggregateSubscriptionHealth({
      generatedAt: new Date("2026-07-31T18:00:00Z"),
      horizon: 30,
      subscriptions: Array.from({ length: 24 }, (_, index) => ({
        billingPlan: index % 2 ? "yearly" : "monthly",
        contactEmail: `customer-${index}@example.com`,
        customerName: `Customer ${index + 1}`,
        endDate: `2026-08-${String((index % 24) + 1).padStart(2, "0")}T10:00:00Z`,
        id: index + 1,
        orderId: index + 1,
        priceCents: 9900 + index * 100,
        productId: (index % 4) + 1,
        productName: `Protection ${(index % 4) + 1}`,
        scheduledCancellation: index < 3,
        seats: (index % 3) + 1,
        status: "active",
      })),
    });
    const data = aggregateCommerceReport({ locale: "en", range, subscriptionHealth, orders, generatedAt: new Date("2026-07-31T18:00:00Z") });
    const element = createElement(CommerceReportPdf, { data }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(element);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");

    if (process.env.PDF_FIXTURE_PATH) await writeFile(process.env.PDF_FIXTURE_PATH, buffer);

    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    expect(document.numPages).toBe(6);
    let text = "";
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      expect(viewport.width).toBeCloseTo(595.28, 1);
      expect(viewport.height).toBeCloseTo(841.89, 1);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => "str" in item ? item.str : "").join(" ");
      expect(pageText).toContain("CYNA");
      expect(pageText).toContain(`Page ${pageNumber} / ${document.numPages}`);
      text += pageText;
    }
    expect(text).toContain("CYNA");
    expect(text).toContain("Commerce report");
    expect(text).toContain("Top products");
    expect(text).toContain("Upcoming renewals");
    expect(text).toContain("Showing the first 20 of 21 rows.");
    expect(text).toContain("Scheduled endings");
    expect(text).toContain("Annual subscription outlook");
    expect(text).toContain("Subscription status distribution");
    expect(text).toContain(`Page ${document.numPages} / ${document.numPages}`);
  }, 20_000);

  it("keeps French report copy and accented glyphs extractable", async () => {
    const range = createReportRange("7d", { now: new Date("2026-07-31T18:00:00Z") });
    const subscriptionHealth = aggregateSubscriptionHealth({
      generatedAt: new Date("2026-07-31T18:00:00Z"),
      horizon: 7,
      subscriptions: [],
    });
    const orders: CommerceOrder[] = [{
      customerId: "customer-large",
      date: "2026-07-30T10:00:00Z",
      guestEmail: null,
      id: 99,
      lines: [{
        billingPlan: "annuel",
        categoryId: 1,
        categoryName: "Protection",
        productId: 99,
        productName: "Protection Grand Compte",
        quantity: 9,
        subtotal: 12_135,
      }],
      status: "Validée",
      total: 12_135,
    }];
    const data = aggregateCommerceReport({ locale: "fr", range, subscriptionHealth, orders, generatedAt: new Date("2026-07-31T18:00:00Z") });
    const element = createElement(CommerceReportPdf, { data }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(element);
    if (process.env.PDF_FIXTURE_PATH) await writeFile(process.env.PDF_FIXTURE_PATH, buffer);
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    let text = "";
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const content = await (await document.getPage(pageNumber)).getTextContent();
      text += content.items.map((item) => "str" in item ? item.str : "").join(" ");
    }
    expect(text).toContain("Période sélectionnée");
    expect(text).toContain("Renouvellements à venir");
    expect(text).toContain("Répartition des statuts d'abonnement");
    expect(text).toContain("12 135,00 €");
  }, 20_000);
});
