import { Link } from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/ui/sidebar";
import { SidebarGroupLabel } from "@/components/ui/sidebar";
export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Plus tard : vérification auth ici

  return <>{children}</>;
}
