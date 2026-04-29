"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Star,
  Clock,
  BookOpen,
  Check,
  User,
} from "lucide-react";
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

const INITIAL_PERSONAL_TASKS = [
  {
    id: 101,
    title: "post ig",
    category: "comsci",
    time: "23:59",
    isDone: false,
    group: "today",
  },
  {
    id: 102,
    title: "สรุปปลายภาค",
    category: "CS232",
    tag: "final",
    time: "13:59",
    isDone: true,
    group: "today",
  },
  {
    id: 103,
    title: "ส่งงานโปรเจค",
    category: "dev",
    time: "09:00",
    isDone: false,
    group: "overdue",
  },
  {
    id: 104,
    title: "post ii",
    category: "comsci",
    time: "23:59",
    isDone: false,
    group: "today",
  },
  {
    id: 105,
    title: "post iii",
    category: "comsci",
    time: "23:59",
    isDone: false,
    group: "today",
  },
];

const UNIVERSITY_TASKS = [
  {
    id: 1,
    name: "Assignment2",
    type: "Assignment",
    subject: "CS222",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23.59",
    score: "10/100",
    status: "normal",
  },
  {
    id: 2,
    name: "งานกลุ่ม CS242",
    type: "Team Project",
    subject: "CS232",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23.59",
    score: "30/100",
    status: "normal",
  },
  {
    id: 3,
    name: "การบ้าน 1",
    type: "Assignment",
    subject: "CS242",
    priority: 2,
    dueDate: "2026-04-26",
    time: "23.59",
    score: "10/100",
    status: "overdue",
  },
  {
    id: 4,
    name: "Assignment2",
    type: "Assignment",
    subject: "CS222",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23.59",
    score: "10/100",
    status: "normal",
  },
  {
    id: 5,
    name: "งานกลุ่ม CS242",
    type: "Team Project",
    subject: "CS232",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23.59",
    score: "30/100",
    status: "normal",
  },
  {
    id: 6,
    name: "การบ้าน 1",
    type: "Assignment",
    subject: "CS242",
    priority: 2,
    dueDate: "2026-04-26",
    time: "23.59",
    score: "10/100",
    status: "overdue",
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

  const tableRef = useRef(null);

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

  const subjects = ["all", ...new Set(UNIVERSITY_TASKS.map((t) => t.subject))];

  const togglePersonalTask = (id) => {
    setPersonalTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    );
  };

  const filteredPersonalTasks = personalTasks
    .filter((task) => task.group === activeTab)
    .sort((a, b) => {
      const toMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };

      // done ไปล่างสุด
      if (a.isDone !== b.isDone) {
        return a.isDone ? 1 : -1;
      }

      // เรียงตามเวลา
      return toMinutes(a.time) - toMinutes(b.time);
    });

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
                Today ({personalTasks.filter((t) => t.group === "today").length}
                )
              </button>
              <button
                onClick={() => setActiveTab("overdue")}
                className={`pb-2 transition-all ${activeTab === "overdue" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
              >
                Overdue (
                {personalTasks.filter((t) => t.group === "overdue").length})
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {filteredPersonalTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${task.isDone ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  <button
                    onClick={() => togglePersonalTask(task.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      task.isDone
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {task.isDone && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <User className="w-4 h-4 text-teal-500" />

                  <div className="flex-1">
                    <p
                      className={`font-medium transition-all ${task.isDone ? "line-through text-gray-400" : "text-gray-700"}`}
                    >
                      {task.title}
                    </p>
                    <div className="flex gap-2 mt-1 items-center">
                      <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-500 border border-orange-100 font-regular uppercase ">
                        {task.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-600">
                        <Clock size={12} />
                        {task.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analyze Section */}
        <div className="col-span-12 lg:col-span-8 ">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6">Analyze</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 space-y-4">
                {MOCK_STATS.filter((s) => !s.large).map((stat, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                      <span className="text-base text-gray-400">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
              {MOCK_STATS.filter((s) => s.large).map((stat, i) => (
                <div
                  key={i}
                  className={`${stat.bg || "bg-green-50"} p-6 rounded-2xl flex flex-col`}
                >
                  <div
                    className={`${stat.bg || "bg-green-50"} p-6 rounded-2xl relative h-full`}
                  >
                    {/* TOP LEFT */}
                    <div className="absolute top-0 left-0 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                      <span className={`text-base ${stat.color}`}>
                        {stat.label}
                      </span>
                    </div>

                    {/* BOTTOM RIGHT */}
                    <div className="absolute bottom-0 right-0">
                      <span className="text-5xl font-bold">{stat.value}</span>
                    </div>
                  </div>
                
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* University Tasks Table */}
        <div className="col-span-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 ">
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

            <div ref={tableRef} className="overflow-auto max-h-[400px]">
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
                          onClick={() => togglePersonalTask(task.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
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

                          {/* TAGS */}
                          <div className="flex gap-1 flex-wrap">
                            {task.tags?.map((tag) => (
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
                        <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-500 border border-orange-100 font-regular uppercase ">
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
    </div>
  );
}
