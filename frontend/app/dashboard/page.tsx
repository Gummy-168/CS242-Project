import React from 'react';
import { Bell, Plus, Search, Star, Clock } from 'lucide-react';

export const MOCK_STATS = [
  { label: "Total Personal Tasks", value: 30, color: "text-orange-500", dot: "bg-orange-500" },
  { label: "Total University Tasks", value: 118, color: "text-purple-500", dot: "bg-purple-500" },
  { label: "Total Done Tasks", value: 44, color: "text-green-500", dot: "bg-green-500", large: true },
  { label: "Total Overdue Tasks", value: 10, color: "text-red-500", dot: "bg-red-500", bg: "bg-red-50", large: true },
];

export const UNIVERSITY_TASKS = [
  { id: 1, name: "Assignment2", type: "Assignment", subject: "CS222", priority: 3, dueDate: "27 เมษายน 2569", time: "23.59", score: "10/100", status: "normal" },
  { id: 2, name: "งานกลุ่ม CS242", type: "Team Project", subject: "CS232", priority: 3, dueDate: "27 เมษายน 2569", time: "23.59", score: "30/100", status: "normal" },
  { id: 3, name: "การบ้าน 1", type: "Assignment", subject: "CS242", priority: 2, dueDate: "26 เมษายน 2569", time: "23.59", score: "10/100", status: "overdue" },
];

export default function Dashboard() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      {/* Header  */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition">
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Personal Tasks*/}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Personal Tasks</h2>
            <div className="flex gap-4 border-b mb-4 text-sm font-medium">
              <button className="pb-2 border-b-2 border-black">Today (2)</button>
              <button className="pb-2 text-gray-400">Overdue (1)</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div>
                  <p className="font-medium text-gray-700">post ig</p>
                  <p className="text-xs text-gray-400">comsci • 23:59</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" checked readOnly className="mt-1 rounded border-gray-300 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-700 line-through">สรุปปลายภาค</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded">CS232</span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">final</span>
                    <span className="text-[10px] text-gray-400">13:59</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyze  */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-bold mb-6">Analyze</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-orange-400" />
                     <span className="text-xs text-gray-500">Total Personal Tasks</span>
                   </div>
                   <span className="text-2xl font-bold">30</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-purple-400" />
                     <span className="text-xs text-gray-500">Total University Tasks</span>
                   </div>
                   <span className="text-2xl font-bold">118</span>
                </div>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   <span className="text-xs text-green-700">Total Done Tasks</span>
                 </div>
                 <span className="text-5xl font-bold text-gray-800">44</span>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <span className="text-xs text-red-700">Total Overdue Tasks</span>
                 </div>
                 <span className="text-5xl font-bold text-gray-800">10</span>
              </div>
            </div>
          </div>
        </div>

        {/*  University Tasks  */}
        <div className="col-span-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">University Tasks</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm w-64 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>
            
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4"></th>
                  <th className="px-6 py-4 font-medium uppercase">Task Name</th>
                  <th className="px-6 py-4 font-medium uppercase">Subjects</th>
                  <th className="px-6 py-4 font-medium uppercase">Priority</th>
                  <th className="px-6 py-4 font-medium uppercase text-center">Due Date</th>
                  <th className="px-6 py-4 font-medium uppercase text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {UNIVERSITY_TASKS.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{task.name}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{task.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] px-3 py-1 rounded font-bold border ${
                        task.subject === 'CS222' ? 'bg-blue-50 text-blue-500 border-blue-100' : 
                        task.subject === 'CS232' ? 'bg-purple-50 text-purple-500 border-purple-100' : 
                        'bg-green-50 text-green-500 border-green-100'
                      }`}>
                        {task.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5 text-red-400">
                        {[...Array(task.priority)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 fill-current ${task.priority === 2 ? 'text-orange-300' : 'text-red-400'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center justify-center gap-2 ${task.status === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-500'}`}>     
                            
                            <span className="whitespace-nowrap">{task.dueDate}</span>
                            
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-600">
                            <Clock size={12} className="text-[#505050]" />
                            {task.time}
                            </span>

                            {task.status === 'overdue' && (
                            <span className="text-[10px] font-bold text-red-500 whitespace-nowrap">
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
  );
}