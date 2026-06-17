import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1>Backoffice</h1>
      <Button nativeButton={false} render={<Link href="/admin/products" />}>
        Gérer les produits
      </Button>
    </div>
  );
}
