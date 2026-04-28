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

  const [isAdding, setIsAdding] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjects, setSubjects] = useState<{ name: string; color: string }[]>([]);

  const addSubject = () => {
    const name = prompt("Enter Subject Name:");
    if (name && name.trim() !== "") {
      setSubjects([...subjects, { name: name.trim(), color: colors[subjects.length % colors.length] }]);
    }
  };
 
  const [menuConfig, setMenuConfig] = useState<{ x: number; y: number; index: number } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const colors = ["#C589FF", "#91CCFF", "#A5FFBC", "#ffef42", "#FFCC91", "#FF8181", "#FF91D0","#9CA3AF" ];
  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault(); 
    setMenuConfig({ x: e.pageX, y: e.pageY, index });
  };

  const changeColor = (index: number, color: string) => {
    const newSubjects = [...subjects];
    newSubjects[index].color = color;
    setSubjects(newSubjects);
    setMenuConfig(null);
  };

  const renameSubject = (index: number) => {
    const newName = prompt("Rename Subject:", subjects[index].name);
    if (newName && newName.trim() !== "") {
      const newSubjects = [...subjects];
      newSubjects[index].name = newName.trim();
      setSubjects(newSubjects);
    }
    setMenuConfig(null);
};
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmAddSubject();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSubjectName("");
    }
  };

  const confirmAddSubject = () => {
    if (newSubjectName.trim() !== "") {
      const randomColor = colors[subjects.length % colors.length];
      setSubjects([...subjects, { name: newSubjectName.trim(), color: randomColor }]);
      setNewSubjectName("");
      setIsAdding(false);
    } else {
      setIsAdding(false);
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
              onClick={() => setIsAdding(true)}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {isAdding && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              <input
                autoFocus
                type="text"
                value={newSubjectName}
                placeholder="Subject name..."
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={confirmAddSubject} 
                className="bg-transparent border-none outline-none text-sm text-gray-600 w-full placeholder:text-gray-300"
              />
            </div>
          )}

          <div className="space-y-1 px-2">
            {subjects.map((subject, index) => (
              <div 
                key={index}
                onContextMenu={(e) => handleContextMenu(e, index)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-xl cursor-pointer group relative"
              >
                {/* color */}
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ background: subject.color }}
                />
                <span className="text-gray-600 font-medium">{subject.name}</span>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-[10px] text-gray-300 px-3 italic">No subjects added</p>
            )}
          </div>
        </div>
      </div>

      {menuConfig && (
        <>
      <div className="fixed inset-0 z-40" onClick={() => setMenuConfig(null)} />
      
      <div 
        className="fixed z-50 bg-white shadow-2xl rounded-2xl border border-gray-100 w-64 overflow-hidden"
        style={{ top: menuConfig.y, left: menuConfig.x }}
      >
        <button 
          onClick={() => renameSubject(menuConfig.index)}
          className="w-full text-left px-5 py-4 hover:bg-gray-50 text-gray-700 font-medium border-b border-gray-50 transition-colors"
        >
          Change Name
        </button>
        
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4 font-medium">Change Color</p>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => changeColor(menuConfig.index, color)}
                className="w-6 h-6 rounded-full hover:scale-125 transition-transform shadow-sm"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )}

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