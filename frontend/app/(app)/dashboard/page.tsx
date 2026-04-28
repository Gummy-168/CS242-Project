"use client";
import React, { useState } from 'react';
import { Bell, Plus, Search, Star, Clock,  } from 'lucide-react';
import { usePathname } from "next/navigation";
import Link from "next/link";
import Notification from '../../components/Notification';
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
  const [showNoti, setShowNoti] = useState(false);
  console.log("Notification Status:", showNoti);
  const subjects = ["all", ...new Set(UNIVERSITY_TASKS.map(t => t.subject))];

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
      {/* Header */}
<div className="flex justify-between items-center mb-8">
  <h1 className="text-3xl font-bold">Dashboard</h1>
  
  {/* คลุมด้วย relative ตรงนี้เพื่อให้ Notification อิงตำแหน่งจากจุดนี้ */}
  <div className="relative"> 
    <div className="flex items-center gap-4">
      <button 
        onClick={() => setShowNoti(!showNoti)} 
        className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 relative hover:bg-gray-50"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>

      <Link href="/addtasks">
        <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition">
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      </Link>
    </div>

    {/* ย้ายมาวางตรงนี้: ให้มันลอยอยู่เหนือปุ่มทั้งหมดในกลุ่มนี้ */}
    <Notification isOpen={showNoti} onClose={() => setShowNoti(false)} />
  </div>
</div>

      <div className="grid grid-cols-12 gap-6">
        {/* Personal Tasks Section */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-bold mb-4">Personal Tasks</h2>
            <div className="flex gap-4 border-b mb-4 text-sm font-medium">
              <button 
                onClick={() => setActiveTab('today')}
                className={`pb-2 transition-all ${activeTab === 'today' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}
              >
                Today ({personalTasks.filter(t => t.group === 'today').length})
              </button>
              <button 
                onClick={() => setActiveTab('overdue')}
                className={`pb-2 transition-all ${activeTab === 'overdue' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}
              >
                Overdue ({personalTasks.filter(t => t.group === 'overdue').length})
              </button>
            </div>
            <div className="space-y-3">
              {filteredPersonalTasks.map((task) => (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${task.isDone ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={task.isDone}
                    onChange={() => togglePersonalTask(task.id)}
                    className="mt-1 rounded border-gray-300 text-blue-500 cursor-pointer w-4 h-4" 
                  />
                  <div className="flex-1">
                    <p className={`font-medium transition-all ${task.isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </p>
                    <div className="flex gap-2 mt-1 items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${task.category === 'CS232' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
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
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-bold mb-6">Analyze</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 space-y-4">
                {MOCK_STATS.filter(s => !s.large).map((stat, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
              {MOCK_STATS.filter(s => s.large).map((stat, i) => (
                <div key={i} className={`${stat.bg || 'bg-green-50'} p-6 rounded-2xl flex flex-col justify-center items-center text-center`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                    <span className={`text-xs ${stat.color}`}>{stat.label}</span>
                  </div>
                  <span className="text-[40px] font-bold">{stat.value}</span>
                </div>
              ))}
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
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4 font-semibold uppercase">Task Name</th>
                    <th className="px-6 py-4 font-semibold uppercase">Subjects</th>
                    <th className="px-6 py-4 font-semibold uppercase">Priority</th>
                    <th className="px-6 py-4 font-semibold uppercase text-center">Due Date</th>
                    <th className="px-6 py-4 font-semibold uppercase text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {processedUniversityTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] px-3 py-1 rounded font-bold border bg-blue-50 text-blue-500 border-blue-100">
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
                                    ? 'text-red-400 fill-red-400' 
                                    : task.priority === 2 
                                      ? 'text-orange-400 fill-orange-400' 
                                      : 'text-green-400 fill-green-400' 
                                  : 'text-gray-200'
                              }`}                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center gap-2 ${
                          task.status === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-500'
                        }`}>    
                          
                          <span className="whitespace-nowrap">{task.dueDate}</span>
                          
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-[11px] ${
                            task.status === 'overdue' 
                              ? 'bg-red-50 border-red-100 text-red-600' 
                              : 'bg-gray-100 border-gray-200 text-gray-600'
                          }`}>
                            <Clock size={12} />
                            {task.time}
                          </span>

                          {task.status === 'overdue' && (
                            <span className="text-[10px] font-bold text-red-500 uppercase ml-1">
                              (Overdue)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">{task.score}</td>
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