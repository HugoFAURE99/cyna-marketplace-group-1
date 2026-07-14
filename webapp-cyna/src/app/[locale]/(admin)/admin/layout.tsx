import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar/AdminSidebar";
import AdminThemeBody from "@/components/admin/AdminThemeBody";
import styles from "./admin.module.scss";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="admin-theme">
      <AdminThemeBody />
      <AdminSidebar />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarInner}>
            <SidebarTrigger />
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </SidebarProvider>
  );
}
