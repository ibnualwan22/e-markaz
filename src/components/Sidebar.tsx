"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  FaHome, FaCalendarAlt, FaBookOpen, FaUserGraduate, 
  FaUsers, FaClipboardList, FaFilePdf, FaUserShield, FaSignOutAlt 
} from "react-icons/fa";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <FaHome />, module: "DASHBOARD" },
    { name: "Manajemen Periode", href: "/admin/periode", icon: <FaCalendarAlt />, module: "PERIODE" },
    { name: "Manajemen Program", href: "/admin/program", icon: <FaBookOpen />, module: "PROGRAM" },
    { name: "Data Pendaftar", href: "/admin/pendaftar", icon: <FaUserGraduate />, module: "PENDAFTAR" },
    { name: "Data Santri Global", href: "/admin/santri", icon: <FaUsers />, module: "SANTRI" },
    { name: "Manajemen Absensi", href: "/admin/absensi", icon: <FaClipboardList />, module: "ABSENSI" },
    { name: "Rekap Santri", href: "/admin/rekap-absensi-santri", icon: <FaClipboardList />, module: "REKAP_ABSENSI" },
    { name: "Rekap Pengajar", href: "/admin/rekap-absensi-pengajar", icon: <FaClipboardList />, module: "REKAP_ABSENSI" },
    { name: "Manajemen Materi", href: "/admin/materi", icon: <FaFilePdf />, module: "MATERI" },
    { name: "Manajemen Akun", href: "/admin/akun", icon: <FaUserShield />, module: "AKUN" },
    { name: "Manajemen Role", href: "/admin/role", icon: <FaUserShield />, module: "ROLE" },
  ];

  const canAccess = (itemModule: string) => {
    if (!session?.user) return false;
    if (session.user.role === "Super Admin") return true; 
    // Usually dashboard is always accessible implicitly if they are admin/pengajar. Let's make an exception for Dashboard
    if (itemModule === "DASHBOARD") return true; 
    
    return session.user.permissions.some(p => p.module === itemModule && p.action === "READ");
  };

  return (
    <div className="w-64 bg-surface border-r border-border min-h-screen flex flex-col fixed left-0 top-0 text-gray-300">
      <div className="p-4 border-b border-border flex items-center justify-center">
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">E-Markaz</h2>
      </div>
      


      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {navItems.filter(item => canAccess(item.module)).map(item => {
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

      <div className="p-4 border-t border-border bg-surface-hover/30">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-default overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30 shrink-0">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="truncate flex-1">
            <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-blue-400 truncate mt-0.5">{session?.user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-2.5 text-red-400 hover:text-white hover:bg-red-500 w-full rounded-lg transition-colors border border-red-500/20 bg-red-500/10">
          <FaSignOutAlt />
          <span className="text-sm font-semibold">Keluar Sistem</span>
        </button>
      </div>
    </div>
  );
}
