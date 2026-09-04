"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FaHome, FaFilePdf, FaClipboardList, FaSignOutAlt, FaBookOpen } from "react-icons/fa";

export default function SidebarSantri() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const navItems = [
    { name: "Dashboard Portal", href: "/portal", icon: <FaHome /> },
    { name: "Akses Materi PDF", href: "/portal/materi", icon: <FaFilePdf /> },
    { name: "Riwayat Absensi", href: "/portal/absensi", icon: <FaClipboardList /> },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border min-h-screen flex flex-col fixed left-0 top-0 text-gray-300">
      <div className="p-4 border-b border-border flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/40 to-transparent">
        <FaBookOpen className="text-3xl text-primary mb-2" />
        <h2 className="text-lg font-bold text-white uppercase tracking-widest text-center">Portal<br/>Santri</h2>
      </div>
      
      <div className="p-6 border-b border-border bg-black/20">
        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Ahlan Wa Sahlan,</p>
        <p className="font-semibold text-blue-400">{session?.user?.name}</p>
        <div className="mt-2 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded inline-block">Santri Aktif</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-surface-hover hover:text-white'
              }`}
            >
              <div className={isActive ? "text-white" : "text-gray-500 group-hover:text-white"}>{item.icon}</div>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-4 py-3 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white w-full rounded-lg transition-all">
          <FaSignOutAlt />
          <span className="text-sm font-medium border-l border-red-500/30 pl-3">Log out</span>
        </button>
      </div>
    </div>
  );
}
