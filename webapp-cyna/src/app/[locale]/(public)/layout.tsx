import PublicHeader from "@/components/layout/public-header/PublicHeader";
import PublicFooter from "@/components/layout/public-footer/PublicFooter";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      {/* Spacer offsets the fixed header (h-[72px]). */}
      <div aria-hidden="true" className="h-[72px] shrink-0" />
      <div className="flex flex-1 flex-col">{children}</div>
      <PublicFooter />
    </div>
  );
}
