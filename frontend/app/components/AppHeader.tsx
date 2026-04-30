"use client";
import { Bell, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Notification from "./Notification";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clientPath, setClientPath] = useState("");
  const [clientTaskName, setClientTaskName] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setClientPath(pathname ?? "");
    setClientTaskName(searchParams?.get("name"));
  }, [pathname, searchParams]);

  const activePath = mounted ? clientPath : "";
  const isDashboard = activePath === "/dashboard";
  const isTasks = activePath === "/tasks";
  const isCalendar = activePath === "/taskcalendar";
  const isAddTask = activePath.includes("/addtasks");
  const taskName = mounted ? clientTaskName : null;

  const getTitle = () => {
    if (isDashboard) return "Dashboard";
    if (isTasks || isCalendar) return "Tasks";
    return "";
  };

  return (
    <div className="flex items-center justify-between bg-white px-8 py-5 shadow-sm border-b border-gray-100 relative sticky top-0 z-50">
      {/* Left */}
      <div className="flex items-center gap-4">
        {isAddTask ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-lg">
              <button
                onClick={() => router.push("/tasks")}
                className="text-gray-400 hover:text-gray-700 transition-colors "
              >
                Tasks
              </button>
              <span className="text-gray-300">›</span>
              <span className="text-gray-700 font-medium">
                {taskName || "New Task"}
              </span>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">
              {getTitle()}
            </h1>
            {(isTasks || isCalendar) && (
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 justify-center gap-1">
                <button
                  onClick={() => router.push("/tasks")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isTasks
                      ? "bg-white shadow-sm text-blue-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => router.push("/taskcalendar")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isCalendar
                      ? "bg-white shadow-sm text-blue-500"
                      : "text-gray-400 hover:text-gray-600 "
                  }`}
                >
                  Calendar
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotiOpen(!isNotiOpen)}
            className="relative p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Bell
              size={18}
              className={isNotiOpen ? "text-blue-500" : "text-gray-500"}
            />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <Notification
            isOpen={isNotiOpen}
            onClose={() => setIsNotiOpen(false)}
          />
        </div>

        {(isTasks || isCalendar || isDashboard) && (
          <button
            onClick={() => router.push("/addtasks")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-Regular text-sm transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Task
          </button>
        )}
      </div>
    </div>
  );
}
