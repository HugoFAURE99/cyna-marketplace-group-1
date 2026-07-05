import PublicHeader from "@/components/layout/public-header/PublicHeader";
import PublicFooter from "@/components/layout/public-footer/PublicFooter";
import CynaChatWidget from "@/components/chat/CynaChatWidget";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      {/* Spacer offsets the fixed header: 72px main row + 44px category bar. */}
      <div aria-hidden="true" className="h-[116px] shrink-0" />
      {/* Content fills at least the viewport (minus the header) so the footer
          stays below the fold on short pages. */}
      <div className="flex flex-1 flex-col min-h-[calc(100vh-116px)]">
        {children}
      </div>
      <PublicFooter />
      {/* Floating CynAI assistant — public pages only (not the admin layout). */}
      <CynaChatWidget />
    </div>
  );
}
