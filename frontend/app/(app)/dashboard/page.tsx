"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  Loader2,
  Search,
  Star,
  Trash2,
  User,
  Calendar,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubjectContext } from "../../components/SubjectContext";

import { assignmentAPI, googleCalendarAPI, type Assignment } from "@/api";
import {
  formatDateKeyInAppTimeZone,
  formatTimeInAppTimeZone,
  parseApiDate,
} from "@/lib/datetime";

type DashboardTask = {
  id: number;
  name: string;
  subject: string;
  priority: number;
  dueAt: number;
  dueDate: string;
  time: string;
  score: string;
  status: "normal" | "done" | "overdue";
  tags: string[];
  taskType: "personal" | "university";
};

type PersonalTask = {
  id: number;
  title: string;
  category: string;
  time: string;
  isDone: boolean;
  group: "today" | "overdue";
};

const PRIORITY_MAP: Record<Assignment["priority"], number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const STATUS_MAP: Record<Assignment["status"], DashboardTask["status"]> = {
  PENDING: "normal",
  IN_PROGRESS: "normal",
  COMPLETED: "done",
  OVERDUE: "overdue",
};

function formatDate(dateValue: string) {
  return formatDateKeyInAppTimeZone(dateValue);
}

function formatTime(dateValue: string) {
  return formatTimeInAppTimeZone(dateValue);
}

function normalizeTask(assignment: Assignment): DashboardTask {
  const derivedStatus =
    assignment.status === "COMPLETED"
      ? "done"
      : parseApiDate(assignment.deadline) < new Date()
        ? "overdue"
        : STATUS_MAP[assignment.status];

  const isPersonal =
    assignment.course_name?.trim().toLowerCase() === "personal";

  return {
    id: assignment.id,
    name: assignment.title,
    subject: isPersonal ? "Personal" : assignment.course_name || "Unknown Course",
    priority: PRIORITY_MAP[assignment.priority] ?? 2,
    dueAt: parseApiDate(assignment.deadline).getTime(),
    dueDate: formatDate(assignment.deadline),
    time: formatTime(assignment.deadline),
    score:
      typeof assignment.score === "number"
        ? `${assignment.score}/${assignment.score_total ?? 100}`
        : assignment.score_total != null
        ? `-/${assignment.score_total}`
        : "-",
    status: derivedStatus,
    tags: assignment.description ? ["assignment"] : [],
    taskType: isPersonal ? "personal" : "university",
  };
}

export default function Dashboard() {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"today" | "overdue">("today");
  const [filters, setFilters] = useState({
    subject: "all",
    status: "all",
    priority: "all",
    sortBy: "default",
  });
  const [assignments, setAssignments] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarStatusMessage, setCalendarStatusMessage] = useState("");
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const { subjects: workspaceSubjects } = useSubjectContext();

  const subjectColorMap = useMemo(
    () =>
      new Map(
        workspaceSubjects.map((subject) => [subject.name, subject.color] as const),
      ),
    [workspaceSubjects],
  );

  const isDarkColor = (hex: string) => {
    const cleaned = hex.replace("#", "");
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 186;
  };

  const getSubjectBadgeStyles = (subjectName: string) => {
    const color = subjectColorMap.get(subjectName);
    if (!color) {
      return {
        backgroundColor: "#fff7ed",
        color: "#c2410c",
        border: "1px solid #fcd34d",
      };
    }

    const backgroundColor = color.length === 7 ? `${color}33` : color;
    return {
      backgroundColor,
      color,
      border: `1px solid ${color}`,
    };
  };

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await assignmentAPI.getAll();
        setAssignments(data.map(normalizeTask));
      } catch (fetchError) {
        console.error("Failed to load assignments:", fetchError);
        setError("Failed to load assignments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [router]);

  const subjects = useMemo(
    () => [
      "all",
      ...new Set(
        assignments
          .filter((task) => task.taskType === "university")
          .map((task) => task.subject),
      ),
    ],
    [assignments],
  );

  const personalTasks = useMemo<PersonalTask[]>(
    () =>
      assignments
        .filter(
          (task) =>
            task.taskType === "personal" &&
            (task.status === "overdue" ||
              task.dueDate === formatDateKeyInAppTimeZone(new Date())),
        )
        .map((task) => ({
          id: task.id,
          title: task.name,
          category: task.subject,
          time: task.time,
          isDone: task.status === "done",
          group: task.status === "overdue" ? "overdue" : "today",
        })),
    [assignments],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Tasks",
        value: assignments.length,
        color: "text-orange-500",
        dot: "bg-orange-500",
      },
      {
        label: "Total Subjects",
        value: new Set(assignments.map((task) => task.subject)).size,
        color: "text-purple-500",
        dot: "bg-purple-500",
      },
      {
        label: "Total Done Tasks",
        value: assignments.filter((task) => task.status === "done").length,
        color: "text-green-500",
        dot: "bg-green-500",
        large: true,
      },
      {
        label: "Total Overdue Tasks",
        value: assignments.filter((task) => task.status === "overdue").length,
        color: "text-red-500",
        dot: "bg-red-500",
        bg: "bg-red-50",
        large: true,
      },
    ],
    [assignments],
  );

  const processedUniversityTasks = useMemo(() => {
    return [...assignments]
      .filter((task) => {
        if (task.taskType !== "university") {
          return false;
        }

        const matchesSearch = task.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesSubject =
          filters.subject === "all" || task.subject === filters.subject;
        const matchesStatus =
          filters.status === "all" || task.status === filters.status;
        const matchesPriority =
          filters.priority === "all" ||
          task.priority === Number.parseInt(filters.priority, 10);

        return (
          matchesSearch && matchesSubject && matchesStatus && matchesPriority
        );
      })
      .sort((a, b) => {
        if (filters.sortBy === "scoreHigh") {
          return Number.parseFloat(b.score) - Number.parseFloat(a.score);
        }

        if (filters.sortBy === "dueDateSoon") {
          return a.dueAt - b.dueAt;
        }

        const dateCompare = a.dueAt - b.dueAt;
        if (dateCompare !== 0) return dateCompare;

        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }

        return Number.parseFloat(b.score) - Number.parseFloat(a.score);
      });
  }, [assignments, filters, searchTerm]);

  const filteredPersonalTasks = useMemo(
    () =>
      [...personalTasks]
        .filter((task) => task.group === activeTab)
        .sort((a, b) => {
          const aMinutes = Number.parseInt(a.time.slice(0, 2), 10) * 60 + Number.parseInt(a.time.slice(3, 5), 10);
          const bMinutes = Number.parseInt(b.time.slice(0, 2), 10) * 60 + Number.parseInt(b.time.slice(3, 5), 10);

          if (a.isDone !== b.isDone) {
            return a.isDone ? 1 : -1;
          }

          return aMinutes - bMinutes;
        }),
    [activeTab, personalTasks],
  );

  const toggleTaskStatus = (id: number) => {
    setAssignments((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "done" ? "normal" : "done",
            }
          : task,
      ),
    );
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setIsCalendarLoading(true);
      setCalendarStatusMessage("");
      const userId = parseInt(localStorage.getItem("userId") || "1", 10);
      const { url } = await googleCalendarAPI.getConnectUrl(userId);
      window.location.href = url;
    } catch (error) {
      setCalendarStatusMessage(
        error instanceof Error ? error.message : "Failed to connect Google Calendar"
      );
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    try {
      setIsCalendarLoading(true);
      setCalendarStatusMessage("");
      const userId = parseInt(localStorage.getItem("userId") || "1", 10);
      await googleCalendarAPI.syncAll(userId);
      setCalendarStatusMessage("Tasks synced to Google Calendar successfully!");
    } catch (error) {
      setCalendarStatusMessage(
        error instanceof Error ? error.message : "Failed to sync Google Calendar"
      );
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      setIsCalendarLoading(true);
      setCalendarStatusMessage("");
      const userId = parseInt(localStorage.getItem("userId") || "1", 10);
      await googleCalendarAPI.disconnect(userId);
      setCalendarStatusMessage("Google Calendar disconnected successfully.");
    } catch (error) {
      setCalendarStatusMessage(
        error instanceof Error ? error.message : "Failed to disconnect Google Calendar"
      );
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );
    if (!confirmed) return;

    try {
      setDeletingIds((prev) => [...prev, id]);
      setError("");
      await assignmentAPI.deleteAssignment(id);
      setAssignments((prev) => prev.filter((task) => task.id !== id));
    } catch (deleteError) {
      console.error("Failed to delete assignment:", deleteError);
      setError("Failed to delete assignment.");
    } finally {
      setDeletingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [filters, searchTerm]);

  return (
    <div className="p-8 bg-[#EFEFEF] min-h-screen font-sans text-gray-800">
      <div className="grid grid-cols-12 gap-6 h-full">
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Personal Tasks</h2>
            <div className="flex gap-4 border-b mb-4 text-sm font-medium">
              <button
                onClick={() => setActiveTab("today")}
                className={`pb-2 transition-all ${activeTab === "today" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
              >
                Today ({personalTasks.filter((task) => task.group === "today").length})
              </button>
              <button
                onClick={() => setActiveTab("overdue")}
                className={`pb-2 transition-all ${activeTab === "overdue" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
              >
                Overdue ({personalTasks.filter((task) => task.group === "overdue").length})
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {loading ? (
                <p className="text-sm text-gray-500">Loading assignments...</p>
              ) : filteredPersonalTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No assignments found.</p>
              ) : (
                filteredPersonalTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${task.isDone ? "bg-gray-50" : "hover:bg-gray-50"}`}
                  >
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${task.isDone ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
                    >
                      {task.isDone && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <User className="w-4 h-4 text-teal-500" />

                    <div className="flex-1">
                      <p
                        onClick={() => router.push(`/task/${task.id}?from=dashboard`)}
                        className={`font-medium cursor-pointer hover:text-blue-500 transition-all ${task.isDone ? "line-through text-gray-400" : "text-gray-700"}`}
                      >
                        {task.title}
                      </p>
                      <div className="flex gap-2 mt-1 items-center">
                        <span
                          className="text-xs px-2 py-1 rounded border font-regular uppercase"
                          style={getSubjectBadgeStyles(task.category)}
                        >
                          {task.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-600">
                          <Clock size={12} />
                          {task.time}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleDeleteTask(task.id)}
                      disabled={deletingIds.includes(task.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete task"
                    >
                      {deletingIds.includes(task.id) ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6">Analyze</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 space-y-4">
                {stats.filter((stat) => !stat.large).map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                      <span className="text-base text-gray-400">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {loading ? "-" : stat.value}
                    </span>
                  </div>
                ))}
              </div>
              {stats.filter((stat) => stat.large).map((stat) => (
                <div
                  key={stat.label}
                  className={`${stat.bg || "bg-green-50"} p-6 rounded-2xl flex flex-col`}
                >
                  <div className="p-6 rounded-2xl relative h-full">
                    <div className="absolute top-0 left-0 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                      <span className={`text-base ${stat.color}`}>{stat.label}</span>
                    </div>
                    <div className="absolute bottom-0 right-0">
                      <span className="text-5xl font-bold">
                        {loading ? "-" : stat.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-xl font-bold">University Tasks</h2>
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="font-medium text-gray-500 text-sm">Filters:</span>
                <select
                  value={filters.subject}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                  onChange={(event) =>
                    setFilters({ ...filters, subject: event.target.value })
                  }
                >
                  <option value="all">Subjects (All)</option>
                  {subjects
                    .filter((subject) => subject !== "all")
                    .map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                </select>
                <select
                  value={filters.status}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                  onChange={(event) =>
                    setFilters({ ...filters, status: event.target.value })
                  }
                >
                  <option value="all">Status (All)</option>
                  <option value="done">Done</option>
                  <option value="normal">Normal</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={filters.priority}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                  onChange={(event) =>
                    setFilters({ ...filters, priority: event.target.value })
                  }
                >
                  <option value="all">Priority (All)</option>
                  <option value="3">High ★★★</option>
                  <option value="2">Medium ★★</option>
                  <option value="1">Low ★</option>
                </select>
                <select
                  value={filters.sortBy}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                  onChange={(event) =>
                    setFilters({ ...filters, sortBy: event.target.value })
                  }
                >
                  <option value="default">Sort By (Default)</option>
                  <option value="scoreHigh">Score: High to Low</option>
                  <option value="dueDateSoon">Due Date: Soonest</option>
                </select>
              </div>
            </div>

            <div ref={tableRef} className="overflow-auto max-h-[400px]">
              {loading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading assignments...</div>
              ) : error ? (
                <div className="px-6 py-8 text-sm text-red-500">{error}</div>
              ) : (
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-10"></th>
                      <th className="px-6 py-4 font-semibold uppercase">Task Name</th>
                      <th className="px-6 py-4 font-semibold uppercase">Subjects</th>
                      <th className="px-6 py-4 font-semibold uppercase">Priority</th>
                      <th className="px-6 py-4 font-semibold uppercase text-center">Due Date</th>
                      <th className="px-6 py-4 font-semibold uppercase text-center">Score</th>
                      <th className="px-6 py-4 font-semibold uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {processedUniversityTasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`transition ${task.status === "done" ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${task.status === "done" ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
                          >
                            {task.status === "done" && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            <span
                              onClick={() => router.push(`/task/${task.id}?from=dashboard`)}
                              className={`font-medium cursor-pointer hover:text-blue-500 transition-all ${task.status === "done" ? "line-through text-gray-400" : "text-gray-700"}`}
                            >
                              {task.name}
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-0.5 rounded-xl bg-gray-100 text-gray-500"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-xs px-2 py-1 rounded border font-regular uppercase"
                            style={getSubjectBadgeStyles(task.subject)}
                          >
                            {task.subject}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-0.5">
                            {[...Array(3)].map((_, index) => (
                              <Star
                                key={index}
                                size={12}
                                className={`${
                                  index < task.priority
                                    ? task.priority === 3
                                      ? "text-red-400 fill-red-400"
                                      : task.priority === 2
                                        ? "text-orange-400 fill-orange-400"
                                        : "text-green-400 fill-green-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`flex items-center justify-center gap-2 ${task.status === "overdue" ? "text-red-500 font-medium" : "text-gray-500"}`}
                          >
                            <span className="whitespace-nowrap">{task.dueDate}</span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-[11px] ${task.status === "overdue" ? "bg-red-50 border-red-100 text-red-600" : "bg-gray-100 border-gray-200 text-gray-600"}`}
                            >
                              <Clock size={12} />
                              {task.time}
                            </span>
                            {task.status === "overdue" && (
                              <span className="text-[10px] font-bold text-red-500 uppercase ml-1">
                                (Overdue)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {task.score}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => void handleDeleteTask(task.id)}
                            disabled={deletingIds.includes(task.id)}
                            className="inline-flex p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Delete task"
                          >
                            {deletingIds.includes(task.id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {processedUniversityTasks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                          No assignments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
