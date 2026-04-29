"use client";
import React, { useState } from "react";
import {
  Bell,
  Plus,
  Search,
  Star,
  Clock,
  Check,
  User,
  BookOpen,
} from "lucide-react";
import router from "next/dist/shared/lib/router/router";
import Link from "next/link";

// Mock Data
export const MOCK_STATS = [
  {
    label: "Total Personal Tasks",
    value: 30,
    color: "text-orange-500",
    dot: "bg-orange-500",
  },
  {
    label: "Total University Tasks",
    value: 118,
    color: "text-purple-500",
    dot: "bg-purple-500",
  },
  {
    label: "Total Done Tasks",
    value: 44,
    color: "text-green-500",
    dot: "bg-green-500",
    large: true,
  },
  {
    label: "Total Overdue Tasks",
    value: 10,
    color: "text-red-500",
    dot: "bg-red-500",
    bg: "bg-red-50",
    large: true,
  },
];
const UNIVERSITY_TASKS = [
  {
    id: 1,
    name: "Assignment2",
    subject: "CS222",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23:59",
    score: "10/100",
    status: "normal",
  },
  {
    id: 2,
    name: "งานกลุ่ม CS242",
    subject: "CS232",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23:59",
    score: "30/100",
    status: "normal",
  },
  {
    id: 3,
    name: "การบ้าน 1",
    subject: "CS242",
    priority: 2,
    dueDate: "2026-04-26",
    time: "23:59",
    score: "10/100",
    status: "overdue",
  },
];

const INITIAL_PERSONAL_TASKS = [
  {
    id: 101,
    title: "Post IG",
    subject: "cs",
    priority: 2,
    dueDate: "2026-04-30",
    time: "23:59",
    status: "normal",
  },
];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [personalTasks, setPersonalTasks] = useState(INITIAL_PERSONAL_TASKS);
  const [activeTab, setActiveTab] = useState("today");
  const [filters, setFilters] = useState({
    subject: "all",
    status: "all",
    priority: "all",
    sortBy: "default",
  });
  const [universityTasks, setUniversityTasks] = useState(UNIVERSITY_TASKS);
  const subjects = ["all", ...new Set(universityTasks.map((t) => t.subject))];

  const [view, setView] = useState<"list" | "calendar">("list");
  const isOverdue = (task) => {
    if (task.status === "done") return false;
    return new Date(task.dueDate) < new Date();
  };

  const SectionHeader = ({ icon, title, count, color }) => (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
        {count}
      </span>
    </div>
  );

  const toggleTaskStatus = (id) => {
    setUniversityTasks((prev) =>
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

  const processedUniversityTasks = universityTasks
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
        task.priority === parseInt(filters.priority);
      return (
        matchesSearch && matchesSubject && matchesStatus && matchesPriority
      );
    })
    .sort((a, b) => {
      // sort
      if (filters.sortBy === "scoreHigh") {
        return parseInt(b.score) - parseInt(a.score);
      }

      if (filters.sortBy === "dueDateSoon") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      // default sort
      const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
      if (dateCompare !== 0) return dateCompare;

      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      return parseInt(b.score) - parseInt(a.score);
    });

  const togglePersonalTask = (id) => {
    setPersonalTasks(
      personalTasks.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    );
  };

  const filteredPersonalTasks = personalTasks.filter(
    (task) => task.group === activeTab,
  );
  const personalTasksList = filteredPersonalTasks;
  const universityTasksList = processedUniversityTasks;

  const [personalFilters, setPersonalFilters] = useState({
    subject: "all",
    status: "all",
    priority: "all",
    sortBy: "default",
  });
  const personalSubjects = [
    "all",
    ...new Set(personalTasks.map((t) => t.subject)),
  ];
  const filterClass =
    "bg-white border border-gray-200 rounded-full px-3 py-1 text-xs outline-none";

  const processedPersonalTasks = personalTasks
    .map((task) => ({
      ...task,
      computedStatus: isOverdue(task)
        ? "overdue"
        : task.status === "done"
          ? "done"
          : "normal",
    }))
    .filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSubject =
        personalFilters.subject === "all" ||
        task.subject === personalFilters.subject;

      const matchesStatus =
        personalFilters.status === "all" ||
        task.computedStatus === personalFilters.status;

      const matchesPriority =
        personalFilters.priority === "all" ||
        task.priority === parseInt(personalFilters.priority);

      return (
        matchesSearch && matchesSubject && matchesStatus && matchesPriority
      );
    })
    .sort((a, b) => {
      if (personalFilters.sortBy === "dueDateSoon") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      if (personalFilters.sortBy === "priorityHigh") {
        return b.priority - a.priority;
      }

      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  return (
    <div className="p-8 bg-[#EFEFEF] min-h-screen font-sans text-gray-800">
      {/* ส่วน Header */}
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 shadow-md border-b border-gray-100 -mt-9 -mx-9">
        <div className="flex items-center gap-6">
          <h1 className="text-[28px] font-bold text-gray-800"> Tasks</h1>

          {/*  List / Calendar */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <Link href="/tasks">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                List
              </button>
            </Link>
            <Link href="/taskcalendar">
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === "calendar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Calendar
              </button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* notification */}
          <button className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors relative group">
            <Bell className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/*  Create Task */}

          <Link href="/addtasks">
            <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition">
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </Link>
        </div>
      </div>
      {/* Personal Tasks Table */}
      <div className="col-span-12 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Personal Tasks</h2>

              {/* search */}
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="font-medium text-gray-500 text-sm">
                Filters:
              </span>

              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setPersonalFilters({
                    ...personalFilters,
                    subject: e.target.value,
                  })
                }
              >
                <option value="all">Subject (All)</option>
                {personalSubjects
                  .filter((s) => s !== "all")
                  .map((s) => (
                    <option key={s}>{s}</option>
                  ))}
              </select>

              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setPersonalFilters({
                    ...personalFilters,
                    status: e.target.value,
                  })
                }
              >
                <option value="all">Status (All)</option>
                <option value="done">Done</option>
                <option value="normal">Normal</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setPersonalFilters({
                    ...personalFilters,
                    priority: e.target.value,
                  })
                }
              >
                <option value="all">Priority (All)</option>
                <option value="3">High ★★★</option>
                <option value="2">Medium ★★</option>
                <option value="1">Low ★</option>
              </select>

              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setPersonalFilters({
                    ...personalFilters,
                    sortBy: e.target.value,
                  })
                }
              >
                <option value="default">Sort By (Default)</option>
                <option value="scoreHigh">Score: High to Low</option>
                <option value="dueDateSoon">Due Date: Soonest</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
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
                    
                  </th>
                </tr>
              </thead>

              <tbody>
                {processedPersonalTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`${
                      task.isDone ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* checkbox */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePersonalTask(task.id)}
                        className={`w-5 h-5 border rounded ${
                          task.isDone
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {task.isDone && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </td>

                    {/* task + icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-teal-500" />
                        <span
                          className={`${
                            task.isDone
                              ? "line-through text-gray-400"
                              : "font-medium"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </td>

                    {/* subject */}
                    <td className="px-6 py-4">
                      <span className="text-xs px-3 py-1 rounded bg-orange-50 text-orange-500">
                        {task.subject}
                      </span>
                    </td>

                    {/* priority */}
                    <td className="px-6 py-4">
                      <div className="flex">
                        {[...Array(3)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={`${
                              i < task.priority
                                ? "text-orange-400 fill-orange-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* due */}
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* University Tasks Table */}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="font-medium text-gray-500 text-sm">
                Filters:
              </span>
              <select
                value={filters.subject}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none "
                onChange={(e) =>
                  setFilters({ ...filters, subject: e.target.value })
                }
              >
                <option value="all">Subjects (All)</option>
                {subjects
                  .filter((s) => s !== "all")
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">Status (All)</option>
                <option value="done">Done</option>
                <option value="normal">Normal</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
              >
                <option value="all">Priority (All)</option>
                <option value="3">High ★★★</option>
                <option value="2">Medium ★★</option>
                <option value="1">Low ★</option>
              </select>
              <select
                className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
              >
                <option value="default">Sort By (Default)</option>
                <option value="scoreHigh">Score: High to Low</option>
                <option value="dueDateSoon">Due Date: Soonest</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
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
                    className={`transition ${
                      task.status === "done"
                        ? "bg-gray-50 opacity-60"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span
                          className={`font-medium ${
                            task.status === "done"
                              ? "line-through text-gray-400"
                              : "text-gray-700"
                          }`}
                        >
                          {task.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] px-3 py-1 rounded font-bold border bg-orange-50 text-orange-500 border-orange-100">
                        {task.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={`${
                              i < task.priority
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
                        className={`flex items-center justify-center gap-2 ${
                          task.status === "overdue"
                            ? "text-red-500 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="whitespace-nowrap">
                          {task.dueDate}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-[11px] ${
                            task.status === "overdue"
                              ? "bg-red-50 border-red-100 text-red-600"
                              : "bg-gray-100 border-gray-200 text-gray-600"
                          }`}
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
