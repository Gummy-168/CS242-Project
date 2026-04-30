"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  Search,
  Star,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { assignmentAPI, type Assignment } from "@/api";

type TaskStatus = "normal" | "done" | "overdue";

type TaskRecord = {
  id: number;
  name: string;
  subject: string;
  priority: number;
  dueDate: string;
  time: string;
  score: string;
  status: TaskStatus;
  tags: string[];
  type: "personal" | "university";
};

type PersonalTask = {
  id: number;
  title: string;
  subject: string;
  priority: number;
  dueDate: string;
  time: string;
  status: TaskStatus;
  isDone: boolean;
  tags: string[];
};

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

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(dateValue));
}

function formatTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateValue));
}

function normalizeTask(assignment: Assignment): TaskRecord {
  const derivedStatus =
    assignment.status === "COMPLETED"
      ? "done"
      : new Date(assignment.deadline) < new Date()
        ? "overdue"
        : STATUS_MAP[assignment.status];
  const courseName = assignment.course_name || "Unknown Course";
  const taskType = courseName === "Personal" ? "personal" : "university";

  return {
    id: assignment.id,
    name: assignment.title,
    subject: courseName,
    priority: PRIORITY_MAP[assignment.priority] ?? 2,
    dueDate: formatDate(assignment.deadline),
    time: formatTime(assignment.deadline),
    score:
      typeof assignment.score === "number"
        ? `${assignment.score}/100`
        : "-",
    status: derivedStatus,
    tags: assignment.description ? ["assignment"] : [],
    type: taskType,
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    subject: "all",
    status: "all",
    priority: "all",
    sortBy: "default",
  });
  const [personalFilters, setPersonalFilters] = useState({
    subject: "all",
    status: "all",
    priority: "all",
    sortBy: "default",
  });
  const [assignments, setAssignments] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const data = await assignmentAPI.getAll(storedUserId);
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

  const personalTaskRecords = useMemo(
    () => assignments.filter((task) => task.type === "personal"),
    [assignments],
  );

  const universityTasks = useMemo(
    () => assignments.filter((task) => task.type === "university"),
    [assignments],
  );

  const personalSubjects = useMemo(
    () => ["all", ...new Set(personalTaskRecords.map((task) => task.subject))],
    [personalTaskRecords],
  );

  const universitySubjects = useMemo(
    () => ["all", ...new Set(universityTasks.map((task) => task.subject))],
    [universityTasks],
  );

  const personalTasks = useMemo<PersonalTask[]>(
    () =>
      personalTaskRecords.map((task) => ({
        id: task.id,
        title: task.name,
        subject: task.subject,
        priority: task.priority,
        dueDate: task.dueDate,
        time: task.time,
        status: task.status,
        isDone: task.status === "done",
        tags: task.tags,
      })),
    [personalTaskRecords],
  );

  const processedPersonalTasks = useMemo(() => {
    return [...personalTasks]
      .filter((task) => {
        const matchesSearch = task.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesSubject =
          personalFilters.subject === "all" ||
          task.subject === personalFilters.subject;
        const matchesStatus =
          personalFilters.status === "all" ||
          task.status === personalFilters.status;
        const matchesPriority =
          personalFilters.priority === "all" ||
          task.priority === Number.parseInt(personalFilters.priority, 10);

        return (
          matchesSearch && matchesSubject && matchesStatus && matchesPriority
        );
      })
      .sort((a, b) => {
        if (personalFilters.sortBy === "dueDateSoon") {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        if (personalFilters.sortBy === "priorityHigh") {
          return b.priority - a.priority;
        }

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [personalFilters, personalTasks, searchTerm]);

  const processedUniversityTasks = useMemo(() => {
    return [...universityTasks]
      .filter((task) => {
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
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        const dateCompare =
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateCompare !== 0) return dateCompare;

        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }

        return Number.parseFloat(b.score) - Number.parseFloat(a.score);
      });
  }, [filters, searchTerm, universityTasks]);

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

  return (
    <div className="p-8 bg-[#EFEFEF] min-h-screen font-sans text-gray-800">
      <div className="col-span-12 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Personal Tasks</h2>

              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="font-medium text-gray-500 text-sm">
                Filters:
              </span>

              <select
                value={personalFilters.subject}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(event) =>
                  setPersonalFilters({
                    ...personalFilters,
                    subject: event.target.value,
                  })
                }
              >
                <option value="all">Subject (All)</option>
                {personalSubjects
                  .filter((subject) => subject !== "all")
                  .map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
              </select>

              <select
                value={personalFilters.status}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(event) =>
                  setPersonalFilters({
                    ...personalFilters,
                    status: event.target.value,
                  })
                }
              >
                <option value="all">Status (All)</option>
                <option value="done">Done</option>
                <option value="normal">Normal</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={personalFilters.priority}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(event) =>
                  setPersonalFilters({
                    ...personalFilters,
                    priority: event.target.value,
                  })
                }
              >
                <option value="all">Priority (All)</option>
                <option value="3">High ★★★</option>
                <option value="2">Medium ★★</option>
                <option value="1">Low ★</option>
              </select>

              <select
                value={personalFilters.sortBy}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(event) =>
                  setPersonalFilters({
                    ...personalFilters,
                    sortBy: event.target.value,
                  })
                }
              >
                <option value="default">Sort By (Default)</option>
                <option value="priorityHigh">Priority: High to Low</option>
                <option value="dueDateSoon">Due Date: Soonest</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 py-8 text-sm text-gray-500">
                Loading assignments...
              </div>
            ) : error ? (
              <div className="px-6 py-8 text-sm text-red-500">{error}</div>
            ) : (
              <table className="w-full table-fixed text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4 font-semibold uppercase">
                      Task Name
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase">
                      Subjects
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase text-center">
                      Due Date
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase text-center"></th>
                  </tr>
                </thead>

                <tbody>
                  {processedPersonalTasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`${task.isDone ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`w-5 h-5 border rounded ${task.isDone ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
                        >
                          {task.isDone && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="w-4 h-4 text-teal-500" />

                          <span
                            onClick={() => router.push(`/task/${task.id}`)}
                            className={`font-medium cursor-pointer hover:text-blue-500 transition-all ${task.status === "done" ? "line-through text-gray-400" : "text-gray-700"}`}
                          >
                            {task.title}
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
                        <span className="text-sm px-3 py-1 rounded bg-orange-50 text-orange-500 font-regular">
                          {task.subject}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex">
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

                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {task.dueDate}
                          <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 rounded">
                            <Clock size={12} />
                            {task.time}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {processedPersonalTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        No personal tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              <span className="font-medium text-gray-500 text-sm">
                Filters:
              </span>
              <select
                value={filters.subject}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(event) =>
                  setFilters({ ...filters, subject: event.target.value })
                }
              >
                <option value="all">Subjects (All)</option>
                {universitySubjects
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

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 py-8 text-sm text-gray-500">
                Loading assignments...
              </div>
            ) : error ? (
              <div className="px-6 py-8 text-sm text-red-500">{error}</div>
            ) : (
              <table className="w-full table-fixed text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4 font-semibold uppercase">
                      Task Name
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase">
                      Subjects
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase text-center">
                      Due Date
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase text-center">
                      Score
                    </th>
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
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${task.status === "done" ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"}`}
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
                            onClick={() => router.push(`/task/${task.id}`)}
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
                        <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-500 border border-orange-100 font-regular uppercase">
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
                          <span className="whitespace-nowrap">
                            {task.dueDate}
                          </span>

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
                    </tr>
                  ))}
                  {processedUniversityTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        No university tasks found.
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
  );
}
