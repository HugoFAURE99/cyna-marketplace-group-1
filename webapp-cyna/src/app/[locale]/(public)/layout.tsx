import PublicHeader from "@/components/layout/public-header/PublicHeader";
import PublicFooter from "@/components/layout/public-footer/PublicFooter";
import CynaChatWidget from "@/components/chat/CynaChatWidget";
import { SiteTransitionReady } from "@/components/layout/SiteTransitionProvider";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteTransitionReady destination="marketplace" />
      <PublicHeader />
      {/* Spacer offsets the fixed 72px header row. */}
      <div aria-hidden="true" className="h-[72px] shrink-0" />
      {/* Content fills at least the viewport (minus the header) so the footer
          stays below the fold on short pages. */}
      <div className="flex min-h-[calc(100vh-72px)] flex-1 flex-col pb-20 md:pb-0">
        {children}
      </div>
      <PublicFooter />
      {/* Floating CynAI assistant — public pages only (not the admin layout). */}
      <CynaChatWidget />
    </div>
  );
}
