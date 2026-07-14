"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Eye,
  ArrowLeft,
  AlertTriangle,
  ClipboardList,
  Play,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@base-ui/react/dialog";
import Spinner from "@/components/ui/spinner";
import {
  updateTicketStatus,
  bulkUpdateTicketStatus,
  getTicketDetail,
  type TicketRow,
  type TicketDetail,
} from "@/app/[locale]/(admin)/admin/_actions/ticket.actions";

type Tab = "new" | "urgent" | "to_process" | "in_progress" | "closed";

const STATUS_MAP: Record<Tab, string> = {
  new: "open",
  urgent: "waiting_customer",
  to_process: "in_progress",
  in_progress: "resolved",
  closed: "closed",
};

const TAB_FROM_STATUS: Record<string, Tab> = {
  open: "new",
  waiting_customer: "urgent",
  in_progress: "to_process",
  resolved: "in_progress",
  closed: "closed",
};

interface Translations {
  title: string;
  tabNew: string;
  tabUrgent: string;
  tabToProcess: string;
  tabInProgress: string;
  tabClosed: string;
  search: string;
  allCategories: string;
  id: string;
  subject: string;
  category: string;
  client: string;
  email: string;
  date: string;
  status: string;
  messages: string;
  actions: string;
  noTickets: string;
  view: string;
  markUrgent: string;
  markToProcess: string;
  moveInProgress: string;
  close: string;
  back: string;
  detailTitle: string;
  loading: string;
  description: string;
  order: string;
  viewOrder: string;
  createdAt: string;
  closedAt: string;
  updatedAt: string;
  source: string;
  sourceChatbot: string;
  sourceManual: string;
  customerMessage: string;
  supportMessage: string;
  noMessages: string;
  selected: string;
  selectAll: string;
  bulkUrgent: string;
  bulkToProcess: string;
  bulkInProgress: string;
  bulkClose: string;
  categoryBilling: string;
  categoryOrder: string;
  categorySubscription: string;
  categoryAccount: string;
  categoryTechnical: string;
  categoryOther: string;
  statusOpen: string;
  statusUrgent: string;
  statusToProcess: string;
  statusInProgress: string;
  statusClosed: string;
}

const PAGE_SIZE = 10;

function categoryColor(cat: string): string {
  switch (cat) {
    case "billing": return "bg-blue-100 text-blue-800";
    case "order": return "bg-amber-100 text-amber-800";
    case "subscription": return "bg-purple-100 text-purple-800";
    case "account": return "bg-cyan-100 text-cyan-800";
    case "technical": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-700";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "open": return "bg-blue-100 text-blue-800";
    case "waiting_customer": return "bg-red-100 text-red-800";
    case "in_progress": return "bg-yellow-100 text-yellow-800";
    case "resolved": return "bg-green-100 text-green-800";
    case "closed": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-700";
  }
}

function translateCategory(cat: string, t: Translations): string {
  switch (cat) {
    case "billing": return t.categoryBilling;
    case "order": return t.categoryOrder;
    case "subscription": return t.categorySubscription;
    case "account": return t.categoryAccount;
    case "technical": return t.categoryTechnical;
    case "other": return t.categoryOther;
    default: return cat;
  }
}

function translateStatus(status: string, t: Translations): string {
  switch (status) {
    case "open": return t.statusOpen;
    case "waiting_customer": return t.statusUrgent;
    case "in_progress": return t.statusToProcess;
    case "resolved": return t.statusInProgress;
    case "closed": return t.statusClosed;
    default: return status;
  }
}

export default function SupportTableClient({
  tickets,
  translations: t,
  initialDetailId,
}: {
  tickets: TicketRow[];
  translations: Translations;
  initialDetailId?: string;
}) {
  const [tab, setTab] = useState<Tab>("new");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tPagination = useTranslations("admin.pagination");

  useState(() => {
    if (initialDetailId) {
      setDetailLoading(true);
      getTicketDetail(initialDetailId).then((d) => {
        setDetail(d);
        setDetailLoading(false);
      });
    }
  });

  const dbStatus = STATUS_MAP[tab];

  const filtered = useMemo(() => {
    let result = tickets.filter((t) => t.status === dbStatus);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id_support.toLowerCase().includes(q) ||
          t.sujet.toLowerCase().includes(q) ||
          t.email_contact.toLowerCase().includes(q) ||
          (t.client_name && t.client_name.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((t) => t.categorie === categoryFilter);
    }

    return result;
  }, [tickets, dbStatus, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { new: 0, urgent: 0, to_process: 0, in_progress: 0, closed: 0 };
    for (const ticket of tickets) {
      const t = TAB_FROM_STATUS[ticket.status];
      if (t) counts[t]++;
    }
    return counts;
  }, [tickets]);

  const handleViewDetail = async (ticket: TicketRow) => {
    setDetailLoading(true);
    router.push(`/admin/support?detail=${ticket.id_support}`);
    const d = await getTicketDetail(ticket.id_support);
    setDetail(d);
    setDetailLoading(false);
  };

  const handleBack = () => {
    setDetail(null);
    router.back();
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateTicketStatus(id, newStatus);
      router.refresh();
    });
  };

  const handleBulkStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await bulkUpdateTicketStatus(Array.from(selectedIds), newStatus);
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((t) => t.id_support)));
    }
  };

  const changeTab = (newTab: Tab) => {
    setTab(newTab);
    setPage(0);
    setSelectedIds(new Set());
  };

  // Detail view
  if (detail || detailLoading) {
    if (detailLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Spinner /> <span className="ml-2 text-sm text-muted-foreground">{t.loading}</span>
        </div>
      );
    }

    if (!detail) return null;

    const currentTab = TAB_FROM_STATUS[detail.status] || "new";

    return (
      <div className="flex flex-col gap-6">
        <Button variant="outline" size="sm" onClick={handleBack} className="w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t.back}
        </Button>

        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">
            {t.detailTitle} — {detail.sujet}
          </h2>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(detail.status)}`}>
            {translateStatus(detail.status, t)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label={t.client} value={detail.client_name ? `${detail.client_name}` : "—"} />
          <InfoCard label={t.email} value={detail.email_contact} />
          <InfoCard label={t.category}>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(detail.categorie)}`}>
              {translateCategory(detail.categorie, t)}
            </span>
          </InfoCard>
          <InfoCard
            label={t.createdAt}
            value={detail.date_creation ? new Date(detail.date_creation).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
          />
          <InfoCard
            label={t.updatedAt}
            value={new Date(detail.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          />
          {detail.date_fermeture && (
            <InfoCard
              label={t.closedAt}
              value={new Date(detail.date_fermeture).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            />
          )}
          <InfoCard label={t.source} value={detail.origine_chatbot ? t.sourceChatbot : t.sourceManual} />
          {detail.id_commande && (
            <InfoCard label={t.order}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">#{detail.id_commande}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/orders?detail=${detail.id_commande}`)}
                >
                  {t.viewOrder}
                </Button>
              </div>
            </InfoCard>
          )}
        </div>

        {detail.description && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">{t.description}</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{detail.description}</p>
          </div>
        )}

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">{t.messages} ({detail.messages.length})</h3>
          {detail.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noMessages}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {detail.messages.map((msg) => (
                <div
                  key={msg.id_message}
                  className={`rounded-lg border p-3 ${
                    msg.sender === "support"
                      ? "ml-8 border-primary/20 bg-primary/5"
                      : "mr-8 bg-muted/30"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">
                      {msg.sender === "support" ? t.supportMessage : t.customerMessage}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.contenu}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons based on current status */}
        <div className="flex gap-2">
          {currentTab === "new" && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleStatusChange(detail.id_support, "waiting_customer")}
                disabled={isPending}
              >
                <AlertTriangle className="mr-1 h-4 w-4" /> {t.markUrgent}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(detail.id_support, "in_progress")}
                disabled={isPending}
              >
                <ClipboardList className="mr-1 h-4 w-4" /> {t.markToProcess}
              </Button>
            </>
          )}
          {(currentTab === "urgent" || currentTab === "to_process") && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(detail.id_support, "resolved")}
              disabled={isPending}
            >
              <Play className="mr-1 h-4 w-4" /> {t.moveInProgress}
            </Button>
          )}
          {currentTab === "in_progress" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(detail.id_support, "closed")}
              disabled={isPending}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" /> {t.close}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // List view
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "new", label: t.tabNew, count: tabCounts.new },
    { key: "urgent", label: t.tabUrgent, count: tabCounts.urgent },
    { key: "to_process", label: t.tabToProcess, count: tabCounts.to_process },
    { key: "in_progress", label: t.tabInProgress, count: tabCounts.in_progress },
    { key: "closed", label: t.tabClosed, count: tabCounts.closed },
  ];

  const bulkTarget = (): { label: string; status: string } | null => {
    switch (tab) {
      case "new": return null;
      case "urgent": return { label: t.bulkInProgress, status: "resolved" };
      case "to_process": return { label: t.bulkInProgress, status: "resolved" };
      case "in_progress": return { label: t.bulkClose, status: "closed" };
      default: return null;
    }
  };

  const bulk = bulkTarget();

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => changeTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                t.key === "urgent" && tab !== "urgent"
                  ? "bg-red-100 text-red-700"
                  : tab === t.key
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters + Bulk actions */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t.allCategories}</option>
          <option value="billing">{t.categoryBilling}</option>
          <option value="order">{t.categoryOrder}</option>
          <option value="subscription">{t.categorySubscription}</option>
          <option value="account">{t.categoryAccount}</option>
          <option value="technical">{t.categoryTechnical}</option>
          <option value="other">{t.categoryOther}</option>
        </select>

        {selectedIds.size > 0 && tab === "new" && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkStatusChange("waiting_customer")}
              disabled={isPending}
            >
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              {t.bulkUrgent} ({selectedIds.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("in_progress")}
              disabled={isPending}
            >
              <ClipboardList className="mr-1 h-3.5 w-3.5" />
              {t.bulkToProcess} ({selectedIds.size})
            </Button>
          </div>
        )}

        {selectedIds.size > 0 && bulk && (
          <Button
            size="sm"
            onClick={() => handleBulkStatusChange(bulk.status)}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : null}
            {bulk.label} ({selectedIds.size})
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={paginated.length > 0 && selectedIds.size === paginated.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
            </TableHead>
            <TableHead>{t.subject}</TableHead>
            <TableHead>{t.category}</TableHead>
            <TableHead>{t.client}</TableHead>
            <TableHead>{t.date}</TableHead>
            <TableHead>{t.messages}</TableHead>
            <TableHead>{t.status}</TableHead>
            <TableHead>{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                {t.noTickets}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((ticket, index) => (
              <TableRow
                key={ticket.id_support}
                className={index % 2 === 1 ? "bg-muted/20" : ""}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(ticket.id_support)}
                    onChange={() => toggleSelect(ticket.id_support)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{ticket.sujet}</span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.id_support.slice(0, 8)}…
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(ticket.categorie)}`}>
                    {translateCategory(ticket.categorie, t)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {ticket.client_name && (
                      <span className="text-sm font-medium">{ticket.client_name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{ticket.email_contact}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {ticket.date_creation
                    ? new Date(ticket.date_creation).toLocaleDateString("fr-FR")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    {ticket.message_count}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(ticket.status)}`}>
                    {translateStatus(ticket.status, t)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(ticket)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> {t.view}
                    </Button>
                    {tab === "new" && (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(ticket.id_support, "waiting_customer")}
                          disabled={isPending}
                        >
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {t.markUrgent}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(ticket.id_support, "in_progress")}
                          disabled={isPending}
                        >
                          <ClipboardList className="mr-1 h-3.5 w-3.5" /> {t.markToProcess}
                        </Button>
                      </>
                    )}
                    {(tab === "urgent" || tab === "to_process") && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(ticket.id_support, "resolved")}
                        disabled={isPending}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" /> {t.moveInProgress}
                      </Button>
                    )}
                    {tab === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(ticket.id_support, "closed")}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {t.close}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {tPagination("info", {
              from: page * PAGE_SIZE + 1,
              to: Math.min((page + 1) * PAGE_SIZE, filtered.length),
              total: filtered.length,
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              {tPagination("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              {tPagination("next")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function InfoCard({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children || <p className="mt-0.5 text-sm font-medium">{value}</p>}
    </div>
  );
}
