"use client";
import React, { useState } from 'react';
import { Bell, Plus, Search, Star, Clock, } from 'lucide-react';
import router from 'next/dist/shared/lib/router/router';
import Link from "next/link";

// Mock Data 
export const MOCK_STATS = [
  { label: "Total Personal Tasks", value: 30, color: "text-orange-500", dot: "bg-orange-500" },
  { label: "Total University Tasks", value: 118, color: "text-purple-500", dot: "bg-purple-500" },
  { label: "Total Done Tasks", value: 44, color: "text-green-500", dot: "bg-green-500", large: true },
  { label: "Total Overdue Tasks", value: 10, color: "text-red-500", dot: "bg-red-500", bg: "bg-red-50", large: true },
];

const INITIAL_PERSONAL_TASKS = [
  { id: 101, title: 'post ig', category: 'comsci', time: '23:59', isDone: false, group: 'today' },
  { id: 102, title: 'สรุปปลายภาค', category: 'CS232', tag: 'final', time: '13:59', isDone: true, group: 'today' },
  { id: 103, title: 'ส่งงานโปรเจค', category: 'dev', time: '09:00', isDone: false, group: 'overdue' },
];

const UNIVERSITY_TASKS = [
  { id: 1, name: "Assignment2", type: "Assignment", subject: "CS222", priority: 3, dueDate: "2026-04-27", time: "23.59", score: "10/100", status: "normal" },
  { id: 2, name: "งานกลุ่ม CS242", type: "Team Project", subject: "CS232", priority: 3, dueDate: "2026-04-27", time: "23.59", score: "30/100", status: "normal" },
  { id: 3, name: "การบ้าน 1", type: "Assignment", subject: "CS242", priority: 2, dueDate: "2026-04-26", time: "23.59", score: "10/100", status: "overdue" },
];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [personalTasks, setPersonalTasks] = useState(INITIAL_PERSONAL_TASKS);
  const [activeTab, setActiveTab] = useState('today');
  const [filters, setFilters] = useState({
    subject: "all",
    status: "all",
    priority: "all",
    sortBy: "default"
  });

  const subjects = ["all", ...new Set(UNIVERSITY_TASKS.map(t => t.subject))];
  const [view, setView] = useState<"list" | "calendar">("calendar");

  const processedUniversityTasks = UNIVERSITY_TASKS
    .filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = filters.subject === "all" || task.subject === filters.subject;
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      const matchesPriority = filters.priority === "all" || task.priority === parseInt(filters.priority);
      return matchesSearch && matchesSubject && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (filters.sortBy === "scoreHigh") {
        return parseInt(b.score) - parseInt(a.score);
      }
      if (filters.sortBy === "dueDateSoon") {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return 0;
    });

  const togglePersonalTask = (id) => {
    setPersonalTasks(personalTasks.map(task => 
      task.id === id ? { ...task, isDone: !task.isDone } : task
    ));
  };

  const filteredPersonalTasks = personalTasks.filter(task => task.group === activeTab);

  return (
    <div className="p-8 bg-[#EFEFEF] min-h-screen font-sans text-gray-800">
      {/* ส่วน Header */}
    <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 shadow-md border-b border-gray-100 -mt-9 -mx-9">        
      <div className="flex items-center gap-6">
          <h1 className="text-[28px] font-bold text-gray-800">  Tasks</h1>
          
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
        

        {/* University Tasks Table */}
        <div className="col-span-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-xl font-bold">Month here </h2>
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
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Filters:</span>
                <select value={filters.subject} className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none" onChange={(e) => setFilters({...filters, subject: e.target.value})}>
                  <option value="all">Subjects (All)</option>
                  {subjects.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none" onChange={(e) => setFilters({...filters, status: e.target.value})}>
                  <option value="all">Status (All)</option>
                  <option value="normal">Normal</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none" onChange={(e) => setFilters({...filters, priority: e.target.value})}>
                  <option value="all">Priority (All)</option>
                  <option value="3">High (3 Stars)</option>
                  <option value="2">Medium (2 Stars)</option>
                  <option value="1">Low (1 Star)</option>
                </select>
                <select className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none" onChange={(e) => setFilters({...filters, sortBy: e.target.value})}>
                  <option value="default">Sort By</option>
                  <option value="scoreHigh">Score: High to Low</option>
                  <option value="dueDateSoon">Due Date: Soonest</option>
                </select>
              </div>
            </div>
            
            
          </div>
          
        </div>
      </div>
    
  );
}