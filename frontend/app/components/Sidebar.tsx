"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FilePen,
  CircleUserRound,
  Plus,
  LogOut,
  MoreHorizontal,
  Link as LinkIcon,
  Trash2,
  Pencil,
  Palette,
  Mail,
  Settings,
  X,
} from "lucide-react";
import { useSubjectContext } from "./SubjectContext";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("Guest");

  useEffect(() => {
    setIsMounted(true);
    const storedUsername = window.localStorage.getItem("username");
    setUsername(storedUsername || "Guest");
  }, []);

  const activePath = isMounted ? pathname ?? "" : "";

  const [isAdding, setIsAdding] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const { subjects, setSubjects, addSubject, renameSubject, changeColor } =
    useSubjectContext();

  const [menuConfig, setMenuConfig] = useState<{
    x: number;
    y: number;
    index: number;
  } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [emailNoti, setEmailNoti] = useState(false);
  const [notifyDays, setNotifyDays] = useState<number[]>([]);

  const colors = [
    "#C589FF",
    "#91CCFF",
    "#A5FFBC",
    "#ffef42",
    "#FFCC91",
    "#FF8181",
    "#FF91D0",
    "#9CA3AF",
  ];

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setMenuConfig({ x: e.pageX, y: e.pageY, index });
  };

  const deleteSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      confirmAddSubject();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewSubjectName("");
    }
  };

  const confirmAddSubject = async () => {
    if (newSubjectName.trim() !== "") {
      await addSubject(newSubjectName);
      setNewSubjectName("");
    }
    setIsAdding(false);
  };

  const activeStyle = "bg-[#EFEFEF] text-black shadow-sm";
  const inactiveStyle = "text-gray-500 hover:bg-gray-50 hover:text-black";

  const handleLogout = () => {
    window.localStorage.clear();
    router.push("/login");
  };

  const toggleDay = (day: number) => {
    setNotifyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
        value ? "bg-blue-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          value ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-100 bg-white shadow-sm">
      <div className="p-6 pb-2">
        <div className="group relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gray-100 p-1">
              <CircleUserRound size={32} className="text-black" />
            </div>
            <p className="text-[14px] font-bold text-black">
              {isMounted ? username : "Guest"}
            </p>
          </div>

          <button
            onClick={() => {
              setProfileMenuOpen((v) => !v);
              document.body.classList.toggle("settings-open");
            }}
            className="text-gray-400 transition-colors hover:text-black"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {profileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-lg"
            onClick={() => {
              setProfileMenuOpen(false);
              document.body.classList.remove("settings-open");
            }}
          />

          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="pointer-events-auto w-[360px] rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <Settings size={16} className="text-gray-400" />
                  Settings
                </p>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    document.body.classList.remove("settings-open");
                  }}
                  className="rounded-lg p-1 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-black"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-6 px-6 py-5">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Notifications
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail size={14} className="text-gray-400" />
                        Email notification
                      </span>
                      <span className="text-xs font-normal text-gray-400">
                        รับการแจ้งเตือนไปที่{" "}
                        <span className="font-medium text-gray-600">
                          username@email.com
                        </span>
                      </span>
                    </div>
                    <Toggle
                      value={emailNoti}
                      onChange={() => {
                        setEmailNoti((v) => !v);
                        if (emailNoti) setNotifyDays([]);
                      }}
                    />
                  </div>

                  <div
                    className={`origin-top transition-all duration-300 ${
                      emailNoti
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-1 opacity-40"
                    }`}
                  >
                    <p className="mb-2 text-xs text-gray-400">
                      Notify me before deadline by:
                    </p>

                    <div className="space-y-2">
                      {[1, 3, 5, 7].map((day, i) => (
                        <div
                          key={day}
                          onClick={() => {
                            if (!emailNoti) setEmailNoti(true);
                            toggleDay(day);
                          }}
                          className={`cursor-pointer rounded-lg px-3 py-2 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98] ${
                            notifyDays.includes(day) ? "bg-gray-100" : ""
                          } ${!emailNoti ? "opacity-80" : ""}`}
                          style={{ transitionDelay: `${i * 40}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-normal text-gray-500">
                              รับการแจ้งเตือนก่อน {day} วัน
                            </span>

                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-200 ${
                                notifyDays.includes(day)
                                  ? "scale-100 border-black bg-black"
                                  : "scale-90 border-gray-500"
                              }`}
                            >
                              <div
                                className={`h-2 w-2 rounded-sm bg-white transition-all duration-200 ${
                                  notifyDays.includes(day)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full border-t px-6 py-4 text-sm font-medium text-red-500 hover:rounded-b-2xl hover:bg-red-50"
              >
                <span className="flex items-center gap-3">
                  <LogOut size={14} />
                  Log out
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex-1 overflow-y-auto px-4">
        <nav className="mb-10 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activePath === "/dashboard" ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard
              size={18}
              color={activePath === "/dashboard" ? "#3D98EF" : "#9CA3AF"}
            />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/tasks"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activePath === "/tasks" || activePath === "/taskcalendar"
                ? activeStyle
                : inactiveStyle
            }`}
          >
            <FilePen
              size={18}
              color={
                activePath === "/tasks" || activePath === "/taskcalendar"
                  ? "#3D98EF"
                  : "#9CA3AF"
              }
            />
            <span>Tasks</span>
          </Link>
        </nav>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between px-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              WORKSPACE SUBJECTS
            </h3>
            <button
              onClick={() => setIsAdding(true)}
              className="text-gray-400 transition-colors hover:text-black"
            >
              <Plus size={16} />
            </button>
          </div>

          {isAdding && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" />
              <input
                autoFocus
                type="text"
                value={newSubjectName}
                placeholder="Subject name..."
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={confirmAddSubject}
                className="w-full border-none bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-300"
              />
            </div>
          )}

          <div className="space-y-1 px-2">
            {subjects.map((subject, index) => (
              <div
                key={subject.id ?? `${subject.name}-${index}`}
                onContextMenu={(e) => handleContextMenu(e, index)}
                className="group relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2 hover:bg-gray-100"
              >
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ background: subject.color }}
                />
                {editingIndex === index ? (
                  <input
                    autoFocus
                    defaultValue={subject.name}
                    onBlur={async (e) => {
                      await renameSubject(index, e.target.value);
                      setEditingIndex(null);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        await renameSubject(index, e.currentTarget.value);
                        setEditingIndex(null);
                      }
                      if (e.key === "Escape") setEditingIndex(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border-b border-gray-400 bg-transparent text-sm font-medium text-gray-600 outline-none"
                  />
                ) : (
                  <span className="truncate text-sm font-medium text-gray-600">
                    {subject.name}
                  </span>
                )}
              </div>
            ))}

            {subjects.length === 0 && (
              <p className="px-3 text-[10px] italic text-gray-300">
                No subjects added
              </p>
            )}
          </div>
        </div>
      </div>

      {menuConfig && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuConfig(null)}
          />
          <div
            className="fixed z-50 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            style={{ top: menuConfig.y, left: menuConfig.x }}
          >
            <button
              onClick={() => {
                setEditingIndex(menuConfig.index);
                setMenuConfig(null);
              }}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-5 py-4 text-left font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Pencil size={16} />
              Change Name
            </button>

            <div className="p-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500">
                <Palette size={14} />
                Change Color
              </p>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={async () => {
                      await changeColor(menuConfig.index, color);
                      setMenuConfig(null);
                    }}
                    className="h-6 w-6 rounded-full shadow-sm transition-transform hover:scale-125"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                deleteSubject(menuConfig.index);
                setMenuConfig(null);
              }}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-5 py-4 text-left font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 space-y-2 border-t border-slate-50 p-4">
        <a
          href="https://calendar.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Open Google Calendar
        </a>

        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
        >
          <LogOut
            size={18}
            className="transition-transform group-hover:-translate-x-1"
          />
          Log out
        </button>
      </div>
    </aside>
  );
}
