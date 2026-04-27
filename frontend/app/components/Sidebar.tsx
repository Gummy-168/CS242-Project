"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FilePen, 
  Rss, 
  BarChart2, 
  Settings, 
  LogOut,
  CircleUserRound, 
} from "lucide-react"; 

export default function Sidebar() {
  const pathname = usePathname(); 
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(true);

  // Active
  const activeStyle = "bg-[#EFEFEF] text-black   ";
  // Inactive
  const inactiveStyle = "text-slate-900 hover:bg-[#EFEFEF] text-black  ";

  return (
<aside className="fixed left-0 top-0 h-screen w-64 bg-white p-6 rounded-r-[40px] flex flex-col justify-between shadow-sm border-r border-slate-50 z-40">      
      <div>
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 mt-4">
        
        <CircleUserRound size={40} />
          <p className="text-[16px] text-black mt-2 tracking-[0.2em] font-bold">
            name
          </p>
        </div>

        <nav className="space-y-2">
          
          {/* Dashboard */}
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/dashboard' ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard size={20} color={pathname === '/dashboard' ? "#3D98EF" : "#9CA3AF"} />
            <span>Dashboard</span>
          </Link>

          
          

          
          {/* Analytics */}
          <Link 
            href="/tasks" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/tasks' ? activeStyle : inactiveStyle}`}
          >
            <FilePen size={20} color={pathname === '/tasks' ? "#3D98EF" : "#9CA3AF"} />
            <span>Tasks</span>
          </Link>

        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-600 font-semibold transition-colors w-full">
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </aside>
  );
}