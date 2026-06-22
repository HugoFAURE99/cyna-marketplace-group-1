import React from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface SidebarProps {
  activeItem: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
  const menuItems = [
    { name: "Account", id: "Account", href: "#" },
    { name: "Orders", id: "Orders", href: "#" },
    { name: "...", id: "item3", href: "#" },
    { name: "...", id: "item4", href: "#" },
    { name: "...", id: "item5", href: "#" },
  ];

  return (
    <aside className="w-[250px] border-r-[1.5px] border-black flex flex-col py-8 shrink-0">
      {menuItems.map((item, index) => (
        <div key={item.id} className="flex flex-col w-full">
          <div className="px-4 mb-3">
            {/* Utilisation de next/link au lieu d'une balise <a> classique */}
            <Link
              href={item.href}
              className={`block w-full text-left px-5 py-2.5 text-lg transition-all ${
                activeItem === item.id
                  ? "bg-[#E1BEE7] text-black font-bold rounded-xl"
                  : "text-black font-bold hover:bg-gray-100 rounded-xl"
              }`}
            >
              {item.name}
            </Link>
          </div>

          {index < menuItems.length - 1 && (
            <Separator className="h-[1.5px] bg-black mb-3" />
          )}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
