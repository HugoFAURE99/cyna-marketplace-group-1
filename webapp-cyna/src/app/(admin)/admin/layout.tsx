import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/AdminSidebar/AdminSidebar'
import styles from './admin.module.scss'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className={styles.main}>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}