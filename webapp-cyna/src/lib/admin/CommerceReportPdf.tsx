import {
  Circle,
  Document,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import type { CommerceReportData } from "@/lib/admin/commerce-report-types";

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", color: "#172033", fontFamily: "Helvetica", fontSize: 9, paddingBottom: 42, paddingHorizontal: 36, paddingTop: 54 },
  pageBackground: { backgroundColor: "#f8fafc", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  header: { alignItems: "center", backgroundColor: "#111827", flexDirection: "row", height: 36, justifyContent: "space-between", left: 0, paddingHorizontal: 36, position: "absolute", right: 0, top: 0 },
  brand: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 16 },
  headerMeta: { color: "#d8b4fe", fontSize: 8 },
  footer: { bottom: 18, color: "#64748b", flexDirection: "row", fontSize: 7, justifyContent: "space-between", left: 36, position: "absolute", right: 36 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 22, marginBottom: 5 },
  subtitle: { color: "#64748b", fontSize: 9, marginBottom: 18 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 14 },
  kpi: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 5, borderWidth: 1, margin: 4, padding: 10, width: "23.4%" },
  kpiLabel: { color: "#64748b", fontSize: 7, marginBottom: 5 },
  kpiValue: { color: "#4c1d95", fontFamily: "Helvetica-Bold", fontSize: 14 },
  kpiChange: { color: "#475569", fontSize: 7, marginTop: 4 },
  featuredCharts: { flexDirection: "row", justifyContent: "space-between" },
  chartCard: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 5, borderWidth: 1, height: 280, padding: 10, width: "32.4%" },
  chartTitle: { color: "#1e1b4b", fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 3 },
  chartHelp: { color: "#64748b", fontSize: 5.5, lineHeight: 1.25, marginBottom: 5, minHeight: 14 },
  chartLabels: { flexDirection: "row", height: 22, marginTop: 2 },
  chartLabel: { color: "#64748b", fontSize: 4.5, textAlign: "center" },
  chartTotal: { color: "#475569", fontFamily: "Helvetica-Bold", fontSize: 6, marginTop: 3 },
  legend: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -2, marginTop: 6 },
  legendItem: { alignItems: "center", flexDirection: "row", marginBottom: 4, marginHorizontal: 2, width: "47%" },
  legendSwatch: { borderRadius: 1, height: 6, marginRight: 3, width: 6 },
  legendLabel: { color: "#334155", fontSize: 5.5, width: "85%" },
  section: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 5, borderWidth: 1, marginBottom: 12, padding: 12 },
  sectionTitle: { color: "#1e1b4b", fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 9 },
  trendRow: { alignItems: "center", flexDirection: "row", marginBottom: 5 },
  trendLabel: { color: "#475569", fontSize: 7, width: 56 },
  trendTrack: { backgroundColor: "#ede9fe", borderRadius: 2, height: 8, marginRight: 8, overflow: "hidden", width: 320 },
  trendBar: { backgroundColor: "#7e22ce", height: 8 },
  trendValue: { fontFamily: "Helvetica-Bold", fontSize: 7, textAlign: "right", width: 75 },
  split: { flexDirection: "row", marginHorizontal: -5 },
  splitColumn: { marginHorizontal: 5, width: "50%" },
  tableHeader: { backgroundColor: "#f1f5f9", flexDirection: "row", paddingVertical: 6 },
  tableRow: { borderBottomColor: "#e2e8f0", borderBottomWidth: 1, flexDirection: "row", paddingVertical: 6 },
  rank: { paddingLeft: 5, width: "7%" },
  name: { paddingRight: 5, width: "48%" },
  metric: { paddingRight: 5, textAlign: "right", width: "15%" },
  revenue: { fontFamily: "Helvetica-Bold", paddingRight: 5, textAlign: "right", width: "30%" },
  reportName: { paddingRight: 5, width: "43%" },
  reportMetric: { paddingRight: 5, textAlign: "right", width: "12%" },
  reportRevenue: { fontFamily: "Helvetica-Bold", fontSize: 8, paddingRight: 5, textAlign: "right", width: "26%" },
  empty: { color: "#64748b", paddingVertical: 12, textAlign: "center" },
  subscriptionRow: { flexDirection: "row", justifyContent: "space-between" },
  subscriptionItem: { backgroundColor: "#f8fafc", borderRadius: 4, marginBottom: 7, padding: 9, width: "31.8%" },
  subscriptionValue: { color: "#4c1d95", fontFamily: "Helvetica-Bold", fontSize: 15, marginTop: 4 },
  dueCustomer: { paddingLeft: 5, width: "22%" },
  dueProduct: { paddingRight: 5, width: "25%" },
  duePlan: { paddingRight: 5, width: "13%" },
  dueSeats: { paddingRight: 5, textAlign: "right", width: "8%" },
  dueAmount: { fontFamily: "Helvetica-Bold", paddingRight: 5, textAlign: "right", width: "16%" },
  dueDate: { paddingRight: 5, textAlign: "right", width: "16%" },
  annualCustomer: { paddingLeft: 5, width: "18%" },
  annualProduct: { paddingRight: 5, width: "21%" },
  annualKind: { paddingRight: 5, width: "13%" },
  annualPlan: { paddingRight: 5, width: "10%" },
  annualSeats: { paddingRight: 5, textAlign: "right", width: "8%" },
  annualAmount: { fontFamily: "Helvetica-Bold", paddingRight: 5, textAlign: "right", width: "15%" },
  annualDate: { paddingRight: 5, textAlign: "right", width: "15%" },
  note: { color: "#64748b", fontSize: 7, marginTop: 7 },
});

const copy = {
  en: {
    title: "Commerce report",
    period: "Selected period",
    generated: "Generated",
    revenue: "Gross revenue",
    orders: "Orders",
    average: "Average order value",
    customers: "Unique customers",
    previous: "vs. previous period",
    salesDay: "Sales per day",
    salesWeek: "Sales per week",
    salesMonth: "Sales per month",
    categoryAverage: "Average cart by category",
    categoryAverageHelp: "EUR per category - Each segment is a category average. The stacked height is not an overall average.",
    categorySales: "Sales distribution by category",
    totalSales: "Total sales",
    topProducts: "Top products",
    categories: "Category distribution",
    billing: "Billing plan mix",
    subscriptions: "Subscription snapshot",
    active: "Active subscriptions",
    cancellations: "Scheduled cancellations",
    activeSeats: "Active seats",
    renewals: "Upcoming renewals",
    renewalValue: "Expected renewal value",
    endings: "Scheduled endings",
    endingValue: "Ending value",
    subscriptionProducts: "Active subscriptions by product",
    subscriptionBilling: "Active subscriptions by billing plan",
    forecast: "Forecast horizon",
    days: "days",
    subscriptionStatuses: "Subscription status distribution",
    customer: "Customer",
    seats: "Seats",
    amount: "Amount",
    dueDate: "Due date",
    annualOutlook: "Annual subscription outlook",
    annualPeriod: "Next calendar year",
    annualRenewals: "Annual renewals",
    annualEndings: "Annual scheduled endings",
    outlookType: "Type",
    renewal: "Renewal",
    ending: "Ending",
    moreRows: "Showing the first 20 of {count} rows.",
    product: "Product",
    category: "Category",
    plan: "Plan",
    quantity: "Qty.",
    noData: "No completed commerce data for this period.",
    page: "Page",
  },
  fr: {
    title: "Rapport commercial",
    period: "Période sélectionnée",
    generated: "Généré",
    revenue: "Chiffre d'affaires brut",
    orders: "Commandes",
    average: "Panier moyen",
    customers: "Clients uniques",
    previous: "vs période précédente",
    salesDay: "Ventes par jour",
    salesWeek: "Ventes par semaine",
    salesMonth: "Ventes par mois",
    categoryAverage: "Paniers moyens par catégorie",
    categoryAverageHelp: "EUR par catégorie - Chaque segment est un panier moyen. La hauteur cumulée n'est pas une moyenne globale.",
    categorySales: "Répartition des ventes par catégorie",
    totalSales: "Total des ventes",
    topProducts: "Meilleurs produits",
    categories: "Répartition par catégorie",
    billing: "Mix des plans de facturation",
    subscriptions: "Aperçu des abonnements",
    active: "Abonnements actifs",
    cancellations: "Résiliations programmées",
    activeSeats: "Postes actifs",
    renewals: "Renouvellements à venir",
    renewalValue: "Valeur de renouvellement attendue",
    endings: "Fins programmées",
    endingValue: "Valeur des fins",
    subscriptionProducts: "Abonnements actifs par produit",
    subscriptionBilling: "Abonnements actifs par plan",
    forecast: "Horizon prévisionnel",
    days: "jours",
    subscriptionStatuses: "Répartition des statuts d'abonnement",
    customer: "Client",
    seats: "Postes",
    amount: "Montant",
    dueDate: "Échéance",
    annualOutlook: "Prévisions annuelles des abonnements",
    annualPeriod: "Prochaine année civile",
    annualRenewals: "Renouvellements annuels",
    annualEndings: "Fins annuelles programmées",
    outlookType: "Type",
    renewal: "Renouvellement",
    ending: "Fin programmée",
    moreRows: "Affichage des 20 premières lignes sur {count}.",
    product: "Produit",
    category: "Catégorie",
    plan: "Plan",
    quantity: "Qté",
    noData: "Aucune vente finalisée sur cette période.",
    page: "Page",
  },
} as const;

export function CommerceReportPdf({ data }: { data: CommerceReportData }) {
  const t = copy[data.locale];
  const currency = new Intl.NumberFormat(data.locale, { style: "currency", currency: "EUR" });
  const number = new Intl.NumberFormat(data.locale);
  const currencyText = (value: number) => sanitizePdfNumberText(currency.format(value));
  const numberText = (value: number) => sanitizePdfNumberText(number.format(value));
  const timestamp = new Intl.DateTimeFormat(data.locale, { dateStyle: "medium", timeStyle: "short", timeZone: data.range.timeZone }).format(new Date(data.generatedAt));
  const salesTitle = data.range.granularity === "month"
    ? t.salesMonth
    : data.range.granularity === "week"
      ? t.salesWeek
      : t.salesDay;
  const kpis = [
    { label: t.revenue, value: currencyText(data.current.grossRevenue), change: data.current.changes.grossRevenue },
    { label: t.orders, value: numberText(data.current.orderCount), change: data.current.changes.orderCount },
    { label: t.average, value: currencyText(data.current.averageOrderValue), change: data.current.changes.averageOrderValue },
    { label: t.customers, value: numberText(data.current.uniqueCustomers), change: data.current.changes.uniqueCustomers },
  ];

  return (
    <Document author="CYNA" subject={`${data.range.from} - ${data.range.to}`} title={`CYNA - ${t.title}`}>
      <Page orientation="landscape" size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.period}: {data.range.from} - {data.range.to} - Europe/Paris - {t.generated}: {timestamp}</Text>

        <View style={styles.kpiGrid}>
          {kpis.map((item) => (
            <View key={item.label} style={styles.kpi} wrap={false}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
              <Text style={styles.kpiChange}>{formatChange(item.change)} {t.previous}</Text>
            </View>
          ))}
        </View>

        <View style={styles.featuredCharts} wrap={false}>
          <RevenueChart currency={currencyText} data={data} noData={t.noData} title={salesTitle} totalLabel={t.totalSales} />
          <CategoryAverageChart currency={currencyText} data={data} help={t.categoryAverageHelp} noData={t.noData} title={t.categoryAverage} />
          <CategoryPieChart currency={currencyText} data={data} noData={t.noData} title={t.categorySales} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{t.subscriptions}</Text>
          <Text style={styles.note}>{t.forecast}: {data.subscriptions.horizon} {t.days} ({data.subscriptions.asOf} - {data.subscriptions.to})</Text>
          <View style={[styles.subscriptionRow, { flexWrap: "wrap", marginTop: 8 }]}>
            <View style={styles.subscriptionItem}><Text>{t.active}</Text><Text style={styles.subscriptionValue}>{numberText(data.subscriptions.active)}</Text></View>
            <View style={styles.subscriptionItem}><Text>{t.activeSeats}</Text><Text style={styles.subscriptionValue}>{numberText(data.subscriptions.activeSeats)}</Text></View>
            <View style={styles.subscriptionItem}><Text>{t.renewals}</Text><Text style={styles.subscriptionValue}>{numberText(data.subscriptions.upcomingRenewalCount)}</Text></View>
            <View style={styles.subscriptionItem}><Text>{t.renewalValue}</Text><Text style={styles.subscriptionValue}>{currencyText(data.subscriptions.upcomingRenewalValue)}</Text></View>
            <View style={styles.subscriptionItem}><Text>{t.endings}</Text><Text style={styles.subscriptionValue}>{numberText(data.subscriptions.scheduledEndingCount)}</Text></View>
            <View style={styles.subscriptionItem}><Text>{t.endingValue}</Text><Text style={styles.subscriptionValue}>{currencyText(data.subscriptions.scheduledEndingValue)}</Text></View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.annualOutlook}</Text>
          <Text style={styles.note}>{t.annualPeriod}: {data.subscriptions.asOf} - {data.subscriptions.annualTo}</Text>
          <View style={[styles.subscriptionRow, { marginBottom: 10, marginTop: 8 }]}>
            <View style={[styles.subscriptionItem, { width: "48%" }]}><Text>{t.annualRenewals}</Text><Text style={styles.subscriptionValue}>{numberText(data.subscriptions.annualRenewalCount)} - {currencyText(data.subscriptions.annualRenewalValue)}</Text></View>
            <View style={[styles.subscriptionItem, { width: "48%" }]}><Text>{t.annualEndings}</Text><Text style={styles.subscriptionValue}>{numberText(data.subscriptions.annualScheduledEndingCount)} - {currencyText(data.subscriptions.annualScheduledEndingValue)}</Text></View>
          </View>
          <AnnualDueTable currency={currencyText} data={data.subscriptions.annualOutlook} labels={t} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.topProducts}</Text>
          <ReportTable headers={[t.product, t.orders, t.quantity]} rows={data.topProducts.slice(0, 15).map((item) => ({ id: String(item.id), name: item.name, metric: numberText(item.orders), quantity: numberText(item.quantity), revenue: currencyText(item.revenue) }))} noData={t.noData} />
        </View>

        <View style={styles.split}>
          <View style={styles.splitColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.categories}</Text>
              <ReportTable compact headers={[t.category, t.quantity, ""]} rows={data.categories.slice(0, 8).map((item, index) => ({ id: String(item.id ?? index), name: item.name, metric: "", quantity: numberText(item.quantity), revenue: currencyText(item.revenue) }))} noData={t.noData} />
            </View>
          </View>
          <View style={styles.splitColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.billing}</Text>
              <ReportTable compact headers={[t.plan, t.quantity, ""]} rows={data.billingMix.slice(0, 8).map((item, index) => ({ id: String(index), name: item.plan, metric: "", quantity: numberText(item.quantity), revenue: currencyText(item.revenue) }))} noData={t.noData} />
            </View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.renewals}</Text>
          <SubscriptionDueTable currency={currencyText} data={data.subscriptions.upcomingRenewals} labels={t} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.endings}</Text>
          <SubscriptionDueTable currency={currencyText} data={data.subscriptions.scheduledEndings} labels={t} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.pageBackground} />
        <ReportChrome generated={timestamp} pageLabel={t.page} />
        <View style={styles.split}>
          <View style={styles.splitColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.subscriptionProducts}</Text>
              <SubscriptionBreakdownTable currency={currencyText} items={data.subscriptions.productBreakdown} noData={t.noData} />
            </View>
          </View>
          <View style={styles.splitColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.subscriptionBilling}</Text>
              <SubscriptionBreakdownTable currency={currencyText} items={data.subscriptions.billingBreakdown} noData={t.noData} />
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.subscriptionStatuses}</Text>
          <SubscriptionStatusTable items={data.subscriptions.statusBreakdown} noData={t.noData} />
        </View>
      </Page>
    </Document>
  );
}

function RevenueChart({
  currency,
  data,
  noData,
  title,
  totalLabel,
}: {
  currency: (value: number) => string;
  data: CommerceReportData;
  noData: string;
  title: string;
  totalLabel: string;
}) {
  const maximum = Math.max(0, ...data.trend.map((point) => point.revenue));
  const count = Math.max(1, data.trend.length);
  const gap = count > 16 ? 1.5 : 4;
  const barWidth = Math.max(1, (210 - gap * (count - 1)) / count);

  return (
    <View style={styles.chartCard} wrap={false}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartHelp}>{data.range.from} - {data.range.to}</Text>
      {maximum > 0 ? (
        <>
          <Svg height={142} viewBox="0 0 220 142" width="100%">
            {data.trend.map((point, index) => {
              const height = safeChartValue((point.revenue / maximum) * 126);
              return (
                <Rect
                  fill="#8b5cf6"
                  height={height}
                  key={point.key}
                  width={barWidth}
                  x={5 + index * (barWidth + gap)}
                  y={136 - height}
                />
              );
            })}
          </Svg>
          <ChartAxisLabels labels={data.trend.map((point) => point.label)} />
          <Text style={styles.chartTotal}>{totalLabel}: {currency(data.current.grossRevenue)}</Text>
        </>
      ) : <Text style={styles.empty}>{noData}</Text>}
    </View>
  );
}

function CategoryAverageChart({
  currency,
  data,
  help,
  noData,
  title,
}: {
  currency: (value: number) => string;
  data: CommerceReportData;
  help: string;
  noData: string;
  title: string;
}) {
  const points = data.categoryAverages.points;
  const categories = data.categoryAverages.categories;
  const totals = points.map((point) => categories.reduce(
    (total, category) => total + (point.values[category.key]?.averageOrderValue ?? 0),
    0,
  ));
  const maximum = Math.max(0, ...totals);
  const count = Math.max(1, points.length);
  const gap = count > 16 ? 1.5 : 4;
  const barWidth = Math.max(1, (210 - gap * (count - 1)) / count);

  return (
    <View style={styles.chartCard} wrap={false}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartHelp}>{help}</Text>
      {maximum > 0 ? (
        <>
          <Svg height={128} viewBox="0 0 220 128" width="100%">
            {points.flatMap((point, pointIndex) => {
              let bottom = 122;
              return categories.map((category) => {
                const value = point.values[category.key]?.averageOrderValue ?? 0;
                const height = safeChartValue((value / maximum) * 112);
                bottom -= height;
                return (
                  <Rect
                    fill={category.color}
                    height={height}
                    key={`${point.key}-${category.key}`}
                    width={barWidth}
                    x={5 + pointIndex * (barWidth + gap)}
                    y={bottom}
                  />
                );
              });
            })}
          </Svg>
          <ChartAxisLabels labels={points.map((point) => point.label)} />
          <CategoryLegend
            categories={categories.map((category) => ({
              color: category.color,
              key: category.key,
              label: `${category.name}: ${currency(category.averageOrderValue)}`,
            }))}
          />
        </>
      ) : <Text style={styles.empty}>{noData}</Text>}
    </View>
  );
}

function CategoryPieChart({
  currency,
  data,
  noData,
  title,
}: {
  currency: (value: number) => string;
  data: CommerceReportData;
  noData: string;
  title: string;
}) {
  const total = data.categories.reduce((sum, category) => sum + category.revenue, 0);
  let angle = -90;

  return (
    <View style={styles.chartCard} wrap={false}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartHelp}>{data.range.from} - {data.range.to}</Text>
      {total > 0 ? (
        <>
          <Svg height={150} viewBox="0 0 220 150" width="100%">
            {data.categories.length === 1 ? (
              <Circle cx={110} cy={75} fill={data.categories[0].color} r={62} />
            ) : data.categories.map((category) => {
              const startAngle = angle;
              const endAngle = angle + (category.revenue / total) * 360;
              angle = endAngle;
              return (
                <Path
                  d={pieSlicePath(110, 75, 62, startAngle, endAngle)}
                  fill={category.color}
                  key={category.key}
                />
              );
            })}
          </Svg>
          <CategoryLegend
            categories={data.categories.map((category) => ({
              color: category.color,
              key: category.key,
              label: `${category.name}: ${currency(category.revenue)} (${((category.revenue / total) * 100).toFixed(1)}%)`,
            }))}
          />
        </>
      ) : <Text style={styles.empty}>{noData}</Text>}
    </View>
  );
}

function ChartAxisLabels({ labels }: { labels: string[] }) {
  const step = labels.length <= 8 ? 1 : Math.ceil(labels.length / 6);
  return (
    <View style={styles.chartLabels}>
      {labels.map((label, index) => (
        <Text key={`${label}-${index}`} style={[styles.chartLabel, { width: `${100 / labels.length}%` }]}>
          {index === 0 || index === labels.length - 1 || index % step === 0 ? label : ""}
        </Text>
      ))}
    </View>
  );
}

function CategoryLegend({
  categories,
}: {
  categories: { color: string; key: string; label: string }[];
}) {
  return (
    <View style={styles.legend}>
      {categories.map((category) => (
        <View key={category.key} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: category.color }]} />
          <Text style={styles.legendLabel}>{category.label}</Text>
        </View>
      ))}
    </View>
  );
}

function safeChartValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function pieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarPoint(centerX, centerY, radius, startAngle);
  const end = polarPoint(centerX, centerY, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function AnnualDueTable({ currency, data, labels }: {
  currency: (value: number) => string;
  data: CommerceReportData["subscriptions"]["annualOutlook"];
  labels: (typeof copy)[keyof typeof copy];
}) {
  return <View><View style={styles.tableHeader}><Text style={styles.annualCustomer}>{labels.customer}</Text><Text style={styles.annualProduct}>{labels.product}</Text><Text style={styles.annualKind}>{labels.outlookType}</Text><Text style={styles.annualPlan}>{labels.plan}</Text><Text style={styles.annualSeats}>{labels.seats}</Text><Text style={styles.annualAmount}>{labels.amount}</Text><Text style={styles.annualDate}>{labels.dueDate}</Text></View>{data.length ? data.slice(0, 20).map((item) => <View key={item.id} style={styles.tableRow} wrap={false}><Text style={styles.annualCustomer}>{item.customerName || item.contactEmail || "-"}</Text><Text style={styles.annualProduct}>{item.productName}</Text><Text style={styles.annualKind}>{item.kind === "renewal" ? labels.renewal : labels.ending}</Text><Text style={styles.annualPlan}>{item.billingPlan}</Text><Text style={styles.annualSeats}>{item.seats}</Text><Text style={styles.annualAmount}>{currency(item.value)}</Text><Text style={styles.annualDate}>{item.dueDate}</Text></View>) : <Text style={styles.empty}>{labels.noData}</Text>}{data.length > 20 && <Text style={styles.note}>{labels.moreRows.replace("{count}", String(data.length))}</Text>}</View>;
}

function SubscriptionDueTable({ currency, data, labels }: {
  currency: (value: number) => string;
  data: CommerceReportData["subscriptions"]["upcomingRenewals"];
  labels: (typeof copy)[keyof typeof copy];
}) {
  return <View><View style={styles.tableHeader}><Text style={styles.dueCustomer}>{labels.customer}</Text><Text style={styles.dueProduct}>{labels.product}</Text><Text style={styles.duePlan}>{labels.plan}</Text><Text style={styles.dueSeats}>{labels.seats}</Text><Text style={styles.dueAmount}>{labels.amount}</Text><Text style={styles.dueDate}>{labels.dueDate}</Text></View>{data.length ? data.slice(0, 20).map((item) => <View key={item.id} style={styles.tableRow} wrap={false}><Text style={styles.dueCustomer}>{item.customerName || item.contactEmail || "-"}</Text><Text style={styles.dueProduct}>{item.productName}</Text><Text style={styles.duePlan}>{item.billingPlan}</Text><Text style={styles.dueSeats}>{item.seats}</Text><Text style={styles.dueAmount}>{currency(item.value)}</Text><Text style={styles.dueDate}>{item.dueDate}</Text></View>) : <Text style={styles.empty}>{labels.noData}</Text>}{data.length > 20 && <Text style={styles.note}>{labels.moreRows.replace("{count}", String(data.length))}</Text>}</View>;
}

function SubscriptionBreakdownTable({ currency, items, noData }: {
  currency: (value: number) => string;
  items: { count: number; label: string; value: number }[];
  noData: string;
}) {
  return <View>{items.length ? items.slice(0, 20).map((item, index) => <View key={`${item.label}-${index}`} style={styles.tableRow} wrap={false}><Text style={styles.rank}>{index + 1}</Text><Text style={styles.name}>{item.label}</Text><Text style={styles.metric}>{item.count}</Text><Text style={styles.revenue}>{currency(item.value)}</Text></View>) : <Text style={styles.empty}>{noData}</Text>}</View>;
}

function SubscriptionStatusTable({ items, noData }: { items: { count: number; label: string }[]; noData: string }) {
  return <View>{items.length ? items.slice(0, 12).map((item, index) => <View key={`${item.label}-${index}`} style={styles.tableRow}><Text style={styles.rank}>{index + 1}</Text><Text style={styles.name}>{item.label}</Text><Text style={styles.revenue}>{item.count}</Text></View>) : <Text style={styles.empty}>{noData}</Text>}</View>;
}

function ReportChrome({ generated, pageLabel }: { generated: string; pageLabel: string }) {
  return <><View fixed style={styles.header}><Text style={styles.brand} render={() => "CYNA"} /><Text style={styles.headerMeta} render={() => generated} /></View><View fixed style={styles.footer}><Text render={() => `CYNA Back-Office - ${generated}`} /><Text render={({ pageNumber, totalPages }) => `${pageLabel} ${pageNumber} / ${totalPages}`} /></View></>;
}

function ReportTable({ compact = false, headers, noData, rows }: { compact?: boolean; headers: [string, string, string]; noData: string; rows: { id: string; metric: string; name: string; quantity: string; revenue: string }[] }) {
  const nameStyle = compact ? styles.name : styles.reportName;
  const metricStyle = compact ? styles.metric : styles.reportMetric;
  const revenueStyle = compact ? styles.revenue : styles.reportRevenue;
  return <View><View style={styles.tableHeader}><Text style={styles.rank}>#</Text><Text style={nameStyle}>{headers[0]}</Text>{!compact && <Text style={metricStyle}>{headers[1]}</Text>}<Text style={metricStyle}>{compact ? headers[1] : headers[2]}</Text><Text style={revenueStyle}>EUR</Text></View>{rows.length ? rows.slice(0, 20).map((row, index) => <View key={row.id} style={styles.tableRow} wrap={false}><Text style={styles.rank}>{index + 1}</Text><Text style={nameStyle}>{row.name}</Text>{!compact && <Text style={metricStyle}>{row.metric}</Text>}<Text style={metricStyle}>{row.quantity}</Text><Text style={revenueStyle}>{row.revenue}</Text></View>) : <Text style={styles.empty}>{noData}</Text>}</View>;
}

export function sanitizePdfNumberText(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, " ");
}

function formatChange(value: number | null): string {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${value}%`;
}
