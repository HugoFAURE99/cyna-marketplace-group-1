import Link from "next/link";
import Searchbar from "./SearchBar";
import { SidebarTrigger } from "../ui/sidebar";

export default function NavBar() {
  return (
    <nav className="w-full">
      <div className="flex items-center justify-center pl-20 p-4 bg-white drop-shadow-md">
        <Link href="" className="text-xl mr-4 my-1.5 font-bold">
          [Logo Cyna]
        </Link>
        <div className="flex mr-30">
          <Searchbar />
          <div className="flex gap-3 ml-4">
            <Link href="" className="my-2">
              Panier
            </Link>
            <SidebarTrigger className="my-1.5" />
          </div>
        </div>
        <a href="/admin" className="my-1">
          espace admin
        </a>
      </div>
    </nav>
  );
}
