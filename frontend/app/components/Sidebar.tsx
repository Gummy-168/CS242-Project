"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FilePen, 
  CircleUserRound, 
  Plus, 
  LogOut, 
  Calendar,
  MoreHorizontal
} from "lucide-react"; 

export default function Sidebar() {
  const pathname = usePathname(); 
  
  const [subjects, setSubjects] = useState<string[]>([]);

  const addSubject = () => {
    const name = prompt("Enter Subject Name:");
    if (name && name.trim() !== "") {
      setSubjects([...subjects, name.trim()]);
    }
  };

  const activeStyle = "bg-[#EFEFEF] text-black shadow-sm";
  const inactiveStyle = "text-gray-500 hover:bg-gray-50 hover:text-black";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white flex flex-col shadow-sm border-r border-slate-100 z-40">
      
      {/* Profile */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 rounded-full p-1">
              <CircleUserRound size={32} className="text-black" />
            </div>
            <p className="text-[14px] text-black font-bold">
              name
            </p>
          </div>
          <button className="text-gray-400 hover:text-black">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto mt-4">
        {/*  Main */}
        <nav className="space-y-1 mb-10">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${pathname === '/dashboard' ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard size={18} color={pathname === '/dashboard' ? "#3D98EF" : "#9CA3AF"} />
            <span>Dashboard</span>
          </Link>

          <Link 
            href="/tasks" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${pathname === '/tasks' ? activeStyle : inactiveStyle}`}
          >
            <FilePen size={18} color={pathname === '/tasks' ? "#3D98EF" : "#9CA3AF"} />
            <span>Tasks</span>
          </Link>
        </nav>

        <div className="mt-8">
          <div className="flex items-center justify-between px-4 mb-4">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              WORKSPACE SUBJECTS
            </h3>
            <button 
              onClick={addSubject}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1 px-2">
            {subjects.map((sub, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                {sub}
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-[10px] text-gray-300 px-3 italic">No subjects added</p>
            )}
          </div>
        </div>
      </div>

      {/*  Bottom*/}
      <div className="p-4 border-t border-slate-50 space-y-2">
        <button className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-[11px] font-medium rounded-xl border border-gray-100 transition-colors">
          <Calendar size={14} />
          Link Google Calendar
        </button>

        <button className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors w-full group">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Log out
        </button>
      </div>

    </aside>
  );
}