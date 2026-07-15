import { CircleUserRound } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar/AdminSidebar";
import AdminThemeBody from "@/components/admin/AdminThemeBody";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";
import A11yMenu from "@/components/layout/public-header/A11yMenu";
import { SiteTransitionReady } from "@/components/layout/SiteTransitionProvider";
import { Link } from "@/i18n/navigation";
import { createServerClient } from "@/lib/supabase/server-client";
import styles from "./admin.module.scss";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("utilisateur")
        .select("adresse_mail, nom_complet")
        .eq("id_compte", user.id)
        .maybeSingle()
    : { data: null };
  const email = profile?.adresse_mail || user?.email || "";
  const displayName =
    profile?.nom_complet?.trim() || email.split("@")[0] || "Admin";

  return (
    <SidebarProvider className="admin-theme">
      <SiteTransitionReady destination="admin" />
      <AdminThemeBody />
      <AdminSidebar />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarInner}>
            <SidebarTrigger />
            <div className={styles.topbarActions}>
              <A11yMenu placement="bottom" />
              <LanguageSwitcher showLocaleCode />
              {user && (
                <Link
                  className={styles.userIndicator}
                  href="/user-dashboard/infos"
                  title={`${displayName}${email ? ` — ${email}` : ""}`}
                >
                  <CircleUserRound aria-hidden="true" className={styles.userIcon} />
                  <span className={styles.userCopy}>
                    <span className={styles.userName}>{displayName}</span>
                    {email && <span className={styles.userEmail}>{email}</span>}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </SidebarProvider>
  );
}
