"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  Link as LinkIcon,
  X,
  BookOpen,
  User,
  Check,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { assignmentAPI, type Assignment } from "@/api";
import {
  formatDateKeyInAppTimeZone,
  formatTimeInAppTimeZone,
  parseApiDate,
  toUtcISOStringFromAppDateTime,
} from "@/lib/datetime";

// ─── Types ───────────────────────────────────────────────────────────────────
type TaskCategory = "personal" | "university";
type TaskStatus = "normal" | "done" | "overdue";

interface Task {
  id: number;
  name: string;
  subject: string;
  subjectColor: string;
  time: string;
  priority: number;
  type: string;
  status: TaskStatus;
  category: TaskCategory;
  googleCalendarLink?: string;
  description?: string;
}

const PRIORITY_MAP: Record<Assignment["priority"], number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const STATUS_MAP: Record<Assignment["status"], TaskStatus> = {
  PENDING: "normal",
  IN_PROGRESS: "normal",
  COMPLETED: "done",
  OVERDUE: "overdue",
};

const SUBJECT_COLOR_CLASSES = [
  "bg-blue-100 text-blue-600",
  "bg-yellow-100 text-yellow-600",
  "bg-pink-100 text-pink-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-orange-100 text-orange-600",
  "bg-sky-100 text-sky-600",
  "bg-rose-100 text-rose-600",
];

function getDateKeyFromDeadline(deadline: string) {
  return formatDateKeyInAppTimeZone(deadline);
}

function getTimeFromDeadline(deadline: string) {
  return formatTimeInAppTimeZone(deadline);
}

function normalizeStatus(assignment: Assignment): TaskStatus {
  if (assignment.status === "COMPLETED") {
    return "done";
  }
  if (parseApiDate(assignment.deadline) < new Date()) {
    return "overdue";
  }
  return STATUS_MAP[assignment.status];
}

function getSubjectColorClass(courseName: string) {
  const index = [...courseName].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return SUBJECT_COLOR_CLASSES[index % SUBJECT_COLOR_CLASSES.length];
}

function mapAssignmentToTask(assignment: Assignment): Task {
  const subject = assignment.course_name || "Unknown Course";
  return {
    id: assignment.id,
    name: assignment.title,
    subject,
    subjectColor: getSubjectColorClass(subject),
    time: getTimeFromDeadline(assignment.deadline),
    priority: PRIORITY_MAP[assignment.priority] ?? 2,
    type: "Assignment",
    status: normalizeStatus(assignment),
    category: subject.toLowerCase() === "personal" ? "personal" : "university",
    description: assignment.description,
  };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const weeks: { date: number; month: "prev" | "curr" | "next" }[][] = [];
  let day = 1;
  let nextDay = 1;

  for (let w = 0; w < 6; w++) {
    const week: { date: number; month: "prev" | "curr" | "next" }[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = w * 7 + d;
      if (cell < firstDay) {
        week.push({ date: daysInPrev - firstDay + cell + 1, month: "prev" });
      } else if (day <= daysInMonth) {
        week.push({ date: day++, month: "curr" });
      } else {
        week.push({ date: nextDay++, month: "next" });
      }
    }
    weeks.push(week);
    if (day > daysInMonth && w >= 3) break;
  }
  return weeks;
}

function StarRating({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= count ? "fill-red-400 text-red-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  );
}

export default function TaskCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "personal" | "university"
  >("all");
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [calendarStatusMessage, setCalendarStatusMessage] = useState("");
  const [calendarErrorMessage, setCalendarErrorMessage] = useState("");
  const [calendarActionLoading, setCalendarActionLoading] = useState(false);

  const matrix = getMonthMatrix(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const getDateKey = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const filterTask = (t: Task) => {
    const matchPriority =
      priorityFilter === "all" || t.priority === parseInt(priorityFilter);
    const matchSubject = subjectFilter === "all" || t.subject === subjectFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchPriority && matchSubject && matchStatus && matchCategory;
  };

  const getTasksForDay = (day: number) => {
    const key = getDateKey(day);
    return (tasksByDate[key] || []).filter(filterTask);
  };

  const allSubjects = [
    ...new Set(
      Object.values(tasksByDate)
        .flat()
        .map((t) => t.subject),
    ),
  ].sort();

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  // Parse selected day info
  const selectedDateObj = selectedDay
    ? new Date(`${selectedDay}T12:00:00`)
    : null;
  const selectedDayTasks = selectedDay ? tasksByDate[selectedDay] || [] : [];
  const personalTasks = selectedDayTasks.filter(
    (t) => t.category === "personal",
  );
  const universityTasks = selectedDayTasks.filter(
    (t) => t.category === "university",
  );

  const updateTaskStatus = (
    dateKey: string,
    taskId: number,
    newStatus: TaskStatus,
  ) => {
    setTasksByDate((prev) => {
      const updated = { ...prev };
      updated[dateKey] = updated[dateKey].map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t,
      );
      return updated;
    });
  };

  const getCurrentUserId = () => {
    const raw = window.localStorage.getItem("userId");
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    return parsed;
  };

  const handleConnectGoogleCalendar = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      router.push("/login");
      return;
    }

    setCalendarActionLoading(true);
    setCalendarErrorMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/integrations/google-calendar/connect-url?user_id=${userId}`,
      );
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          detail?: string;
        };
        throw new Error(errorBody.detail || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { auth_url?: string };
      if (!data.auth_url) {
        throw new Error("Missing Google auth URL");
      }
      window.location.href = data.auth_url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect Google Calendar";
      setCalendarErrorMessage(message);
    } finally {
      setCalendarActionLoading(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      router.push("/login");
      return;
    }

    setCalendarActionLoading(true);
    setCalendarErrorMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/integrations/google-calendar/sync-all?user_id=${userId}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          detail?: string;
        };
        throw new Error(errorBody.detail || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { synced_count?: number };
      setCalendarStatusMessage(`Synced ${data.synced_count ?? 0} task(s) to Google Calendar.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sync Google Calendar";
      setCalendarErrorMessage(message);
    } finally {
      setCalendarActionLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      router.push("/login");
      return;
    }

    setCalendarActionLoading(true);
    setCalendarErrorMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/integrations/google-calendar/disconnect?user_id=${userId}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          detail?: string;
        };
        throw new Error(errorBody.detail || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { disconnected_assignments?: number };
      setCalendarStatusMessage(
        `Disconnected Google Calendar (${data.disconnected_assignments ?? 0} task link(s) removed).`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to disconnect Google Calendar";
      setCalendarErrorMessage(message);
    } finally {
      setCalendarActionLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();

    setTasksByDate((prev) => {
      const updated = { ...prev };

      Object.keys(updated).forEach((dateKey) => {
        updated[dateKey] = updated[dateKey].map((task) => {
          if (task.status === "done") return task;

          const taskDateTime = new Date(
            toUtcISOStringFromAppDateTime(dateKey, task.time),
          );
          if (taskDateTime < now) {
            return { ...task, status: "overdue" };
          }
          return task;
        });
      });

      return updated;
    });
  }, []);

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    
    if (!storedUserId) {
      router.push("/login");
      return; 
    }

    // Fetch Data WITH the user ID
    const fetchAssignments = async () => {
      try {
        const assignments = await assignmentAPI.getAll();
        
        const groupedTasks = assignments.reduce<Record<string, Task[]>>(
          (accumulator, assignment) => {
            const dateKey = getDateKeyFromDeadline(assignment.deadline);
            const task = mapAssignmentToTask(assignment); // This already handles 'overdue' status automatically!
            
            if (!accumulator[dateKey]) {
              accumulator[dateKey] = [];
            }
            accumulator[dateKey].push(task);
            return accumulator;
          },
          {}
        );
        setTasksByDate(groupedTasks);
      } catch (error) {
        console.error("Failed to load assignments for calendar:", error);
      }
    };

    fetchAssignments();
  }, []);

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    
    if (!storedUserId) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const status = searchParams.get("calendar_status");
    const error = searchParams.get("calendar_error");
    if (status === "connected") {
      setCalendarStatusMessage("Google Calendar connected successfully.");
    }
    if (error) {
      setCalendarErrorMessage(decodeURIComponent(error));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#EFEFEF] font-sans text-gray-800">
      {/* Main Content */}
      <div className="p-6">
        <div className={`flex gap-4 transition-all duration-300`}>
          {/* Calendar Panel */}
          <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${selectedDay ? "flex-1" : "w-full"}`}
          >
            {/* Calendar Header */}
            <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  <span className="text-gray-800">
                    {MONTH_NAMES[currentMonth]}
                  </span>{" "}
                  <span className="text-gray-400 font-normal">
                    {currentYear}
                  </span>
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleConnectGoogleCalendar}
                  disabled={calendarActionLoading}
                  className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition bg-white disabled:opacity-60"
                >
                  Connect Google Calendar
                </button>
                <button
                  onClick={handleSyncGoogleCalendar}
                  disabled={calendarActionLoading}
                  className="px-3 py-1.5 border border-emerald-200 rounded-lg text-sm text-emerald-600 hover:bg-emerald-50 transition bg-white disabled:opacity-60"
                >
                  Sync Tasks
                </button>
                <button
                  onClick={handleDisconnectGoogleCalendar}
                  disabled={calendarActionLoading}
                  className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition bg-white disabled:opacity-60"
                >
                  Disconnect
                </button>
                {/* Link Google Calendar */}
                <a
                  href="https://calendar.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition bg-gray-50"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Open Google Calendar
                </a>
                {calendarStatusMessage && (
                  <span className="text-xs text-emerald-600">{calendarStatusMessage}</span>
                )}
                {calendarErrorMessage && (
                  <span className="text-xs text-red-600">{calendarErrorMessage}</span>
                )}

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${categoryFilter === "all" ? "bg-white text-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCategoryFilter("personal")}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-all ${categoryFilter === "personal" ? "bg-teal-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <User className="w-3 h-3" />
                    Personal
                  </button>
                  <button
                    onClick={() => setCategoryFilter("university")}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-all ${categoryFilter === "university" ? "bg-blue-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <BookOpen className="w-3 h-3" />
                    University
                  </button>
                </div>

                {/* Other Filters */}
                <span className="text-sm text-gray-500 ml-1">Filters:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1.5 outline-none bg-white hover:border-gray-300 transition text-gray-400 "
                >
                  <option value="all">Priority (All)</option>
                  <option value="3">High ★★★</option>
                  <option value="2">Medium ★★</option>
                  <option value="1">Low ★</option>
                </select>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1.5 outline-none bg-white hover:border-gray-300 transition text-gray-400 "
                >
                  <option value="all">Subjects (All)</option>
                  {allSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1.5 outline-none bg-white hover:border-gray-300 transition text-gray-400 "
                >
                  <option value="all">Status (All)</option>
                  <option value="done">Done</option>
                  <option value="normal">Normal</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-medium text-gray-400 tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-gray-50">
              {matrix.map((week, wi) =>
                week.map((cell, di) => {
                  const isOtherMonth = cell.month !== "curr";
                  const allTasks = isOtherMonth
                    ? []
                    : tasksByDate[getDateKey(cell.date)] || [];
                  const tasks = isOtherMonth ? [] : getTasksForDay(cell.date);
                  const todayCell = !isOtherMonth && isToday(cell.date);
                  const dateKey = isOtherMonth ? "" : getDateKey(cell.date);
                  const isSelected = selectedDay === dateKey && dateKey !== "";
                  const hasPersonal = allTasks.some(
                    (t) => t.category === "personal",
                  );
                  const hasUniversity = allTasks.some(
                    (t) => t.category === "university",
                  );

                  return (
                    <div
                      key={`${wi}-${di}`}
                      onClick={() =>
                        !isOtherMonth &&
                        setSelectedDay(isSelected ? null : dateKey)
                      }
                      className={`min-h-[110px] p-2 border-b border-gray-50 transition-colors cursor-pointer
                        ${isOtherMonth ? "bg-gray-50/50" : "hover:bg-blue-50/30"}
                        ${isSelected ? "bg-blue-50/50 ring-1 ring-inset ring-blue-200" : ""}
                      `}
                    >
                      {/* Date number */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex gap-0.5">
                          {hasPersonal && !isOtherMonth && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1"
                              title="Personal tasks"
                            />
                          )}
                          {hasUniversity && !isOtherMonth && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1"
                              title="University tasks"
                            />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                          ${isOtherMonth ? "text-gray-300" : todayCell ? "bg-gray-800 text-white" : "text-gray-600"}
                        `}
                        >
                          {cell.date}
                        </span>
                      </div>

                      {/* Tasks */}
                      <div className="flex flex-col gap-1">
                        {tasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`rounded-md px-1.5 py-1 text-xs border shadow-sm
                              ${
                                task.status === "overdue"
                                  ? "bg-red-50 border-red-100"
                                  : task.category === "personal"
                                    ? "bg-teal-50 border-teal-100"
                                    : "bg-white border-gray-100"
                              }`}
                          >
                            <div className="flex items-center gap-1">
                              {task.category === "personal" ? (
                                <User className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                              ) : (
                                <BookOpen className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                              )}
                              <span
                                onClick={() => router.push(`/task/${task.id}`)}
                                className={`font-medium cursor-pointer hover:text-blue-500 transition-all ${
                                  task.status === "done"
                                    ? "line-through text-gray-400"
                                    : "text-gray-700"
                                }`}
                              >
                                {task.name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5 gap-1">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${task.subjectColor}`}
                              >
                                {task.subject}
                              </span>
                              <StarRating count={task.priority} />
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5 text-gray-400">
                              <Clock className="w-2.5 h-2.5" />
                              <span className="text-[10px]">{task.time}</span>
                            </div>
                          </div>
                        ))}
                        {tasks.length > 2 && (
                          <button className="text-[10px] text-blue-500 hover:text-blue-600 text-right pr-0.5">
                            view more +{tasks.length - 2}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          {/* Right Panel - Day Detail */}
          {selectedDay && selectedDateObj && (
            <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              {/* Panel Header */}
              <div className="flex items-start justify-between p-5 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {
                      DAY_NAMES[
                        selectedDateObj.getDay() === 0
                          ? 0
                          : selectedDateObj.getDay()
                      ]
                    }
                  </p>
                  <p className="text-5xl font-bold text-gray-800 leading-none mt-0.5">
                    {selectedDateObj.getDate()}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {MONTH_NAMES[selectedDateObj.getMonth()]},{" "}
                    {selectedDateObj.getFullYear()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks Content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {selectedDayTasks.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No tasks for this day
                  </div>
                ) : (
                  <>
                    {/* Personal Tasks Section */}
                    {personalTasks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              Personal Tasks
                            </span>
                          </div>
                          <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-medium">
                            {personalTasks.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {personalTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border text-sm transition-all hover:shadow-sm
                                ${task.status === "overdue" ? "bg-red-50 border-red-100" : "bg-teal-50/60 border-teal-100"}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <button
                                    onClick={() =>
                                      updateTaskStatus(
                                        selectedDay!,
                                        task.id,
                                        task.status === "done"
                                          ? "normal"
                                          : "done",
                                      )
                                    }
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition
        ${
          task.status === "done"
            ? "bg-blue-500 border-blue-500"
            : "border-gray-300 bg-white"
        }`}
                                  >
                                    {task.status === "done" && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </button>

                                  <span
                                    onClick={() =>
                                      router.push(`/task/${task.id}`)
                                    }
                                    className={`font-medium cursor-pointer hover:text-blue-500 transition-all ${
                                      task.status === "done"
                                        ? "line-through text-gray-400"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {task.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-gray-400 text-[11px] shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {task.time}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${task.subjectColor}`}
                                >
                                  {task.subject}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {task.type}
                                </span>
                                {task.status === "overdue" && (
                                  <span className="text-[11px] text-red-500 font-medium">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <StarRating count={task.priority} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* University Tasks Section */}
                    {universityTasks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              University Tasks
                            </span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {universityTasks.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {universityTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border text-sm transition-all hover:shadow-sm
      ${task.status === "overdue" ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  {/* ปุ่มติ๊ก */}
                                  <button
                                    onClick={() =>
                                      updateTaskStatus(
                                        selectedDay!,
                                        task.id,
                                        task.status === "done"
                                          ? "normal"
                                          : "done",
                                      )
                                    }
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition
      ${
        task.status === "done"
          ? "bg-blue-500 border-blue-500"
          : "border-gray-300 bg-white"
      }`}
                                  >
                                    {task.status === "done" && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </button>

                                  {/* ชื่อ task */}
                                  <span
                                    onClick={() =>
                                      router.push(`/task/${task.id}`)
                                    }
                                    className={`font-medium cursor-pointer hover:text-blue-500 transition-all ${
                                      task.status === "done"
                                        ? "line-through text-gray-400"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {task.name}
                                  </span>
                                </div>
                              </div>

                              {/* ✅ รายละเอียด */}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${task.subjectColor}`}
                                >
                                  {task.subject}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {task.type}
                                </span>
                                {task.status === "overdue" && (
                                  <span className="text-[11px] text-red-500 font-medium">
                                    Overdue
                                  </span>
                                )}
                              </div>

                              {/* ⭐ Priority */}
                              <div className="flex items-center justify-between mt-1.5">
                                <StarRating count={task.priority} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
